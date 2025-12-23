const BinanceConnector = require('./connectors/BinanceConnector');
const CoinbaseConnector = require('./connectors/CoinbaseConnector');
const KrakenConnector = require('./connectors/KrakenConnector');
const BitfinexConnector = require('./connectors/BitfinexConnector');
const BybitConnector = require('./connectors/BybitConnector');
const OKXConnector = require('./connectors/OKXConnector');

class ExchangeManager {
  constructor() {
    this.connectors = {
      binance: new BinanceConnector(),
      coinbase: new CoinbaseConnector(),
      kraken: new KrakenConnector(),
      bitfinex: new BitfinexConnector(),
      bybit: new BybitConnector(),
      okx: new OKXConnector()
    };
  }

  async subscribe(exchange, symbol, callback) {
    if (!this.connectors[exchange]) {
      throw new Error(`Exchange ${exchange} not supported`);
    }
    
    return await this.connectors[exchange].subscribe(symbol, callback);
  }

  unsubscribe(exchange, symbol) {
    if (this.connectors[exchange]) {
      this.connectors[exchange].unsubscribe(symbol);
    }
  }

  getAvailableExchanges() {
    return Object.keys(this.connectors).map(exchange => ({
      id: exchange,
      name: exchange.charAt(0).toUpperCase() + exchange.slice(1),
      supportedPairs: this.connectors[exchange].getSupportedPairs()
    }));
  }
}

module.exports = ExchangeManager;
