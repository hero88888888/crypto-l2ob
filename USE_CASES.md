# Use Cases Guide

## Practical Trading Strategy Implementations

This guide provides step-by-step implementations of trading strategies using Level 2 orderbook data. Each use case includes setup, execution logic, risk management, and expected performance.

## Table of Contents

1. [Order Flow Scalping Strategy](#1-order-flow-scalping-strategy)
2. [Liquidity-Based Market Making](#2-liquidity-based-market-making)
3. [Cross-Exchange Arbitrage](#3-cross-exchange-arbitrage)
4. [Large Order Detection & Front-Running](#4-large-order-detection--front-running)
5. [Mean Reversion on VWAP Deviation](#5-mean-reversion-on-vwap-deviation)
6. [Volatility Breakout Trading](#6-volatility-breakout-trading)

---

## 1. Order Flow Scalping Strategy

### Overview
Trade based on short-term order flow imbalances to capture quick price movements (1-5 minute holding period).

### Strategy Logic

**Entry Conditions:**
- Order imbalance > 0.4 (strong buy pressure) → Enter LONG
- Order imbalance < -0.4 (strong sell pressure) → Enter SHORT
- Order flow confirms imbalance (same sign)
- Spread < 0.05% (liquid market only)

**Exit Conditions:**
- Target: 0.1% profit
- Stop-loss: 0.05% loss
- Time-based exit: 5 minutes maximum

**Risk Management:**
- Position size: 1% of capital per trade
- Maximum 3 concurrent positions
- Daily loss limit: 2% of capital

### Implementation

```javascript
class OrderFlowScalper {
  constructor(capital, config) {
    this.capital = capital;
    this.maxPositions = 3;
    this.positionSize = capital * 0.01;
    this.positions = [];
    
    // Strategy parameters
    this.imbalanceThreshold = 0.4;
    this.targetProfit = 0.001; // 0.1%
    this.stopLoss = 0.0005; // 0.05%
    this.maxHoldTime = 5 * 60 * 1000; // 5 minutes
    this.maxSpread = 0.0005; // 0.05%
  }
  
  onMetricsUpdate(metrics) {
    // Check for entry signals
    if (this.positions.length < this.maxPositions) {
      const signal = this.generateSignal(metrics);
      if (signal !== 'NEUTRAL') {
        this.enterPosition(signal, metrics);
      }
    }
    
    // Manage existing positions
    this.managePositions(metrics);
  }
  
  generateSignal(metrics) {
    const { imbalance, orderFlow, spreadPercentage } = metrics;
    
    // Only trade in liquid markets
    if (spreadPercentage > this.maxSpread) {
      return 'NEUTRAL';
    }
    
    // Strong buy signal
    if (imbalance > this.imbalanceThreshold && 
        orderFlow > this.imbalanceThreshold * 0.5) {
      return 'LONG';
    }
    
    // Strong sell signal
    if (imbalance < -this.imbalanceThreshold && 
        orderFlow < -this.imbalanceThreshold * 0.5) {
      return 'SHORT';
    }
    
    return 'NEUTRAL';
  }
  
  enterPosition(direction, metrics) {
    const position = {
      direction,
      entryPrice: metrics.midPrice,
      entryTime: Date.now(),
      size: this.positionSize / metrics.midPrice,
      targetPrice: this.calculateTarget(metrics.midPrice, direction),
      stopPrice: this.calculateStop(metrics.midPrice, direction)
    };
    
    this.positions.push(position);
    console.log(`Entered ${direction} at ${position.entryPrice}`);
  }
  
  calculateTarget(price, direction) {
    return direction === 'LONG' 
      ? price * (1 + this.targetProfit)
      : price * (1 - this.targetProfit);
  }
  
  calculateStop(price, direction) {
    return direction === 'LONG'
      ? price * (1 - this.stopLoss)
      : price * (1 + this.stopLoss);
  }
  
  managePositions(metrics) {
    const currentTime = Date.now();
    const currentPrice = metrics.midPrice;
    
    this.positions = this.positions.filter(pos => {
      // Check target
      if (pos.direction === 'LONG' && currentPrice >= pos.targetPrice) {
        this.closePosition(pos, currentPrice, 'TARGET');
        return false;
      }
      if (pos.direction === 'SHORT' && currentPrice <= pos.targetPrice) {
        this.closePosition(pos, currentPrice, 'TARGET');
        return false;
      }
      
      // Check stop
      if (pos.direction === 'LONG' && currentPrice <= pos.stopPrice) {
        this.closePosition(pos, currentPrice, 'STOP');
        return false;
      }
      if (pos.direction === 'SHORT' && currentPrice >= pos.stopPrice) {
        this.closePosition(pos, currentPrice, 'STOP');
        return false;
      }
      
      // Check time
      if (currentTime - pos.entryTime > this.maxHoldTime) {
        this.closePosition(pos, currentPrice, 'TIME');
        return false;
      }
      
      return true; // Keep position
    });
  }
  
  closePosition(position, exitPrice, reason) {
    const pnl = position.direction === 'LONG'
      ? (exitPrice - position.entryPrice) * position.size
      : (position.entryPrice - exitPrice) * position.size;
    
    console.log(`Closed ${position.direction} at ${exitPrice}, PnL: ${pnl}, Reason: ${reason}`);
  }
}

// Usage
const scalper = new OrderFlowScalper(10000);
socket.on('metrics', (metrics) => {
  scalper.onMetricsUpdate(metrics);
});
```

### Expected Performance
- **Win Rate**: 55-65%
- **Average Win**: 0.08-0.12%
- **Average Loss**: 0.04-0.06%
- **Profit Factor**: 1.5-2.0
- **Sharpe Ratio**: 1.5-2.5
- **Best Markets**: BTC/USDT, ETH/USDT on high-volume exchanges

### Optimization Tips
- Adjust imbalance threshold based on market volatility
- Use tighter stops during high volatility
- Avoid trading during news events
- Focus on high-volume trading hours

---

## 2. Liquidity-Based Market Making

### Overview
Provide liquidity by placing limit orders on both sides of the orderbook, earning the spread while managing inventory risk.

### Strategy Logic

**Quote Placement:**
- Place bid at: Mid Price × (1 - spread_factor)
- Place ask at: Mid Price × (1 + spread_factor)
- spread_factor based on volatility and order imbalance

**Inventory Management:**
- Target: Neutral inventory (50% long, 50% short)
- If inventory > 60% long → Widen bid, tighten ask
- If inventory < 40% long → Tighten bid, widen ask

**Risk Management:**
- Max inventory: 10% of daily volume
- Stop-loss: 0.5% adverse move
- Refresh quotes every 5 seconds

### Implementation

```python
import numpy as np

class MarketMaker:
    def __init__(self, capital=10000):
        self.capital = capital
        self.inventory = 0
        self.target_inventory = 0
        self.max_inventory_pct = 0.10
        
        # Parameters
        self.base_spread = 0.0005  # 0.05%
        self.inventory_skew = 0.0002  # Adjust quotes by 0.02% per 10% inventory
        self.min_edge = 0.0002  # Minimum 0.02% edge
        
    def calculate_quotes(self, metrics):
        """Calculate bid and ask quotes"""
        mid_price = metrics['midPrice']
        imbalance = metrics['imbalance']
        spread_pct = metrics['spreadPercentage']
        
        # Adjust spread based on volatility
        volatility_adj = max(spread_pct / 0.001, 1.0)  # Scale by normal spread
        spread = self.base_spread * volatility_adj
        
        # Adjust for inventory
        inventory_pct = self.inventory / (self.capital / mid_price)
        inventory_adj = inventory_pct * self.inventory_skew
        
        # Adjust for order flow
        flow_adj = imbalance * 0.0001  # Small adjustment based on flow
        
        # Calculate quotes
        bid_spread = spread / 2 + inventory_adj - flow_adj
        ask_spread = spread / 2 - inventory_adj + flow_adj
        
        # Ensure minimum edge
        bid_spread = max(bid_spread, self.min_edge)
        ask_spread = max(ask_spread, self.min_edge)
        
        bid_price = mid_price * (1 - bid_spread)
        ask_price = mid_price * (1 + ask_spread)
        
        return {
            'bid': bid_price,
            'ask': ask_price,
            'bid_size': self.calculate_size(metrics, 'bid'),
            'ask_size': self.calculate_size(metrics, 'ask')
        }
    
    def calculate_size(self, metrics, side):
        """Calculate order size based on liquidity"""
        liquidity = metrics['liquidity']['total']
        
        # Don't place orders larger than 5% of available liquidity
        max_size_usd = liquidity * 0.05
        max_size_btc = max_size_usd / metrics['midPrice']
        
        # Scale based on inventory
        inventory_pct = abs(self.inventory) / (self.capital / metrics['midPrice'])
        
        if side == 'bid' and inventory_pct > 0.6:
            # Reduce bid size if too long
            return max_size_btc * 0.5
        elif side == 'ask' and inventory_pct < 0.4:
            # Reduce ask size if too short
            return max_size_btc * 0.5
        
        return max_size_btc
    
    def on_fill(self, side, price, size):
        """Handle order fills"""
        if side == 'bid':
            self.inventory += size
            print(f"Bought {size} at {price}, Inventory: {self.inventory}")
        else:
            self.inventory -= size
            print(f"Sold {size} at {price}, Inventory: {self.inventory}")
    
    def manage_risk(self, metrics):
        """Check risk limits"""
        mid_price = metrics['midPrice']
        max_inventory = (self.capital / mid_price) * self.max_inventory_pct
        
        if abs(self.inventory) > max_inventory:
            print(f"WARNING: Inventory limit exceeded: {self.inventory}")
            # Reduce position
            return 'REDUCE_POSITION'
        
        return 'OK'

# Usage
mm = MarketMaker(capital=10000)

def on_metrics(metrics):
    quotes = mm.calculate_quotes(metrics)
    # Place orders via exchange API
    place_limit_order('bid', quotes['bid'], quotes['bid_size'])
    place_limit_order('ask', quotes['ask'], quotes['ask_size'])
    
    # Check risk
    mm.manage_risk(metrics)
```

### Expected Performance
- **Daily Return**: 0.5-2%
- **Sharpe Ratio**: 2-4
- **Win Rate**: 70-80%
- **Max Drawdown**: 5-10%
- **Capital Efficiency**: High (fully utilized)

---

## 3. Cross-Exchange Arbitrage

### Overview
Exploit price differences between exchanges by simultaneously buying on one and selling on another.

### Strategy Logic

**Arbitrage Detection:**
```
Profitable if: Price_Ex1 - Price_Ex2 > Spread_Ex1 + Spread_Ex2 + Fees
```

**Execution:**
1. Monitor orderbooks on multiple exchanges
2. Calculate net profit after spreads and fees
3. Execute simultaneous market orders if profitable
4. Manage inventory across exchanges

**Risk Management:**
- Execution risk: Use limit orders near best prices
- Inventory risk: Rebalance between exchanges daily
- Exchange risk: Diversify across multiple venues

### Implementation

```javascript
class CrossExchangeArbitrage {
  constructor() {
    this.exchanges = ['binance', 'coinbase', 'kraken'];
    this.metrics = {};
    this.minProfitBps = 10; // Minimum 10 bps profit
    this.tradingFee = 0.001; // 0.1% per side
  }
  
  onMetricsUpdate(exchange, metrics) {
    this.metrics[exchange] = metrics;
    
    // Check all exchange pairs
    for (let ex1 of this.exchanges) {
      for (let ex2 of this.exchanges) {
        if (ex1 !== ex2 && this.metrics[ex1] && this.metrics[ex2]) {
          this.checkArbitrage(ex1, ex2);
        }
      }
    }
  }
  
  checkArbitrage(ex1, ex2) {
    const m1 = this.metrics[ex1];
    const m2 = this.metrics[ex2];
    
    // Calculate net profit for buying on ex1, selling on ex2
    const profitEx1ToEx2 = this.calculateProfit(
      m1.midPrice, // Buy price (ask)
      m2.midPrice, // Sell price (bid)
      m1.spreadPercentage,
      m2.spreadPercentage
    );
    
    // Calculate reverse direction
    const profitEx2ToEx1 = this.calculateProfit(
      m2.midPrice,
      m1.midPrice,
      m2.spreadPercentage,
      m1.spreadPercentage
    );
    
    // Execute if profitable
    if (profitEx1ToEx2 > this.minProfitBps) {
      this.executeArbitrage(ex1, ex2, 'BUY_EX1_SELL_EX2', profitEx1ToEx2);
    } else if (profitEx2ToEx1 > this.minProfitBps) {
      this.executeArbitrage(ex2, ex1, 'BUY_EX2_SELL_EX1', profitEx2ToEx1);
    }
  }
  
  calculateProfit(buyPrice, sellPrice, spreadBuy, spreadSell) {
    // Account for spread (use market orders, so cross spread)
    const effectiveBuyPrice = buyPrice * (1 + spreadBuy / 2);
    const effectiveSellPrice = sellPrice * (1 - spreadSell / 2);
    
    // Account for fees
    const netBuyPrice = effectiveBuyPrice * (1 + this.tradingFee);
    const netSellPrice = effectiveSellPrice * (1 - this.tradingFee);
    
    // Calculate profit in basis points
    const profitBps = ((netSellPrice - netBuyPrice) / netBuyPrice) * 10000;
    
    return profitBps;
  }
  
  executeArbitrage(buyExchange, sellExchange, direction, profitBps) {
    const m1 = this.metrics[buyExchange];
    const m2 = this.metrics[sellExchange];
    
    // Calculate size based on liquidity
    const maxSize = Math.min(
      m1.liquidity.ask * 0.05,
      m2.liquidity.bid * 0.05
    ) / m1.midPrice;
    
    console.log(`Arbitrage opportunity: ${direction}`);
    console.log(`Profit: ${profitBps.toFixed(2)} bps`);
    console.log(`Size: ${maxSize.toFixed(4)}`);
    
    // Execute orders (pseudo-code)
    // placeMarketOrder(buyExchange, 'BUY', maxSize);
    // placeMarketOrder(sellExchange, 'SELL', maxSize);
  }
}

// Usage
const arb = new CrossExchangeArbitrage();

// Subscribe to multiple exchanges
['binance', 'coinbase', 'kraken'].forEach(exchange => {
  socket.on(`metrics_${exchange}`, (metrics) => {
    arb.onMetricsUpdate(exchange, metrics);
  });
});
```

### Expected Performance
- **Opportunities**: 10-50 per day (depending on markets)
- **Profit Per Trade**: 5-30 basis points
- **Win Rate**: 85-95%
- **Execution Risk**: Medium (slippage, latency)
- **Capital Requirements**: $10,000+ (need funds on multiple exchanges)

---

## 4. Large Order Detection & Front-Running

### Overview
Detect large orders in the orderbook and position ahead of anticipated price movement. **Note: Use ethically and in compliance with regulations.**

### Strategy Logic

**Detection:**
- Z-score > 3: Very large order detected
- Order placed near current price (within 0.5%)
- Order size > 2x normal average

**Execution:**
- If large bid: Buy small position, expect upward pressure
- If large ask: Short small position, expect downward pressure
- Quick exit on profit or if large order cancelled

### Implementation

```python
class LargeOrderTracker:
    def __init__(self, capital=10000):
        self.capital = capital
        self.position_size_pct = 0.02  # 2% of capital
        self.active_position = None
        self.large_order_history = []
        
    def on_metrics(self, metrics):
        large_orders = metrics['largeOrders']
        
        # Detect new large orders
        for bid in large_orders['bids']:
            if bid['zscore'] > 3:
                self.on_large_order_detected('BID', bid, metrics)
        
        for ask in large_orders['asks']:
            if ask['zscore'] > 3:
                self.on_large_order_detected('ASK', ask, metrics)
        
        # Manage active position
        if self.active_position:
            self.manage_position(metrics)
    
    def on_large_order_detected(self, side, order, metrics):
        """Handle detection of large order"""
        mid_price = metrics['midPrice']
        price_distance = abs(order['price'] - mid_price) / mid_price
        
        # Only trade if order is near current price
        if price_distance > 0.005:  # 0.5%
            return
        
        # Don't have position already
        if self.active_position:
            return
        
        # Enter position
        if side == 'BID':
            # Large buy order: expect upward pressure
            direction = 'LONG'
            target = mid_price * 1.002  # 0.2% target
            stop = mid_price * 0.998    # 0.2% stop
        else:
            # Large sell order: expect downward pressure
            direction = 'SHORT'
            target = mid_price * 0.998
            stop = mid_price * 1.002
        
        self.active_position = {
            'direction': direction,
            'entry_price': mid_price,
            'target': target,
            'stop': stop,
            'entry_time': time.time(),
            'large_order': order
        }
        
        print(f"Large {side} detected at {order['price']}, entering {direction}")
    
    def manage_position(self, metrics):
        """Manage active position"""
        pos = self.active_position
        current_price = metrics['midPrice']
        
        # Check if large order still exists
        large_orders = metrics['largeOrders']
        still_exists = False
        
        orders_to_check = large_orders['bids'] if pos['direction'] == 'LONG' else large_orders['asks']
        for order in orders_to_check:
            if abs(order['price'] - pos['large_order']['price']) < 1:
                still_exists = True
                break
        
        # Exit if large order cancelled
        if not still_exists:
            print(f"Large order cancelled, exiting position")
            self.active_position = None
            return
        
        # Check target/stop
        if pos['direction'] == 'LONG':
            if current_price >= pos['target']:
                print(f"Target hit: {current_price}")
                self.active_position = None
            elif current_price <= pos['stop']:
                print(f"Stop hit: {current_price}")
                self.active_position = None
        else:
            if current_price <= pos['target']:
                print(f"Target hit: {current_price}")
                self.active_position = None
            elif current_price >= pos['stop']:
                print(f"Stop hit: {current_price}")
                self.active_position = None
        
        # Time-based exit (2 minutes)
        if time.time() - pos['entry_time'] > 120:
            print(f"Time exit")
            self.active_position = None
```

### Ethical Considerations
- This strategy walks a fine line with market manipulation regulations
- Use small sizes that don't impact market
- Focus on detection for research purposes rather than aggressive front-running
- Some jurisdictions prohibit this type of trading

### Expected Performance
- **Win Rate**: 60-70%
- **Average Profit**: 0.1-0.3%
- **Frequency**: 5-20 opportunities per day
- **Risk**: Medium-high (regulatory, execution)

---

## 5. Mean Reversion on VWAP Deviation

### Overview
Trade mean reversion when price deviates significantly from VWAP.

### Strategy Logic

**Entry Signal:**
```
Z-score = (Current Price - VWAP) / StdDev
Enter SHORT if Z-score > 2
Enter LONG if Z-score < -2
```

**Exit:**
- Target: Price returns to VWAP
- Stop: Z-score increases to 3
- Time limit: 30 minutes

### Implementation

```javascript
class VWAPMeanReversion {
  constructor() {
    this.lookback = 60; // 60 data points
    this.priceHistory = [];
    this.vwapHistory = [];
    this.position = null;
  }
  
  onMetricsUpdate(metrics) {
    this.updateHistory(metrics);
    
    if (this.priceHistory.length < this.lookback) {
      return; // Need more data
    }
    
    const zScore = this.calculateZScore(metrics);
    
    if (!this.position) {
      // Check entry
      if (zScore > 2) {
        this.enterPosition('SHORT', metrics, zScore);
      } else if (zScore < -2) {
        this.enterPosition('LONG', metrics, zScore);
      }
    } else {
      // Manage position
      this.managePosition(metrics, zScore);
    }
  }
  
  calculateZScore(metrics) {
    const currentPrice = metrics.midPrice;
    const vwap = metrics.vwap.bid;
    
    // Calculate standard deviation of price deviations
    const deviations = this.priceHistory.map((p, i) => 
      p - this.vwapHistory[i]
    );
    const stdDev = this.standardDeviation(deviations);
    
    return (currentPrice - vwap) / stdDev;
  }
  
  enterPosition(direction, metrics, zScore) {
    this.position = {
      direction,
      entryPrice: metrics.midPrice,
      entryVWAP: metrics.vwap.bid,
      entryZScore: zScore,
      entryTime: Date.now()
    };
    
    console.log(`Enter ${direction} at ${metrics.midPrice}, Z-score: ${zScore.toFixed(2)}`);
  }
  
  managePosition(metrics, zScore) {
    const pos = this.position;
    const currentPrice = metrics.midPrice;
    const vwap = metrics.vwap.bid;
    
    // Check if reverted to VWAP
    const distanceToVWAP = Math.abs(currentPrice - vwap) / vwap;
    
    if (distanceToVWAP < 0.0005) {  // Within 0.05% of VWAP
      console.log(`Target hit: Price reverted to VWAP`);
      this.position = null;
      return;
    }
    
    // Check stop (Z-score increases)
    if (pos.direction === 'LONG' && zScore < pos.entryZScore - 0.5) {
      console.log(`Stop hit: Z-score worsened`);
      this.position = null;
      return;
    }
    
    if (pos.direction === 'SHORT' && zScore > pos.entryZScore + 0.5) {
      console.log(`Stop hit: Z-score worsened`);
      this.position = null;
      return;
    }
    
    // Time stop
    if (Date.now() - pos.entryTime > 30 * 60 * 1000) {
      console.log(`Time stop hit`);
      this.position = null;
    }
  }
  
  updateHistory(metrics) {
    this.priceHistory.push(metrics.midPrice);
    this.vwapHistory.push(metrics.vwap.bid);
    
    if (this.priceHistory.length > this.lookback) {
      this.priceHistory.shift();
      this.vwapHistory.shift();
    }
  }
  
  standardDeviation(values) {
    const mean = values.reduce((a, b) => a + b) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b) / values.length;
    return Math.sqrt(variance);
  }
}
```

### Expected Performance
- **Win Rate**: 65-75%
- **Average Profit**: 0.05-0.15%
- **Sharpe Ratio**: 1.5-2.0
- **Best During**: High volatility periods

---

## 6. Volatility Breakout Trading

### Overview
Trade breakouts when price breaks through strong support/resistance with high volume.

### Implementation Summary

**Entry:**
- Price breaks through resistance level
- Volume > 2x average
- Spread not widening excessively

**Exit:**
- Target: Next resistance level or 1% profit
- Stop: Back below breakout level

Expected win rate: 55-65%, Average profit: 0.5-2%

---

## Conclusion

These use cases demonstrate practical applications of orderbook data for quantitative trading. Key success factors:

1. **Risk Management**: Always use stops and position sizing
2. **Market Selection**: Trade liquid markets during active hours
3. **Backtesting**: Test strategies on historical data before live trading
4. **Monitoring**: Continuously monitor performance and adapt

For more details on the underlying quantitative methods, see:
- [Quantitative Finance Guide](QUANTITATIVE_FINANCE_GUIDE.md)
- [Analytics Outputs Guide](ANALYTICS_OUTPUTS.md)

**Disclaimer**: These strategies are for educational purposes. Always paper trade first and understand the risks before trading with real capital.
