#!/usr/bin/env python3
"""
Crypto L2 Orderbook Analyzer - Python Backend Server
Real-time WebSocket server for multi-exchange orderbook streaming
"""

import asyncio
import json
import logging
from typing import Dict, List, Any
from datetime import datetime

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit

from exchanges.exchange_manager import ExchangeManager
from analysis.orderbook_analyzer import OrderbookAnalyzer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app, origins="http://localhost:3000")
socketio = SocketIO(app, cors_allowed_origins="http://localhost:3000", async_mode='threading')

# Initialize managers
exchange_manager = ExchangeManager()
analyzer = OrderbookAnalyzer()

# Store active subscriptions
active_subscriptions: Dict[str, Any] = {}


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'exchanges': exchange_manager.get_available_exchanges(),
        'activeSubscriptions': list(active_subscriptions.keys())
    })


@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    logger.info(f"Client connected: {request.sid}")
    emit('connection_status', {'status': 'connected'})


@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    logger.info(f"Client disconnected: {request.sid}")
    # Clean up subscriptions for this client
    for key in list(active_subscriptions.keys()):
        if active_subscriptions[key].get('client_id') == request.sid:
            exchange, symbol = key.split('_')
            exchange_manager.unsubscribe(exchange, symbol)
            del active_subscriptions[key]


@socketio.on('get_exchanges')
def handle_get_exchanges():
    """Send available exchanges to client"""
    exchanges = exchange_manager.get_available_exchanges()
    emit('exchanges', exchanges)


@socketio.on('subscribe')
def handle_subscribe(data):
    """Handle subscription request"""
    try:
        exchange = data.get('exchange')
        symbol = data.get('symbol')
        client_id = request.sid

        key = f"{exchange}_{symbol}"

        # If not already subscribed, create new subscription
        if key not in active_subscriptions:
            logger.info(f"Creating subscription for {exchange} {symbol}")

            def orderbook_callback(orderbook_data):
                """Callback for orderbook updates"""
                try:
                    # Calculate metrics
                    metrics = analyzer.calculate_metrics(orderbook_data)

                    # Emit to all connected clients
                    socketio.emit('orderbook_update', {
                        'exchange': exchange,
                        'symbol': symbol,
                        'orderbook': orderbook_data,
                        'metrics': metrics,
                        'timestamp': datetime.now().timestamp() * 1000
                    })
                except Exception as e:
                    logger.error(f"Error processing orderbook: {e}")

            # Subscribe to exchange
            subscription = exchange_manager.subscribe(exchange, symbol, orderbook_callback)
            active_subscriptions[key] = {
                'subscription': subscription,
                'client_id': client_id
            }

            emit('subscription_status', {
                'status': 'subscribed',
                'exchange': exchange,
                'symbol': symbol
            })
        else:
            logger.info(f"Already subscribed to {exchange} {symbol}")

    except Exception as e:
        logger.error(f"Error handling subscription: {e}")
        emit('error', {'message': str(e)})


@socketio.on('unsubscribe')
def handle_unsubscribe(data):
    """Handle unsubscription request"""
    try:
        exchange = data.get('exchange')
        symbol = data.get('symbol')
        key = f"{exchange}_{symbol}"

        if key in active_subscriptions:
            exchange_manager.unsubscribe(exchange, symbol)
            del active_subscriptions[key]

            emit('subscription_status', {
                'status': 'unsubscribed',
                'exchange': exchange,
                'symbol': symbol
            })
    except Exception as e:
        logger.error(f"Error handling unsubscription: {e}")
        emit('error', {'message': str(e)})


def run_server(port=3001):
    """Run the server"""
    logger.info(f"Starting server on port {port}")

    # Start exchange manager in background
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    # Run Flask-SocketIO server
    socketio.run(app, host='0.0.0.0', port=port, debug=False)


if __name__ == '__main__':
    try:
        run_server()
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {e}")
        raise
