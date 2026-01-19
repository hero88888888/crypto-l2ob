"""Binance WebSocket connector for L2 orderbook data"""

import json
import time
import logging
import requests
from typing import List, Dict, Any
from .base_connector import BaseConnector

logger = logging.getLogger(__name__)


class BinanceConnector(BaseConnector):
    """Binance exchange WebSocket connector"""

    def __init__(self):
        super().__init__()
        self.ws_url = "wss://stream.binance.com:9443/ws"
        self.stream_ids = {}
        self.orderbook_cache = {}

    def get_supported_pairs(self) -> List[str]:
        """Get list of supported trading pairs"""
        return ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT',
                'SOLUSDT', 'DOTUSDT', 'DOGEUSDT', 'AVAXUSDT', 'SHIBUSDT']

    def handle_message(self, message: str):
        """Handle incoming WebSocket message"""
        try:
            data = json.loads(message)

            # Handle subscription response
            if 'result' in data and data['result'] is None:
                logger.debug("Subscription successful")
                return

            # Handle depth20 updates (snapshot style)
            if 'lastUpdateId' in data and 'bids' in data and 'asks' in data:
                # This is a depth20 snapshot - find the symbol from stream_ids
                for symbol, stream in self.stream_ids.items():
                    # Process this update for the subscribed symbol
                    self.handle_depth_snapshot(symbol, data)
                    break
            # Handle stream data with wrapper
            elif 'stream' in data and 'data' in data:
                stream_parts = data['stream'].split('@')
                symbol = stream_parts[0].upper()

                update_data = data['data']
                if 'lastUpdateId' in update_data and 'bids' in update_data:
                    # depth20 snapshot in stream format
                    self.handle_depth_snapshot(symbol, update_data)
                elif update_data.get('e') == 'depthUpdate':
                    # incremental update
                    self.update_orderbook(symbol, update_data)

        except Exception as e:
            logger.error(f"Error handling Binance message: {e}")

    def handle_depth_snapshot(self, symbol: str, data: Dict):
        """Handle depth20 snapshot data"""
        try:
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

            # Process bids
            for bid in data.get('bids', []):
                price = float(bid[0])
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

            # Send to callback
            if symbol in self.subscriptions:
                sorted_bids = sorted(orderbook['bids'].items(), key=lambda x: x[0], reverse=True)[:50]
                sorted_asks = sorted(orderbook['asks'].items(), key=lambda x: x[0])[:50]
                normalized = self.normalize_orderbook(
                    sorted_bids, sorted_asks, 'binance', symbol
                )
                self.subscriptions[symbol](normalized)

        except Exception as e:
            logger.error(f"Error handling Binance depth snapshot: {e}")

    def update_orderbook(self, symbol: str, data: Dict):
        """Update orderbook with new data"""
        try:
            # Initialize orderbook if not exists
            if symbol not in self.orderbook_cache:
                self.orderbook_cache[symbol] = {
                    'bids': {},
                    'asks': {},
                    'lastUpdateId': 0
                }
                # Get initial snapshot
                self.get_snapshot(symbol)
                return

            orderbook = self.orderbook_cache[symbol]

            # Update bids
            for bid in data.get('b', []):
                price = float(bid[0])
                size = float(bid[1])
                if size == 0:
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
            sorted_bids = sorted(orderbook['bids'].items(), key=lambda x: x[0], reverse=True)[:50]
            sorted_asks = sorted(orderbook['asks'].items(), key=lambda x: x[0])[:50]

            # Send to callback if subscribed
            if symbol in self.subscriptions:
                normalized = self.normalize_orderbook(
                    sorted_bids, sorted_asks, 'binance', symbol
                )
                self.subscriptions[symbol](normalized)

        except Exception as e:
            logger.error(f"Error updating Binance orderbook: {e}")

    def get_snapshot(self, symbol: str):
        """Get orderbook snapshot from REST API"""
        try:
            url = f"https://api.binance.com/api/v3/depth?symbol={symbol}&limit=50"
            response = requests.get(url)

            if response.status_code == 200:
                data = response.json()

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
                    sorted_bids = sorted(orderbook['bids'].items(), key=lambda x: x[0], reverse=True)[:50]
                    sorted_asks = sorted(orderbook['asks'].items(), key=lambda x: x[0])[:50]
                    normalized = self.normalize_orderbook(
                        sorted_bids, sorted_asks, 'binance', symbol
                    )
                    self.subscriptions[symbol](normalized)

        except Exception as e:
            logger.error(f"Error getting Binance snapshot: {e}")

    def subscribe_to_symbol(self, symbol: str):
        """Subscribe to orderbook updates for a symbol"""
        try:
            # Use depth20@100ms for more reliable updates
            stream_name = f"{symbol.lower()}@depth20@100ms"
            self.stream_ids[symbol] = stream_name

            subscribe_message = {
                "method": "SUBSCRIBE",
                "params": [stream_name],
                "id": int(time.time())
            }

            if self.ws:
                self.ws.send(json.dumps(subscribe_message))
                logger.info(f"Subscribed to Binance {symbol}")

                # Get initial snapshot after a short delay to ensure subscription is active
                import threading
                threading.Timer(0.5, self.get_snapshot, args=[symbol]).start()

        except Exception as e:
            logger.error(f"Error subscribing to Binance: {e}")

    def unsubscribe_from_symbol(self, symbol: str):
        """Unsubscribe from a symbol"""
        try:
            stream_name = self.stream_ids.get(symbol)
            if stream_name and self.ws:
                unsubscribe_message = {
                    "method": "UNSUBSCRIBE",
                    "params": [stream_name],
                    "id": int(time.time())
                }
                self.ws.send(json.dumps(unsubscribe_message))
                del self.stream_ids[symbol]
                if symbol in self.orderbook_cache:
                    del self.orderbook_cache[symbol]
                logger.info(f"Unsubscribed from Binance {symbol}")

        except Exception as e:
            logger.error(f"Error unsubscribing from Binance: {e}")
