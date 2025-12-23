"""
Base async connector for all exchange implementations
High-performance WebSocket handling using aiohttp
"""

import asyncio
import json
import logging
import time
from abc import ABC, abstractmethod
from typing import Dict, List, Callable, Optional, Any
import aiohttp
from aiohttp import ClientWebSocketResponse

logger = logging.getLogger(__name__)

class BaseAsyncConnector(ABC):
    """High-performance async base class for exchange WebSocket connectors"""
    
    def __init__(self):
        self.ws: Optional[ClientWebSocketResponse] = None
        self.session: Optional[aiohttp.ClientSession] = None
        self.subscriptions: Dict[str, Callable] = {}
        self.orderbooks: Dict[str, Dict] = {}
        self.running = False
        self.ws_url = ""
        self.reconnect_attempts = 0
        self.max_reconnect_attempts = 5
        self.reconnect_delay = 1.0
        self.heartbeat_interval = 30  # seconds
        self.last_heartbeat = time.time()
        self._listen_task: Optional[asyncio.Task] = None
        self._heartbeat_task: Optional[asyncio.Task] = None
        
    async def initialize(self):
        """Initialize the connector"""
        self.session = aiohttp.ClientSession()
        await self.connect()
        
    async def connect(self):
        """Connect to the WebSocket asynchronously"""
        try:
            logger.info(f"Connecting to {self.__class__.__name__}...")
            
            # Create WebSocket connection
            self.ws = await self.session.ws_connect(
                self.ws_url,
                heartbeat=30,
                ssl=False  # Set to True in production with proper cert verification
            )
            
            self.running = True
            self.reconnect_attempts = 0
            
            # Start listening for messages
            self._listen_task = asyncio.create_task(self._listen())
            
            # Start heartbeat
            self._heartbeat_task = asyncio.create_task(self._heartbeat())
            
            # Handle connection open
            await self._on_open()
            
            logger.info(f"{self.__class__.__name__} connected successfully")
            
        except Exception as e:
            logger.error(f"Connection error: {e}")
            await self.handle_reconnect()
    
    async def _listen(self):
        """Listen for messages from WebSocket"""
        try:
            async for msg in self.ws:
                if msg.type == aiohttp.WSMsgType.TEXT:
                    await self._on_message(msg.data)
                elif msg.type == aiohttp.WSMsgType.ERROR:
                    logger.error(f"WebSocket error: {msg.data}")
                elif msg.type == aiohttp.WSMsgType.CLOSED:
                    logger.info("WebSocket connection closed")
                    break
        except Exception as e:
            logger.error(f"Error in message listener: {e}")
        finally:
            if self.running:
                await self.handle_reconnect()
    
    async def _heartbeat(self):
        """Send periodic heartbeat to keep connection alive"""
        while self.running:
            try:
                await asyncio.sleep(self.heartbeat_interval)
                if self.ws and not self.ws.closed:
                    await self.send_heartbeat()
                    self.last_heartbeat = time.time()
            except Exception as e:
                logger.error(f"Heartbeat error: {e}")
    
    async def send_heartbeat(self):
        """Send heartbeat message - override in subclass if needed"""
        # Default implementation - override if exchange requires specific heartbeat
        if self.ws and not self.ws.closed:
            await self.ws.ping()
    
    async def _on_open(self):
        """Handle WebSocket open event"""
        logger.info(f"{self.__class__.__name__} connection opened")
        
        # Resubscribe to all symbols
        for symbol in list(self.subscriptions.keys()):
            await self.subscribe_to_symbol(symbol)
    
    async def _on_message(self, message: str):
        """Handle incoming WebSocket message"""
        try:
            await self.handle_message(message)
        except Exception as e:
            logger.error(f"Error handling message: {e}")
    
    async def handle_reconnect(self):
        """Handle reconnection logic with exponential backoff"""
        if self.reconnect_attempts < self.max_reconnect_attempts:
            self.reconnect_attempts += 1
            # Exponential backoff with jitter
            delay = min(self.reconnect_delay * (2 ** self.reconnect_attempts), 60)
            jitter = delay * 0.1 * (0.5 - asyncio.create_task(asyncio.sleep(0)).done())
            total_delay = delay + jitter
            
            logger.info(f"Reconnecting in {total_delay:.1f}s... Attempt {self.reconnect_attempts}")
            await asyncio.sleep(total_delay)
            await self.connect()
        else:
            logger.error("Max reconnection attempts reached")
            self.running = False
    
    def normalize_orderbook(self, bids: List, asks: List, exchange: str, symbol: str) -> Dict:
        """
        Normalize orderbook data to standard format
        Python equivalent of JavaScript object creation
        """
        return {
            'exchange': exchange,
            'symbol': symbol,
            'bids': [
                {'price': float(price), 'size': float(size)} 
                for price, size in bids[:50]  # List comprehension - Python's map()
            ],
            'asks': [
                {'price': float(price), 'size': float(size)} 
                for price, size in asks[:50]
            ],
            'timestamp': int(time.time() * 1000)  # Python time.time() returns seconds
        }
    
    async def subscribe(self, symbol: str, callback: Callable) -> Dict[str, Any]:
        """Subscribe to orderbook updates for a symbol"""
        if not self.ws or self.ws.closed:
            await self.connect()
        
        self.subscriptions[symbol] = callback
        await self.subscribe_to_symbol(symbol)
        
        return {
            'exchange': self.__class__.__name__.replace('AsyncConnector', ''),
            'symbol': symbol,
            'status': 'subscribed'
        }
    
    async def unsubscribe(self, symbol: str):
        """Unsubscribe from a symbol"""
        if symbol in self.subscriptions:
            del self.subscriptions[symbol]
            await self.unsubscribe_from_symbol(symbol)
            if symbol in self.orderbooks:
                del self.orderbooks[symbol]
    
    async def close(self):
        """Close the WebSocket connection gracefully"""
        self.running = False
        
        # Cancel tasks
        if self._listen_task:
            self._listen_task.cancel()
        if self._heartbeat_task:
            self._heartbeat_task.cancel()
        
        # Close WebSocket
        if self.ws and not self.ws.closed:
            await self.ws.close()
        
        # Close session
        if self.session and not self.session.closed:
            await self.session.close()
    
    def is_connected(self) -> bool:
        """Check if WebSocket is connected"""
        return self.ws is not None and not self.ws.closed and self.running
    
    async def send_message(self, message: Dict):
        """Send message to WebSocket"""
        if self.ws and not self.ws.closed:
            await self.ws.send_str(json.dumps(message))
    
    # Abstract methods that must be implemented by subclasses
    @abstractmethod
    async def handle_message(self, message: str):
        """Handle incoming message - must be implemented by subclass"""
        pass
    
    @abstractmethod
    async def subscribe_to_symbol(self, symbol: str):
        """Subscribe to a specific symbol - must be implemented by subclass"""
        pass
    
    @abstractmethod
    async def unsubscribe_from_symbol(self, symbol: str):
        """Unsubscribe from a specific symbol - must be implemented by subclass"""
        pass
    
    @abstractmethod
    async def get_supported_pairs(self) -> List[str]:
        """Get list of supported trading pairs - must be implemented by subclass"""
        pass
