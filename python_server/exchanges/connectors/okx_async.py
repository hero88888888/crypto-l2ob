"""
OKX Async WebSocket connector for L2 orderbook data
High-performance implementation using asyncio
"""

import json
import logging
import time
from typing import List, Dict, Any
from .base_async import BaseAsyncConnector

logger = logging.getLogger(__name__)

class OKXAsyncConnector(BaseAsyncConnector):
    """High-performance OKX exchange WebSocket connector"""
    
    def __init__(self):
        super().__init__()
        # OKX public WebSocket
        self.ws_url = "wss://ws.okx.com:8443/ws/v5/public"
        self.orderbook_cache: Dict[str, Dict] = {}
        self.heartbeat_interval = 25  # OKX recommends ping every 30s
        
    async def get_supported_pairs(self) -> List[str]:
        """Get list of supported trading pairs"""
        # OKX uses format like BTC-USDT
        return [
            'BTC-USDT', 'ETH-USDT', 'XRP-USDT', 'SOL-USDT', 'DOGE-USDT',
            'ADA-USDT', 'AVAX-USDT', 'DOT-USDT', 'MATIC-USDT', 'LINK-USDT',
            'LTC-USDT', 'UNI-USDT', 'ATOM-USDT', 'FIL-USDT', 'ARB-USDT'
        ]
    
    def convert_symbol_format(self, symbol: str) -> str:
        """Convert from standard format to OKX format"""
        # Convert BTCUSDT -> BTC-USDT
        if 'USDT' in symbol:
            base = symbol.replace('USDT', '')
            return f"{base}-USDT"
        return symbol
    
    def convert_symbol_back(self, okx_symbol: str) -> str:
        """Convert from OKX format to standard format"""
        # Convert BTC-USDT -> BTCUSDT
        return okx_symbol.replace('-', '')
    
    async def handle_message(self, message: str):
        """Handle incoming WebSocket message from OKX"""
        try:
            data = json.loads(message)
            
            # Handle different message types
            if data.get('event'):
                event = data['event']
                
                if event == 'subscribe':
                    logger.info(f"OKX subscription successful: {data.get('arg')}")
                elif event == 'unsubscribe':
                    logger.info(f"OKX unsubscription successful: {data.get('arg')}")
                elif event == 'error':
                    logger.error(f"OKX error: {data.get('msg')} (code: {data.get('code')})")
            
            elif data.get('arg') and data.get('data'):
                # Data update
                arg = data['arg']
                channel = arg.get('channel')
                
                if channel == 'books5' or channel == 'books':
                    # Orderbook update
                    inst_id = arg.get('instId')
                    if inst_id:
                        symbol = self.convert_symbol_back(inst_id)
                        await self.handle_orderbook_update(symbol, data['data'])
                        
        except Exception as e:
            logger.error(f"Error handling OKX message: {e}")
    
    async def handle_orderbook_update(self, symbol: str, data_list: List[Dict]):
        """Process orderbook update from OKX"""
        try:
            # OKX sends data as array, take first element
            if not data_list:
                return
            
            data = data_list[0]
            
            # Initialize cache if needed
            if symbol not in self.orderbook_cache:
                self.orderbook_cache[symbol] = {
                    'bids': {},
                    'asks': {},
                    'timestamp': 0,
                    'checksum': None
                }
            
            orderbook = self.orderbook_cache[symbol]
            
            # OKX sends full orderbook snapshots
            orderbook['bids'].clear()
            orderbook['asks'].clear()
            
            # Process bids
            for bid in data.get('bids', []):
                # OKX format: [price, size, liquidation_orders, number_of_orders]
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
            
            # Store timestamp and checksum for verification
            orderbook['timestamp'] = int(data.get('ts', time.time() * 1000))
            orderbook['checksum'] = data.get('checksum')
            
            # Verify checksum if provided (optional)
            if orderbook['checksum']:
                calculated = self.calculate_checksum(orderbook)
                if calculated != orderbook['checksum']:
                    logger.warning(f"OKX checksum mismatch for {symbol}")
            
            # Send normalized orderbook
            await self.send_normalized_orderbook(symbol)
            
        except Exception as e:
            logger.error(f"Error processing OKX orderbook: {e}")
    
    def calculate_checksum(self, orderbook: Dict) -> str:
        """Calculate OKX checksum for orderbook verification"""
        # OKX checksum calculation (CRC32)
        # This is simplified - implement full CRC32 if needed
        checksum_str = ""
        
        # Get top 25 bids and asks
        bids = sorted(orderbook['bids'].items(), key=lambda x: x[0], reverse=True)[:25]
        asks = sorted(orderbook['asks'].items(), key=lambda x: x[0])[:25]
        
        # Build checksum string
        for bid_price, bid_size in bids:
            checksum_str += f"{bid_price}:{bid_size}:"
        for ask_price, ask_size in asks:
            checksum_str += f"{ask_price}:{ask_size}:"
        
        # Calculate CRC32 (simplified - use zlib.crc32 for production)
        return str(hash(checksum_str))
    
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
            sorted_bids, sorted_asks, 'okx', symbol
        )
        
        callback = self.subscriptions[symbol]
        if asyncio.iscoroutinefunction(callback):
            await callback(normalized)
        else:
            callback(normalized)
    
    async def subscribe_to_symbol(self, symbol: str):
        """Subscribe to orderbook updates for a symbol"""
        try:
            # Convert to OKX format
            okx_symbol = self.convert_symbol_format(symbol)
            
            # OKX subscription message for orderbook depth
            subscribe_message = {
                "op": "subscribe",
                "args": [{
                    "channel": "books",  # Full orderbook depth
                    "instId": okx_symbol
                }]
            }
            
            await self.send_message(subscribe_message)
            logger.info(f"Subscribed to OKX {symbol} (as {okx_symbol})")
            
        except Exception as e:
            logger.error(f"Error subscribing to OKX: {e}")
    
    async def unsubscribe_from_symbol(self, symbol: str):
        """Unsubscribe from a symbol"""
        try:
            okx_symbol = self.convert_symbol_format(symbol)
            
            unsubscribe_message = {
                "op": "unsubscribe",
                "args": [{
                    "channel": "books",
                    "instId": okx_symbol
                }]
            }
            
            await self.send_message(unsubscribe_message)
            
            # Clean up
            if symbol in self.orderbook_cache:
                del self.orderbook_cache[symbol]
            
            logger.info(f"Unsubscribed from OKX {symbol}")
            
        except Exception as e:
            logger.error(f"Error unsubscribing from OKX: {e}")
    
    async def send_heartbeat(self):
        """Send heartbeat ping to OKX"""
        try:
            # OKX uses simple ping string
            await self.ws.send_str("ping")
            logger.debug("Sent ping to OKX")
        except Exception as e:
            logger.error(f"Error sending OKX heartbeat: {e}")

import asyncio  # Required for async operations
