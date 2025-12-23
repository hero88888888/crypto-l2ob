const BaseConnector = require('./BaseConnector');

class CoinbaseConnector extends BaseConnector {
  constructor() {
    super();
    this.wsUrl = 'wss://ws-feed.exchange.coinbase.com';
  }

  getSupportedPairs() {
    return ['BTC-USD', 'ETH-USD', 'SOL-USD', 'ADA-USD', 'DOGE-USD', 
            'AVAX-USD', 'MATIC-USD', 'LINK-USD', 'DOT-USD', 'UNI-USD'];
  }

  handleMessage(data) {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'snapshot') {
        this.handleSnapshot(message);
      } else if (message.type === 'l2update') {
        this.handleL2Update(message);
      }
    } catch (error) {
      console.error('Coinbase message parsing error:', error);
    }
  }

  handleSnapshot(message) {
    const symbol = message.product_id;
    
    const orderbook = {
      bids: new Map(),
      asks: new Map()
    };

    message.bids.forEach(([price, size]) => {
      orderbook.bids.set(parseFloat(price), parseFloat(size));
    });

    message.asks.forEach(([price, size]) => {
      orderbook.asks.set(parseFloat(price), parseFloat(size));
    });

    this.orderbooks.set(symbol, orderbook);
    this.emitOrderbook(symbol);
  }

  handleL2Update(message) {
    const symbol = message.product_id;
    const orderbook = this.orderbooks.get(symbol);
    
    if (!orderbook) return;

    message.changes.forEach(([side, price, size]) => {
      const priceFloat = parseFloat(price);
      const sizeFloat = parseFloat(size);
      
      const book = side === 'buy' ? orderbook.bids : orderbook.asks;
      
      if (sizeFloat === 0) {
        book.delete(priceFloat);
      } else {
        book.set(priceFloat, sizeFloat);
      }
    });

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
      callback(this.normalizeOrderbook(sortedBids, sortedAsks, 'coinbase', symbol));
    }
  }

  async subscribeToSymbol(symbol) {
    const subscribeMessage = {
      type: 'subscribe',
      product_ids: [symbol],
      channels: ['level2']
    };

    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(subscribeMessage));
    }
  }

  unsubscribeFromSymbol(symbol) {
    const unsubscribeMessage = {
      type: 'unsubscribe',
      product_ids: [symbol],
      channels: ['level2']
    };
    
    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(unsubscribeMessage));
      this.orderbooks.delete(symbol);
    }
  }
}

module.exports = CoinbaseConnector;
