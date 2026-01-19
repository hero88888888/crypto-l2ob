"""Exchange Manager - Handles connections to multiple exchanges"""

import logging
from typing import Dict, Any, Callable, List

from .connectors.binance_connector import BinanceConnector
from .connectors.coinbase_connector import CoinbaseConnector
from .connectors.kraken_connector import KrakenConnector

logger = logging.getLogger(__name__)


class ExchangeManager:
    """Manages connections to multiple cryptocurrency exchanges"""

    def __init__(self):
        """Initialize exchange connectors"""
        self.connectors = {
            'binance': BinanceConnector(),
            'coinbase': CoinbaseConnector(),
            'kraken': KrakenConnector(),
        }
        logger.info(f"Initialized {len(self.connectors)} exchange connectors")

    def subscribe(self, exchange: str, symbol: str, callback: Callable) -> Dict[str, Any]:
        """Subscribe to orderbook updates for a symbol on an exchange"""
        if exchange not in self.connectors:
            raise ValueError(f"Exchange {exchange} not supported")

        logger.info(f"Subscribing to {exchange} {symbol}")
        return self.connectors[exchange].subscribe(symbol, callback)

    def unsubscribe(self, exchange: str, symbol: str):
        """Unsubscribe from orderbook updates"""
        if exchange in self.connectors:
            logger.info(f"Unsubscribing from {exchange} {symbol}")
            self.connectors[exchange].unsubscribe(symbol)

    def get_available_exchanges(self) -> List[Dict[str, Any]]:
        """Get list of available exchanges and their supported pairs"""
        exchanges = []
        for exchange_id, connector in self.connectors.items():
            exchanges.append({
                'id': exchange_id,
                'name': exchange_id.capitalize(),
                'supportedPairs': connector.get_supported_pairs()
            })
        return exchanges

    def close_all(self):
        """Close all exchange connections"""
        for connector in self.connectors.values():
            connector.close()
