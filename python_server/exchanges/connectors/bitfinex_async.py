"""
Bitfinex Async WebSocket connector for L2 orderbook data
High-performance implementation using asyncio
"""

import json
import logging
import time
from typing import List, Dict, Any, Optional
from .base_async import BaseAsyncConnector

logger = logging.getLogger(__name__)

class BitfinexAsyncConnector(BaseAsyncConnector):
    """High-performance Bitfinex exchange WebSocket connector"""
    
    def __init__(self):
        super().__init__()
        self.ws_url = "wss://api-pub.bitfinex.com/ws/2"
        self.channel_ids: Dict[int, str] = {}  # channel_id -> symbol mapping
        self.symbol_to_channel: Dict[str, int] = {}  # symbol -> channel_id mapping
        self.orderbook_cache: Dict[str, Dict] = {}
        
    async def get_supported_pairs(self) -> List[str]:
        """Get list of supported trading pairs"""
        # Bitfinex uses different symbol format (tBTCUSD instead of BTCUSDT)
        return [
            'tBTCUSD', 'tETHUSD', 'tLTCUSD', 'tXRPUSD', 'tEOSUSD',
            'tNEOUSD', 'tIOTUSD', 'tXMRUSD', 'tTRXUSD', 'tXLMUSD',
            'tDOTUSD', 'tLINKUSD', 'tUNIUSD', 'tADAUSD', 'tSOLUSD'
        ]
    
    def convert_symbol_format(self, symbol: str) -> str:
        """Convert from standard format to Bitfinex format"""
        # Convert BTCUSDT -> tBTCUSD
        symbol_map = {
            'BTCUSDT': 'tBTCUSD',
            'ETHUSDT': 'tETHUSD',
            'LTCUSDT': 'tLTCUSD',
            'XRPUSDT': 'tXRPUSD',
            'ADAUSDT': 'tADAUSD',
            'SOLUSDT': 'tSOLUSD',
            'DOTUSDT': 'tDOTUSD',
            'LINKUSDT': 'tLINKUSD',
            'UNIUSDT': 'tUNIUSD',
        }
        return symbol_map.get(symbol, symbol)
    
    def convert_symbol_back(self, bitfinex_symbol: str) -> str:
        """Convert from Bitfinex format to standard format"""
        # Convert tBTCUSD -> BTCUSDT
        symbol_map = {
            'tBTCUSD': 'BTCUSDT',
            'tETHUSD': 'ETHUSDT',
            'tLTCUSD': 'LTCUSDT',
            'tXRPUSD': 'XRPUSDT',
            'tADAUSD': 'ADAUSDT',
            'tSOLUSD': 'SOLUSDT',
            'tDOTUSD': 'DOTUSDT',
            'tLINKUSD': 'LINKUSDT',
            'tUNIUSD': 'UNIUSDT',
        }
        return symbol_map.get(bitfinex_symbol, bitfinex_symbol)
    
    async def handle_message(self, message: str):
        """Handle incoming WebSocket message from Bitfinex"""
        try:
            data = json.loads(message)
            
            # Handle different message types
            if isinstance(data, dict):
                # Handle events
                if data.get('event') == 'subscribed':
                    await self.handle_subscription_success(data)
                elif data.get('event') == 'error':
                    logger.error(f"Bitfinex error: {data.get('msg')}")
                elif data.get('event') == 'info':
                    logger.info(f"Bitfinex info: {data}")
            
            elif isinstance(data, list):
                # Handle channel data
                channel_id = data[0]
                
                # Ignore heartbeat
                if data[1] == 'hb':
                    return
                
                if channel_id in self.channel_ids:
                    symbol = self.channel_ids[channel_id]
                    await self.handle_orderbook_update(symbol, data[1])
                    
        except Exception as e:
            logger.error(f"Error handling Bitfinex message: {e}")
    
    async def handle_subscription_success(self, data: Dict):
        """Handle successful subscription response"""
        channel_id = data['chanId']
        symbol = data.get('symbol', data.get('pair'))
        
        if symbol:
            # Convert back to standard format for internal use
            standard_symbol = self.convert_symbol_back(symbol)
            self.channel_ids[channel_id] = standard_symbol
            self.symbol_to_channel[standard_symbol] = channel_id
            logger.info(f"Subscribed to Bitfinex channel {channel_id} for {standard_symbol}")
    
    async def handle_orderbook_update(self, symbol: str, data: Any):
        """Process orderbook update from Bitfinex"""
        try:
            # Initialize cache if needed
            if symbol not in self.orderbook_cache:
                self.orderbook_cache[symbol] = {
                    'bids': {},
                    'asks': {}
                }
            
            orderbook = self.orderbook_cache[symbol]
            
            # Check if it's a snapshot (array of arrays) or update (single array)
            if isinstance(data[0], list):
                # Snapshot - clear and rebuild
                orderbook['bids'].clear()
                orderbook['asks'].clear()
                
                for entry in data:
                    price = float(entry[0])
                    count = int(entry[1])
                    amount = float(entry[2])
                    
                    if count > 0:
                        # Positive amount = bid, negative = ask
                        if amount > 0:
                            orderbook['bids'][price] = amount
                        else:
                            orderbook['asks'][price] = abs(amount)
            else:
                # Single update
                price = float(data[0])
                count = int(data[1])
                amount = float(data[2])
                
                if count == 0:
                    # Remove price level
                    orderbook['bids'].pop(price, None)
                    orderbook['asks'].pop(price, None)
                else:
                    # Update price level
                    if amount > 0:
                        orderbook['bids'][price] = amount
                    else:
                        orderbook['asks'][price] = abs(amount)
            
            # Send normalized orderbook
            await self.send_normalized_orderbook(symbol)
            
        except Exception as e:
            logger.error(f"Error processing Bitfinex orderbook: {e}")
    
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
            sorted_bids, sorted_asks, 'bitfinex', symbol
        )
        
        callback = self.subscriptions[symbol]
        if asyncio.iscoroutinefunction(callback):
            await callback(normalized)
        else:
            callback(normalized)
    
    async def subscribe_to_symbol(self, symbol: str):
        """Subscribe to orderbook updates for a symbol"""
        try:
            # Convert to Bitfinex format
            bitfinex_symbol = self.convert_symbol_format(symbol)
            
            # Bitfinex subscription message
            subscribe_message = {
                "event": "subscribe",
                "channel": "book",
                "symbol": bitfinex_symbol,
                "prec": "P0",  # Price precision
                "freq": "F0",  # Frequency (realtime)
                "len": "25"    # Depth
            }
            
            await self.send_message(subscribe_message)
            logger.info(f"Subscribing to Bitfinex {symbol} (as {bitfinex_symbol})")
            
        except Exception as e:
            logger.error(f"Error subscribing to Bitfinex: {e}")
    
    async def unsubscribe_from_symbol(self, symbol: str):
        """Unsubscribe from a symbol"""
        try:
            channel_id = self.symbol_to_channel.get(symbol)
            
            if channel_id:
                unsubscribe_message = {
                    "event": "unsubscribe",
                    "chanId": channel_id
                }
                
                await self.send_message(unsubscribe_message)
                
                # Clean up
                del self.channel_ids[channel_id]
                del self.symbol_to_channel[symbol]
                if symbol in self.orderbook_cache:
                    del self.orderbook_cache[symbol]
                
                logger.info(f"Unsubscribed from Bitfinex {symbol}")
                
        except Exception as e:
            logger.error(f"Error unsubscribing from Bitfinex: {e}")
    
    async def send_heartbeat(self):
        """Send heartbeat to Bitfinex"""
        # Bitfinex doesn't require client heartbeat, but we can send ping
        if self.ws and not self.ws.closed:
            await self.ws.ping()

import asyncio  # Required for async operations
