const BaseConnector = require('./BaseConnector');
const pako = require('pako');

class BybitConnector extends BaseConnector {
  constructor() {
    super();
    this.wsUrl = 'wss://stream.bybit.com/v5/public/spot';
  }

  getSupportedPairs() {
    return ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'DOGEUSDT', 
            'AVAXUSDT', 'MATICUSDT', 'LINKUSDT', 'DOTUSDT', 'LTCUSDT'];
  }

  handleMessage(data) {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.topic && message.type === 'snapshot') {
        const parts = message.topic.split('.');
        if (parts[0] === 'orderbook') {
          const symbol = parts[2];
          this.handleSnapshot(symbol, message.data);
        }
      } else if (message.topic && message.type === 'delta') {
        const parts = message.topic.split('.');
        if (parts[0] === 'orderbook') {
          const symbol = parts[2];
          this.handleDelta(symbol, message.data);
        }
      }
    } catch (error) {
      console.error('Bybit message parsing error:', error);
    }
  }

  handleSnapshot(symbol, data) {
    const orderbook = {
      bids: new Map(),
      asks: new Map(),
      updateId: data.u
    };

    data.b.forEach(([price, size]) => {
      orderbook.bids.set(parseFloat(price), parseFloat(size));
    });

    data.a.forEach(([price, size]) => {
      orderbook.asks.set(parseFloat(price), parseFloat(size));
    });

    this.orderbooks.set(symbol, orderbook);
    this.emitOrderbook(symbol);
  }

  handleDelta(symbol, data) {
    const orderbook = this.orderbooks.get(symbol);
    if (!orderbook) return;

    // Update bids
    if (data.b) {
      data.b.forEach(([price, size]) => {
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
    if (data.a) {
      data.a.forEach(([price, size]) => {
        const priceFloat = parseFloat(price);
        const sizeFloat = parseFloat(size);
        
        if (sizeFloat === 0) {
          orderbook.asks.delete(priceFloat);
        } else {
          orderbook.asks.set(priceFloat, sizeFloat);
        }
      });
    }

    orderbook.updateId = data.u;
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
      callback(this.normalizeOrderbook(sortedBids, sortedAsks, 'bybit', symbol));
    }
  }

  async subscribeToSymbol(symbol) {
    const subscribeMessage = {
      op: 'subscribe',
      args: [`orderbook.50.${symbol}`]
    };

    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(subscribeMessage));
    }
  }

  unsubscribeFromSymbol(symbol) {
    const unsubscribeMessage = {
      op: 'unsubscribe',
      args: [`orderbook.50.${symbol}`]
    };
    
    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(unsubscribeMessage));
      this.orderbooks.delete(symbol);
    }
  }

  sendPing() {
    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify({ op: 'ping' }));
    }
  }
}

module.exports = BybitConnector;
