"""Kraken WebSocket connector for L2 orderbook data"""

import json
import logging
from typing import List, Dict, Any
from .base_connector import BaseConnector

logger = logging.getLogger(__name__)


class KrakenConnector(BaseConnector):
    """Kraken exchange WebSocket connector"""

    def __init__(self):
        super().__init__()
        self.ws_url = "wss://ws.kraken.com"
        self.channel_map = {}
        self.orderbook_cache = {}

    def get_supported_pairs(self) -> List[str]:
        """Get list of supported trading pairs"""
        return ['XBT/USD', 'ETH/USD', 'SOL/USD', 'ADA/USD', 'DOT/USD',
                'MATIC/USD', 'LINK/USD', 'AVAX/USD', 'ALGO/USD', 'ATOM/USD']

    def handle_message(self, message: str):
        """Handle incoming WebSocket message"""
        try:
            data = json.loads(message)

            # Handle subscription response
            if isinstance(data, dict):
                if data.get('event') == 'subscriptionStatus':
                    channel_id = data.get('channelID')
                    pair = data.get('pair')
                    if channel_id and pair:
                        self.channel_map[channel_id] = pair
                        logger.info(f"Kraken subscription confirmed for {pair}")
                elif data.get('event') == 'pong':
                    logger.debug("Kraken pong received")
                return

            # Handle orderbook data
            if isinstance(data, list) and len(data) >= 4:
                channel_id = data[0]
                orderbook_data = data[1]
                channel_name = data[2] if len(data) > 2 else None
                pair = data[3] if len(data) > 3 else self.channel_map.get(channel_id)

                if channel_name and 'book' in channel_name and pair:
                    if 'as' in orderbook_data or 'bs' in orderbook_data:
                        # Snapshot
                        self.handle_snapshot(pair, orderbook_data)
                    elif 'a' in orderbook_data or 'b' in orderbook_data:
                        # Update
                        self.handle_update(pair, orderbook_data)

        except Exception as e:
            logger.error(f"Error handling Kraken message: {e}")

    def handle_snapshot(self, symbol: str, data: Dict):
        """Handle orderbook snapshot"""
        try:
            orderbook = {
                'bids': {},
                'asks': {}
            }

            # Process bids
            if 'bs' in data:
                for bid in data['bs']:
                    price = float(bid[0])
                    size = float(bid[1])
                    orderbook['bids'][price] = size

            # Process asks
            if 'as' in data:
                for ask in data['as']:
                    price = float(ask[0])
                    size = float(ask[1])
                    orderbook['asks'][price] = size

            self.orderbook_cache[symbol] = orderbook
            self.emit_orderbook(symbol)

        except Exception as e:
            logger.error(f"Error handling Kraken snapshot: {e}")

    def handle_update(self, symbol: str, data: Dict):
        """Handle orderbook update"""
        try:
            orderbook = self.orderbook_cache.get(symbol)
            if not orderbook:
                return

            # Process bid updates
            if 'b' in data:
                for bid in data['b']:
                    price = float(bid[0])
                    size = float(bid[1])

                    if size == 0:
                        orderbook['bids'].pop(price, None)
                    else:
                        orderbook['bids'][price] = size

            # Process ask updates
            if 'a' in data:
                for ask in data['a']:
                    price = float(ask[0])
                    size = float(ask[1])

                    if size == 0:
                        orderbook['asks'].pop(price, None)
                    else:
                        orderbook['asks'][price] = size

            self.emit_orderbook(symbol)

        except Exception as e:
            logger.error(f"Error handling Kraken update: {e}")

    def emit_orderbook(self, symbol: str):
        """Emit normalized orderbook to callback"""
        try:
            orderbook = self.orderbook_cache.get(symbol)
            if not orderbook or symbol not in self.subscriptions:
                return

            # Convert to sorted lists
            sorted_bids = sorted(orderbook['bids'].items(), key=lambda x: x[0], reverse=True)[:50]
            sorted_asks = sorted(orderbook['asks'].items(), key=lambda x: x[0])[:50]

            normalized = self.normalize_orderbook(
                sorted_bids, sorted_asks, 'kraken', symbol
            )

            self.subscriptions[symbol](normalized)

        except Exception as e:
            logger.error(f"Error emitting Kraken orderbook: {e}")

    def subscribe_to_symbol(self, symbol: str):
        """Subscribe to orderbook updates for a symbol"""
        try:
            subscribe_message = {
                "event": "subscribe",
                "pair": [symbol],
                "subscription": {
                    "name": "book",
                    "depth": 25
                }
            }

            if self.ws:
                self.ws.send(json.dumps(subscribe_message))
                logger.info(f"Subscribed to Kraken {symbol}")

        except Exception as e:
            logger.error(f"Error subscribing to Kraken: {e}")

    def unsubscribe_from_symbol(self, symbol: str):
        """Unsubscribe from a symbol"""
        try:
            if self.ws:
                # Find channel ID for this symbol
                channel_id = None
                for cid, pair in self.channel_map.items():
                    if pair == symbol:
                        channel_id = cid
                        break

                if channel_id:
                    unsubscribe_message = {
                        "event": "unsubscribe",
                        "pair": [symbol],
                        "subscription": {
                            "name": "book"
                        }
                    }
                    self.ws.send(json.dumps(unsubscribe_message))

                    del self.channel_map[channel_id]
                    if symbol in self.orderbook_cache:
                        del self.orderbook_cache[symbol]

                    logger.info(f"Unsubscribed from Kraken {symbol}")

        except Exception as e:
            logger.error(f"Error unsubscribing from Kraken: {e}")
