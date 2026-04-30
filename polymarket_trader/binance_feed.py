"""
Binance WebSocket Feed — live BTC/USDT Preisdaten
Liest Trade-Stream und 1-Minuten-Kerzen für Momentum-Analyse
"""

import asyncio
import json
import time
from collections import deque
from dataclasses import dataclass, field
from typing import Optional
import websockets
from colorama import Fore, Style

from config import BINANCE_WS_URL, BINANCE_KLINE_URL, MOMENTUM_WINDOW_SECONDS


@dataclass
class PricePoint:
    price: float
    timestamp: float


@dataclass
class MarketSnapshot:
    price: float
    timestamp: float
    momentum_1m: float = 0.0      # % Änderung letzte 1 Min
    momentum_3m: float = 0.0      # % Änderung letzte 3 Min
    momentum_5m: float = 0.0      # % Änderung letzte 5 Min
    volume_1m: float = 0.0        # Volumen letzte 1 Min
    buy_pressure: float = 0.5     # 0-1, Anteil Käufe vs Verkäufe
    volatility: float = 0.0       # Standardabweichung letzte Minute
    trend_strength: float = 0.0   # Wie stark und konsistent der Trend ist


class BinanceFeed:
    def __init__(self):
        self.prices: deque[PricePoint] = deque(maxlen=600)  # 10 Min History
        self.trades_buffer: list[dict] = []
        self.current_price: float = 0.0
        self.last_kline: dict = {}
        self._running = False
        self._callbacks = []

    def on_update(self, callback):
        self._callbacks.append(callback)

    def _notify(self, snapshot: MarketSnapshot):
        for cb in self._callbacks:
            try:
                cb(snapshot)
            except Exception:
                pass

    def _compute_snapshot(self) -> Optional[MarketSnapshot]:
        if len(self.prices) < 5:
            return None

        now = time.time()
        current = self.prices[-1].price

        def pct_change(seconds_ago: int) -> float:
            cutoff = now - seconds_ago
            old_prices = [p for p in self.prices if p.timestamp >= cutoff]
            if not old_prices:
                return 0.0
            return (current - old_prices[0].price) / old_prices[0].price

        # Momentum verschiedener Zeiträume
        m1 = pct_change(60)
        m3 = pct_change(180)
        m5 = pct_change(300)

        # Volatilität (letzte 60s)
        recent = [p.price for p in self.prices if p.timestamp >= now - 60]
        if len(recent) > 2:
            import numpy as np
            volatility = float(np.std(recent) / current)
        else:
            volatility = 0.0

        # Kauf-Druck aus Trade-Buffer
        buy_trades = sum(1 for t in self.trades_buffer if t.get("m") is False)
        total_trades = len(self.trades_buffer) or 1
        buy_pressure = buy_trades / total_trades
        self.trades_buffer.clear()

        # Trend-Stärke: wie konsistent gehen die Preispunkte in eine Richtung?
        if len(recent) > 10:
            diffs = [recent[i+1] - recent[i] for i in range(len(recent)-1)]
            pos = sum(1 for d in diffs if d > 0)
            trend_strength = abs((pos / len(diffs)) - 0.5) * 2  # 0=neutral, 1=stark
        else:
            trend_strength = 0.0

        return MarketSnapshot(
            price=current,
            timestamp=now,
            momentum_1m=m1,
            momentum_3m=m3,
            momentum_5m=m5,
            volume_1m=self.last_kline.get("v", 0),
            buy_pressure=buy_pressure,
            volatility=volatility,
            trend_strength=trend_strength,
        )

    async def _trade_stream(self):
        async for ws in websockets.connect(BINANCE_WS_URL, ping_interval=20):
            try:
                async for raw in ws:
                    data = json.loads(raw)
                    price = float(data["p"])
                    ts = data["T"] / 1000.0

                    self.current_price = price
                    self.prices.append(PricePoint(price=price, timestamp=ts))
                    self.trades_buffer.append(data)

                    snap = self._compute_snapshot()
                    if snap:
                        self._notify(snap)

            except websockets.ConnectionClosed:
                print(f"{Fore.YELLOW}Binance Trade-Stream getrennt, reconnect...{Style.RESET_ALL}")
                await asyncio.sleep(1)

    async def _kline_stream(self):
        async for ws in websockets.connect(BINANCE_KLINE_URL, ping_interval=20):
            try:
                async for raw in ws:
                    data = json.loads(raw)
                    kline = data.get("k", {})
                    if kline.get("x"):  # Kerze geschlossen
                        self.last_kline = kline
            except websockets.ConnectionClosed:
                await asyncio.sleep(1)

    async def start(self):
        self._running = True
        print(f"{Fore.CYAN}Binance Feed gestartet — warte auf Preisdaten...{Style.RESET_ALL}")
        await asyncio.gather(
            self._trade_stream(),
            self._kline_stream(),
        )

    def stop(self):
        self._running = False
