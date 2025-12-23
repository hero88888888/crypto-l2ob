"""Coinbase WebSocket connector for L2 orderbook data"""

import json
import logging
from typing import List, Dict, Any
from .base_connector import BaseConnector

logger = logging.getLogger(__name__)

class CoinbaseConnector(BaseConnector):
    """Coinbase exchange WebSocket connector"""
    
    def __init__(self):
        super().__init__()
        self.ws_url = "wss://ws-feed.exchange.coinbase.com"
        self.orderbook_cache = {}
        
    def get_supported_pairs(self) -> List[str]:
        """Get list of supported trading pairs"""
        return ['BTC-USD', 'ETH-USD', 'SOL-USD', 'ADA-USD', 'DOGE-USD', 
                'AVAX-USD', 'MATIC-USD', 'LINK-USD', 'DOT-USD', 'UNI-USD']
    
    def handle_message(self, message: str):
        """Handle incoming WebSocket message"""
        try:
            data = json.loads(message)
            msg_type = data.get('type')
            
            # Log all message types during debug
            if msg_type not in ['heartbeat']:
                logger.debug(f"Coinbase message type: {msg_type}, keys: {data.keys()}")
            
            if msg_type == 'snapshot':
                self.handle_snapshot(data)
            elif msg_type == 'l2update':
                self.handle_l2_update(data)
            elif msg_type == 'subscriptions':
                logger.info(f"Subscription confirmed: {data}")
                # Check if we have active channels
                channels = data.get('channels', [])
                if not channels:
                    logger.warning("No channels in subscription response - retrying subscription")
            elif msg_type == 'error':
                logger.error(f"Coinbase error: {data}")
                
        except Exception as e:
            logger.error(f"Error handling Coinbase message: {e}")
    
    def handle_snapshot(self, data: Dict):
        """Handle orderbook snapshot"""
        try:
            symbol = data['product_id']
            
            orderbook = {
                'bids': {},
                'asks': {}
            }
            
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
            
            self.orderbook_cache[symbol] = orderbook
            self.emit_orderbook(symbol)
            
        except Exception as e:
            logger.error(f"Error handling Coinbase snapshot: {e}")
    
    def handle_l2_update(self, data: Dict):
        """Handle L2 orderbook update"""
        try:
            symbol = data['product_id']
            orderbook = self.orderbook_cache.get(symbol)
            
            if not orderbook:
                return
            
            # Process changes
            for change in data.get('changes', []):
                side = change[0]
                price = float(change[1])
                size = float(change[2])
                
                book = orderbook['bids'] if side == 'buy' else orderbook['asks']
                
                if size == 0:
                    book.pop(price, None)
                else:
                    book[price] = size
            
            self.emit_orderbook(symbol)
            
        except Exception as e:
            logger.error(f"Error handling Coinbase L2 update: {e}")
    
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
                sorted_bids, sorted_asks, 'coinbase', symbol
            )
            
            self.subscriptions[symbol](normalized)
            
        except Exception as e:
            logger.error(f"Error emitting Coinbase orderbook: {e}")
    
    def subscribe_to_symbol(self, symbol: str):
        """Subscribe to orderbook updates for a symbol"""
        try:
            # Coinbase Pro API format
            subscribe_message = {
                "type": "subscribe",
                "product_ids": [symbol],
                "channels": [
                    {
                        "name": "level2",
                        "product_ids": [symbol]
                    }
                ]
            }
            
            if self.ws:
                self.ws.send(json.dumps(subscribe_message))
                logger.info(f"Subscribed to Coinbase {symbol}")
                
        except Exception as e:
            logger.error(f"Error subscribing to Coinbase: {e}")
    
    def unsubscribe_from_symbol(self, symbol: str):
        """Unsubscribe from a symbol"""
        try:
            if self.ws:
                unsubscribe_message = {
                    "type": "unsubscribe",
                    "product_ids": [symbol],
                    "channels": ["level2"]
                }
                self.ws.send(json.dumps(unsubscribe_message))
                
                if symbol in self.orderbook_cache:
                    del self.orderbook_cache[symbol]
                    
                logger.info(f"Unsubscribed from Coinbase {symbol}")
                
        except Exception as e:
            logger.error(f"Error unsubscribing from Coinbase: {e}")
