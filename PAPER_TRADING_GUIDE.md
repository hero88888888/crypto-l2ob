# 📈 Paper Trading Simulator Guide

## Overview

The Paper Trading Simulator allows you to test trading strategies with simulated money using real-time orderbook data. You can create custom strategies based on market metrics and track performance without risking real capital.

## 🎯 Key Features

### 1. **Strategy Builder**
Create automated trading strategies with:
- **Conditional Logic**: Combine multiple conditions with AND/OR operators
- **Metrics-Based Triggers**: Use skew, imbalance, spread, liquidity, VWAP, order flow
- **Flexible Actions**: Market or limit orders, fixed or percentage-based sizing
- **Risk Management**: Automatic stop-loss and take-profit levels
- **Cooldown Periods**: Prevent overtrading with time-based restrictions

### 2. **Live Trading Engine**
- **Real-time Execution**: Strategies execute against live orderbook data
- **Position Tracking**: Monitor open positions with live P&L
- **Automatic Risk Management**: Stop-loss and take-profit orders execute automatically
- **Performance Metrics**: Track win rate, profit factor, drawdown, and more
- **Trade Log**: Real-time log of all trading activity

### 3. **Trade History & Analytics**
- **Performance Charts**: Visualize balance and P&L over time
- **Strategy Comparison**: See which strategies perform best
- **Trade History**: Complete record of all executed trades
- **Export Capability**: Download trade history as CSV for analysis

## 📋 How to Use Paper Trading

### Step 1: Access Paper Trading
1. Click the **"Paper Trading"** tab in the navigation
2. You'll see three sub-tabs: Strategies, Live Trading, Trade History

### Step 2: Create a Strategy

#### Example Strategy: "Buy on High Imbalance"
```
Conditions:
- Imbalance > 0.3 AND
- Skew > 1.2

Action: BUY
Size: 0.01 BTC (or 1% of balance)
Order Type: Market
Stop Loss: 2%
Take Profit: 5%
Cooldown: 60 seconds
```

#### Available Metrics:
- **Skew**: Bid volume / Ask volume ratio
- **Imbalance**: (Bid volume - Ask volume) / Total volume
- **Spread**: Best ask - Best bid
- **Bid/Ask Liquidity**: Volume within 1% of best prices
- **VWAP**: Volume-weighted average price
- **Order Flow**: Net buying vs selling pressure

### Step 3: Configure Strategy Settings

#### Order Types:
- **Market Order**: Execute immediately at best available price
- **Limit Order**: Set specific price with offset from best bid/ask

#### Size Types:
- **Fixed**: Specific amount (e.g., 0.01 BTC)
- **Percentage**: Percentage of available balance

#### Risk Management:
- **Stop Loss**: Automatically close position at X% loss
- **Take Profit**: Automatically close position at X% profit
- **Max Position Size**: Limit total exposure
- **Cooldown Period**: Minimum time between trades

### Step 4: Start Trading
1. Enable your strategies (toggle the enable/disable button)
2. Go to **"Live Trading"** tab
3. Click **"Start Trading"** to begin simulation
4. Monitor real-time performance and positions

### Step 5: Analyze Results
- **Balance**: Current simulated balance
- **Total P&L**: Overall profit/loss
- **Win Rate**: Percentage of profitable trades
- **Profit Factor**: Ratio of total wins to total losses
- **Max Drawdown**: Largest peak-to-trough decline
- **Open Positions**: Current active trades with live P&L

## 🎲 Example Trading Strategies

### 1. **Momentum Trading**
```yaml
Name: "Momentum Long"
Conditions:
  - Order Flow > 100 AND
  - Imbalance > 0.4
Action: BUY
Size: 2% of balance
Stop Loss: 1.5%
Take Profit: 3%
```

### 2. **Mean Reversion**
```yaml
Name: "Oversold Bounce"
Conditions:
  - Imbalance < -0.5 AND
  - Spread > 10
Action: BUY
Type: Limit Order
Offset: $2 below best bid
Size: 0.05 BTC
Stop Loss: 3%
Take Profit: 2%
```

### 3. **Arbitrage Alert**
```yaml
Name: "High Spread Short"
Conditions:
  - Spread > 15 OR
  - Skew < 0.8
Action: SELL
Size: 1% of balance
Stop Loss: 2%
Take Profit: 1%
Cooldown: 30 seconds
```

### 4. **Liquidity Provider**
```yaml
Name: "Liquidity Imbalance"
Conditions:
  - BidLiquidity < 100 AND
  - AskLiquidity > 500
Action: BUY
Type: Limit Order
Offset: $5 below best bid
Size: 0.1 BTC
```

## 📊 Performance Metrics Explained

### **Win Rate**
- Percentage of trades that are profitable
- Good strategies typically achieve 40-60% win rate
- Higher isn't always better if losses are larger than wins

### **Profit Factor**
- Total profits ÷ Total losses
- Values > 1.0 indicate profitable strategy
- Target 1.5+ for robust strategies

### **Max Drawdown**
- Largest peak-to-trough decline in balance
- Lower is better (< 20% is good)
- Indicates risk level of strategy

### **Sharpe Ratio** (Coming Soon)
- Risk-adjusted returns
- Higher is better (> 1.0 is good)
- Accounts for volatility of returns

## ⚠️ Important Considerations

### **Paper Trading Limitations**
1. **No Slippage**: Real trades may execute at worse prices
2. **No Fees**: Exchange fees not included in simulation
3. **Perfect Fills**: All orders assumed to fill completely
4. **No Market Impact**: Large orders don't move the market

### **Best Practices**
1. **Test Thoroughly**: Run strategies for extended periods before real trading
2. **Start Small**: Use conservative position sizes initially
3. **Monitor Actively**: Watch for unexpected behavior
4. **Diversify**: Don't rely on a single strategy
5. **Account for Fees**: Mental adjust results by ~0.1% per trade for fees

### **Transitioning to Real Trading**
1. Paper trade for at least 100+ trades
2. Achieve consistent profitability over different market conditions
3. Reduce position sizes by 50% when starting real trading
4. Factor in exchange fees (typically 0.1% per trade)
5. Consider slippage especially during volatile periods

## 🔧 Advanced Features

### **Combining Multiple Strategies**
- Run multiple strategies simultaneously
- Strategies can have opposite signals (hedging)
- Each strategy tracks performance independently

### **Strategy Optimization** (Manual)
1. Track performance of different parameter values
2. Adjust conditions based on results
3. Test in different market conditions
4. Use Trade History export for deeper analysis

### **Risk Management Tips**
- Never risk more than 2% per trade
- Keep total exposure under 10% of balance
- Use stop-losses on every trade
- Set realistic take-profit levels
- Monitor correlation between strategies

## 📝 Quick Reference

### **Metric Ranges** (Typical Values)
```
Skew:        0.5 - 2.0 (1.0 = balanced)
Imbalance:   -1.0 to 1.0 (0 = balanced)
Spread:      $1 - $50 (varies by volatility)
Liquidity:   10 - 1000+ BTC
Order Flow:  -500 to +500 (0 = neutral)
```

### **Strategy Checklist**
- [ ] Clear entry conditions defined
- [ ] Exit strategy (SL/TP) configured
- [ ] Position size appropriate
- [ ] Cooldown period set
- [ ] Tested for at least 50 trades
- [ ] Achieves 1.2+ profit factor
- [ ] Max drawdown < 20%

## 🚀 Getting Started

1. **Beginner**: Start with simple single-condition strategies
2. **Intermediate**: Combine 2-3 conditions with AND logic
3. **Advanced**: Use OR conditions and multiple strategies
4. **Expert**: Optimize parameters and correlation management

---

Remember: Paper trading is for learning and testing. Always start with small positions when transitioning to real trading, and never trade more than you can afford to lose.
