"""
Risikomanagement: Positionsgrößen berechnen
- Bei niedrigem Kontostand (<=5$) nur kleine Bets (max 2$)
- Niemals mehr als MAX_BET_USD riskieren
- Kelly-ähnliche Formel für optimale Betgröße
"""

from config import (
    MAX_BET_USD,
    MIN_BET_USD,
    LOW_BALANCE_THRESHOLD,
    LOW_BALANCE_MAX_BET,
)


class RiskManager:
    def __init__(self):
        self._total_invested = 0.0
        self._total_returned = 0.0

    def record_bet(self, amount: float):
        self._total_invested += amount

    def record_return(self, amount: float):
        self._total_returned += amount

    @property
    def net_pnl(self) -> float:
        return self._total_returned - self._total_invested

    def compute_bet_size(
        self,
        balance: float,
        confidence: float,
        win_rate: float = 0.5,
        odds: float = 1.0,  # Polymarket-Quoten: Preis des Tokens (0-1)
    ) -> float:
        """
        Berechnet optimale Betgröße.

        Bei balance <= 5$: max LOW_BALANCE_MAX_BET (2$)
        Sonst: Kelly-Kriterium gedämpft mit Konfidenz-Faktor

        odds = Preis des YES/NO-Tokens auf Polymarket (z.B. 0.52 = 52 Cent)
        Das impliziert eine Auszahlung von 1/odds wenn gewonnen.
        """
        if balance <= 0:
            return 0.0

        # Absolutes Limit basierend auf Kontostand
        if balance <= 5.0:
            max_allowed = min(LOW_BALANCE_MAX_BET, balance * 0.4)
        elif balance <= LOW_BALANCE_THRESHOLD:
            max_allowed = min(MAX_BET_USD, balance * 0.20)
        else:
            max_allowed = min(MAX_BET_USD, balance * 0.15)

        # Kelly-Kriterium: f* = (bp - q) / b
        # b = Gewinn pro Einheit bei Sieg (1/odds - 1)
        # p = geschätzte Gewinnwahrscheinlichkeit
        # q = 1 - p
        if odds <= 0 or odds >= 1:
            odds = 0.5

        b = (1.0 / odds) - 1.0
        p = win_rate * confidence + (1 - confidence) * 0.5  # confidence-gewichtet
        q = 1.0 - p

        kelly = (b * p - q) / b if b > 0 else 0.0
        kelly = max(0.0, kelly)

        # Gedämpftes Kelly (Viertel-Kelly für Sicherheit)
        fractional_kelly = kelly * 0.25

        bet = min(balance * fractional_kelly, max_allowed)
        bet = max(bet, MIN_BET_USD) if bet > 0 else 0.0
        bet = min(bet, max_allowed)

        # Auf 2 Dezimalstellen runden (USDC)
        return round(bet, 2)

    def should_stop_session(self, balance: float, start_balance: float) -> bool:
        """Stop-Loss: Session beenden wenn mehr als 50% verloren."""
        if start_balance <= 0:
            return False
        loss_pct = (start_balance - balance) / start_balance
        return loss_pct > 0.50

    def format_summary(self) -> str:
        pnl = self.net_pnl
        sign = "+" if pnl >= 0 else ""
        return f"PnL: {sign}{pnl:.2f}$ | investiert: {self._total_invested:.2f}$ | zurück: {self._total_returned:.2f}$"
