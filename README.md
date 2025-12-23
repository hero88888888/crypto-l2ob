# Crypto L2 Orderbook Analyzer

A comprehensive real-time Level 2 orderbook analyzer for cryptocurrency exchanges with advanced metrics and visualization tools.

## Features

### 🔗 Multi-Exchange Support
- **Binance** - Major global exchange with extensive pairs
- **Coinbase** - Leading US exchange
- **Kraken** - European exchange with deep liquidity
- **Bitfinex** - Professional trading platform
- **Bybit** - Derivatives and spot trading
- **OKX** - Global exchange with diverse markets

All connections use **public WebSocket APIs** - no API keys or accounts required!

### 📊 Real-Time Metrics

#### Core Orderbook Metrics
- **Spread & Mid Price** - Real-time bid-ask spread tracking
- **Order Imbalance** - Buy/sell pressure ratio (-1 to 1 scale)
- **Market Skew** - Weighted price skew analysis
- **Order Flow** - Directional flow imbalance indicator

#### Advanced Analytics
- **VWAP** (Volume Weighted Average Price) - For both bid and ask sides
- **Liquidity Analysis** - Depth-weighted liquidity measurements
- **Price Impact** - Estimated slippage for market orders
- **Microstructure Metrics** - Order concentration, size distribution, resilience

#### Market Intelligence
- **Large Order Detection** - Statistical outlier detection (Z-score > 2σ)
- **Support/Resistance Levels** - Automatic liquidity cluster identification
- **Depth Analysis** - Multi-level depth metrics (0.1%, 0.2%, 0.5%, 1%, 2% from mid)

### 📈 Visualization Tools

1. **Live Orderbook Ladder** - Animated bid/ask levels with size visualization
2. **Depth Chart** - Cumulative depth visualization
3. **Historical Metrics Chart** - Time series of imbalance, skew, and order flow
4. **Liquidity Heatmap** - Visual representation of liquidity distribution
5. **Large Orders Table** - Real-time detection and display of whale orders

## Architecture

### Backend (Node.js)
- **WebSocket Management** - Persistent connections to multiple exchanges
- **Exchange Connectors** - Modular architecture for easy exchange addition
- **Orderbook Normalization** - Unified data format across exchanges
- **Metrics Engine** - Real-time calculation of 15+ metrics
- **Socket.IO Server** - Low-latency data streaming to clients

### Frontend (React + TypeScript)
- **Real-time Updates** - Socket.IO client for live data
- **Interactive Charts** - Recharts for data visualization
- **Responsive Design** - TailwindCSS for modern UI
- **Animated Components** - Framer Motion for smooth transitions

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup

1. Clone the repository:
```bash
cd /Users/jae/crypto-L2OB
```

2. Install server dependencies:
```bash
npm install
```

3. Install client dependencies:
```bash
cd client
npm install
cd ..
```

## Running the Application

### Development Mode

Start both server and client:
```bash
npm run dev
```

Or run separately:

**Server only:**
```bash
npm run server
```

**Client only:**
```bash
npm run client
```

### Production Mode

Build the client:
```bash
npm run build
```

Start the server:
```bash
node server/index.js
```

## Usage

1. **Open the application** at `http://localhost:3000`
2. **Select an exchange** from the dropdown (default: Binance)
3. **Choose a trading pair** (e.g., BTCUSDT, ETH-USD)
4. **Watch real-time data** flow in with automatic metric updates

## Metrics Explained

### Order Imbalance
- **Positive (Green)**: More buying pressure
- **Negative (Red)**: More selling pressure
- **Near Zero (Yellow)**: Balanced market

### Market Skew
- Measures the concentration of orders near the spread
- Positive values indicate bullish sentiment
- Negative values indicate bearish sentiment

### Liquidity Ratio
- Ratio of bid liquidity to total liquidity
- Values > 50% indicate stronger buy-side support
- Values < 50% indicate stronger sell-side pressure

### Large Orders (Whales)
- Orders with Z-score > 2 (2 standard deviations above mean)
- Can indicate institutional activity or market manipulation
- Monitor for potential support/resistance levels

## Technical Details

### WebSocket Streams
- **Binance**: `wss://stream.binance.com:9443/ws`
- **Coinbase**: `wss://ws-feed.exchange.coinbase.com`
- **Kraken**: `wss://ws.kraken.com`
- **Bitfinex**: `wss://api-pub.bitfinex.com/ws/2`
- **Bybit**: `wss://stream.bybit.com/v5/public/spot`
- **OKX**: `wss://ws.okx.com:8443/ws/v5/public`

### Data Flow
1. Exchange WebSocket → Exchange Connector
2. Raw Data → Normalization Layer
3. Normalized Data → Metrics Calculator
4. Metrics + Orderbook → Socket.IO Broadcast
5. Client Receives → Real-time UI Update

### Performance
- Handles 100+ updates per second per exchange
- Sub-100ms latency for metric calculations
- Efficient memory management with order limit caps
- Automatic reconnection on connection loss

## Customization

### Adding New Exchanges
1. Create a new connector in `/server/exchanges/connectors/`
2. Extend the `BaseConnector` class
3. Implement WebSocket connection and data parsing
4. Register in `ExchangeManager.js`

### Adding New Metrics
1. Add calculation method to `OrderbookAnalyzer.js`
2. Update the `Metrics` type in `/client/src/types/`
3. Add visualization component in `/client/src/components/`

## Troubleshooting

### Connection Issues
- Check your internet connection
- Verify WebSocket URLs are accessible
- Check for firewall/proxy blocking WebSocket connections

### Data Not Updating
- Ensure the selected exchange supports the chosen pair
- Check browser console for errors
- Verify server is running on port 3001

### Performance Issues
- Reduce the number of simultaneous subscriptions
- Lower the update frequency in exchange connectors
- Increase the orderbook depth limit

## License

MIT

## Contributing

Pull requests are welcome! Please ensure:
1. Code follows existing patterns
2. New exchanges include proper error handling
3. Metrics are well-documented
4. UI components are responsive

## Disclaimer

This tool is for educational and analytical purposes only. Always verify data accuracy before making trading decisions. Past performance does not guarantee future results.
