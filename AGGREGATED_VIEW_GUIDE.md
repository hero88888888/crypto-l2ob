# Aggregated Cross-Exchange View

## 🌐 Overview

The **Aggregated View** tab combines orderbook data from multiple exchanges into a single unified interface, allowing you to:
- Compare prices across all exchanges simultaneously
- Detect arbitrage opportunities automatically
- View combined market depth and liquidity
- Track the best bid/ask globally across all venues

## ✨ Key Features

### 1. **Global Best Prices**
- **Best Bid**: Highest bid price across all exchanges
- **Best Ask**: Lowest ask price across all exchanges
- **Global Spread**: Difference between best bid and ask across different exchanges
- Shows which exchange offers the best price

### 2. **Arbitrage Detection** 🚨
- **Automatic Detection**: Highlights when buy price on one exchange < sell price on another
- **Profit Calculation**: Shows potential profit in both $ and %
- **Exchange Identification**: Clearly shows where to buy and where to sell
- **Real-time Updates**: Opportunities appear/disappear as markets move

### 3. **Aggregated Orderbook**
- **Combined Bids**: All buy orders from all exchanges sorted by price
- **Combined Asks**: All sell orders from all exchanges sorted by price
- **Exchange Count**: Shows how many exchanges have orders at each price level
- **Total Volume**: Combined volume across all exchanges

### 4. **Exchange Price Comparison**
- **Bar Chart**: Visual comparison of bid/ask prices on each exchange
- **Price Table**: Detailed breakdown showing:
  - Bid price per exchange
  - Ask price per exchange
  - Spread per exchange
  - Real-time updates

### 5. **Exchange Status Grid**
- **Connection Status**: Green pulse = connected, Gray = disconnected
- **Current Prices**: Latest bid/ask for each exchange
- **Last Update Time**: When data was last received
- **Visual Health Check**: Instantly see which exchanges are active

## 📊 How to Use

### **Switching to Aggregated View**:
1. Click the **"Aggregated View"** tab at the top
2. System automatically subscribes to BTC pairs on all exchanges:
   - Binance: BTCUSDT
   - Kraken: XBT/USD
   - Coinbase: BTC-USD

### **Understanding the Display**:

#### **Header Cards**:
```
Active Exchanges: 3        (Number of connected exchanges)
Best Bid: $87,850.20       (Highest bid globally) - binance
Best Ask: $87,851.10       (Lowest ask globally) - kraken
Global Spread: $0.90       (Best ask - Best bid)
```

#### **Arbitrage Alert** (When Available):
```
⚠️ Arbitrage Opportunity Detected!
Buy on kraken at $87,850.00
Sell on binance at $87,852.00
Profit: +$2.00 (0.002%)
```

#### **Aggregated Orderbook**:
```
COMBINED BIDS              COMBINED ASKS
$87,850.20 | 0.5432 (2)   $87,851.10 | 0.3421 (3)
$87,850.10 | 0.8765 (1)   $87,851.20 | 0.6543 (2)
           ↑        ↑                ↑        ↑
        Price   Size  #Exchanges
```

## 🎯 Trading Strategies

### **1. Arbitrage Trading**:
- Monitor the arbitrage alert section
- When opportunity appears:
  - Buy on the cheaper exchange
  - Transfer to expensive exchange
  - Sell for profit
- Consider fees and transfer times

### **2. Best Execution**:
- Always trade at the best available price
- Use aggregated view to identify which exchange has best price
- Place orders on the optimal exchange

### **3. Liquidity Analysis**:
- Check combined orderbook depth
- Identify price levels with orders from multiple exchanges (stronger support/resistance)
- Monitor total volume available at each price

### **4. Market Making**:
- Identify price gaps between exchanges
- Place orders to capture spreads
- Monitor all exchanges simultaneously

## 📈 Metrics Explained

### **Active Exchange Count**:
- Shows how many exchanges are currently streaming data
- More exchanges = better price discovery

### **Global Spread**:
- Difference between best bid and best ask across ALL exchanges
- Can be negative (arbitrage opportunity!)
- Smaller spread = more efficient market

### **Imbalance**:
- `(Total Bid Volume - Total Ask Volume) / (Total Bid + Ask Volume)`
- Positive = More buying pressure
- Negative = More selling pressure

### **Exchange Numbers (x)**:
- Shows how many exchanges have orders at that price level
- Higher number = stronger price level

## 🔧 Technical Details

### **Data Aggregation**:
- All exchanges stream data via WebSocket
- Data is normalized to common format
- Updates occur in real-time (< 100ms latency)

### **Symbol Mapping**:
```javascript
Binance: BTCUSDT
Kraken:  XBT/USD  
Coinbase: BTC-USD
```

### **Arbitrage Calculation**:
```
If (Best Bid Price > Best Ask Price):
  Arbitrage Exists = TRUE
  Profit = Best Bid - Best Ask
  Profit % = (Profit / Best Ask) * 100
```

## ⚠️ Important Considerations

### **Arbitrage Limitations**:
- **Fees**: Exchange fees may eat into profits
- **Transfer Time**: Moving funds between exchanges takes time
- **Slippage**: Prices may move before execution
- **Limits**: Exchanges may have withdrawal limits

### **Data Accuracy**:
- Prices are from orderbook, not executed trades
- Network latency affects data freshness
- Each exchange may have different tick sizes

### **Risk Factors**:
- Arbitrage opportunities often disappear quickly
- Large orders may not execute at displayed price
- Exchange outages can affect aggregated data

## 🚀 Quick Start

1. **Open Application**: http://localhost:3000
2. **Click "Aggregated View"** tab
3. **Wait for Data**: All exchanges connect automatically
4. **Monitor Opportunities**: Watch for arbitrage alerts
5. **Compare Prices**: Use bar chart and table for analysis

## 💡 Pro Tips

- **Best Times**: Arbitrage opportunities often appear during:
  - High volatility periods
  - News events
  - Exchange maintenance windows
  
- **Quick Actions**: 
  - Keep accounts funded on multiple exchanges
  - Use limit orders to capture exact prices
  - Monitor the aggregated orderbook for large orders

- **Risk Management**:
  - Start with small amounts
  - Account for all fees
  - Have backup plans for failed transfers

## 📊 Example Scenarios

### **Scenario 1: Simple Arbitrage**
```
Kraken Ask: $87,850.00
Binance Bid: $87,852.00
Profit: $2.00 per BTC
Action: Buy on Kraken, Sell on Binance
```

### **Scenario 2: Best Execution**
```
Your Order: Buy 1 BTC
Binance Ask: $87,853.00
Kraken Ask: $87,851.00  ← Best Price
Coinbase Ask: $87,854.00
Action: Execute on Kraken
```

### **Scenario 3: Liquidity Check**
```
Need to buy 10 BTC
Aggregated Asks at $87,851:
- Binance: 3 BTC
- Kraken: 4 BTC  
- Coinbase: 5 BTC
Total Available: 12 BTC ✓
```

---

The Aggregated View provides a complete cross-exchange market picture, enabling sophisticated trading strategies and ensuring you always get the best prices available in the market.
