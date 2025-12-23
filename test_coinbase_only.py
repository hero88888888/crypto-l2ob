#!/usr/bin/env python3
"""Test Coinbase connection directly"""

import sys
import time
import logging

# Add the python_server directory to the path
sys.path.append('python_server')

from python_server.exchanges.connectors.coinbase_connector import CoinbaseConnector

# Configure verbose logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

def test_callback(data):
    """Test callback to print received data"""
    print(f"\n✅ Received orderbook data:")
    print(f"  Exchange: {data['exchange']}")
    print(f"  Symbol: {data['symbol']}")
    print(f"  Bids: {len(data['bids'])} levels")
    if data['bids']:
        print(f"    Best Bid: ${data['bids'][0]['price']:.2f} x {data['bids'][0]['size']:.8f}")
    print(f"  Asks: {len(data['asks'])} levels")
    if data['asks']:
        print(f"    Best Ask: ${data['asks'][0]['price']:.2f} x {data['asks'][0]['size']:.8f}")
    return True

def main():
    print("Testing Coinbase Connector...")
    print("="*50)
    
    try:
        connector = CoinbaseConnector()
        print("✓ Created Coinbase connector")
        
        # Subscribe to BTC-USD
        symbol = "BTC-USD"
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
        
        print("\n✅ Test completed successfully")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
