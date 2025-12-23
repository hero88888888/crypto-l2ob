#!/usr/bin/env python3
"""Test script to verify exchange connections are working"""

import sys
import time
import logging

# Add the python_server directory to the path
sys.path.append('python_server')

from python_server.exchanges.connectors.binance_connector import BinanceConnector
from python_server.exchanges.connectors.coinbase_connector import CoinbaseConnector
from python_server.exchanges.connectors.kraken_connector import KrakenConnector

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

def test_callback(data):
    """Test callback to print received data"""
    print(f"\n✅ Received orderbook data from {data['exchange']}:")
    print(f"  Symbol: {data['symbol']}")
    print(f"  Bids: {len(data['bids'])} levels, Best: {data['bids'][0] if data['bids'] else 'None'}")
    print(f"  Asks: {len(data['asks'])} levels, Best: {data['asks'][0] if data['asks'] else 'None'}")
    print(f"  Timestamp: {data['timestamp']}")
    return True

def test_exchange(connector_class, exchange_name, symbol):
    """Test a specific exchange connector"""
    print(f"\n{'='*50}")
    print(f"Testing {exchange_name} with {symbol}")
    print(f"{'='*50}")
    
    try:
        connector = connector_class()
        print(f"✓ Created {exchange_name} connector")
        
        # Subscribe to the symbol
        result = connector.subscribe(symbol, test_callback)
        print(f"✓ Subscribed to {symbol}")
        
        # Wait for data
        print(f"⏳ Waiting for data (30 seconds)...")
        time.sleep(30)
        
        # Unsubscribe
        connector.unsubscribe(symbol)
        print(f"✓ Unsubscribed from {symbol}")
        
        # Close connection
        connector.close()
        print(f"✓ Closed connection")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing {exchange_name}: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Test all exchanges"""
    tests = [
        (BinanceConnector, "Binance", "BTCUSDT"),
        (CoinbaseConnector, "Coinbase", "BTC-USD"),
        (KrakenConnector, "Kraken", "XBT/USD"),
    ]
    
    results = []
    
    for connector_class, exchange_name, symbol in tests:
        success = test_exchange(connector_class, exchange_name, symbol)
        results.append((exchange_name, success))
        time.sleep(2)  # Wait between tests
    
    print(f"\n{'='*50}")
    print("Test Results:")
    print(f"{'='*50}")
    for exchange, success in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{exchange}: {status}")

if __name__ == "__main__":
    main()
