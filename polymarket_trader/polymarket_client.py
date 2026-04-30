"""
Polymarket CLOB API Client
Handelt das BTC 5-Min Up/Down Market
https://polymarket.com/de/event/btc-updown-5m-1777589700
"""

import asyncio
import json
import time
from typing import Optional, Literal
import aiohttp
from colorama import Fore, Style

from config import (
    POLYMARKET_HOST,
    POLYMARKET_API_KEY,
    POLYMARKET_API_SECRET,
    POLYMARKET_API_PASSPHRASE,
    PRIVATE_KEY,
    WALLET_ADDRESS,
    MARKET_SLUG,
    CHAIN_ID,
)


class PolymarketClient:
    def __init__(self):
        self._session: Optional[aiohttp.ClientSession] = None
        self._clob_client = None
        self._market_info: Optional[dict] = None
        self._yes_token_id: Optional[str] = None
        self._no_token_id: Optional[str] = None
        self._balance: float = 0.0

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession()
        return self._session

    def _init_clob_client(self):
        """Initialisiert den py-clob-client mit Credentials."""
        try:
            from py_clob_client.client import ClobClient
            from py_clob_client.clob_types import ApiCreds

            if PRIVATE_KEY and POLYMARKET_API_KEY:
                creds = ApiCreds(
                    api_key=POLYMARKET_API_KEY,
                    api_secret=POLYMARKET_API_SECRET,
                    api_passphrase=POLYMARKET_API_PASSPHRASE,
                )
                self._clob_client = ClobClient(
                    host=POLYMARKET_HOST,
                    chain_id=CHAIN_ID,
                    key=PRIVATE_KEY,
                    creds=creds,
                    signature_type=2,
                    funder=WALLET_ADDRESS,
                )
                print(f"{Fore.GREEN}CLOB Client initialisiert (L2 Auth){Style.RESET_ALL}")
            elif PRIVATE_KEY:
                self._clob_client = ClobClient(
                    host=POLYMARKET_HOST,
                    chain_id=CHAIN_ID,
                    key=PRIVATE_KEY,
                )
                # API Keys automatisch anlegen
                resp = self._clob_client.create_or_derive_api_creds()
                self._clob_client.set_api_creds(self._clob_client.create_or_derive_api_creds())
                print(f"{Fore.GREEN}CLOB Client initialisiert (L1 Auth, Keys automatisch erstellt){Style.RESET_ALL}")
            else:
                print(f"{Fore.RED}Keine Credentials gesetzt — Dry-Run Modus{Style.RESET_ALL}")
        except ImportError:
            print(f"{Fore.YELLOW}py-clob-client nicht installiert — Dry-Run Modus{Style.RESET_ALL}")
        except Exception as e:
            print(f"{Fore.RED}CLOB Client Fehler: {e}{Style.RESET_ALL}")

    async def connect(self):
        """Verbindet mit Polymarket und lädt Market-Infos."""
        self._init_clob_client()
        await self._load_market()
        await self._update_balance()

    async def _load_market(self):
        """Sucht das BTC 5-Min Market und speichert Token-IDs."""
        try:
            session = await self._get_session()

            # Alle aktiven BTC 5-min Märkte laden
            url = f"{POLYMARKET_HOST}/markets"
            params = {"active": "true", "closed": "false"}

            async with session.get(url, params=params) as resp:
                if resp.status != 200:
                    print(f"{Fore.RED}Market-Load Fehler: HTTP {resp.status}{Style.RESET_ALL}")
                    return

                data = await resp.json()
                markets = data.get("data", [])

                # Suche nach BTC Up/Down 5min
                for m in markets:
                    slug = m.get("marketSlug", "").lower()
                    question = m.get("question", "").lower()
                    if "btc" in slug and "5m" in slug:
                        self._market_info = m
                        # Token-IDs aus den Outcomes extrahieren
                        tokens = m.get("tokens", [])
                        for token in tokens:
                            outcome = token.get("outcome", "").upper()
                            if "UP" in outcome or "YES" in outcome or "HIGHER" in outcome:
                                self._yes_token_id = token.get("token_id")
                            elif "DOWN" in outcome or "NO" in outcome or "LOWER" in outcome:
                                self._no_token_id = token.get("token_id")
                        break

                if self._market_info:
                    print(f"{Fore.GREEN}Market gefunden: {self._market_info.get('question', 'BTC 5min')}{Style.RESET_ALL}")
                    print(f"  UP Token:   {self._yes_token_id}")
                    print(f"  DOWN Token: {self._no_token_id}")
                else:
                    print(f"{Fore.YELLOW}BTC 5min Market nicht gefunden — verwende direkte Token-IDs{Style.RESET_ALL}")
                    await self._load_market_direct()

        except Exception as e:
            print(f"{Fore.RED}Market-Load Exception: {e}{Style.RESET_ALL}")
            await self._load_market_direct()

    async def _load_market_direct(self):
        """Fallback: Market direkt über den Event-Slug laden."""
        try:
            session = await self._get_session()
            url = f"{POLYMARKET_HOST}/markets/{MARKET_SLUG}"

            async with session.get(url) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    self._market_info = data
                    tokens = data.get("tokens", [])
                    for token in tokens:
                        outcome = token.get("outcome", "").upper()
                        if "UP" in outcome or "HIGHER" in outcome:
                            self._yes_token_id = token.get("token_id")
                        elif "DOWN" in outcome or "LOWER" in outcome:
                            self._no_token_id = token.get("token_id")
                    print(f"{Fore.GREEN}Market (direkt) geladen{Style.RESET_ALL}")
        except Exception as e:
            print(f"{Fore.RED}Direkter Market-Load fehlgeschlagen: {e}{Style.RESET_ALL}")

    async def _update_balance(self):
        """Holt aktuellen USDC-Kontostand."""
        if not self._clob_client:
            self._balance = 0.0
            return
        try:
            balance_info = self._clob_client.get_balance()
            self._balance = float(balance_info.get("balance", 0)) / 1e6  # USDC hat 6 Dezimalstellen
            print(f"{Fore.CYAN}Kontostand: ${self._balance:.2f} USDC{Style.RESET_ALL}")
        except Exception as e:
            print(f"{Fore.YELLOW}Balance-Abruf fehlgeschlagen: {e}{Style.RESET_ALL}")

    @property
    def balance(self) -> float:
        return self._balance

    async def get_current_odds(self) -> dict:
        """Holt aktuelle Preise (YES/NO Quoten) vom Orderbook."""
        try:
            session = await self._get_session()

            result = {"up_price": 0.5, "down_price": 0.5}

            if self._yes_token_id:
                url = f"{POLYMARKET_HOST}/book"
                params = {"token_id": self._yes_token_id}
                async with session.get(url, params=params) as resp:
                    if resp.status == 200:
                        book = await resp.json()
                        bids = book.get("bids", [])
                        asks = book.get("asks", [])
                        if asks:
                            result["up_price"] = float(asks[0]["price"])
                        if bids:
                            result["down_price"] = 1.0 - float(bids[0]["price"])

            return result
        except Exception:
            return {"up_price": 0.5, "down_price": 0.5}

    async def place_order(
        self,
        direction: Literal["UP", "DOWN"],
        amount_usd: float,
        dry_run: bool = False,
    ) -> Optional[dict]:
        """
        Platziert eine Market-Order auf Polymarket.

        direction: "UP" → kauft YES-Token, "DOWN" → kauft NO-Token
        amount_usd: Betrag in USD (USDC)
        dry_run: True = keine echte Order, nur Simulation
        """
        token_id = self._yes_token_id if direction == "UP" else self._no_token_id

        if not token_id:
            print(f"{Fore.RED}Kein Token-ID für {direction} — Order abgebrochen{Style.RESET_ALL}")
            return None

        odds = await self.get_current_odds()
        price = odds["up_price"] if direction == "UP" else odds["down_price"]

        if dry_run or not self._clob_client:
            print(
                f"{Fore.YELLOW}[DRY-RUN] {direction} Order: ${amount_usd:.2f} @ {price:.3f} "
                f"(Token: {token_id[:8]}...){Style.RESET_ALL}"
            )
            return {"dry_run": True, "direction": direction, "amount": amount_usd, "price": price}

        try:
            from py_clob_client.clob_types import OrderArgs, OrderType

            # Größe = Anzahl Tokens = USD-Betrag / Preis
            size = round(amount_usd / price, 2)

            order_args = OrderArgs(
                token_id=token_id,
                price=round(price, 3),
                size=size,
                side="BUY",
            )

            resp = self._clob_client.create_and_post_order(order_args)
            order_id = resp.get("orderID", "unknown")

            print(
                f"{Fore.GREEN}Order platziert! {direction} ${amount_usd:.2f} @ {price:.3f} "
                f"| ID: {order_id[:12]}...{Style.RESET_ALL}"
            )

            await self._update_balance()
            return resp

        except Exception as e:
            print(f"{Fore.RED}Order-Fehler: {e}{Style.RESET_ALL}")
            return None

    async def get_open_orders(self) -> list:
        if not self._clob_client:
            return []
        try:
            return self._clob_client.get_orders() or []
        except Exception:
            return []

    async def close(self):
        if self._session and not self._session.closed:
            await self._session.close()
