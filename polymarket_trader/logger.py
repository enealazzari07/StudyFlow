"""
Einfaches Logging: Konsole + CSV-Datei für Trade-History
"""

import csv
import os
import time
from datetime import datetime
from colorama import Fore, Style, init

init(autoreset=True)

LOG_FILE = "trades.csv"


def _ensure_csv():
    if not os.path.exists(LOG_FILE):
        with open(LOG_FILE, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([
                "timestamp", "direction", "amount_usd", "price",
                "confidence", "reason", "btc_price", "balance_before",
                "order_id", "result"
            ])


def log_trade(
    direction: str,
    amount_usd: float,
    price: float,
    confidence: float,
    reason: str,
    btc_price: float,
    balance_before: float,
    order_id: str = "",
    result: str = "placed",
):
    _ensure_csv()
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    with open(LOG_FILE, "a", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            ts, direction, f"{amount_usd:.2f}", f"{price:.4f}",
            f"{confidence:.3f}", reason, f"{btc_price:.2f}",
            f"{balance_before:.2f}", order_id, result
        ])

    color = Fore.GREEN if direction == "UP" else Fore.RED
    print(
        f"{color}[TRADE] {ts} | {direction} | ${amount_usd:.2f} @ {price:.3f} "
        f"| BTC: ${btc_price:,.0f} | Konfidenz: {confidence:.0%} | {reason}{Style.RESET_ALL}"
    )


def log_signal(direction: str, confidence: float, reason: str, btc_price: float):
    if direction == "HOLD":
        return
    color = Fore.CYAN if direction == "UP" else Fore.MAGENTA
    print(
        f"{color}[SIGNAL] {direction} | Konfidenz: {confidence:.0%} | "
        f"BTC: ${btc_price:,.2f} | {reason}{Style.RESET_ALL}"
    )


def log_status(balance: float, btc_price: float, pnl_summary: str):
    now = datetime.now().strftime("%H:%M:%S")
    print(
        f"{Fore.WHITE}[{now}] Kontostand: ${balance:.2f} | "
        f"BTC: ${btc_price:,.2f} | {pnl_summary}{Style.RESET_ALL}"
    )
