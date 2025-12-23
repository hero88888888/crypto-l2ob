#!/usr/bin/env python3
"""Test the complete Socket.IO flow with Python backend"""

import socketio
import time
import sys

# Create a Socket.IO client
sio = socketio.Client()

# Track received data
received_data = {
    'binance': False,
    'coinbase': False,
    'kraken': False
}

@sio.on('connect')
def on_connect():
    print('✅ Connected to server')
    
@sio.on('connection_status')
def on_connection_status(data):
    print(f"Connection status: {data}")

@sio.on('subscription_status')
def on_subscription_status(data):
    print(f"Subscription status: {data}")

@sio.on('orderbook_update')
def on_orderbook_update(data):
    exchange = data.get('exchange', '')
    symbol = data.get('symbol', '')
    orderbook = data.get('orderbook', {})
    metrics = data.get('metrics', {})
    
    bids = orderbook.get('bids', [])
    asks = orderbook.get('asks', [])
    
    if bids and asks:
        print(f"\n📊 {exchange.upper()} - {symbol}")
        print(f"   Best Bid: ${bids[0]['price']:.2f} x {bids[0]['size']:.8f}")
        print(f"   Best Ask: ${asks[0]['price']:.2f} x {asks[0]['size']:.8f}")
        print(f"   Spread: ${metrics.get('spread', 0):.2f}")
        print(f"   Imbalance: {metrics.get('imbalance', 0):.3f}")
        
        received_data[exchange] = True

@sio.on('error')
def on_error(data):
    print(f"❌ Error: {data}")

def test_exchange(exchange, symbol, duration=15):
    """Test a specific exchange subscription"""
    print(f"\n{'='*50}")
    print(f"Testing {exchange} - {symbol}")
    print(f"{'='*50}")
    
    # Subscribe
    sio.emit('subscribe', {'exchange': exchange, 'symbol': symbol})
    
    # Wait for data
    print(f"Waiting for data ({duration} seconds)...")
    start = time.time()
    while time.time() - start < duration:
        time.sleep(1)
        if received_data.get(exchange):
            print(f"✅ Received data from {exchange}")
            break
    
    # Unsubscribe
    sio.emit('unsubscribe', {'exchange': exchange, 'symbol': symbol})
    time.sleep(1)
    
    return received_data.get(exchange, False)

def main():
    try:
        # Connect to server
        print("Connecting to Socket.IO server at http://localhost:3001...")
        sio.connect('http://localhost:3001')
        time.sleep(2)
        
        # Test each exchange
        tests = [
            ('binance', 'BTCUSDT'),
            ('coinbase', 'BTC-USD'),
            ('kraken', 'XBT/USD'),
        ]
        
        results = []
        for exchange, symbol in tests:
            success = test_exchange(exchange, symbol, duration=10)
            results.append((exchange, success))
            time.sleep(2)
        
        # Print summary
        print(f"\n{'='*50}")
        print("TEST RESULTS:")
        print(f"{'='*50}")
        for exchange, success in results:
            status = "✅ PASSED" if success else "❌ FAILED"
            print(f"{exchange.capitalize()}: {status}")
        
        # Disconnect
        sio.disconnect()
        print("\nDisconnected from server")
        
        # Exit with appropriate code
        all_passed = all(success for _, success in results)
        sys.exit(0 if all_passed else 1)
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
