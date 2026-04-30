"""
Polymarket BTC 5-Min Trading Bot
=================================
Liest live BTC-Preise von Binance und tradet automatisch auf dem
Polymarket BTC Up/Down 5-Minuten-Markt.

Starten:
    python main.py              # Live-Modus (echte Orders)
    python main.py --dry-run    # Simulation ohne echte Orders

Voraussetzungen:
    1. pip install -r requirements.txt
    2. .env Datei ausfüllen (siehe .env.example)
"""

import asyncio
import sys
import time
import signal
from datetime import datetime
from colorama import Fore, Style, init

init(autoreset=True)

from binance_feed import BinanceFeed, MarketSnapshot
from polymarket_client import PolymarketClient
from strategy import MomentumStrategy, TradeSignal
from risk_manager import RiskManager
import logger
from config import MAX_BET_USD, MIN_BET_USD

DRY_RUN = "--dry-run" in sys.argv or "-d" in sys.argv


class TradingBot:
    def __init__(self):
        self.binance = BinanceFeed()
        self.polymarket = PolymarketClient()
        self.strategy = MomentumStrategy()
        self.risk = RiskManager()

        self._start_balance: float = 0.0
        self._running = True
        self._last_status_print = 0.0
        self._pending_trade: dict = {}  # Verfolgt offene Trades für PnL

        self._snap_queue: asyncio.Queue = asyncio.Queue(maxsize=50)

    def _on_price_update(self, snap: MarketSnapshot):
        """Callback vom Binance Feed — läuft im Hintergrund."""
        try:
            self._snap_queue.put_nowait(snap)
        except asyncio.QueueFull:
            pass  # Veraltete Daten überspringen

    async def _process_signals(self):
        """Verarbeitet Preis-Snapshots und entscheidet ob gehandelt wird."""
        while self._running:
            try:
                snap: MarketSnapshot = await asyncio.wait_for(
                    self._snap_queue.get(), timeout=5.0
                )
            except asyncio.TimeoutError:
                continue

            # Status alle 30s ausgeben
            now = time.time()
            if now - self._last_status_print > 30:
                logger.log_status(
                    self.polymarket.balance,
                    snap.price,
                    self.risk.format_summary(),
                )
                self._last_status_print = now

            # Stop-Loss prüfen
            if self.risk.should_stop_session(self.polymarket.balance, self._start_balance):
                print(f"{Fore.RED}STOP-LOSS erreicht — Session beendet.{Style.RESET_ALL}")
                self._running = False
                break

            # Signal analysieren
            signal: TradeSignal = self.strategy.analyze(snap)

            if signal.direction == "HOLD":
                continue

            logger.log_signal(
                signal.direction, signal.confidence, signal.reason, snap.price
            )

            # Kontostand aktualisieren (gecacht, nicht jedes Mal API-Call)
            balance = self.polymarket.balance

            # Betgröße berechnen
            odds = await self.polymarket.get_current_odds()
            token_price = odds["up_price"] if signal.direction == "UP" else odds["down_price"]

            bet = self.risk.compute_bet_size(
                balance=balance,
                confidence=signal.confidence,
                win_rate=self.strategy.win_rate,
                odds=token_price,
            )

            if bet < MIN_BET_USD:
                print(f"{Fore.YELLOW}Bet ${bet:.2f} zu klein (min ${MIN_BET_USD}) — skip{Style.RESET_ALL}")
                continue

            # Order platzieren
            result = await self.polymarket.place_order(
                direction=signal.direction,
                amount_usd=bet,
                dry_run=DRY_RUN,
            )

            if result:
                order_id = result.get("orderID", "dry-run")
                self.risk.record_bet(bet)
                self.strategy.mark_trade_placed()

                logger.log_trade(
                    direction=signal.direction,
                    amount_usd=bet,
                    price=token_price,
                    confidence=signal.confidence,
                    reason=signal.reason,
                    btc_price=snap.price,
                    balance_before=balance,
                    order_id=str(order_id),
                )

                # Im Dry-Run simulierten Return nach 5 Minuten berechnen
                if DRY_RUN:
                    asyncio.create_task(
                        self._simulate_result(signal, snap.price, bet, token_price)
                    )

    async def _simulate_result(
        self,
        signal: TradeSignal,
        entry_btc_price: float,
        bet: float,
        token_price: float,
    ):
        """Dry-Run Simulation: prüft nach 5 Min ob die Wette gewonnen hätte."""
        await asyncio.sleep(300)  # 5 Minuten warten

        current_price = self.binance.current_price
        if current_price <= 0:
            return

        actual_up = current_price > entry_btc_price
        predicted_up = signal.direction == "UP"
        won = actual_up == predicted_up

        payout = (bet / token_price) if won else 0.0
        self.risk.record_return(payout)
        self.strategy.record_result(won)

        result_str = "GEWONNEN" if won else "VERLOREN"
        color = Fore.GREEN if won else Fore.RED
        print(
            f"{color}[RESULT] {result_str} | {signal.direction} | "
            f"BTC: {entry_btc_price:,.2f} → {current_price:,.2f} | "
            f"Bet: ${bet:.2f} | Return: ${payout:.2f}{Style.RESET_ALL}"
        )

    def _print_banner(self):
        print(f"""
{Fore.CYAN}╔══════════════════════════════════════════════════════╗
║     POLYMARKET BTC 5-MIN TRADING BOT                 ║
║     Market: btc-updown-5m-1777589700                 ║
║     Daten: Binance live BTC/USDT                     ║
╚══════════════════════════════════════════════════════╝{Style.RESET_ALL}
Modus: {'🔵 DRY-RUN (keine echten Orders)' if DRY_RUN else '🔴 LIVE (echte Orders!)'}
Gestartet: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
""")

    async def run(self):
        self._print_banner()

        # Polymarket verbinden
        await self.polymarket.connect()
        self._start_balance = self.polymarket.balance

        if not DRY_RUN and self._start_balance <= 0:
            print(f"{Fore.RED}Kein Kontostand gefunden — wechsle zu Dry-Run{Style.RESET_ALL}")
            global DRY_RUN
            DRY_RUN = True

        # Binance Feed starten
        self.binance.on_update(self._on_price_update)

        print(f"{Fore.CYAN}Warte auf erste Preisdaten von Binance...{Style.RESET_ALL}")

        await asyncio.gather(
            self.binance.start(),
            self._process_signals(),
        )

    async def shutdown(self):
        self._running = False
        await self.polymarket.close()
        print(f"\n{Fore.YELLOW}Bot gestoppt. {self.risk.format_summary()}{Style.RESET_ALL}")


async def main():
    bot = TradingBot()

    loop = asyncio.get_event_loop()

    def _handle_exit(*_):
        print(f"\n{Fore.YELLOW}Stoppe Bot...{Style.RESET_ALL}")
        asyncio.create_task(bot.shutdown())

    signal.signal(signal.SIGINT, _handle_exit)
    signal.signal(signal.SIGTERM, _handle_exit)

    await bot.run()


if __name__ == "__main__":
    asyncio.run(main())
