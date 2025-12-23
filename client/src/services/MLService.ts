// Machine Learning Service using TensorFlow.js
// Provides pattern recognition, prediction models, and advanced analytics
// Note: TensorFlow.js is imported but can run without it for basic functionality

let tf: any;
try {
  tf = require('@tensorflow/tfjs');
} catch (e) {
  console.log('TensorFlow.js not loaded, ML features will be limited');
}

interface PatternRecognition {
  pattern: 'ascending_triangle' | 'descending_triangle' | 'double_top' | 'double_bottom' | 
           'head_shoulders' | 'flag' | 'wedge' | 'channel' | 'none';
  confidence: number;
  breakoutDirection?: 'up' | 'down';
  targetPrice?: number;
}

interface VolumeCluster {
  priceLevel: number;
  volume: number;
  significance: 'high' | 'medium' | 'low';
  type: 'support' | 'resistance';
}

interface MLPrediction {
  nextPrice: number;
  confidence: number;
  features: {
    name: string;
    importance: number;
    value: number;
  }[];
}

interface TradingSignal {
  type: 'BUY' | 'SELL' | 'HOLD';
  strength: number; // 0-100
  reasons: string[];
  entryPrice: number;
  stopLoss: number;
  takeProfit: number[];
}

class MLService {
  private model: any = null;
  private isModelLoaded = false;
  private featureScaler: { mean: number[], std: number[] } = { mean: [], std: [] };

  constructor() {
    if (tf) {
      this.initializeModel();
    }
  }

  // Initialize TensorFlow.js model for price prediction
  private async initializeModel() {
    if (!tf) {
      console.log('TensorFlow.js not available, skipping model initialization');
      return;
    }
    
    try {
      // Create a simple neural network for demonstration
      // In production, you'd load a pre-trained model
      const model = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [10], units: 32, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 16, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 8, activation: 'relu' }),
          tf.layers.dense({ units: 1, activation: 'linear' })
        ]
      });

      model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'meanSquaredError',
        metrics: ['mae']
      });

      this.model = model;
      this.isModelLoaded = true;
      console.log('ML Model initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ML model:', error);
    }
  }

  // Extract features from orderbook and metrics
  private extractFeatures(orderbook: any, metrics: any): number[] {
    return [
      metrics.spread / metrics.midPrice, // Normalized spread
      metrics.imbalance, // Already normalized (-1 to 1)
      metrics.skew,
      metrics.orderFlow / 100, // Normalize order flow
      metrics.liquidity.bid / 100,
      metrics.liquidity.ask / 100,
      metrics.liquidity.total / 200,
      Math.log(metrics.midPrice), // Log of price for stability
      metrics.vwap ? metrics.vwap / metrics.midPrice : 1,
      orderbook.bids.length / 50 // Normalized depth
    ];
  }

  // Predict next price using neural network
  async predictNextPrice(orderbook: any, metrics: any, historicalData: any[]): Promise<MLPrediction> {
    if (!this.isModelLoaded || !this.model || !tf) {
      // Fallback prediction without TensorFlow
      const features = this.extractFeatures(orderbook, metrics);
      const featureNames = [
        'Spread', 'Imbalance', 'Skew', 'Order Flow', 'Bid Liquidity',
        'Ask Liquidity', 'Total Liquidity', 'Price Level', 'VWAP Ratio', 'Order Depth'
      ];
      
      const featureImportance = features.map((value, i) => ({
        name: featureNames[i],
        importance: Math.abs(value) / features.reduce((sum, f) => sum + Math.abs(f), 0),
        value: value
      })).sort((a, b) => b.importance - a.importance);
      
      // Simple heuristic prediction
      const imbalance = metrics.imbalance || 0;
      const predictedChange = imbalance * 0.001; // 0.1% change per unit imbalance
      
      return {
        nextPrice: metrics.midPrice * (1 + predictedChange),
        confidence: 0.3,
        features: featureImportance
      };
    }

    const features = this.extractFeatures(orderbook, metrics);
    
    // Create tensor from features
    const inputTensor = tf.tensor2d([features]);
    
    // Make prediction
    const prediction = this.model.predict(inputTensor) as any;
    const predictedValue = await prediction.data();
    
    // Calculate feature importance (simplified)
    const featureNames = [
      'Spread', 'Imbalance', 'Skew', 'Order Flow', 'Bid Liquidity',
      'Ask Liquidity', 'Total Liquidity', 'Price Level', 'VWAP Ratio', 'Order Depth'
    ];
    
    const featureImportance = features.map((value, i) => ({
      name: featureNames[i],
      importance: Math.abs(value) / features.reduce((sum, f) => sum + Math.abs(f), 0),
      value: value
    })).sort((a, b) => b.importance - a.importance);

    // Clean up tensors
    inputTensor.dispose();
    prediction.dispose();

    // Calculate confidence based on feature stability
    const confidence = this.calculatePredictionConfidence(features, historicalData);

    return {
      nextPrice: Math.exp(predictedValue[0]) * metrics.midPrice,
      confidence,
      features: featureImportance
    };
  }

  // Pattern recognition in orderbook data
  recognizePattern(priceHistory: number[], volumeHistory: number[]): PatternRecognition {
    if (priceHistory.length < 20) {
      return { pattern: 'none', confidence: 0 };
    }

    // Detect ascending triangle
    const ascendingTriangle = this.detectAscendingTriangle(priceHistory);
    if (ascendingTriangle.detected) {
      return {
        pattern: 'ascending_triangle',
        confidence: ascendingTriangle.confidence,
        breakoutDirection: 'up',
        targetPrice: ascendingTriangle.targetPrice
      };
    }

    // Detect double top
    const doubleTop = this.detectDoubleTop(priceHistory);
    if (doubleTop.detected) {
      return {
        pattern: 'double_top',
        confidence: doubleTop.confidence,
        breakoutDirection: 'down',
        targetPrice: doubleTop.targetPrice
      };
    }

    // Detect head and shoulders
    const headShoulders = this.detectHeadAndShoulders(priceHistory);
    if (headShoulders.detected) {
      return {
        pattern: 'head_shoulders',
        confidence: headShoulders.confidence,
        breakoutDirection: 'down',
        targetPrice: headShoulders.targetPrice
      };
    }

    return { pattern: 'none', confidence: 0 };
  }

  // Volume cluster analysis for support/resistance
  analyzeVolumeClusters(orderbook: any): VolumeCluster[] {
    const clusters: VolumeCluster[] = [];
    
    // Analyze bid clusters for support
    const bidClusters = this.findVolumeClusters(orderbook.bids, 'support');
    clusters.push(...bidClusters);
    
    // Analyze ask clusters for resistance
    const askClusters = this.findVolumeClusters(orderbook.asks, 'resistance');
    clusters.push(...askClusters);
    
    // Sort by significance
    return clusters.sort((a, b) => {
      const sigOrder = { high: 3, medium: 2, low: 1 };
      return sigOrder[b.significance] - sigOrder[a.significance];
    });
  }

  // Generate trading signals using ML
  generateTradingSignal(
    orderbook: any,
    metrics: any,
    patterns: PatternRecognition,
    clusters: VolumeCluster[]
  ): TradingSignal {
    const reasons: string[] = [];
    let signalStrength = 50; // Start neutral
    let signalType: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    
    // Factor 1: Orderbook imbalance
    if (metrics.imbalance > 0.3) {
      signalStrength += 15;
      reasons.push('Strong buying pressure in orderbook');
    } else if (metrics.imbalance < -0.3) {
      signalStrength -= 15;
      reasons.push('Strong selling pressure in orderbook');
    }
    
    // Factor 2: Pattern recognition
    if (patterns.pattern !== 'none' && patterns.confidence > 0.7) {
      if (patterns.breakoutDirection === 'up') {
        signalStrength += 20;
        reasons.push(`${patterns.pattern} pattern detected (bullish)`);
      } else {
        signalStrength -= 20;
        reasons.push(`${patterns.pattern} pattern detected (bearish)`);
      }
    }
    
    // Factor 3: Volume clusters
    const nearestSupport = clusters.find(c => c.type === 'support' && c.significance === 'high');
    const nearestResistance = clusters.find(c => c.type === 'resistance' && c.significance === 'high');
    
    if (nearestSupport && nearestResistance) {
      const currentPrice = metrics.midPrice;
      const supportDistance = (currentPrice - nearestSupport.priceLevel) / currentPrice;
      const resistanceDistance = (nearestResistance.priceLevel - currentPrice) / currentPrice;
      
      if (supportDistance < 0.01) { // Near support
        signalStrength += 10;
        reasons.push('Price near strong support level');
      } else if (resistanceDistance < 0.01) { // Near resistance
        signalStrength -= 10;
        reasons.push('Price near strong resistance level');
      }
    }
    
    // Factor 4: Order flow momentum
    if (metrics.orderFlow > 100) {
      signalStrength += 10;
      reasons.push('Positive order flow momentum');
    } else if (metrics.orderFlow < -100) {
      signalStrength -= 10;
      reasons.push('Negative order flow momentum');
    }
    
    // Determine signal type
    if (signalStrength > 65) signalType = 'BUY';
    else if (signalStrength < 35) signalType = 'SELL';
    else signalType = 'HOLD';
    
    // Calculate entry, stop loss, and take profit
    const entryPrice = metrics.midPrice;
    const stopLoss = signalType === 'BUY' ? 
      nearestSupport?.priceLevel || entryPrice * 0.98 :
      nearestResistance?.priceLevel || entryPrice * 1.02;
    
    const takeProfit = signalType === 'BUY' ?
      [entryPrice * 1.01, entryPrice * 1.02, entryPrice * 1.05] :
      [entryPrice * 0.99, entryPrice * 0.98, entryPrice * 0.95];
    
    if (signalType === 'HOLD') {
      reasons.push('Insufficient signal strength for entry');
    }
    
    return {
      type: signalType,
      strength: Math.min(100, Math.max(0, signalStrength)),
      reasons,
      entryPrice,
      stopLoss,
      takeProfit
    };
  }

  // Train model with new data (online learning)
  async trainOnNewData(features: number[][], labels: number[]) {
    if (!this.model || !tf || features.length === 0) {
      console.log('Cannot train model: TensorFlow not available or no data');
      return;
    }
    
    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels, [labels.length, 1]);
    
    await this.model.fit(xs, ys, {
      epochs: 5,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch: any, logs: any) => {
          console.log(`Training epoch ${epoch}: loss = ${logs?.loss}`);
        }
      }
    });
    
    xs.dispose();
    ys.dispose();
  }

  // Helper: Detect ascending triangle pattern
  private detectAscendingTriangle(prices: number[]): { detected: boolean; confidence: number; targetPrice: number } {
    const highs = this.findLocalExtrema(prices, 'high');
    const lows = this.findLocalExtrema(prices, 'low');
    
    // Check for flat top (resistance) and rising bottom (support)
    const highsFlat = this.isFlat(highs.map(h => h.value));
    const lowsRising = this.isRising(lows.map(l => l.value));
    
    if (highsFlat && lowsRising) {
      const resistance = Math.max(...highs.map(h => h.value));
      const support = lows[lows.length - 1].value;
      const targetPrice = resistance + (resistance - support);
      
      return {
        detected: true,
        confidence: 0.75,
        targetPrice
      };
    }
    
    return { detected: false, confidence: 0, targetPrice: 0 };
  }

  // Helper: Detect double top pattern
  private detectDoubleTop(prices: number[]): { detected: boolean; confidence: number; targetPrice: number } {
    const highs = this.findLocalExtrema(prices, 'high');
    
    if (highs.length >= 2) {
      const lastTwo = highs.slice(-2);
      const priceDiff = Math.abs(lastTwo[0].value - lastTwo[1].value) / lastTwo[0].value;
      
      if (priceDiff < 0.02) { // Within 2% of each other
        const neckline = Math.min(...prices.slice(lastTwo[0].index, lastTwo[1].index));
        const targetPrice = neckline - (lastTwo[0].value - neckline);
        
        return {
          detected: true,
          confidence: 0.7,
          targetPrice
        };
      }
    }
    
    return { detected: false, confidence: 0, targetPrice: 0 };
  }

  // Helper: Detect head and shoulders pattern
  private detectHeadAndShoulders(prices: number[]): { detected: boolean; confidence: number; targetPrice: number } {
    const highs = this.findLocalExtrema(prices, 'high');
    
    if (highs.length >= 3) {
      const lastThree = highs.slice(-3);
      const [leftShoulder, head, rightShoulder] = lastThree.map(h => h.value);
      
      if (head > leftShoulder && head > rightShoulder) {
        const shoulderDiff = Math.abs(leftShoulder - rightShoulder) / leftShoulder;
        
        if (shoulderDiff < 0.03) { // Shoulders within 3% of each other
          const neckline = Math.min(...prices.slice(lastThree[0].index, lastThree[2].index));
          const targetPrice = neckline - (head - neckline);
          
          return {
            detected: true,
            confidence: 0.65,
            targetPrice
          };
        }
      }
    }
    
    return { detected: false, confidence: 0, targetPrice: 0 };
  }

  // Helper: Find local extrema
  private findLocalExtrema(prices: number[], type: 'high' | 'low'): { index: number; value: number }[] {
    const extrema: { index: number; value: number }[] = [];
    
    for (let i = 1; i < prices.length - 1; i++) {
      if (type === 'high') {
        if (prices[i] > prices[i-1] && prices[i] > prices[i+1]) {
          extrema.push({ index: i, value: prices[i] });
        }
      } else {
        if (prices[i] < prices[i-1] && prices[i] < prices[i+1]) {
          extrema.push({ index: i, value: prices[i] });
        }
      }
    }
    
    return extrema;
  }

  // Helper: Check if values are flat (horizontal)
  private isFlat(values: number[]): boolean {
    if (values.length < 2) return false;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const maxDev = Math.max(...values.map(v => Math.abs(v - avg) / avg));
    return maxDev < 0.02; // Within 2% deviation
  }

  // Helper: Check if values are rising
  private isRising(values: number[]): boolean {
    if (values.length < 2) return false;
    let rising = 0;
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[i-1]) rising++;
    }
    return rising > values.length * 0.6; // 60% rising
  }

  // Helper: Find volume clusters
  private findVolumeClusters(orders: any[], type: 'support' | 'resistance'): VolumeCluster[] {
    const clusters: VolumeCluster[] = [];
    const priceGroups = new Map<number, number>();
    
    // Group orders by price level (round to nearest 10)
    orders.forEach(order => {
      const roundedPrice = Math.round(order.price / 10) * 10;
      priceGroups.set(roundedPrice, (priceGroups.get(roundedPrice) || 0) + order.size);
    });
    
    // Find significant clusters
    const avgVolume = Array.from(priceGroups.values()).reduce((a, b) => a + b, 0) / priceGroups.size;
    
    priceGroups.forEach((volume, price) => {
      let significance: 'high' | 'medium' | 'low';
      if (volume > avgVolume * 3) significance = 'high';
      else if (volume > avgVolume * 1.5) significance = 'medium';
      else significance = 'low';
      
      if (significance !== 'low') {
        clusters.push({
          priceLevel: price,
          volume,
          significance,
          type
        });
      }
    });
    
    return clusters;
  }

  // Helper: Calculate prediction confidence
  private calculatePredictionConfidence(features: number[], historicalData: any[]): number {
    // Base confidence on feature stability and data quality
    let confidence = 0.5;
    
    // Check for extreme values
    const hasExtreme = features.some(f => Math.abs(f) > 3);
    if (!hasExtreme) confidence += 0.1;
    
    // Check for sufficient historical data
    if (historicalData.length > 50) confidence += 0.1;
    if (historicalData.length > 100) confidence += 0.1;
    
    // Check for consistent patterns
    const recentMetrics = historicalData.slice(-10).map(d => d.metrics);
    if (recentMetrics.length > 0) {
      const imbalances = recentMetrics.map(m => m?.imbalance || 0);
      const stdDev = this.calculateStdDev(imbalances);
      if (stdDev < 0.2) confidence += 0.1; // Low volatility
    }
    
    return Math.min(0.9, confidence);
  }

  // Helper: Calculate standard deviation
  private calculateStdDev(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
}

export const mlService = new MLService();
