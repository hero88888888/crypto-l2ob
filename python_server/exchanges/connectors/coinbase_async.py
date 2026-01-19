"""
Coinbase Async WebSocket connector for L2 orderbook data
High-performance implementation using asyncio
"""

import asyncio
import json
import logging
import time
from typing import List, Dict, Any
from .base_async import BaseAsyncConnector

logger = logging.getLogger(__name__)


class CoinbaseAsyncConnector(BaseAsyncConnector):
    """High-performance Coinbase exchange WebSocket connector"""

    def __init__(self):
        super().__init__()
        self.ws_url = "wss://ws-feed.exchange.coinbase.com"
        self.orderbook_cache: Dict[str, Dict] = {}
        self.sequence_numbers: Dict[str, int] = {}

    async def get_supported_pairs(self) -> List[str]:
        """Get list of supported trading pairs"""
        # Coinbase uses format like BTC-USD
        return [
            'BTC-USD', 'ETH-USD', 'LTC-USD', 'XRP-USD', 'BCH-USD',
            'ADA-USD', 'SOL-USD', 'DOT-USD', 'DOGE-USD', 'AVAX-USD',
            'MATIC-USD', 'LINK-USD', 'UNI-USD', 'ATOM-USD', 'ALGO-USD'
        ]

    def convert_symbol_format(self, symbol: str) -> str:
        """Convert from standard format to Coinbase format"""
        # Convert BTCUSDT -> BTC-USD
        symbol_map = {
            'BTCUSDT': 'BTC-USD',
            'ETHUSDT': 'ETH-USD',
            'LTCUSDT': 'LTC-USD',
            'XRPUSDT': 'XRP-USD',
            'ADAUSDT': 'ADA-USD',
            'SOLUSDT': 'SOL-USD',
            'DOTUSDT': 'DOT-USD',
            'DOGEUSDT': 'DOGE-USD',
            'AVAXUSDT': 'AVAX-USD',
            'MATICUSDT': 'MATIC-USD',
            'LINKUSDT': 'LINK-USD',
            'UNIUSDT': 'UNI-USD',
        }
        return symbol_map.get(symbol, symbol)

    def convert_symbol_back(self, coinbase_symbol: str) -> str:
        """Convert from Coinbase format to standard format"""
        # Convert BTC-USD -> BTCUSDT
        return coinbase_symbol.replace('-USD', 'USDT').replace('-', '')

    async def handle_message(self, message: str):
        """Handle incoming WebSocket message from Coinbase"""
        try:
            data = json.loads(message)
            msg_type = data.get('type')

            if msg_type == 'subscriptions':
                logger.info(f"Coinbase subscription confirmed: {data.get('channels')}")

            elif msg_type == 'snapshot':
                await self.handle_snapshot(data)

            elif msg_type == 'l2update':
                await self.handle_l2_update(data)

            elif msg_type == 'error':
                logger.error(f"Coinbase error: {data.get('message')}")

        except Exception as e:
            logger.error(f"Error handling Coinbase message: {e}")

    async def handle_snapshot(self, data: Dict):
        """Handle orderbook snapshot from Coinbase"""
        try:
            product_id = data.get('product_id')
            if not product_id:
                return

            symbol = self.convert_symbol_back(product_id)

            # Initialize orderbook
            self.orderbook_cache[symbol] = {
                'bids': {},
                'asks': {}
            }

            orderbook = self.orderbook_cache[symbol]

            # Process bids
            for bid in data.get('bids', []):
                price = float(bid[0])
                size = float(bid[1])
                orderbook['bids'][price] = size

            # Process asks
            for ask in data.get('asks', []):
                price = float(ask[0])
                size = float(ask[1])
                orderbook['asks'][price] = size

            # Store sequence number
            self.sequence_numbers[symbol] = data.get('sequence', 0)

            # Send normalized orderbook
            await self.send_normalized_orderbook(symbol)

        except Exception as e:
            logger.error(f"Error handling Coinbase snapshot: {e}")

    async def handle_l2_update(self, data: Dict):
        """Handle incremental orderbook update from Coinbase"""
        try:
            product_id = data.get('product_id')
            if not product_id:
                return

            symbol = self.convert_symbol_back(product_id)

            # Check sequence
            sequence = data.get('sequence', 0)
            if symbol in self.sequence_numbers:
                if sequence <= self.sequence_numbers[symbol]:
                    # Out of order, ignore
                    return
                self.sequence_numbers[symbol] = sequence

            # Get orderbook
            if symbol not in self.orderbook_cache:
                logger.warning(f"No orderbook cache for {symbol}, requesting snapshot")
                return

            orderbook = self.orderbook_cache[symbol]

            # Process changes
            for change in data.get('changes', []):
                side = change[0]  # 'buy' or 'sell'
                price = float(change[1])
                size = float(change[2])

                if side == 'buy':
                    if size == 0:
                        orderbook['bids'].pop(price, None)
                    else:
                        orderbook['bids'][price] = size
                elif side == 'sell':
                    if size == 0:
                        orderbook['asks'].pop(price, None)
                    else:
                        orderbook['asks'][price] = size

            # Send normalized orderbook
            await self.send_normalized_orderbook(symbol)

        except Exception as e:
            logger.error(f"Error handling Coinbase l2update: {e}")

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
            sorted_bids, sorted_asks, 'coinbase', symbol
        )

        callback = self.subscriptions[symbol]
        if asyncio.iscoroutinefunction(callback):
            await callback(normalized)
        else:
            callback(normalized)

    async def subscribe_to_symbol(self, symbol: str):
        """Subscribe to orderbook updates for a symbol"""
        try:
            # Convert to Coinbase format
            coinbase_symbol = self.convert_symbol_format(symbol)

            # Coinbase subscription message
            subscribe_message = {
                "type": "subscribe",
                "product_ids": [coinbase_symbol],
                "channels": [
                    {
                        "name": "level2",
                        "product_ids": [coinbase_symbol]
                    }
                ]
            }

            await self.send_message(subscribe_message)
            logger.info(f"Subscribed to Coinbase {symbol} (as {coinbase_symbol})")

        except Exception as e:
            logger.error(f"Error subscribing to Coinbase: {e}")

    async def unsubscribe_from_symbol(self, symbol: str):
        """Unsubscribe from a symbol"""
        try:
            coinbase_symbol = self.convert_symbol_format(symbol)

            unsubscribe_message = {
                "type": "unsubscribe",
                "product_ids": [coinbase_symbol],
                "channels": ["level2"]
            }

            await self.send_message(unsubscribe_message)

            # Clean up
            if symbol in self.orderbook_cache:
                del self.orderbook_cache[symbol]
            if symbol in self.sequence_numbers:
                del self.sequence_numbers[symbol]

            logger.info(f"Unsubscribed from Coinbase {symbol}")

        except Exception as e:
            logger.error(f"Error unsubscribing from Coinbase: {e}")
