#!/usr/bin/env python3
"""
High-Performance Async Python Backend Server for L2 Orderbook Analyzer
Uses asyncio, aiohttp, and websockets for maximum performance
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, Set, Any, Optional
from contextlib import asynccontextmanager

# Using pure async libraries for better performance
import aiohttp
from aiohttp import web
import socketio

from exchanges.exchange_manager_async import ExchangeManagerAsync
from analysis.orderbook_analyzer import OrderbookAnalyzer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create Socket.IO server with async mode
sio = socketio.AsyncServer(
    async_mode='aiohttp',
    cors_allowed_origins='http://localhost:3000',
    logger=True,
    engineio_logger=False
)

# Create aiohttp app
app = web.Application()
sio.attach(app)

# Initialize managers
exchange_manager: Optional[ExchangeManagerAsync] = None
analyzer = OrderbookAnalyzer()

# Store active subscriptions per client
active_subscriptions: Dict[str, Set[str]] = {}


@asynccontextmanager
async def lifespan():
    """Manage application lifecycle"""
    global exchange_manager
    exchange_manager = ExchangeManagerAsync()
    await exchange_manager.initialize()
    yield
    await exchange_manager.close_all()

# Health check endpoint


async def health(request):
    """Health check endpoint - pure async"""
    return web.json_response({
        'status': 'healthy',
        'exchanges': await exchange_manager.get_available_exchanges(),
        'active_clients': len(active_subscriptions),
        'timestamp': datetime.now().isoformat()
    })


@sio.event
async def connect(sid, environ):
    """Handle client connection - async"""
    logger.info(f"Client connected: {sid}")
    active_subscriptions[sid] = set()
    await sio.emit('connection_status', {'status': 'connected'}, to=sid)


@sio.event
async def disconnect(sid):
    """Handle client disconnection - async"""
    logger.info(f"Client disconnected: {sid}")

    # Clean up subscriptions for this client
    if sid in active_subscriptions:
        for key in active_subscriptions[sid]:
            exchange, symbol = key.split('_')
            await exchange_manager.unsubscribe(exchange, symbol)
        del active_subscriptions[sid]


@sio.event
async def get_exchanges(sid):
    """Send available exchanges to client - async"""
    exchanges = await exchange_manager.get_available_exchanges()
    await sio.emit('exchanges', exchanges, to=sid)


@sio.event
async def subscribe(sid, data):
    """Handle subscription request - fully async"""
    try:
        exchange = data.get('exchange')
        symbol = data.get('symbol')
        key = f"{exchange}_{symbol}"

        # Add to client's subscriptions
        if sid not in active_subscriptions:
            active_subscriptions[sid] = set()
        active_subscriptions[sid].add(key)

        # Create async callback for orderbook updates
        async def orderbook_callback(orderbook_data):
            """Async callback for orderbook updates"""
            try:
                # Calculate metrics asynchronously
                metrics = await analyzer.calculate_metrics_async(orderbook_data)

                # Emit to all connected clients
                await sio.emit('orderbook_update', {
                    'exchange': exchange,
                    'symbol': symbol,
                    'orderbook': orderbook_data,
                    'metrics': metrics,
                    'timestamp': datetime.now().timestamp() * 1000
                })
            except Exception as e:
                logger.error(f"Error processing orderbook: {e}")

        # Subscribe to exchange
        await exchange_manager.subscribe(exchange, symbol, orderbook_callback)

        await sio.emit('subscription_status', {
            'status': 'subscribed',
            'exchange': exchange,
            'symbol': symbol
        }, to=sid)

    except Exception as e:
        logger.error(f"Error handling subscription: {e}")
        await sio.emit('error', {'message': str(e)}, to=sid)


@sio.event
async def unsubscribe(sid, data):
    """Handle unsubscription request - async"""
    try:
        exchange = data.get('exchange')
        symbol = data.get('symbol')
        key = f"{exchange}_{symbol}"

        # Remove from client's subscriptions
        if sid in active_subscriptions:
            active_subscriptions[sid].discard(key)

        await exchange_manager.unsubscribe(exchange, symbol)

        await sio.emit('subscription_status', {
            'status': 'unsubscribed',
            'exchange': exchange,
            'symbol': symbol
        }, to=sid)
    except Exception as e:
        logger.error(f"Error handling unsubscription: {e}")
        await sio.emit('error', {'message': str(e)}, to=sid)

# Add routes
app.router.add_get('/health', health)


async def init_app():
    """Initialize the application"""
    async with lifespan():
        return app


def run_server(host='0.0.0.0', port=3001):
    """Run the async server with uvloop for maximum performance"""
    try:
        # Try to use uvloop for better performance (Linux/macOS)
        import uvloop
        asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())
        logger.info("Using uvloop for better performance")
    except ImportError:
        logger.info("uvloop not available, using default event loop")

    logger.info(f"Starting async server on {host}:{port}")
    web.run_app(
        init_app(),
        host=host,
        port=port,
        access_log=None  # Disable access logs for better performance
    )


if __name__ == '__main__':
    run_server()
