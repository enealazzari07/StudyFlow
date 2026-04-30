"""
Trading-Strategie: Momentum-basiertes Handeln auf BTC 5-Min Up/Down
Kombiniert kurzfristiges Momentum, Trend-Stärke und Kauf-Druck
"""

from dataclasses import dataclass
from typing import Literal, Optional
import time

from binance_feed import MarketSnapshot
from config import (
    PRICE_CHANGE_THRESHOLD,
    STRONG_SIGNAL_THRESHOLD,
    MIN_CONFIDENCE,
    COOLDOWN_SECONDS,
    ENTRY_WINDOW_SECONDS,
    MARKET_RESOLVE_SECONDS,
)


@dataclass
class TradeSignal:
    direction: Literal["UP", "DOWN", "HOLD"]
    confidence: float          # 0.0 – 1.0
    reason: str
    momentum_score: float
    timestamp: float = 0.0

    def __post_init__(self):
        if self.timestamp == 0.0:
            self.timestamp = time.time()


class MomentumStrategy:
    def __init__(self):
        self._last_trade_time: float = 0.0
        self._trade_count_session: int = 0
        self._win_count: int = 0
        self._loss_count: int = 0

    def record_result(self, won: bool):
        if won:
            self._win_count += 1
        else:
            self._loss_count += 1

    @property
    def win_rate(self) -> float:
        total = self._win_count + self._loss_count
        return self._win_count / total if total > 0 else 0.5

    def _in_cooldown(self) -> bool:
        return (time.time() - self._last_trade_time) < COOLDOWN_SECONDS

    def _market_phase_ok(self) -> bool:
        """Nur in den ersten ENTRY_WINDOW_SECONDS einer neuen 5-Min-Periode handeln."""
        now = time.time()
        seconds_in_cycle = now % MARKET_RESOLVE_SECONDS
        return seconds_in_cycle <= ENTRY_WINDOW_SECONDS

    def analyze(self, snap: MarketSnapshot) -> TradeSignal:
        if self._in_cooldown():
            return TradeSignal("HOLD", 0.0, "Cooldown aktiv", 0.0)

        if not self._market_phase_ok():
            secs_left = MARKET_RESOLVE_SECONDS - (time.time() % MARKET_RESOLVE_SECONDS)
            return TradeSignal("HOLD", 0.0, f"Warte auf neue Periode ({secs_left:.0f}s)", 0.0)

        # ──────────────────────────────────────────────
        # Score-Berechnung: mehrere Signale kombinieren
        # ──────────────────────────────────────────────
        score = 0.0
        reasons = []

        # 1. Kurzfristiges 1-Min Momentum (stärkstes Signal)
        m1 = snap.momentum_1m
        if abs(m1) > STRONG_SIGNAL_THRESHOLD:
            score += 0.40 * (1 if m1 > 0 else -1)
            reasons.append(f"starkes 1m-Momentum {m1*100:.3f}%")
        elif abs(m1) > PRICE_CHANGE_THRESHOLD:
            score += 0.25 * (1 if m1 > 0 else -1)
            reasons.append(f"1m-Momentum {m1*100:.3f}%")

        # 2. 3-Min Momentum als Bestätigung
        m3 = snap.momentum_3m
        if abs(m3) > PRICE_CHANGE_THRESHOLD * 1.5:
            score += 0.20 * (1 if m3 > 0 else -1)
            reasons.append(f"3m-Bestätigung {m3*100:.3f}%")

        # 3. Kauf-Druck aus Trade-Stream
        bp = snap.buy_pressure
        if abs(bp - 0.5) > 0.1:
            score += 0.20 * (1 if bp > 0.5 else -1)
            reasons.append(f"Kauf-Druck {bp*100:.0f}%")

        # 4. Trend-Konsistenz
        if snap.trend_strength > 0.6:
            direction_sign = 1 if snap.momentum_1m > 0 else -1
            score += 0.15 * direction_sign
            reasons.append(f"konsistenter Trend ({snap.trend_strength:.2f})")

        # 5. Hohe Volatilität → Vorsicht, Score dämpfen
        if snap.volatility > 0.003:
            score *= 0.7
            reasons.append(f"hohe Volatilität ({snap.volatility*100:.3f}%)")

        # 6. Session-Lernfaktor: bei schlechter Win-Rate vorsichtiger
        if self._trade_count_session > 5 and self.win_rate < 0.4:
            score *= 0.8

        # Richtung und Konfidenz
        confidence = min(abs(score), 1.0)
        direction: Literal["UP", "DOWN", "HOLD"]

        if confidence < MIN_CONFIDENCE or abs(score) < 0.3:
            direction = "HOLD"
        elif score > 0:
            direction = "UP"
        else:
            direction = "DOWN"

        return TradeSignal(
            direction=direction,
            confidence=confidence,
            reason=" | ".join(reasons) if reasons else "kein Signal",
            momentum_score=score,
        )

    def mark_trade_placed(self):
        self._last_trade_time = time.time()
        self._trade_count_session += 1
