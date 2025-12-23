"""
Async Exchange Manager - High-performance WebSocket connections
Uses asyncio and aiohttp for concurrent connections to multiple exchanges
"""

import asyncio
import logging
from typing import Dict, Any, Callable, List, Optional
from concurrent.futures import ThreadPoolExecutor

from .connectors.binance_async import BinanceAsyncConnector
from .connectors.coinbase_async import CoinbaseAsyncConnector
from .connectors.kraken_async import KrakenAsyncConnector
from .connectors.bitfinex_async import BitfinexAsyncConnector
from .connectors.bybit_async import BybitAsyncConnector
from .connectors.okx_async import OKXAsyncConnector

logger = logging.getLogger(__name__)

class ExchangeManagerAsync:
    """High-performance async manager for multiple cryptocurrency exchanges"""
    
    def __init__(self):
        """Initialize exchange connectors"""
        self.connectors: Dict[str, Any] = {}
        self.executor = ThreadPoolExecutor(max_workers=10)
        
    async def initialize(self):
        """Initialize all exchange connectors asynchronously"""
        # Create connector instances
        self.connectors = {
            'binance': BinanceAsyncConnector(),
            'coinbase': CoinbaseAsyncConnector(),
            'kraken': KrakenAsyncConnector(),
            'bitfinex': BitfinexAsyncConnector(),
            'bybit': BybitAsyncConnector(),
            'okx': OKXAsyncConnector(),
        }
        
        # Initialize all connectors concurrently
        init_tasks = [
            connector.initialize() 
            for connector in self.connectors.values()
        ]
        await asyncio.gather(*init_tasks, return_exceptions=True)
        
        logger.info(f"Initialized {len(self.connectors)} exchange connectors")
    
    async def subscribe(self, exchange: str, symbol: str, callback: Callable) -> Dict[str, Any]:
        """Subscribe to orderbook updates for a symbol on an exchange"""
        if exchange not in self.connectors:
            raise ValueError(f"Exchange {exchange} not supported")
        
        logger.info(f"Subscribing to {exchange} {symbol}")
        return await self.connectors[exchange].subscribe(symbol, callback)
    
    async def unsubscribe(self, exchange: str, symbol: str):
        """Unsubscribe from orderbook updates"""
        if exchange in self.connectors:
            logger.info(f"Unsubscribing from {exchange} {symbol}")
            await self.connectors[exchange].unsubscribe(symbol)
    
    async def get_available_exchanges(self) -> List[Dict[str, Any]]:
        """Get list of available exchanges and their supported pairs"""
        exchanges = []
        for exchange_id, connector in self.connectors.items():
            exchanges.append({
                'id': exchange_id,
                'name': exchange_id.capitalize(),
                'supportedPairs': await connector.get_supported_pairs(),
                'status': 'connected' if connector.is_connected() else 'disconnected'
            })
        return exchanges
    
    async def close_all(self):
        """Close all exchange connections gracefully"""
        close_tasks = [
            connector.close() 
            for connector in self.connectors.values()
        ]
        await asyncio.gather(*close_tasks, return_exceptions=True)
        self.executor.shutdown(wait=False)
