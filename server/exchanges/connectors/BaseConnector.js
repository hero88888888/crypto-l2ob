const WebSocket = require('ws');

class BaseConnector {
  constructor() {
    this.ws = null;
    this.subscriptions = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.pingInterval = null;
    this.orderbooks = new Map();
  }

  async connect(url) {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url);
      
      this.ws.on('open', () => {
        console.log(`Connected to ${this.constructor.name}`);
        this.reconnectAttempts = 0;
        this.setupPing();
        resolve();
      });

      this.ws.on('message', (data) => {
        this.handleMessage(data);
      });

      this.ws.on('error', (error) => {
        console.error(`${this.constructor.name} error:`, error);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log(`${this.constructor.name} connection closed`);
        this.handleReconnect();
      });
    });
  }

  setupPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendPing();
      }
    }, 30000);
  }

  sendPing() {
    // Override in subclasses if needed
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.ping();
    }
  }

  async handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting ${this.constructor.name}... Attempt ${this.reconnectAttempts}`);
      
      setTimeout(async () => {
        try {
          await this.connect(this.wsUrl);
          // Resubscribe to all symbols
          for (const symbol of this.subscriptions.keys()) {
            await this.subscribeToSymbol(symbol);
          }
        } catch (error) {
          console.error('Reconnection failed:', error);
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  normalizeOrderbook(bids, asks, exchange, symbol) {
    return {
      exchange,
      symbol,
      bids: bids.map(([price, size]) => ({ 
        price: parseFloat(price), 
        size: parseFloat(size) 
      })),
      asks: asks.map(([price, size]) => ({ 
        price: parseFloat(price), 
        size: parseFloat(size) 
      })),
      timestamp: Date.now()
    };
  }

  getSupportedPairs() {
    // Override in subclasses
    return [];
  }

  async subscribe(symbol, callback) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.connect(this.wsUrl);
    }
    
    this.subscriptions.set(symbol, callback);
    await this.subscribeToSymbol(symbol);
    
    return {
      exchange: this.constructor.name,
      symbol
    };
  }

  unsubscribe(symbol) {
    this.subscriptions.delete(symbol);
    this.unsubscribeFromSymbol(symbol);
  }

  // Methods to be implemented by subclasses
  handleMessage(data) {
    throw new Error('handleMessage must be implemented by subclass');
  }

  async subscribeToSymbol(symbol) {
    throw new Error('subscribeToSymbol must be implemented by subclass');
  }

  unsubscribeFromSymbol(symbol) {
    throw new Error('unsubscribeFromSymbol must be implemented by subclass');
  }
}

module.exports = BaseConnector;
