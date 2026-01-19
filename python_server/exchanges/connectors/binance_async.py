"""
Binance Async WebSocket connector for L2 orderbook data
High-performance implementation using asyncio
"""

import asyncio  # Required for async operations
import json
import logging
import time
from typing import List, Dict, Any
from .base_async import BaseAsyncConnector

logger = logging.getLogger(__name__)


class BinanceAsyncConnector(BaseAsyncConnector):
    """High-performance Binance exchange WebSocket connector"""

    def __init__(self):
        super().__init__()
        self.ws_url = "wss://stream.binance.com:9443/ws"
        self.stream_ids: Dict[str, str] = {}
        self.orderbook_cache: Dict[str, Dict] = {}

    async def get_supported_pairs(self) -> List[str]:
        """Get list of supported trading pairs"""
        # Python list - equivalent to JavaScript array
        return [
            'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT',
            'SOLUSDT', 'DOTUSDT', 'DOGEUSDT', 'AVAXUSDT', 'SHIBUSDT',
            'MATICUSDT', 'LTCUSDT', 'UNIUSDT', 'LINKUSDT', 'ATOMUSDT'
        ]

    async def handle_message(self, message: str):
        """Handle incoming WebSocket message asynchronously"""
        try:
            # json.loads() is Python's JSON.parse()
            data = json.loads(message)

            # Python dictionary access with .get() for safety (like JS optional chaining)
            if data.get('result') is None and 'id' in data:
                logger.debug(f"Subscription confirmed: {data.get('id')}")
                return

            # Handle depth snapshot updates
            if 'lastUpdateId' in data and 'bids' in data and 'asks' in data:
                # Find symbol from stream_ids
                for symbol, stream in self.stream_ids.items():
                    await self.handle_depth_snapshot(symbol, data)
                    break

            # Handle stream data with wrapper
            elif 'stream' in data and 'data' in data:
                # Python string methods - split() works same as JS
                stream_parts = data['stream'].split('@')
                symbol = stream_parts[0].upper()

                update_data = data['data']
                if 'lastUpdateId' in update_data and 'bids' in update_data:
                    await self.handle_depth_snapshot(symbol, update_data)
                elif update_data.get('e') == 'depthUpdate':
                    await self.update_orderbook(symbol, update_data)

        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}")
        except Exception as e:
            logger.error(f"Error handling Binance message: {e}")

    async def handle_depth_snapshot(self, symbol: str, data: Dict):
        """Handle depth snapshot data asynchronously"""
        try:
            # Initialize orderbook if not exists
            if symbol not in self.orderbook_cache:
                self.orderbook_cache[symbol] = {
                    'bids': {},  # Python dict - like JS object
                    'asks': {},
                    'lastUpdateId': 0
                }

            orderbook = self.orderbook_cache[symbol]
            orderbook['bids'].clear()  # Python dict.clear() - like JS object = {}
            orderbook['asks'].clear()

            # Process bids - Python for loop over list
            for bid in data.get('bids', []):
                price = float(bid[0])  # Python float() - like JS Number()
                size = float(bid[1])
                if size > 0:
                    orderbook['bids'][price] = size

            # Process asks
            for ask in data.get('asks', []):
                price = float(ask[0])
                size = float(ask[1])
                if size > 0:
                    orderbook['asks'][price] = size

            orderbook['lastUpdateId'] = data.get('lastUpdateId', 0)

            # Send to callback if subscribed
            if symbol in self.subscriptions:
                # Python sorted() with lambda - like JS array.sort()
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
                    sorted_bids, sorted_asks, 'binance', symbol
                )

                # Async callback invocation
                callback = self.subscriptions[symbol]
                if asyncio.iscoroutinefunction(callback):
                    await callback(normalized)
                else:
                    callback(normalized)

        except Exception as e:
            logger.error(f"Error handling Binance depth snapshot: {e}")

    async def update_orderbook(self, symbol: str, data: Dict):
        """Update orderbook with incremental changes"""
        try:
            # Initialize orderbook if not exists
            if symbol not in self.orderbook_cache:
                self.orderbook_cache[symbol] = {
                    'bids': {},
                    'asks': {},
                    'lastUpdateId': 0
                }
                # Get initial snapshot
                await self.get_snapshot(symbol)
                return

            orderbook = self.orderbook_cache[symbol]

            # Update bids
            for bid in data.get('b', []):
                price = float(bid[0])
                size = float(bid[1])
                if size == 0:
                    # Python dict.pop() - like JS delete object.key
                    orderbook['bids'].pop(price, None)
                else:
                    orderbook['bids'][price] = size

            # Update asks
            for ask in data.get('a', []):
                price = float(ask[0])
                size = float(ask[1])
                if size == 0:
                    orderbook['asks'].pop(price, None)
                else:
                    orderbook['asks'][price] = size

            orderbook['lastUpdateId'] = data['u']

            # Convert to sorted lists
            sorted_bids = sorted(
                orderbook['bids'].items(),
                key=lambda x: x[0],
                reverse=True
            )[:50]
            sorted_asks = sorted(
                orderbook['asks'].items(),
                key=lambda x: x[0]
            )[:50]

            # Send to callback if subscribed
            if symbol in self.subscriptions:
                normalized = self.normalize_orderbook(
                    sorted_bids, sorted_asks, 'binance', symbol
                )

                callback = self.subscriptions[symbol]
                if asyncio.iscoroutinefunction(callback):
                    await callback(normalized)
                else:
                    callback(normalized)

        except Exception as e:
            logger.error(f"Error updating Binance orderbook: {e}")

    async def get_snapshot(self, symbol: str):
        """Get orderbook snapshot from REST API asynchronously"""
        try:
            url = f"https://api.binance.com/api/v3/depth?symbol={symbol}&limit=50"

            # aiohttp for async HTTP requests - like fetch() in JS
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()

                    # Initialize if not exists
                    if symbol not in self.orderbook_cache:
                        self.orderbook_cache[symbol] = {
                            'bids': {},
                            'asks': {},
                            'lastUpdateId': 0
                        }

                    orderbook = self.orderbook_cache[symbol]
                    orderbook['bids'].clear()
                    orderbook['asks'].clear()

                    # Set bids
                    for bid in data['bids']:
                        orderbook['bids'][float(bid[0])] = float(bid[1])

                    # Set asks
                    for ask in data['asks']:
                        orderbook['asks'][float(ask[0])] = float(ask[1])

                    orderbook['lastUpdateId'] = data['lastUpdateId']
                    logger.info(f"Got Binance snapshot for {symbol}")

                    # Send initial data to callback
                    if symbol in self.subscriptions:
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
                            sorted_bids, sorted_asks, 'binance', symbol
                        )

                        callback = self.subscriptions[symbol]
                        if asyncio.iscoroutinefunction(callback):
                            await callback(normalized)
                        else:
                            callback(normalized)
                else:
                    logger.error(f"Failed to get snapshot: HTTP {response.status}")

        except Exception as e:
            logger.error(f"Error getting Binance snapshot: {e}")

    async def subscribe_to_symbol(self, symbol: str):
        """Subscribe to orderbook updates for a symbol"""
        try:
            # Python f-strings - like JS template literals
            stream_name = f"{symbol.lower()}@depth20@100ms"
            self.stream_ids[symbol] = stream_name

            # Python dict literal - like JS object literal
            subscribe_message = {
                "method": "SUBSCRIBE",
                "params": [stream_name],
                "id": int(time.time() * 1000)
            }

            await self.send_message(subscribe_message)
            logger.info(f"Subscribed to Binance {symbol}")

            # Get initial snapshot after subscription
            # asyncio.create_task() - like JS Promise without await
            asyncio.create_task(self.get_snapshot(symbol))

        except Exception as e:
            logger.error(f"Error subscribing to Binance: {e}")

    async def unsubscribe_from_symbol(self, symbol: str):
        """Unsubscribe from a symbol"""
        try:
            stream_name = self.stream_ids.get(symbol)
            if stream_name:
                unsubscribe_message = {
                    "method": "UNSUBSCRIBE",
                    "params": [stream_name],
                    "id": int(time.time() * 1000)
                }

                await self.send_message(unsubscribe_message)

                # Clean up
                del self.stream_ids[symbol]
                if symbol in self.orderbook_cache:
                    del self.orderbook_cache[symbol]

                logger.info(f"Unsubscribed from Binance {symbol}")

        except Exception as e:
            logger.error(f"Error unsubscribing from Binance: {e}")
