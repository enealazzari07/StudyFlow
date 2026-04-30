import os
from dotenv import load_dotenv

load_dotenv()

# Polymarket
POLYMARKET_HOST = "https://clob.polymarket.com"
POLYMARKET_API_KEY = os.getenv("POLYMARKET_API_KEY", "")
POLYMARKET_API_SECRET = os.getenv("POLYMARKET_API_SECRET", "")
POLYMARKET_API_PASSPHRASE = os.getenv("POLYMARKET_API_PASSPHRASE", "")
PRIVATE_KEY = os.getenv("PRIVATE_KEY", "")
WALLET_ADDRESS = os.getenv("WALLET_ADDRESS", "")

# Das spezifische BTC 5min Up/Down Market auf Polymarket
# https://polymarket.com/de/event/btc-updown-5m-1777589700
MARKET_SLUG = "btc-updown-5m-1777589700"

# Binance WebSocket
BINANCE_WS_URL = "wss://stream.binance.com:9443/ws/btcusdt@trade"
BINANCE_KLINE_URL = "wss://stream.binance.com:9443/ws/btcusdt@kline_1m"

# Risikomanagement
MAX_BET_USD = float(os.getenv("MAX_BET_USD", "6.0"))
MIN_BET_USD = float(os.getenv("MIN_BET_USD", "0.50"))
LOW_BALANCE_THRESHOLD = float(os.getenv("LOW_BALANCE_THRESHOLD", "10.0"))
LOW_BALANCE_MAX_BET = float(os.getenv("LOW_BALANCE_MAX_BET", "2.0"))

# Strategie
MIN_CONFIDENCE = float(os.getenv("MIN_CONFIDENCE", "0.60"))
MOMENTUM_WINDOW_SECONDS = 60        # Beobachtungsfenster für Momentum
PRICE_CHANGE_THRESHOLD = 0.0008     # 0.08% Mindestbewegung für Signal
STRONG_SIGNAL_THRESHOLD = 0.002     # 0.2% starkes Signal

# Timing
MARKET_RESOLVE_SECONDS = 300        # 5 Minuten
ENTRY_WINDOW_SECONDS = 30           # Nur in den ersten 30s einer neuen Periode handeln
COOLDOWN_SECONDS = 60               # Mindestwartezeit zwischen Trades

# Chain (Polygon für Polymarket)
CHAIN_ID = 137
