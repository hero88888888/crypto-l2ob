# Quantitative Finance Guide

## Statistical Methods for Orderbook Analysis

This guide covers quantitative techniques and statistical methods applicable to Level 2 orderbook data analysis for cryptocurrency markets.

## Overview

Orderbook data provides rich information about market microstructure that can be analyzed using various quantitative methods. This platform captures real-time orderbook states enabling both real-time analysis and historical backtesting.

## Core Statistical Techniques

### 1. Order Imbalance Analysis

**Mathematical Definition:**
```
Imbalance = (BidVolume - AskVolume) / (BidVolume + AskVolume)
```

**Statistical Properties:**
- Range: [-1, 1] where -1 = pure sell pressure, +1 = pure buy pressure
- Time-series analysis reveals mean-reversion properties
- Can be used as a predictive feature in ML models

**Quantitative Applications:**
- **Predictive Power**: Studies show orderbook imbalance has predictive power for price movements in 1-30 minute horizons
- **Trading Signal**: Extreme imbalances (|imbalance| > 0.5) often precede price movements
- **Statistical Arbitrage**: Pairs trading based on divergence in cross-exchange imbalances

**Implementation Example:**
```python
import numpy as np

def calculate_predictive_signal(imbalance_history, threshold=0.3):
    """
    Generate trading signal based on imbalance history
    Returns: 1 (buy), -1 (sell), 0 (neutral)
    """
    recent_imbalance = np.mean(imbalance_history[-10:])
    
    if recent_imbalance > threshold:
        return 1  # Buy signal
    elif recent_imbalance < -threshold:
        return -1  # Sell signal
    return 0  # Neutral
```

### 2. Volume-Weighted Average Price (VWAP)

**Calculation:**
```
VWAP = Σ(Price_i × Volume_i) / Σ(Volume_i)
```

**Applications in Quant Finance:**
- **Execution Benchmarking**: Compare execution prices against VWAP to measure performance
- **Mean Reversion**: Price deviations from VWAP often exhibit mean-reversion
- **Algorithmic Execution**: VWAP algorithms aim to match the VWAP over execution period

**Statistical Analysis:**
```python
def vwap_deviation_signal(current_price, vwap, std_dev):
    """
    Calculate Z-score of price deviation from VWAP
    """
    z_score = (current_price - vwap) / std_dev
    
    # Mean reversion strategy
    if z_score > 2:
        return -1  # Expect reversion down
    elif z_score < -2:
        return 1  # Expect reversion up
    return 0
```

### 3. Liquidity Analysis

**Depth-Weighted Liquidity:**
```
Liquidity = Σ(Volume_i × Price_i × exp(-distance_i / mid_price))
```

**Key Metrics:**
- **Bid-Ask Liquidity Ratio**: Measures relative liquidity on each side
- **Cumulative Depth**: Total volume available at various price levels
- **Liquidity Resilience**: Rate at which liquidity replenishes after trades

**Quantitative Insights:**
- Low liquidity → Higher price impact → Higher execution costs
- Liquidity asymmetry can predict price direction
- Sudden liquidity drops often precede volatility spikes

### 4. Spread Analysis

**Effective Spread:**
```
Effective Spread = 2 × |Trade Price - Mid Price|
```

**Statistical Properties:**
- Spread widens during high volatility periods
- Spread is inversely correlated with liquidity
- Can be modeled using time-series methods (GARCH)

## Advanced Quantitative Methods

### Monte Carlo Simulation for Risk Analysis

Monte Carlo methods can simulate potential orderbook states and estimate risk metrics:

**Application: Estimating Price Impact Distribution**

```python
import numpy as np

def monte_carlo_price_impact(orderbook, trade_size, n_simulations=10000):
    """
    Simulate price impact using Monte Carlo method
    
    Parameters:
    - orderbook: Current orderbook state
    - trade_size: Size of order to execute
    - n_simulations: Number of simulations
    
    Returns:
    - Distribution of price impacts
    """
    impacts = []
    
    for _ in range(n_simulations):
        # Simulate orderbook changes
        simulated_book = perturb_orderbook(orderbook)
        
        # Calculate impact
        impact = calculate_execution_impact(simulated_book, trade_size)
        impacts.append(impact)
    
    return {
        'mean': np.mean(impacts),
        'std': np.std(impacts),
        'percentile_95': np.percentile(impacts, 95),
        'VaR_95': np.percentile(impacts, 95)
    }

def perturb_orderbook(orderbook, volatility=0.01):
    """
    Add noise to orderbook to simulate market dynamics
    """
    # Implementation: Add Brownian motion to prices
    # Adjust volumes based on Poisson process
    pass
```

**Use Cases:**
- Estimating worst-case execution costs
- Value-at-Risk (VaR) calculation for large orders
- Stress testing trading strategies

### GARCH Models for Volatility Prediction

GARCH (Generalized Autoregressive Conditional Heteroskedasticity) models can predict volatility using orderbook features:

**Volatility Forecasting Using Orderbook Metrics:**

```python
from arch import arch_model

def forecast_volatility_with_spread(spread_data, returns_data):
    """
    Forecast volatility using GARCH model with spread as exogenous variable
    
    Parameters:
    - spread_data: Time series of bid-ask spreads
    - returns_data: Time series of price returns
    
    Returns:
    - Volatility forecast
    """
    # Fit GARCH(1,1) model with spread as exogenous variable
    model = arch_model(returns_data, 
                       vol='Garch', 
                       p=1, q=1,
                       x=spread_data)
    
    results = model.fit()
    
    # Forecast next period volatility
    forecast = results.forecast(horizon=1)
    
    return forecast.variance.values[-1, 0]
```

**Quantitative Insights:**
- Wider spreads predict higher future volatility
- Orderbook imbalance can be used as exogenous variable
- Improves volatility forecasts compared to price-only models

### Machine Learning Applications

**Feature Engineering from Orderbook Data:**

```python
def extract_ml_features(orderbook, window_size=10):
    """
    Extract machine learning features from orderbook
    
    Returns feature vector for ML models
    """
    features = {
        # Level 1 features
        'spread': orderbook['spread'],
        'spread_pct': orderbook['spreadPercentage'],
        'mid_price': orderbook['midPrice'],
        
        # Imbalance features
        'imbalance': orderbook['imbalance'],
        'imbalance_ma': moving_average(orderbook['imbalance_history'], window_size),
        'imbalance_std': std_dev(orderbook['imbalance_history'], window_size),
        
        # Liquidity features
        'total_liquidity': orderbook['liquidity']['total'],
        'liquidity_ratio': orderbook['liquidity']['ratio'],
        'bid_depth_01': orderbook['depth']['bids']['0.1'],
        'ask_depth_01': orderbook['depth']['asks']['0.1'],
        
        # Flow features
        'order_flow': orderbook['orderFlow'],
        'pressure_ratio': orderbook['pressure']['ratio'],
        
        # Microstructure
        'price_impact_buy': orderbook['microstructure']['priceImpact']['buy'],
        'price_impact_sell': orderbook['microstructure']['priceImpact']['sell'],
        
        # Derived features
        'bid_ask_ratio': calculate_ratio(orderbook),
        'vwap_distance': orderbook['midPrice'] - orderbook['vwap']['bid'],
        
        # Large order indicators
        'large_bid_count': len(orderbook['largeOrders']['bids']),
        'large_ask_count': len(orderbook['largeOrders']['asks']),
    }
    
    return features
```

**ML Model Applications:**
1. **Price Direction Prediction**: XGBoost/Random Forest using orderbook features
2. **Volatility Prediction**: Neural networks with LSTM layers for time-series
3. **Anomaly Detection**: Isolation Forest for detecting unusual orderbook states
4. **Optimal Execution**: Reinforcement Learning for order placement

### Statistical Arbitrage Strategies

**Pairs Trading with Orderbook Metrics:**

```python
def cointegration_arbitrage_signal(exchange1_data, exchange2_data):
    """
    Generate arbitrage signals based on cointegration analysis
    
    Parameters:
    - exchange1_data: Orderbook metrics from exchange 1
    - exchange2_data: Orderbook metrics from exchange 2
    
    Returns:
    - Trading signal and confidence level
    """
    # Calculate price spread
    spread = exchange1_data['midPrice'] - exchange2_data['midPrice']
    
    # Statistical analysis
    spread_mean = historical_mean(spread)
    spread_std = historical_std(spread)
    z_score = (spread - spread_mean) / spread_std
    
    # Check liquidity and execution feasibility
    min_liquidity = min(
        exchange1_data['liquidity']['total'],
        exchange2_data['liquidity']['total']
    )
    
    # Adjust for transaction costs
    total_spread = (exchange1_data['spread'] + exchange2_data['spread'])
    
    # Generate signal
    if z_score > 2 and min_liquidity > threshold:
        return {
            'signal': 'sell_ex1_buy_ex2',
            'confidence': min(abs(z_score) / 3, 1.0),
            'expected_profit': spread - total_spread - fees
        }
    elif z_score < -2 and min_liquidity > threshold:
        return {
            'signal': 'buy_ex1_sell_ex2',
            'confidence': min(abs(z_score) / 3, 1.0),
            'expected_profit': -spread - total_spread - fees
        }
    
    return {'signal': 'neutral'}
```

## Backtesting Framework

### Performance Metrics

Key metrics for evaluating orderbook-based strategies:

```python
def calculate_performance_metrics(returns, trades):
    """
    Calculate comprehensive performance metrics
    """
    return {
        # Return metrics
        'total_return': np.sum(returns),
        'annualized_return': annualize_return(returns),
        'sharpe_ratio': calculate_sharpe(returns),
        'sortino_ratio': calculate_sortino(returns),
        
        # Risk metrics
        'max_drawdown': calculate_max_drawdown(returns),
        'var_95': np.percentile(returns, 5),
        'cvar_95': np.mean(returns[returns <= np.percentile(returns, 5)]),
        
        # Trading metrics
        'win_rate': len([r for r in returns if r > 0]) / len(returns),
        'profit_factor': sum([r for r in returns if r > 0]) / abs(sum([r for r in returns if r < 0])),
        'avg_trade': np.mean(returns),
        'avg_win': np.mean([r for r in returns if r > 0]),
        'avg_loss': np.mean([r for r in returns if r < 0]),
        
        # Execution metrics
        'avg_slippage': calculate_avg_slippage(trades),
        'fill_rate': calculate_fill_rate(trades),
    }
```

### Walk-Forward Analysis

```python
def walk_forward_optimization(data, strategy, train_window=30, test_window=7):
    """
    Perform walk-forward analysis to avoid overfitting
    
    Parameters:
    - data: Historical orderbook data
    - strategy: Strategy function to optimize
    - train_window: Days for training
    - test_window: Days for testing
    
    Returns:
    - Out-of-sample performance results
    """
    results = []
    
    for i in range(0, len(data) - train_window - test_window, test_window):
        # Training period
        train_data = data[i:i+train_window]
        optimal_params = optimize_strategy(strategy, train_data)
        
        # Testing period
        test_data = data[i+train_window:i+train_window+test_window]
        test_returns = backtest_strategy(strategy, test_data, optimal_params)
        
        results.append({
            'period': i,
            'params': optimal_params,
            'returns': test_returns,
            'sharpe': calculate_sharpe(test_returns)
        })
    
    return results
```

## Risk Management

### Position Sizing Based on Liquidity

```python
def kelly_criterion_with_liquidity(win_rate, avg_win, avg_loss, available_liquidity):
    """
    Calculate optimal position size using Kelly Criterion adjusted for liquidity
    
    Parameters:
    - win_rate: Historical win rate
    - avg_win: Average winning trade return
    - avg_loss: Average losing trade return
    - available_liquidity: Current orderbook liquidity
    
    Returns:
    - Optimal position size
    """
    # Kelly formula
    kelly_fraction = (win_rate * avg_win - (1 - win_rate) * abs(avg_loss)) / avg_win
    
    # Apply half-Kelly for safety
    kelly_fraction *= 0.5
    
    # Limit by liquidity (don't use more than 20% of available liquidity)
    liquidity_limit = available_liquidity * 0.20
    
    # Calculate position size
    position_size = min(
        kelly_fraction * total_capital,
        liquidity_limit
    )
    
    return max(position_size, 0)
```

### Dynamic Stop-Loss Based on Support Levels

```python
def dynamic_stop_loss(entry_price, support_levels, volatility):
    """
    Calculate dynamic stop-loss based on orderbook support levels
    
    Parameters:
    - entry_price: Entry price of position
    - support_levels: Support levels from orderbook
    - volatility: Current market volatility
    
    Returns:
    - Stop-loss price
    """
    # Find nearest support level below entry
    relevant_supports = [s['price'] for s in support_levels if s['price'] < entry_price]
    
    if not relevant_supports:
        # Use volatility-based stop if no support
        return entry_price * (1 - 2 * volatility)
    
    # Use strongest nearby support
    nearest_support = max(relevant_supports)
    
    # Place stop slightly below support with volatility buffer
    stop_loss = nearest_support * (1 - volatility)
    
    return stop_loss
```

## Conclusion

This guide provides a foundation for applying quantitative finance techniques to orderbook analysis. The combination of real-time data capture, statistical analysis, and machine learning creates powerful tools for:

- Alpha generation through orderbook signals
- Risk management and execution optimization
- Market microstructure research
- Automated trading strategy development

For practical implementation examples, see:
- [Use Cases Guide](USE_CASES.md) - Step-by-step strategy implementations
- [Analytics Outputs Guide](ANALYTICS_OUTPUTS.md) - Detailed metric calculations
- [Visualization Guide](VISUALIZATION_GUIDE.md) - Data visualization techniques

## Further Reading

**Academic Papers:**
- Cont, R., Kukanov, A., & Stoikov, S. (2014). "The Price Impact of Order Book Events"
- Cartea, Á., Jaimungal, S., & Penalva, J. (2015). "Algorithmic and High-Frequency Trading"
- Hautsch, N. (2012). "Econometrics of Financial High-Frequency Data"

**Books:**
- "Algorithmic Trading and DMA" by Barry Johnson
- "High-Frequency Trading" by Irene Aldridge
- "Quantitative Trading" by Ernest Chan

**Online Resources:**
- QuantStart: https://www.quantstart.com/
- QuantConnect: https://www.quantconnect.com/
- Quantitative Finance Stack Exchange: https://quant.stackexchange.com/
