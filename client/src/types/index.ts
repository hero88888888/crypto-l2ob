export interface OrderLevel {
  price: number;
  size: number;
}

export interface OrderbookData {
  exchange: string;
  symbol: string;
  bids: OrderLevel[];
  asks: OrderLevel[];
  timestamp: number;
}

export interface Metrics {
  spread: number;
  spreadPercentage: number;
  midPrice: number;
  imbalance: number;
  depth: {
    bids: { [key: string]: number };
    asks: { [key: string]: number };
  };
  skew: number;
  pressure: {
    buy: number;
    sell: number;
    ratio: number;
  };
  vwap: {
    bid: number;
    ask: number;
    spread: number;
  };
  liquidity: {
    bid: number;
    ask: number;
    total: number;
    ratio: number;
  };
  orderFlow: number;
  microstructure: {
    effectiveSpread: number;
    realizedSpread: number;
    priceImpact: {
      buy: number;
      sell: number;
      average: number;
    };
    orderConcentration: number;
    sizeDistribution: {
      mean: number;
      stdDev: number;
      skewness: number;
    };
    resilience: any;
  };
  largeOrders: {
    bids: Array<{ price: number; size: number; zscore: number }>;
    asks: Array<{ price: number; size: number; zscore: number }>;
    threshold: number;
  };
  supportResistance: {
    support: Array<{ price: number; volume: number; strength: number }>;
    resistance: Array<{ price: number; volume: number; strength: number }>;
  };
}
