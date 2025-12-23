const BaseConnector = require('./BaseConnector');

class OKXConnector extends BaseConnector {
  constructor() {
    super();
    this.wsUrl = 'wss://ws.okx.com:8443/ws/v5/public';
  }

  getSupportedPairs() {
    return ['BTC-USDT', 'ETH-USDT', 'SOL-USDT', 'ADA-USDT', 'DOGE-USDT', 
            'AVAX-USDT', 'MATIC-USDT', 'LINK-USDT', 'DOT-USDT', 'UNI-USDT'];
  }

  handleMessage(data) {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.arg && message.arg.channel === 'books') {
        const symbol = message.arg.instId;
        
        if (message.action === 'snapshot') {
          this.handleSnapshot(symbol, message.data[0]);
        } else if (message.action === 'update') {
          this.handleUpdate(symbol, message.data[0]);
        }
      }
    } catch (error) {
      console.error('OKX message parsing error:', error);
    }
  }

  handleSnapshot(symbol, data) {
    const orderbook = {
      bids: new Map(),
      asks: new Map(),
      checksum: data.checksum
    };

    data.bids.forEach(([price, size, _, numOrders]) => {
      orderbook.bids.set(parseFloat(price), parseFloat(size));
    });

    data.asks.forEach(([price, size, _, numOrders]) => {
      orderbook.asks.set(parseFloat(price), parseFloat(size));
    });

    this.orderbooks.set(symbol, orderbook);
    this.emitOrderbook(symbol);
  }

  handleUpdate(symbol, data) {
    const orderbook = this.orderbooks.get(symbol);
    if (!orderbook) return;

    // Update bids
    if (data.bids) {
      data.bids.forEach(([price, size, _, numOrders]) => {
        const priceFloat = parseFloat(price);
        const sizeFloat = parseFloat(size);
        
        if (sizeFloat === 0) {
          orderbook.bids.delete(priceFloat);
        } else {
          orderbook.bids.set(priceFloat, sizeFloat);
        }
      });
    }

    // Update asks
    if (data.asks) {
      data.asks.forEach(([price, size, _, numOrders]) => {
        const priceFloat = parseFloat(price);
        const sizeFloat = parseFloat(size);
        
        if (sizeFloat === 0) {
          orderbook.asks.delete(priceFloat);
        } else {
          orderbook.asks.set(priceFloat, sizeFloat);
        }
      });
    }

    orderbook.checksum = data.checksum;
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
      callback(this.normalizeOrderbook(sortedBids, sortedAsks, 'okx', symbol));
    }
  }

  async subscribeToSymbol(symbol) {
    const subscribeMessage = {
      op: 'subscribe',
      args: [{
        channel: 'books',
        instId: symbol
      }]
    };

    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(subscribeMessage));
    }
  }

  unsubscribeFromSymbol(symbol) {
    const unsubscribeMessage = {
      op: 'unsubscribe',
      args: [{
        channel: 'books',
        instId: symbol
      }]
    };
    
    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(unsubscribeMessage));
      this.orderbooks.delete(symbol);
    }
  }

  sendPing() {
    if (this.ws && this.ws.readyState === 1) {
      this.ws.send('ping');
    }
  }
}

module.exports = OKXConnector;
