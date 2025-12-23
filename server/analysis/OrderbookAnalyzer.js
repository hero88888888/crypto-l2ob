class OrderbookAnalyzer {
  calculateMetrics(orderbook) {
    if (!orderbook || !orderbook.bids || !orderbook.asks || 
        orderbook.bids.length === 0 || orderbook.asks.length === 0) {
      return this.getEmptyMetrics();
    }

    const metrics = {
      spread: this.calculateSpread(orderbook),
      spreadPercentage: this.calculateSpreadPercentage(orderbook),
      midPrice: this.calculateMidPrice(orderbook),
      imbalance: this.calculateImbalance(orderbook),
      depth: this.calculateDepth(orderbook),
      skew: this.calculateSkew(orderbook),
      pressure: this.calculatePressure(orderbook),
      vwap: this.calculateVWAP(orderbook),
      liquidity: this.calculateLiquidity(orderbook),
      orderFlow: this.calculateOrderFlow(orderbook),
      microstructure: this.calculateMicrostructure(orderbook),
      largeOrders: this.detectLargeOrders(orderbook),
      supportResistance: this.findSupportResistance(orderbook)
    };

    return metrics;
  }

  getEmptyMetrics() {
    return {
      spread: 0,
      spreadPercentage: 0,
      midPrice: 0,
      imbalance: 0,
      depth: { bids: {}, asks: {} },
      skew: 0,
      pressure: { buy: 0, sell: 0 },
      vwap: { bid: 0, ask: 0 },
      liquidity: { bid: 0, ask: 0 },
      orderFlow: 0,
      microstructure: {},
      largeOrders: { bids: [], asks: [] },
      supportResistance: { support: [], resistance: [] }
    };
  }

  calculateSpread(orderbook) {
    const bestBid = orderbook.bids[0].price;
    const bestAsk = orderbook.asks[0].price;
    return bestAsk - bestBid;
  }

  calculateSpreadPercentage(orderbook) {
    const spread = this.calculateSpread(orderbook);
    const midPrice = this.calculateMidPrice(orderbook);
    return midPrice > 0 ? (spread / midPrice) * 100 : 0;
  }

  calculateMidPrice(orderbook) {
    const bestBid = orderbook.bids[0].price;
    const bestAsk = orderbook.asks[0].price;
    return (bestBid + bestAsk) / 2;
  }

  calculateImbalance(orderbook) {
    // Order book imbalance ratio
    const bidVolume = orderbook.bids.slice(0, 10).reduce((sum, bid) => sum + bid.size, 0);
    const askVolume = orderbook.asks.slice(0, 10).reduce((sum, ask) => sum + ask.size, 0);
    const totalVolume = bidVolume + askVolume;
    
    if (totalVolume === 0) return 0;
    
    // Returns value between -1 (all sell pressure) and 1 (all buy pressure)
    return (bidVolume - askVolume) / totalVolume;
  }

  calculateDepth(orderbook) {
    const depthLevels = [0.1, 0.2, 0.5, 1.0, 2.0]; // Percentage from mid price
    const midPrice = this.calculateMidPrice(orderbook);
    
    const depth = {
      bids: {},
      asks: {}
    };

    depthLevels.forEach(level => {
      const bidThreshold = midPrice * (1 - level / 100);
      const askThreshold = midPrice * (1 + level / 100);
      
      depth.bids[level] = orderbook.bids
        .filter(bid => bid.price >= bidThreshold)
        .reduce((sum, bid) => sum + (bid.size * bid.price), 0);
      
      depth.asks[level] = orderbook.asks
        .filter(ask => ask.price <= askThreshold)
        .reduce((sum, ask) => sum + (ask.size * ask.price), 0);
    });

    return depth;
  }

  calculateSkew(orderbook) {
    // Weighted average price skew
    const midPrice = this.calculateMidPrice(orderbook);
    const range = midPrice * 0.01; // 1% range
    
    const bidsInRange = orderbook.bids.filter(bid => bid.price >= midPrice - range);
    const asksInRange = orderbook.asks.filter(ask => ask.price <= midPrice + range);
    
    const bidWeight = bidsInRange.reduce((sum, bid) => sum + bid.size, 0);
    const askWeight = asksInRange.reduce((sum, ask) => sum + ask.size, 0);
    
    const totalWeight = bidWeight + askWeight;
    if (totalWeight === 0) return 0;
    
    // Positive skew indicates more buying pressure
    return (bidWeight - askWeight) / totalWeight;
  }

  calculatePressure(orderbook) {
    // Calculate buy and sell pressure based on order concentration
    const levels = Math.min(20, orderbook.bids.length, orderbook.asks.length);
    
    let buyPressure = 0;
    let sellPressure = 0;
    
    for (let i = 0; i < levels; i++) {
      const weight = 1 / (i + 1); // Give more weight to orders closer to spread
      buyPressure += orderbook.bids[i].size * weight;
      sellPressure += orderbook.asks[i].size * weight;
    }
    
    return {
      buy: buyPressure,
      sell: sellPressure,
      ratio: buyPressure / (buyPressure + sellPressure)
    };
  }

  calculateVWAP(orderbook, depth = 10) {
    // Volume Weighted Average Price for both sides
    const bidLevels = orderbook.bids.slice(0, depth);
    const askLevels = orderbook.asks.slice(0, depth);
    
    const bidVWAP = this.computeVWAP(bidLevels);
    const askVWAP = this.computeVWAP(askLevels);
    
    return {
      bid: bidVWAP,
      ask: askVWAP,
      spread: askVWAP - bidVWAP
    };
  }

  computeVWAP(levels) {
    const totalValue = levels.reduce((sum, level) => sum + (level.price * level.size), 0);
    const totalVolume = levels.reduce((sum, level) => sum + level.size, 0);
    return totalVolume > 0 ? totalValue / totalVolume : 0;
  }

  calculateLiquidity(orderbook) {
    // Calculate available liquidity at different price levels
    const midPrice = this.calculateMidPrice(orderbook);
    
    const bidLiquidity = orderbook.bids.reduce((sum, bid) => {
      const distance = (midPrice - bid.price) / midPrice;
      const weight = Math.exp(-distance * 100); // Exponential decay based on distance
      return sum + (bid.size * bid.price * weight);
    }, 0);
    
    const askLiquidity = orderbook.asks.reduce((sum, ask) => {
      const distance = (ask.price - midPrice) / midPrice;
      const weight = Math.exp(-distance * 100);
      return sum + (ask.size * ask.price * weight);
    }, 0);
    
    return {
      bid: bidLiquidity,
      ask: askLiquidity,
      total: bidLiquidity + askLiquidity,
      ratio: bidLiquidity / (bidLiquidity + askLiquidity)
    };
  }

  calculateOrderFlow(orderbook) {
    // Estimate order flow imbalance
    const topBids = orderbook.bids.slice(0, 5);
    const topAsks = orderbook.asks.slice(0, 5);
    
    const bidFlow = topBids.reduce((sum, bid, i) => {
      const weight = 1 / (i + 1);
      return sum + (bid.size * weight);
    }, 0);
    
    const askFlow = topAsks.reduce((sum, ask, i) => {
      const weight = 1 / (i + 1);
      return sum + (ask.size * weight);
    }, 0);
    
    // Normalized between -1 and 1
    return (bidFlow - askFlow) / (bidFlow + askFlow);
  }

  calculateMicrostructure(orderbook) {
    // Advanced microstructure metrics
    const midPrice = this.calculateMidPrice(orderbook);
    const spread = this.calculateSpread(orderbook);
    
    // Calculate price levels concentration
    const priceLevels = new Set();
    orderbook.bids.forEach(bid => priceLevels.add(bid.price));
    orderbook.asks.forEach(ask => priceLevels.add(ask.price));
    
    // Order size distribution
    const allSizes = [...orderbook.bids, ...orderbook.asks].map(order => order.size);
    const avgSize = allSizes.reduce((a, b) => a + b, 0) / allSizes.length;
    const stdDev = Math.sqrt(
      allSizes.reduce((sum, size) => sum + Math.pow(size - avgSize, 2), 0) / allSizes.length
    );
    
    return {
      effectiveSpread: spread,
      realizedSpread: spread * 0.5, // Simplified estimate
      priceImpact: this.calculatePriceImpact(orderbook),
      orderConcentration: priceLevels.size,
      sizeDistribution: {
        mean: avgSize,
        stdDev: stdDev,
        skewness: this.calculateSizeSkewness(allSizes, avgSize, stdDev)
      },
      resilience: this.calculateResilience(orderbook)
    };
  }

  calculatePriceImpact(orderbook, tradeSize = null) {
    const midPrice = this.calculateMidPrice(orderbook);
    
    if (!tradeSize) {
      // Use average order size as default
      tradeSize = [...orderbook.bids, ...orderbook.asks]
        .reduce((sum, order) => sum + order.size, 0) / (orderbook.bids.length + orderbook.asks.length);
    }
    
    // Calculate price impact for buy and sell
    let buyImpact = 0;
    let remainingSize = tradeSize;
    
    for (const ask of orderbook.asks) {
      if (remainingSize <= 0) break;
      const fillSize = Math.min(remainingSize, ask.size);
      buyImpact += (ask.price - midPrice) * fillSize;
      remainingSize -= fillSize;
    }
    
    remainingSize = tradeSize;
    let sellImpact = 0;
    
    for (const bid of orderbook.bids) {
      if (remainingSize <= 0) break;
      const fillSize = Math.min(remainingSize, bid.size);
      sellImpact += (midPrice - bid.price) * fillSize;
      remainingSize -= fillSize;
    }
    
    return {
      buy: buyImpact / tradeSize,
      sell: sellImpact / tradeSize,
      average: (buyImpact + sellImpact) / (2 * tradeSize)
    };
  }

  calculateSizeSkewness(sizes, mean, stdDev) {
    if (stdDev === 0) return 0;
    
    const n = sizes.length;
    const skewness = sizes.reduce((sum, size) => {
      return sum + Math.pow((size - mean) / stdDev, 3);
    }, 0) / n;
    
    return skewness;
  }

  calculateResilience(orderbook) {
    // Measure how quickly the orderbook might recover from trades
    const depths = [1, 5, 10, 20];
    const resilience = {};
    
    depths.forEach(depth => {
      const bidVolume = orderbook.bids.slice(0, depth).reduce((sum, bid) => sum + bid.size, 0);
      const askVolume = orderbook.asks.slice(0, depth).reduce((sum, ask) => sum + ask.size, 0);
      
      resilience[`level_${depth}`] = {
        bid: bidVolume,
        ask: askVolume,
        ratio: bidVolume / askVolume
      };
    });
    
    return resilience;
  }

  detectLargeOrders(orderbook) {
    // Detect unusually large orders that might indicate institutional activity
    const allOrders = [...orderbook.bids, ...orderbook.asks];
    const sizes = allOrders.map(order => order.size);
    
    const mean = sizes.reduce((a, b) => a + b, 0) / sizes.length;
    const stdDev = Math.sqrt(
      sizes.reduce((sum, size) => sum + Math.pow(size - mean, 2), 0) / sizes.length
    );
    
    const threshold = mean + (2 * stdDev); // 2 standard deviations
    
    const largeBids = orderbook.bids.filter(bid => bid.size > threshold)
      .map(bid => ({ price: bid.price, size: bid.size, zscore: (bid.size - mean) / stdDev }));
    
    const largeAsks = orderbook.asks.filter(ask => ask.size > threshold)
      .map(ask => ({ price: ask.price, size: ask.size, zscore: (ask.size - mean) / stdDev }));
    
    return {
      bids: largeBids,
      asks: largeAsks,
      threshold: threshold
    };
  }

  findSupportResistance(orderbook) {
    // Find price levels with high liquidity concentration
    const support = [];
    const resistance = [];
    
    // Group orders by price ranges
    const priceRange = 0.001; // 0.1% price buckets
    const midPrice = this.calculateMidPrice(orderbook);
    
    // Find support levels (bid side)
    const bidBuckets = new Map();
    orderbook.bids.forEach(bid => {
      const bucket = Math.floor(bid.price / (midPrice * priceRange)) * (midPrice * priceRange);
      const current = bidBuckets.get(bucket) || 0;
      bidBuckets.set(bucket, current + bid.size);
    });
    
    // Find resistance levels (ask side)
    const askBuckets = new Map();
    orderbook.asks.forEach(ask => {
      const bucket = Math.floor(ask.price / (midPrice * priceRange)) * (midPrice * priceRange);
      const current = askBuckets.get(bucket) || 0;
      askBuckets.set(bucket, current + ask.size);
    });
    
    // Convert to arrays and sort by volume
    const sortedSupport = Array.from(bidBuckets.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([price, volume]) => ({ price, volume, strength: volume / orderbook.bids[0].size }));
    
    const sortedResistance = Array.from(askBuckets.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([price, volume]) => ({ price, volume, strength: volume / orderbook.asks[0].size }));
    
    return {
      support: sortedSupport,
      resistance: sortedResistance
    };
  }
}

module.exports = OrderbookAnalyzer;
