"""Base connector for all exchange implementations"""

import asyncio
import json
import logging
import threading
from abc import ABC, abstractmethod
from typing import Dict, List, Callable, Optional, Any
import websocket
import time

logger = logging.getLogger(__name__)

class BaseConnector(ABC):
    """Abstract base class for exchange WebSocket connectors"""
    
    def __init__(self):
        self.ws: Optional[websocket.WebSocketApp] = None
        self.subscriptions: Dict[str, Callable] = {}
        self.orderbooks: Dict[str, Dict] = {}
        self.running = False
        self.thread = None
        self.ws_url = ""
        self.reconnect_attempts = 0
        self.max_reconnect_attempts = 5
        self.reconnect_delay = 1
        
    def connect(self):
        """Connect to the WebSocket"""
        try:
            logger.info(f"Connecting to {self.__class__.__name__}...")
            
            self.ws = websocket.WebSocketApp(
                self.ws_url,
                on_open=self._on_open,
                on_message=self._on_message,
                on_error=self._on_error,
                on_close=self._on_close
            )
            
            self.running = True
            self.thread = threading.Thread(target=self._run_forever)
            self.thread.daemon = True
            self.thread.start()
            
            # Wait for connection
            time.sleep(1)
            
        except Exception as e:
            logger.error(f"Connection error: {e}")
            self.handle_reconnect()
    
    def _run_forever(self):
        """Run the WebSocket in a separate thread"""
        import ssl
        while self.running:
            try:
                # Create SSL context with certificate verification disabled for development
                # In production, you should verify certificates properly
                sslopt = {"cert_reqs": ssl.CERT_NONE}
                self.ws.run_forever(sslopt=sslopt)
            except Exception as e:
                logger.error(f"WebSocket error: {e}")
                if self.running:
                    self.handle_reconnect()
                    
    def _on_open(self, ws):
        """Handle WebSocket open event"""
        logger.info(f"{self.__class__.__name__} connected")
        self.reconnect_attempts = 0
        
        # Resubscribe to all symbols
        for symbol in list(self.subscriptions.keys()):
            self.subscribe_to_symbol(symbol)
    
    def _on_message(self, ws, message):
        """Handle incoming WebSocket message"""
        try:
            self.handle_message(message)
        except Exception as e:
            logger.error(f"Error handling message: {e}")
    
    def _on_error(self, ws, error):
        """Handle WebSocket error"""
        logger.error(f"{self.__class__.__name__} error: {error}")
    
    def _on_close(self, ws, close_status_code, close_msg):
        """Handle WebSocket close event"""
        logger.info(f"{self.__class__.__name__} connection closed")
        if self.running:
            self.handle_reconnect()
    
    def handle_reconnect(self):
        """Handle reconnection logic"""
        if self.reconnect_attempts < self.max_reconnect_attempts:
            self.reconnect_attempts += 1
            delay = self.reconnect_delay * self.reconnect_attempts
            logger.info(f"Reconnecting in {delay} seconds... Attempt {self.reconnect_attempts}")
            time.sleep(delay)
            self.connect()
        else:
            logger.error("Max reconnection attempts reached")
            self.running = False
    
    def normalize_orderbook(self, bids: List, asks: List, exchange: str, symbol: str) -> Dict:
        """Normalize orderbook data to standard format"""
        return {
            'exchange': exchange,
            'symbol': symbol,
            'bids': [{'price': float(price), 'size': float(size)} 
                    for price, size in bids[:50]],  # Limit to 50 levels
            'asks': [{'price': float(price), 'size': float(size)} 
                    for price, size in asks[:50]],
            'timestamp': int(time.time() * 1000)
        }
    
    def subscribe(self, symbol: str, callback: Callable) -> Dict[str, Any]:
        """Subscribe to orderbook updates for a symbol"""
        if not self.ws or not self.running:
            self.connect()
        
        self.subscriptions[symbol] = callback
        self.subscribe_to_symbol(symbol)
        
        return {
            'exchange': self.__class__.__name__.replace('Connector', ''),
            'symbol': symbol
        }
    
    def unsubscribe(self, symbol: str):
        """Unsubscribe from a symbol"""
        if symbol in self.subscriptions:
            del self.subscriptions[symbol]
            self.unsubscribe_from_symbol(symbol)
            if symbol in self.orderbooks:
                del self.orderbooks[symbol]
    
    def close(self):
        """Close the WebSocket connection"""
        self.running = False
        if self.ws:
            self.ws.close()
    
    @abstractmethod
    def handle_message(self, message: str):
        """Handle incoming message - must be implemented by subclass"""
        pass
    
    @abstractmethod
    def subscribe_to_symbol(self, symbol: str):
        """Subscribe to a specific symbol - must be implemented by subclass"""
        pass
    
    @abstractmethod
    def unsubscribe_from_symbol(self, symbol: str):
        """Unsubscribe from a specific symbol - must be implemented by subclass"""
        pass
    
    @abstractmethod
    def get_supported_pairs(self) -> List[str]:
        """Get list of supported trading pairs - must be implemented by subclass"""
        pass
