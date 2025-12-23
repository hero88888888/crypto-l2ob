// AI Service for intelligent market analysis and predictions
// Integrates multiple AI/ML capabilities for trading insights

interface MarketSentiment {
  overall: 'bullish' | 'bearish' | 'neutral';
  score: number; // -1 to 1
  confidence: number; // 0 to 1
  factors: string[];
}

interface PricePrediction {
  shortTerm: { // 5-15 minutes
    price: number;
    confidence: number;
    direction: 'up' | 'down' | 'sideways';
  };
  mediumTerm: { // 1-4 hours
    price: number;
    confidence: number;
    direction: 'up' | 'down' | 'sideways';
  };
}

interface AnomalyDetection {
  hasAnomaly: boolean;
  type?: 'whale_activity' | 'unusual_spread' | 'volume_spike' | 'price_manipulation';
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
}

interface StrategyRecommendation {
  strategy: string;
  conditions: any[];
  reasoning: string;
  expectedReturn: number;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
}

class AIService {
  private orderbookHistory: any[] = [];
  private metricsHistory: any[] = [];
  private priceHistory: number[] = [];
  
  // Market Sentiment Analysis using orderbook imbalance and flow
  analyzeSentiment(orderbook: any, metrics: any): MarketSentiment {
    const factors: string[] = [];
    let score = 0;
    let confidence = 0.5;

    // Analyze orderbook imbalance
    if (metrics.imbalance > 0.3) {
      score += 0.3;
      factors.push('Strong buy pressure detected');
      confidence += 0.1;
    } else if (metrics.imbalance < -0.3) {
      score -= 0.3;
      factors.push('Strong sell pressure detected');
      confidence += 0.1;
    }

    // Analyze bid/ask ratio (skew)
    if (metrics.skew > 1.5) {
      score += 0.2;
      factors.push('Bid volume exceeds ask volume significantly');
    } else if (metrics.skew < 0.7) {
      score -= 0.2;
      factors.push('Ask volume exceeds bid volume significantly');
    }

    // Analyze spread tightness
    if (metrics.spread < metrics.midPrice * 0.001) {
      score += 0.1;
      factors.push('Very tight spread indicates high liquidity');
      confidence += 0.05;
    }

    // Analyze order flow
    if (metrics.orderFlow > 100) {
      score += 0.2;
      factors.push('Positive order flow momentum');
    } else if (metrics.orderFlow < -100) {
      score -= 0.2;
      factors.push('Negative order flow momentum');
    }

    // Determine overall sentiment
    let overall: 'bullish' | 'bearish' | 'neutral';
    if (score > 0.3) overall = 'bullish';
    else if (score < -0.3) overall = 'bearish';
    else overall = 'neutral';

    confidence = Math.min(confidence, 0.9); // Cap confidence

    return {
      overall,
      score: Math.max(-1, Math.min(1, score)),
      confidence,
      factors
    };
  }

  // Price prediction using pattern recognition and ML
  predictPrice(orderbook: any, metrics: any, historicalData: any[]): PricePrediction {
    const currentPrice = metrics.midPrice;
    
    // Simple momentum-based prediction
    const recentPrices = this.priceHistory.slice(-20);
    const momentum = recentPrices.length > 1 ? 
      (currentPrice - recentPrices[0]) / recentPrices[0] : 0;
    
    // Support and resistance levels from orderbook
    const resistanceLevels = this.findResistanceLevels(orderbook.asks);
    const supportLevels = this.findSupportLevels(orderbook.bids);
    
    // Short-term prediction (5-15 min)
    let shortTermPrice = currentPrice;
    let shortTermDirection: 'up' | 'down' | 'sideways' = 'sideways';
    
    if (metrics.imbalance > 0.2 && momentum > 0) {
      shortTermPrice = resistanceLevels[0] || currentPrice * 1.002;
      shortTermDirection = 'up';
    } else if (metrics.imbalance < -0.2 && momentum < 0) {
      shortTermPrice = supportLevels[0] || currentPrice * 0.998;
      shortTermDirection = 'down';
    }
    
    // Medium-term prediction (1-4 hours)
    const volatility = this.calculateVolatility(recentPrices);
    const mediumTermPrice = currentPrice * (1 + momentum * 0.5);
    const mediumTermDirection = momentum > 0.001 ? 'up' : momentum < -0.001 ? 'down' : 'sideways';
    
    return {
      shortTerm: {
        price: shortTermPrice,
        confidence: Math.max(0.3, Math.min(0.8, 0.5 + Math.abs(metrics.imbalance))),
        direction: shortTermDirection
      },
      mediumTerm: {
        price: mediumTermPrice,
        confidence: Math.max(0.2, Math.min(0.6, 0.4 - volatility)),
        direction: mediumTermDirection
      }
    };
  }

  // Anomaly detection in orderbook and trading patterns
  detectAnomalies(orderbook: any, metrics: any): AnomalyDetection {
    // Check for whale activity
    const largeOrders = this.detectLargeOrders(orderbook);
    if (largeOrders.length > 0) {
      const totalSize = largeOrders.reduce((sum, order) => sum + order.size, 0);
      const avgSize = orderbook.bids.concat(orderbook.asks)
        .reduce((sum: number, o: any) => sum + o.size, 0) / 
        (orderbook.bids.length + orderbook.asks.length);
      
      if (totalSize > avgSize * 10) {
        return {
          hasAnomaly: true,
          type: 'whale_activity',
          severity: totalSize > avgSize * 50 ? 'high' : 'medium',
          description: `Large orders detected: ${largeOrders.length} orders totaling ${totalSize.toFixed(4)} BTC`,
          recommendation: 'Monitor for potential price manipulation. Consider following whale movements.'
        };
      }
    }

    // Check for unusual spread
    const normalSpread = metrics.midPrice * 0.002; // 0.2% normal spread
    if (metrics.spread > normalSpread * 3) {
      return {
        hasAnomaly: true,
        type: 'unusual_spread',
        severity: metrics.spread > normalSpread * 5 ? 'high' : 'medium',
        description: `Spread is ${(metrics.spread / normalSpread).toFixed(1)}x wider than normal`,
        recommendation: 'Wide spread indicates low liquidity or high volatility. Use limit orders.'
      };
    }

    // Check for volume spikes
    const recentVolumes = this.metricsHistory.slice(-20).map(m => m.liquidity.total);
    const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
    const currentVolume = metrics.liquidity.total;
    
    if (currentVolume > avgVolume * 3) {
      return {
        hasAnomaly: true,
        type: 'volume_spike',
        severity: currentVolume > avgVolume * 5 ? 'high' : 'low',
        description: `Volume is ${(currentVolume / avgVolume).toFixed(1)}x higher than average`,
        recommendation: 'High volume may indicate important news or price movement incoming.'
      };
    }

    return {
      hasAnomaly: false,
      severity: 'low',
      description: 'No anomalies detected',
      recommendation: 'Market conditions appear normal'
    };
  }

  // AI-powered strategy recommendations
  recommendStrategy(
    orderbook: any, 
    metrics: any, 
    userRiskTolerance: 'conservative' | 'moderate' | 'aggressive' = 'moderate'
  ): StrategyRecommendation {
    const sentiment = this.analyzeSentiment(orderbook, metrics);
    const prediction = this.predictPrice(orderbook, metrics, this.orderbookHistory);
    const anomaly = this.detectAnomalies(orderbook, metrics);
    
    // Conservative strategy
    if (userRiskTolerance === 'conservative') {
      if (sentiment.overall === 'bullish' && metrics.spread < metrics.midPrice * 0.001) {
        return {
          strategy: 'Tight Spread Scalping',
          conditions: [
            { metric: 'spread', operator: '<', value: metrics.midPrice * 0.001 },
            { metric: 'imbalance', operator: '>', value: 0.2 }
          ],
          reasoning: 'Low risk scalping opportunity with tight spreads and bullish sentiment',
          expectedReturn: 0.1,
          riskLevel: 'low',
          confidence: sentiment.confidence * 0.8
        };
      }
    }
    
    // Moderate strategy
    if (userRiskTolerance === 'moderate') {
      if (sentiment.overall === 'bullish' && prediction.shortTerm.direction === 'up') {
        return {
          strategy: 'Momentum Following',
          conditions: [
            { metric: 'imbalance', operator: '>', value: 0.3 },
            { metric: 'orderFlow', operator: '>', value: 50 }
          ],
          reasoning: 'Strong bullish momentum detected with positive order flow',
          expectedReturn: 0.5,
          riskLevel: 'medium',
          confidence: (sentiment.confidence + prediction.shortTerm.confidence) / 2
        };
      }
    }
    
    // Aggressive strategy
    if (userRiskTolerance === 'aggressive') {
      if (anomaly.hasAnomaly && anomaly.type === 'whale_activity') {
        return {
          strategy: 'Whale Following',
          conditions: [
            { metric: 'liquidity.bid', operator: '>', value: 100 },
            { metric: 'skew', operator: '>', value: 1.5 }
          ],
          reasoning: 'Follow large traders who may have insider information',
          expectedReturn: 2.0,
          riskLevel: 'high',
          confidence: 0.6
        };
      }
    }
    
    // Default safe strategy
    return {
      strategy: 'Range Trading',
      conditions: [
        { metric: 'spread', operator: '>', value: 5 },
        { metric: 'imbalance', operator: 'BETWEEN', value: [-0.2, 0.2] }
      ],
      reasoning: 'Market is ranging, profit from oscillations',
      expectedReturn: 0.3,
      riskLevel: 'low',
      confidence: 0.5
    };
  }

  // Natural language explanation of market conditions
  explainMarketConditions(orderbook: any, metrics: any): string {
    const sentiment = this.analyzeSentiment(orderbook, metrics);
    const anomaly = this.detectAnomalies(orderbook, metrics);
    const prediction = this.predictPrice(orderbook, metrics, this.orderbookHistory);
    
    let explanation = `📊 **Market Analysis**\n\n`;
    
    // Sentiment
    explanation += `**Sentiment**: The market is currently ${sentiment.overall.toUpperCase()} `;
    explanation += `with ${(sentiment.confidence * 100).toFixed(0)}% confidence.\n`;
    if (sentiment.factors.length > 0) {
      explanation += `Key factors: ${sentiment.factors.join(', ')}.\n\n`;
    }
    
    // Price prediction
    explanation += `**Price Outlook**: `;
    explanation += `Short-term (15min): ${prediction.shortTerm.direction === 'up' ? '📈' : prediction.shortTerm.direction === 'down' ? '📉' : '➡️'} `;
    explanation += `$${prediction.shortTerm.price.toFixed(2)} (${(prediction.shortTerm.confidence * 100).toFixed(0)}% confidence)\n`;
    
    // Anomalies
    if (anomaly.hasAnomaly) {
      explanation += `\n⚠️ **Alert**: ${anomaly.description}\n`;
      explanation += `💡 ${anomaly.recommendation}\n`;
    }
    
    // Trading advice
    explanation += `\n**Recommended Action**: `;
    if (sentiment.overall === 'bullish' && prediction.shortTerm.direction === 'up') {
      explanation += `Consider BUYING with stop-loss at $${(metrics.midPrice * 0.98).toFixed(2)}`;
    } else if (sentiment.overall === 'bearish' && prediction.shortTerm.direction === 'down') {
      explanation += `Consider SELLING or staying out of the market`;
    } else {
      explanation += `WAIT for clearer signals. Market is uncertain.`;
    }
    
    return explanation;
  }

  // Update historical data for better predictions
  updateHistory(orderbook: any, metrics: any) {
    this.orderbookHistory.push({ ...orderbook, timestamp: Date.now() });
    this.metricsHistory.push({ ...metrics, timestamp: Date.now() });
    this.priceHistory.push(metrics.midPrice);
    
    // Keep only recent history (last 100 data points)
    if (this.orderbookHistory.length > 100) {
      this.orderbookHistory.shift();
      this.metricsHistory.shift();
      this.priceHistory.shift();
    }
  }

  // Helper: Find resistance levels from asks
  private findResistanceLevels(asks: any[]): number[] {
    const levels: number[] = [];
    const sortedAsks = [...asks].sort((a, b) => a.price - b.price);
    
    let cumulativeSize = 0;
    const totalSize = asks.reduce((sum, ask) => sum + ask.size, 0);
    
    for (const ask of sortedAsks) {
      cumulativeSize += ask.size;
      if (cumulativeSize / totalSize > 0.2) { // 20% of total ask volume
        levels.push(ask.price);
        if (levels.length >= 3) break;
      }
    }
    
    return levels;
  }

  // Helper: Find support levels from bids
  private findSupportLevels(bids: any[]): number[] {
    const levels: number[] = [];
    const sortedBids = [...bids].sort((a, b) => b.price - a.price);
    
    let cumulativeSize = 0;
    const totalSize = bids.reduce((sum, bid) => sum + bid.size, 0);
    
    for (const bid of sortedBids) {
      cumulativeSize += bid.size;
      if (cumulativeSize / totalSize > 0.2) { // 20% of total bid volume
        levels.push(bid.price);
        if (levels.length >= 3) break;
      }
    }
    
    return levels;
  }

  // Helper: Detect large orders (whales)
  private detectLargeOrders(orderbook: any): any[] {
    const allOrders = [...orderbook.bids, ...orderbook.asks];
    const avgSize = allOrders.reduce((sum, o) => sum + o.size, 0) / allOrders.length;
    return allOrders.filter(order => order.size > avgSize * 5);
  }

  // Helper: Calculate price volatility
  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }
}

export const aiService = new AIService();
