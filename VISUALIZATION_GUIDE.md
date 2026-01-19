# Visualization Guide

## Overview

This guide covers the visualization capabilities of the Crypto L2 Orderbook Analyzer, including chart types, interpretations, and how to use visual data for trading decisions.

## Available Visualizations

### 1. Live Orderbook Ladder

**Description**: Real-time display of bid and ask orders at each price level.

**Visual Elements:**
- **Left side (Bids)**: Green bars showing buy orders
- **Right side (Asks)**: Red bars showing sell orders
- **Bar width**: Proportional to order size
- **Price levels**: Displayed in the center
- **Best bid/ask**: Highlighted with brighter colors

**How to Read:**
```
Price Level    Bids ←→ Asks
45,265.50      █████ | ████████
45,265.00      ███ | ██████
45,264.50      ██████ | ███
45,264.00 (BID) ████████ | ██
45,263.50      ██████ | (ASK) ████████
45,263.00      ████ | ██████
```

**Interpretation:**
- **Thick bars**: Large orders (potential support/resistance)
- **Asymmetric distribution**: Indicates directional pressure
- **Gaps**: Price levels with no orders
- **Walls**: Unusually large orders that may act as barriers

**Trading Applications:**
- Identify where large buyers/sellers are positioned
- Detect spoofing (large orders that disappear quickly)
- Find optimal limit order placement
- Gauge short-term support/resistance

**Animation Features:**
- Orders flash when added
- Orders fade when removed
- Size changes animate smoothly
- Color intensity reflects order age

---

### 2. Depth Chart (Cumulative)

**Description**: Cumulative visualization of orderbook depth.

**Chart Structure:**
```
Volume
  ↑
  |     /‾‾‾‾‾‾‾‾\___
  |   /              \___
  | /                    ‾‾\___
  |/__________________________|→ Price
      Bids    Mid    Asks
```

**Visual Elements:**
- **X-axis**: Price levels
- **Y-axis**: Cumulative volume (in base currency or USD)
- **Green area**: Cumulative bid volume
- **Red area**: Cumulative ask volume
- **Mid price line**: Vertical line at current mid price

**Key Patterns:**

**1. Steep Slope**
```
  |  /|
  | / |  ← Steep slope = Deep liquidity
  |/  |
```
Interpretation: Strong support/resistance, harder to move price

**2. Gentle Slope**
```
  |‾‾‾\
  |    \  ← Gentle slope = Thin liquidity
  |     \
```
Interpretation: Weak support/resistance, price moves easily

**3. Steps/Walls**
```
  |    ___
  |   |    ← Large order wall
  | __|
```
Interpretation: Single large order at specific price level

**4. Symmetrical Depth**
```
      /‾‾\
     /    \
    /      \
```
Interpretation: Balanced liquidity, neutral market

**5. Asymmetrical Depth**
```
      /‾‾‾‾‾‾\_
     /         \___
    /              ‾‾
```
Interpretation: More liquidity on one side (directional bias)

**Trading Applications:**
- Estimate slippage for market orders
- Identify liquidity imbalances
- Find optimal trade sizes
- Detect potential manipulation (fake walls)

**Interactive Features:**
- Hover to see exact volume at price level
- Zoom to analyze specific price ranges
- Click to place limit orders at that level

---

### 3. Historical Metrics Chart (Time-Series)

**Description**: Time-series visualization of key orderbook metrics.

**Metrics Displayed:**
1. Order Imbalance
2. Market Skew
3. Order Flow
4. Spread Percentage
5. Total Liquidity

**Chart Layout:**
```
Imbalance
 1.0 ┤    ╱╲
 0.5 ┤───╱──╲────
 0.0 ┤──────────╲─
-0.5 ┤           ╲╱
-1.0 ┴─────────────→ Time
```

**Color Coding:**
- **Green**: Positive values (buy pressure)
- **Red**: Negative values (sell pressure)
- **Yellow**: Neutral (near zero)

**Key Patterns:**

**1. Trending Imbalance**
```
 ↑  ╱╱╱╱
    ╱╱╱╱   ← Consistent buying pressure
───╱╱╱╱
```
Action: Consider long position

**2. Mean Reversion**
```
    ╱╲╱╲╱╲
───╱──────╲─  ← Oscillating around zero
  ╱        ╲
```
Action: Fade extremes (contrarian trades)

**3. Divergence**
```
Price:  ╱╱╱╱
Imb: ───────╲╲╲  ← Price up but imbalance down
```
Action: Warning sign, potential reversal

**4. Convergence**
```
Price:  ╱╱╱╱
Imb:    ╱╱╱╱  ← Both trending same direction
```
Action: Strong trend confirmation

**Trading Applications:**
- Identify trend strength
- Spot divergences (reversal signals)
- Time entries/exits
- Backtest strategy performance

**Time Ranges:**
- 1 minute: Ultra short-term (scalping)
- 5 minutes: Short-term (day trading)
- 15 minutes: Medium-term
- 1 hour: Longer-term trends

---

### 4. Liquidity Heatmap

**Description**: 2D visualization of liquidity distribution over time and price.

**Heatmap Structure:**
```
Price
  ↑
  |  [█][█][░][░][░]
  |  [█][█][█][░][░]
  |  [░][█][█][█][░]  ← Liquidity moves up
  |  [░][░][█][█][█]
  └─────────────────→ Time
```

**Color Intensity:**
- **Dark red/blue**: High liquidity
- **Light red/blue**: Medium liquidity
- **White**: Low/no liquidity
- **Red**: Ask side (sell liquidity)
- **Blue**: Bid side (buy liquidity)

**Patterns to Watch:**

**1. Liquidity Migration**
```
Time: t0  t1  t2  t3
      [█][░][░][░]
      [░][█][░][░]  ← Liquidity moving down
      [░][░][█][░]
      [░][░][░][█]
```
Interpretation: Orders being cancelled and replaced lower (bearish)

**2. Liquidity Buildup**
```
Time: t0  t1  t2  t3
      [░][█][█][█]
      [░][█][█][█]  ← Accumulating at level
      [░][█][█][█]
```
Interpretation: Strong support/resistance forming

**3. Liquidity Evaporation**
```
Time: t0  t1  t2  t3
      [█][█][░][░]
      [█][█][░][░]  ← Liquidity disappearing
      [█][█][░][░]
```
Interpretation: Market makers pulling out (potential volatility)

**4. Liquidity Clusters**
```
      [░][█][░]
      [█][█][█]  ← Dense cluster
      [░][█][░]
```
Interpretation: Key price level (likely to bounce or break)

**Trading Applications:**
- Predict price levels where order flow will concentrate
- Identify liquidity traps
- Time entries for limit orders
- Detect stop-loss clusters (potential cascades)

---

### 5. Large Orders Table

**Description**: Real-time table of detected large orders (whale orders).

**Table Columns:**
| Side | Price | Size | Z-Score | Value | Time |
|------|-------|------|---------|-------|------|
| BID | 45,250 | 15.5 BTC | 3.2σ | $701K | 10:35:22 |
| ASK | 45,280 | 12.8 BTC | 2.8σ | $579K | 10:35:18 |
| BID | 45,230 | 18.2 BTC | 3.8σ | $823K | 10:34:55 |

**Color Coding:**
- **Green row**: Large bid (buy order)
- **Red row**: Large ask (sell order)
- **Flashing**: Newly detected order
- **Faded**: Order cancelled or filled

**Interpretation:**

**Z-Score Levels:**
- 2.0-2.5σ: Notable order
- 2.5-3.0σ: Large order
- 3.0-4.0σ: Very large order (whale)
- 4.0+σ: Exceptional order (institution/market maker)

**Order Behavior:**
- **Persistent**: Stays in book → Genuine interest
- **Fleeting**: Appears/disappears quickly → Possible spoofing
- **Filled**: Executed → Real liquidity taken
- **Pulled**: Cancelled before fill → Fake liquidity

**Trading Strategies:**

**1. Follow the Whale**
- Large bid appears → Consider long position
- Large ask appears → Consider short position

**2. Fade the Spoof**
- Order appears and disappears repeatedly → Trade opposite direction

**3. Front the Fill**
- Large order about to fill → Position ahead of anticipated movement

---

## Multi-Exchange Comparison

### Side-by-Side Orderbooks

Compare orderbooks across exchanges in real-time:

```
Binance        Coinbase       Kraken
45,265.50      45,267.20      45,266.80  ← Price differences
Spread: 0.5    Spread: 1.2    Spread: 0.8
Imb: +0.35     Imb: -0.12     Imb: +0.15
```

**Use Cases:**
- Arbitrage detection
- Liquidity comparison
- Best execution venue selection

### Spread Comparison Chart

Time-series comparing spreads across exchanges:

```
Spread (bps)
 20 ┤     Kraken ─────
 15 ┤    ╱
 10 ┤───╱  Binance ─
  5 ┤──────  Coinbase ─
  0 ┴─────────────→ Time
```

**Interpretation:**
- **Lower spread**: Better liquidity, prefer for trading
- **Spread convergence**: Market normalizing
- **Spread divergence**: Market stress or opportunity

---

## Advanced Visualizations

### 1. Order Flow Sankey Diagram

Shows flow of liquidity between price levels:

```
Level 1 ──────➤ Level 2
        \      
         \─────➤ Level 3
         
Orders moving from one level to another
```

**Use**: Understand orderbook dynamics

### 2. 3D Orderbook Surface

3D representation of orderbook depth over time:

```
     Depth
       ↑  ╱╲
       | ╱  ╲
Price ←──────→ Time
```

**Use**: Visualize liquidity evolution

### 3. Imbalance vs Returns Scatter

Scatter plot showing relationship:

```
Returns
  ↑   ·  ·
  |  ·    ·
  | ·      ·  ← Positive correlation
──┼────────→ Imbalance
  |
```

**Use**: Validate predictive power

---

## Interpretation Cheatsheet

### Quick Reference for Common Patterns

**Bullish Signals:**
- ✅ Order imbalance > 0.3
- ✅ Large bids appearing
- ✅ Liquidity building on bid side
- ✅ Spread tightening
- ✅ Asks being consumed

**Bearish Signals:**
- ❌ Order imbalance < -0.3
- ❌ Large asks appearing
- ❌ Liquidity building on ask side
- ❌ Spread widening
- ❌ Bids being cancelled

**Neutral/Balanced:**
- ⚪ Imbalance near 0
- ⚪ Symmetrical depth chart
- ⚪ Stable spread
- ⚪ No large order activity

**Warning Signs:**
- ⚠️ Liquidity evaporating
- ⚠️ Spread widening rapidly
- ⚠️ Large orders flashing in/out (spoofing)
- ⚠️ Divergence between price and imbalance

---

## Customization Options

### Chart Settings

**Time Resolution:**
- 1s: Ultra high-frequency
- 100ms: High-frequency
- 1m: Standard
- 5m: Smoothed

**Depth Levels:**
- Top 10: Quick overview
- Top 50: Detailed view
- Top 100: Full depth

**Color Schemes:**
- Green/Red: Traditional
- Blue/Orange: Colorblind-friendly
- Custom: Define your own

### Export Options

**Image Export:**
- PNG: High resolution
- SVG: Scalable vector
- PDF: Print-ready

**Data Export:**
- CSV: Time-series data
- JSON: Full orderbook snapshots
- Parquet: Compressed columnar

---

## Real-World Examples

### Example 1: Pre-Breakout Setup

**Depth Chart Shows:**
```
  |        ___
  |       |
  |     __|      ← Large resistance
  |   /
  |__/
```

Large ask wall at $45,300. Price approaches, gets rejected twice. On third attempt, wall is pulled → Breakout likely.

**Action**: Place buy order at $45,305 to catch breakout.

### Example 2: Liquidity Trap

**Heatmap Shows:**
```
t0 t1 t2 t3
[█][█][█][░]  ← Liquidity disappears before price reaches
```

Large bid wall that keeps getting pulled as price approaches.

**Action**: Don't rely on this support. Likely market manipulation.

### Example 3: Accumulation Phase

**Imbalance Chart:**
```
 0.5 ┤    ╱‾‾‾‾╲
 0.0 ┤───╱──────╲───
-0.5 ┤             ╲/
```

Price consolidating but imbalance trending positive → Accumulation happening.

**Action**: Position for upside breakout.

---

## Conclusion

Visual analysis of orderbook data provides intuitive insights that complement numerical metrics. Key principles:

1. **Context Matters**: Always consider multiple visualizations together
2. **Time Frames**: Use appropriate time scale for your strategy
3. **Confirmation**: Don't rely on single signal
4. **Practice**: Learn to recognize patterns through experience

For quantitative analysis methods, see:
- [Quantitative Finance Guide](QUANTITATIVE_FINANCE_GUIDE.md)
- [Analytics Outputs Guide](ANALYTICS_OUTPUTS.md)
- [Use Cases Guide](USE_CASES.md)

**Next Steps:**
1. Explore the live visualizations
2. Practice pattern recognition on historical data
3. Develop your own interpretation framework
4. Integrate visual signals into your trading strategy
