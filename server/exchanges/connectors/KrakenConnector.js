const BaseConnector = require('./BaseConnector');

class KrakenConnector extends BaseConnector {
  constructor() {
    super();
    this.wsUrl = 'wss://ws.kraken.com';
    this.symbolMap = new Map();
  }

  getSupportedPairs() {
    return ['XBT/USD', 'ETH/USD', 'SOL/USD', 'ADA/USD', 'DOT/USD', 
            'MATIC/USD', 'LINK/USD', 'AVAX/USD', 'ALGO/USD', 'ATOM/USD'];
  }

  handleMessage(data) {
    try {
      const message = JSON.parse(data.toString());
      
      if (Array.isArray(message) && message.length >= 4) {
        const [channelId, orderbook, channelName, pair] = message;
        
        if (channelName === 'book-25') {
          const symbol = this.symbolMap.get(channelId) || pair;
          
          if (orderbook.as || orderbook.bs) {
            // Snapshot
            this.handleSnapshot(symbol, orderbook);
          } else if (orderbook.a || orderbook.b) {
            // Update
            this.handleUpdate(symbol, orderbook);
          }
        }
      }
    } catch (error) {
      console.error('Kraken message parsing error:', error);
    }
  }

  handleSnapshot(symbol, data) {
    const orderbook = {
      bids: new Map(),
      asks: new Map()
    };

    if (data.bs) {
      data.bs.forEach(([price, size, timestamp]) => {
        orderbook.bids.set(parseFloat(price), parseFloat(size));
      });
    }

    if (data.as) {
      data.as.forEach(([price, size, timestamp]) => {
        orderbook.asks.set(parseFloat(price), parseFloat(size));
      });
    }

    this.orderbooks.set(symbol, orderbook);
    this.emitOrderbook(symbol);
  }

  handleUpdate(symbol, data) {
    const orderbook = this.orderbooks.get(symbol);
    if (!orderbook) return;

    if (data.b) {
      data.b.forEach(([price, size, timestamp]) => {
        const priceFloat = parseFloat(price);
        const sizeFloat = parseFloat(size);
        
        if (sizeFloat === 0) {
          orderbook.bids.delete(priceFloat);
        } else {
          orderbook.bids.set(priceFloat, sizeFloat);
        }
      });
    }

    if (data.a) {
      data.a.forEach(([price, size, timestamp]) => {
        const priceFloat = parseFloat(price);
        const sizeFloat = parseFloat(size);
        
        if (sizeFloat === 0) {
          orderbook.asks.delete(priceFloat);
        } else {
          orderbook.asks.set(priceFloat, sizeFloat);
        }
      });
    }

    this.emitOrderbook(symbol);
  }

  emitOrderbook(symbol) {
    const orderbook = this.orderbooks.get(symbol);
    if (!orderbook) return;

    const sortedBids = Array.from(orderbook.bids.entries())
      .sort((a, b) => b[0] - a[0])
      .slice(0, 50);
    
    const sortedAsks = Array.from(orderbook.asks.entries())
      .sort((a, b) => a[0] - b[0])
      .slice(0, 50);

    const callback = this.subscriptions.get(symbol);
    if (callback) {
      callback(this.normalizeOrderbook(sortedBids, sortedAsks, 'kraken', symbol));
    }
  }

  async subscribeToSymbol(symbol) {
    const subscribeMessage = {
      event: 'subscribe',
      pair: [symbol],
      subscription: {
        name: 'book',
        depth: 25
      }
    };

    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(subscribeMessage));
    }
  }

  unsubscribeFromSymbol(symbol) {
    const unsubscribeMessage = {
      event: 'unsubscribe',
      pair: [symbol],
      subscription: {
        name: 'book'
      }
    };
    
    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(unsubscribeMessage));
      this.orderbooks.delete(symbol);
    }
  }

  sendPing() {
    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify({ event: 'ping' }));
    }
  }
}

module.exports = KrakenConnector;
