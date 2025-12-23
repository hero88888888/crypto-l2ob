"""
Bybit Async WebSocket connector for L2 orderbook data
High-performance implementation using asyncio
"""

import json
import logging
import time
from typing import List, Dict, Any
from .base_async import BaseAsyncConnector

logger = logging.getLogger(__name__)

class BybitAsyncConnector(BaseAsyncConnector):
    """High-performance Bybit exchange WebSocket connector"""
    
    def __init__(self):
        super().__init__()
        # Bybit public WebSocket for spot trading
        self.ws_url = "wss://stream.bybit.com/v5/public/spot"
        self.orderbook_cache: Dict[str, Dict] = {}
        self.heartbeat_interval = 20  # Bybit requires ping every 20s
        
    async def get_supported_pairs(self) -> List[str]:
        """Get list of supported trading pairs"""
        return [
            'BTCUSDT', 'ETHUSDT', 'XRPUSDT', 'EOSUSDT', 'LTCUSDT',
            'ADAUSDT', 'DOGEUSDT', 'MATICUSDT', 'SOLUSDT', 'DOTUSDT',
            'AVAXUSDT', 'LINKUSDT', 'ATOMUSDT', 'NEARUSDT', 'FTMUSDT'
        ]
    
    async def handle_message(self, message: str):
        """Handle incoming WebSocket message from Bybit"""
        try:
            data = json.loads(message)
            
            # Handle different message types
            if data.get('success') is not None:
                # Subscription response
                if data.get('success'):
                    logger.debug(f"Bybit subscription successful: {data.get('req_id')}")
                else:
                    logger.error(f"Bybit subscription failed: {data.get('ret_msg')}")
            
            elif data.get('topic'):
                # Data update
                topic = data['topic']
                
                # Parse topic to get symbol
                if topic.startswith('orderbook'):
                    # Extract symbol from topic like "orderbook.50.BTCUSDT"
                    parts = topic.split('.')
                    if len(parts) >= 3:
                        symbol = parts[2]
                        await self.handle_orderbook_update(symbol, data)
            
            elif data.get('op') == 'pong':
                # Pong response
                logger.debug("Received pong from Bybit")
                
        except Exception as e:
            logger.error(f"Error handling Bybit message: {e}")
    
    async def handle_orderbook_update(self, symbol: str, data: Dict):
        """Process orderbook update from Bybit"""
        try:
            # Get the data payload
            orderbook_data = data.get('data', {})
            update_type = data.get('type')  # 'snapshot' or 'delta'
            
            # Initialize cache if needed
            if symbol not in self.orderbook_cache:
                self.orderbook_cache[symbol] = {
                    'bids': {},
                    'asks': {},
                    'timestamp': 0
                }
            
            orderbook = self.orderbook_cache[symbol]
            
            if update_type == 'snapshot':
                # Full orderbook snapshot
                orderbook['bids'].clear()
                orderbook['asks'].clear()
                
                # Process bids (b)
                for bid in orderbook_data.get('b', []):
                    # Bybit format: [price, size]
                    price = float(bid[0])
                    size = float(bid[1])
                    if size > 0:
                        orderbook['bids'][price] = size
                
                # Process asks (a)
                for ask in orderbook_data.get('a', []):
                    price = float(ask[0])
                    size = float(ask[1])
                    if size > 0:
                        orderbook['asks'][price] = size
            
            elif update_type == 'delta':
                # Incremental update
                # Process bid updates
                for bid in orderbook_data.get('b', []):
                    price = float(bid[0])
                    size = float(bid[1])
                    if size == 0:
                        # Remove price level
                        orderbook['bids'].pop(price, None)
                    else:
                        # Update price level
                        orderbook['bids'][price] = size
                
                # Process ask updates
                for ask in orderbook_data.get('a', []):
                    price = float(ask[0])
                    size = float(ask[1])
                    if size == 0:
                        orderbook['asks'].pop(price, None)
                    else:
                        orderbook['asks'][price] = size
            
            # Update timestamp
            orderbook['timestamp'] = data.get('ts', int(time.time() * 1000))
            
            # Send normalized orderbook
            await self.send_normalized_orderbook(symbol)
            
        except Exception as e:
            logger.error(f"Error processing Bybit orderbook: {e}")
    
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
            sorted_bids, sorted_asks, 'bybit', symbol
        )
        
        callback = self.subscriptions[symbol]
        if asyncio.iscoroutinefunction(callback):
            await callback(normalized)
        else:
            callback(normalized)
    
    async def subscribe_to_symbol(self, symbol: str):
        """Subscribe to orderbook updates for a symbol"""
        try:
            # Bybit subscription message
            # Subscribe to orderbook depth 50
            subscribe_message = {
                "op": "subscribe",
                "args": [f"orderbook.50.{symbol}"],
                "req_id": f"sub_{symbol}_{int(time.time() * 1000)}"
            }
            
            await self.send_message(subscribe_message)
            logger.info(f"Subscribed to Bybit {symbol}")
            
        except Exception as e:
            logger.error(f"Error subscribing to Bybit: {e}")
    
    async def unsubscribe_from_symbol(self, symbol: str):
        """Unsubscribe from a symbol"""
        try:
            unsubscribe_message = {
                "op": "unsubscribe",
                "args": [f"orderbook.50.{symbol}"],
                "req_id": f"unsub_{symbol}_{int(time.time() * 1000)}"
            }
            
            await self.send_message(unsubscribe_message)
            
            # Clean up
            if symbol in self.orderbook_cache:
                del self.orderbook_cache[symbol]
            
            logger.info(f"Unsubscribed from Bybit {symbol}")
            
        except Exception as e:
            logger.error(f"Error unsubscribing from Bybit: {e}")
    
    async def send_heartbeat(self):
        """Send heartbeat ping to Bybit"""
        try:
            # Bybit requires ping message
            ping_message = {
                "op": "ping",
                "req_id": f"ping_{int(time.time() * 1000)}"
            }
            await self.send_message(ping_message)
            logger.debug("Sent ping to Bybit")
        except Exception as e:
            logger.error(f"Error sending Bybit heartbeat: {e}")

import asyncio  # Required for async operations
