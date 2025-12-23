const BaseConnector = require('./BaseConnector');

class BitfinexConnector extends BaseConnector {
  constructor() {
    super();
    this.wsUrl = 'wss://api-pub.bitfinex.com/ws/2';
    this.channelMap = new Map();
  }

  getSupportedPairs() {
    return ['tBTCUSD', 'tETHUSD', 'tSOLUSD', 'tADAUSD', 'tDOGEUSD', 
            'tMATIC:USD', 'tLINK:USD', 'tDOTUSD', 'tAVAX:USD', 'tATOMUSD'];
  }

  handleMessage(data) {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.event === 'subscribed') {
        this.channelMap.set(message.chanId, message.symbol);
      } else if (Array.isArray(message)) {
        const [channelId, ...bookData] = message;
        
        if (channelId && this.channelMap.has(channelId)) {
          const symbol = this.channelMap.get(channelId);
          
          if (bookData[0] === 'hb') {
            // Heartbeat
            return;
          } else if (Array.isArray(bookData[0])) {
            // Snapshot
            this.handleSnapshot(symbol, bookData[0]);
          } else if (bookData.length === 3) {
            // Update
            this.handleUpdate(symbol, bookData);
          }
        }
      }
    } catch (error) {
      console.error('Bitfinex message parsing error:', error);
    }
  }

  handleSnapshot(symbol, data) {
    const orderbook = {
      bids: new Map(),
      asks: new Map()
    };

    data.forEach(([price, count, amount]) => {
      const priceFloat = parseFloat(price);
      const absAmount = Math.abs(parseFloat(amount));
      
      if (count > 0) {
        if (amount > 0) {
          orderbook.bids.set(priceFloat, absAmount);
        } else {
          orderbook.asks.set(priceFloat, absAmount);
        }
      }
    });

    this.orderbooks.set(symbol, orderbook);
    this.emitOrderbook(symbol);
  }

  handleUpdate(symbol, data) {
    const orderbook = this.orderbooks.get(symbol);
    if (!orderbook) return;

    const [price, count, amount] = data;
    const priceFloat = parseFloat(price);
    const absAmount = Math.abs(parseFloat(amount));
    
    if (count === 0) {
      // Remove price level
      orderbook.bids.delete(priceFloat);
      orderbook.asks.delete(priceFloat);
    } else {
      // Update price level
      if (amount > 0) {
        orderbook.bids.set(priceFloat, absAmount);
        orderbook.asks.delete(priceFloat);
      } else {
        orderbook.asks.set(priceFloat, absAmount);
        orderbook.bids.delete(priceFloat);
      }
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
      callback(this.normalizeOrderbook(sortedBids, sortedAsks, 'bitfinex', symbol));
    }
  }

  async subscribeToSymbol(symbol) {
    const subscribeMessage = {
      event: 'subscribe',
      channel: 'book',
      symbol: symbol,
      prec: 'P0',
      freq: 'F0',
      len: '25'
    };

    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(subscribeMessage));
    }
  }

  unsubscribeFromSymbol(symbol) {
    // Find channel ID for symbol
    let channelId = null;
    for (const [id, sym] of this.channelMap.entries()) {
      if (sym === symbol) {
        channelId = id;
        break;
      }
    }

    if (channelId && this.ws && this.ws.readyState === 1) {
      const unsubscribeMessage = {
        event: 'unsubscribe',
        chanId: channelId
      };
      
      this.ws.send(JSON.stringify(unsubscribeMessage));
      this.channelMap.delete(channelId);
      this.orderbooks.delete(symbol);
    }
  }
}

module.exports = BitfinexConnector;
