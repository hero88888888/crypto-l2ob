const BaseConnector = require('./BaseConnector');

class BinanceConnector extends BaseConnector {
  constructor() {
    super();
    this.wsUrl = 'wss://stream.binance.com:9443/ws';
    this.streamIds = new Map();
  }

  getSupportedPairs() {
    return ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT', 
            'SOLUSDT', 'DOTUSDT', 'DOGEUSDT', 'AVAXUSDT', 'SHIBUSDT'];
  }

  handleMessage(data) {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.stream && message.data) {
        const streamParts = message.stream.split('@');
        const symbol = streamParts[0].toUpperCase();
        
        if (message.data.e === 'depthUpdate') {
          this.updateOrderbook(symbol, message.data);
        }
      }
    } catch (error) {
      console.error('Binance message parsing error:', error);
    }
  }

  updateOrderbook(symbol, data) {
    if (!this.orderbooks.has(symbol)) {
      this.orderbooks.set(symbol, {
        bids: new Map(),
        asks: new Map(),
        lastUpdateId: 0
      });
    }

    const orderbook = this.orderbooks.get(symbol);
    
    // Update bids
    data.b.forEach(([price, size]) => {
      const priceFloat = parseFloat(price);
      const sizeFloat = parseFloat(size);
      
      if (sizeFloat === 0) {
        orderbook.bids.delete(priceFloat);
      } else {
        orderbook.bids.set(priceFloat, sizeFloat);
      }
    });

    // Update asks
    data.a.forEach(([price, size]) => {
      const priceFloat = parseFloat(price);
      const sizeFloat = parseFloat(size);
      
      if (sizeFloat === 0) {
        orderbook.asks.delete(priceFloat);
      } else {
        orderbook.asks.set(priceFloat, sizeFloat);
      }
    });

    orderbook.lastUpdateId = data.u;

    // Convert to sorted arrays and emit
    const sortedBids = Array.from(orderbook.bids.entries())
      .sort((a, b) => b[0] - a[0])
      .slice(0, 50);
    
    const sortedAsks = Array.from(orderbook.asks.entries())
      .sort((a, b) => a[0] - b[0])
      .slice(0, 50);

    const callback = this.subscriptions.get(symbol);
    if (callback) {
      callback(this.normalizeOrderbook(sortedBids, sortedAsks, 'binance', symbol));
    }
  }

  async subscribeToSymbol(symbol) {
    const streamName = `${symbol.toLowerCase()}@depth@100ms`;
    this.streamIds.set(symbol, streamName);
    
    const subscribeMessage = {
      method: 'SUBSCRIBE',
      params: [streamName],
      id: Date.now()
    };

    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(subscribeMessage));
      
      // Get initial orderbook snapshot
      await this.getSnapshot(symbol);
    }
  }

  async getSnapshot(symbol) {
    try {
      const axios = require('axios');
      const response = await axios.get(
        `https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=50`
      );
      
      const orderbook = this.orderbooks.get(symbol) || {
        bids: new Map(),
        asks: new Map(),
        lastUpdateId: 0
      };

      // Clear and set initial orderbook
      orderbook.bids.clear();
      orderbook.asks.clear();
      
      response.data.bids.forEach(([price, size]) => {
        orderbook.bids.set(parseFloat(price), parseFloat(size));
      });
      
      response.data.asks.forEach(([price, size]) => {
        orderbook.asks.set(parseFloat(price), parseFloat(size));
      });
      
      orderbook.lastUpdateId = response.data.lastUpdateId;
      this.orderbooks.set(symbol, orderbook);
    } catch (error) {
      console.error('Failed to get Binance snapshot:', error);
    }
  }

  unsubscribeFromSymbol(symbol) {
    const streamName = this.streamIds.get(symbol);
    if (streamName && this.ws && this.ws.readyState === 1) {
      const unsubscribeMessage = {
        method: 'UNSUBSCRIBE',
        params: [streamName],
        id: Date.now()
      };
      
      this.ws.send(JSON.stringify(unsubscribeMessage));
      this.streamIds.delete(symbol);
      this.orderbooks.delete(symbol);
    }
  }
}

module.exports = BinanceConnector;
