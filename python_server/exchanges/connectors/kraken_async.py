"""
Kraken Async WebSocket connector for L2 orderbook data
High-performance implementation using asyncio
"""

import asyncio
import json
import logging
import time
from typing import List, Dict, Any
from .base_async import BaseAsyncConnector

logger = logging.getLogger(__name__)


class KrakenAsyncConnector(BaseAsyncConnector):
    """High-performance Kraken exchange WebSocket connector"""

    def __init__(self):
        super().__init__()
        self.ws_url = "wss://ws.kraken.com"
        self.orderbook_cache: Dict[str, Dict] = {}
        self.channel_subscriptions: Dict[int, str] = {}  # channelID -> symbol
        self.heartbeat_interval = 30

    async def get_supported_pairs(self) -> List[str]:
        """Get list of supported trading pairs"""
        # Kraken uses format like XBT/USD (Bitcoin is XBT on Kraken)
        return [
            'XBT/USD', 'ETH/USD', 'XRP/USD', 'LTC/USD', 'BCH/USD',
            'ADA/USD', 'DOT/USD', 'LINK/USD', 'UNI/USD', 'DOGE/USD',
            'SOL/USD', 'AVAX/USD', 'MATIC/USD', 'ATOM/USD', 'ALGO/USD'
        ]

    def convert_symbol_format(self, symbol: str) -> str:
        """Convert from standard format to Kraken format"""
        # Convert BTCUSDT -> XBT/USD
        symbol_map = {
            'BTCUSDT': 'XBT/USD',
            'ETHUSDT': 'ETH/USD',
            'LTCUSDT': 'LTC/USD',
            'XRPUSDT': 'XRP/USD',
            'BCHUSDT': 'BCH/USD',
            'ADAUSDT': 'ADA/USD',
            'SOLUSDT': 'SOL/USD',
            'DOTUSDT': 'DOT/USD',
            'DOGEUSDT': 'DOGE/USD',
            'AVAXUSDT': 'AVAX/USD',
            'MATICUSDT': 'MATIC/USD',
            'LINKUSDT': 'LINK/USD',
            'UNIUSDT': 'UNI/USD',
        }
        return symbol_map.get(symbol, symbol)

    def convert_symbol_back(self, kraken_symbol: str) -> str:
        """Convert from Kraken format to standard format"""
        # Convert XBT/USD -> BTCUSDT
        symbol_map = {
            'XBT/USD': 'BTCUSDT',
            'ETH/USD': 'ETHUSDT',
            'LTC/USD': 'LTCUSDT',
            'XRP/USD': 'XRPUSDT',
            'BCH/USD': 'BCHUSDT',
            'ADA/USD': 'ADAUSDT',
            'SOL/USD': 'SOLUSDT',
            'DOT/USD': 'DOTUSDT',
            'DOGE/USD': 'DOGEUSDT',
            'AVAX/USD': 'AVAXUSDT',
            'MATIC/USD': 'MATICUSDT',
            'LINK/USD': 'LINKUSDT',
            'UNI/USD': 'UNIUSDT',
        }
        return symbol_map.get(kraken_symbol, kraken_symbol)

    async def handle_message(self, message: str):
        """Handle incoming WebSocket message from Kraken"""
        try:
            data = json.loads(message)

            # Kraken sends arrays for data, objects for system messages
            if isinstance(data, dict):
                # System message
                event = data.get('event')

                if event == 'systemStatus':
                    logger.info(f"Kraken system status: {data.get('status')}")
                elif event == 'subscriptionStatus':
                    await self.handle_subscription_status(data)
                elif event == 'heartbeat':
                    logger.debug("Received Kraken heartbeat")
                elif event == 'error':
                    logger.error(f"Kraken error: {data.get('errorMessage')}")

            elif isinstance(data, list) and len(data) >= 3:
                # Data message: [channelID, data, channelName, pair]
                channel_id = data[0]
                orderbook_data = data[1]
                channel_name = data[2] if len(data) > 2 else None
                pair = data[3] if len(data) > 3 else None

                # Handle orderbook updates
                if channel_name == 'book-25' or channel_name == 'book-10':
                    symbol = self.convert_symbol_back(pair) if pair else None
                    if not symbol and channel_id in self.channel_subscriptions:
                        symbol = self.channel_subscriptions[channel_id]

                    if symbol:
                        await self.handle_orderbook_update(symbol, orderbook_data)

        except Exception as e:
            logger.error(f"Error handling Kraken message: {e}")

    async def handle_subscription_status(self, data: Dict):
        """Handle subscription status message"""
        status = data.get('status')
        channel_id = data.get('channelID')
        pair = data.get('pair')

        if status == 'subscribed' and channel_id and pair:
            symbol = self.convert_symbol_back(pair)
            self.channel_subscriptions[channel_id] = symbol
            logger.info(f"Subscribed to Kraken channel {channel_id} for {symbol}")
        elif status == 'unsubscribed':
            logger.info(f"Unsubscribed from Kraken channel")

    async def handle_orderbook_update(self, symbol: str, data: Dict):
        """Process orderbook update from Kraken"""
        try:
            # Initialize cache if needed
            if symbol not in self.orderbook_cache:
                self.orderbook_cache[symbol] = {
                    'bids': {},
                    'asks': {}
                }

            orderbook = self.orderbook_cache[symbol]

            # Handle snapshot (as) or update (a for asks, b for bids)
            if 'as' in data and 'bs' in data:
                # Snapshot
                orderbook['bids'].clear()
                orderbook['asks'].clear()

                # Process bid snapshot
                for bid in data.get('bs', []):
                    price = float(bid[0])
                    size = float(bid[1])
                    orderbook['bids'][price] = size

                # Process ask snapshot
                for ask in data.get('as', []):
                    price = float(ask[0])
                    size = float(ask[1])
                    orderbook['asks'][price] = size

            else:
                # Incremental update
                # Process bid updates
                for bid in data.get('b', []):
                    price = float(bid[0])
                    size = float(bid[1])
                    if size == 0:
                        orderbook['bids'].pop(price, None)
                    else:
                        orderbook['bids'][price] = size

                # Process ask updates
                for ask in data.get('a', []):
                    price = float(ask[0])
                    size = float(ask[1])
                    if size == 0:
                        orderbook['asks'].pop(price, None)
                    else:
                        orderbook['asks'][price] = size

            # Send normalized orderbook
            await self.send_normalized_orderbook(symbol)

        except Exception as e:
            logger.error(f"Error processing Kraken orderbook: {e}")

    async def send_normalized_orderbook(self, symbol: str):
        """Send normalized orderbook to callback"""
        if symbol not in self.subscriptions:
            return

        orderbook = self.orderbook_cache.get(symbol, {'bids': {}, 'asks': {}})

        # Sort and limit orderbook
        sorted_bids = sorted(
            orderbook['bids'].items(),
            key=lambda x: x[0],
            reverse=True
        )[:50]

        sorted_asks = sorted(
            orderbook['asks'].items(),
            key=lambda x: x[0]
        )[:50]

        normalized = self.normalize_orderbook(
            sorted_bids, sorted_asks, 'kraken', symbol
        )

        callback = self.subscriptions[symbol]
        if asyncio.iscoroutinefunction(callback):
            await callback(normalized)
        else:
            callback(normalized)

    async def subscribe_to_symbol(self, symbol: str):
        """Subscribe to orderbook updates for a symbol"""
        try:
            # Convert to Kraken format
            kraken_symbol = self.convert_symbol_format(symbol)

            # Kraken subscription message
            subscribe_message = {
                "event": "subscribe",
                "pair": [kraken_symbol],
                "subscription": {
                    "name": "book",  # Orderbook
                    "depth": 25  # Depth levels
                }
            }

            await self.send_message(subscribe_message)
            logger.info(f"Subscribed to Kraken {symbol} (as {kraken_symbol})")

        except Exception as e:
            logger.error(f"Error subscribing to Kraken: {e}")

    async def unsubscribe_from_symbol(self, symbol: str):
        """Unsubscribe from a symbol"""
        try:
            kraken_symbol = self.convert_symbol_format(symbol)

            # Find channel ID for this symbol
            channel_id = None
            for cid, sym in self.channel_subscriptions.items():
                if sym == symbol:
                    channel_id = cid
                    break

            unsubscribe_message = {
                "event": "unsubscribe",
                "pair": [kraken_symbol],
                "subscription": {
                    "name": "book"
                }
            }

            if channel_id:
                unsubscribe_message["channelID"] = channel_id

            await self.send_message(unsubscribe_message)

            # Clean up
            if symbol in self.orderbook_cache:
                del self.orderbook_cache[symbol]
            if channel_id and channel_id in self.channel_subscriptions:
                del self.channel_subscriptions[channel_id]

            logger.info(f"Unsubscribed from Kraken {symbol}")

        except Exception as e:
            logger.error(f"Error unsubscribing from Kraken: {e}")

    async def send_heartbeat(self):
        """Send heartbeat ping to Kraken"""
        try:
            # Kraken heartbeat
            heartbeat_message = {
                "event": "ping"
            }
            await self.send_message(heartbeat_message)
            logger.debug("Sent ping to Kraken")
        except Exception as e:
            logger.error(f"Error sending Kraken heartbeat: {e}")
