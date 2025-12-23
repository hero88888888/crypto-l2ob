"""
Orderbook Analyzer - High-performance metrics calculation for L2 orderbook data
Supports both sync and async operations for maximum flexibility
"""

import numpy as np
import asyncio
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)

class OrderbookAnalyzer:
    """High-performance orderbook analyzer with async support"""
    
    async def calculate_metrics_async(self, orderbook: Dict) -> Dict:
        """Calculate metrics asynchronously for high-throughput scenarios"""
        # Run CPU-intensive calculations in executor to avoid blocking
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.calculate_metrics, orderbook)
    
    def calculate_metrics(self, orderbook: Dict) -> Dict:
        """Calculate comprehensive metrics from orderbook data"""
        try:
            if not orderbook or not orderbook.get('bids') or not orderbook.get('asks'):
                return self._get_empty_metrics()
            
            bids = orderbook['bids']
            asks = orderbook['asks']
            
            if not bids or not asks:
                return self._get_empty_metrics()
            
            metrics = {
                'spread': self._calculate_spread(bids, asks),
                'spreadPercentage': self._calculate_spread_percentage(bids, asks),
                'midPrice': self._calculate_mid_price(bids, asks),
                'imbalance': self._calculate_imbalance(bids, asks),
                'depth': self._calculate_depth(bids, asks),
                'skew': self._calculate_skew(bids, asks),
                'pressure': self._calculate_pressure(bids, asks),
                'vwap': self._calculate_vwap(bids, asks),
                'liquidity': self._calculate_liquidity(bids, asks),
                'orderFlow': self._calculate_order_flow(bids, asks),
                'microstructure': self._calculate_microstructure(bids, asks),
                'largeOrders': self._detect_large_orders(bids, asks),
                'supportResistance': self._find_support_resistance(bids, asks)
            }
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error calculating metrics: {e}")
            return self._get_empty_metrics()
    
    def _get_empty_metrics(self) -> Dict:
        """Return empty metrics structure"""
        return {
            'spread': 0,
            'spreadPercentage': 0,
            'midPrice': 0,
            'imbalance': 0,
            'depth': {'bids': {}, 'asks': {}},
            'skew': 0,
            'pressure': {'buy': 0, 'sell': 0, 'ratio': 0},
            'vwap': {'bid': 0, 'ask': 0, 'spread': 0},
            'liquidity': {'bid': 0, 'ask': 0, 'total': 0, 'ratio': 0},
            'orderFlow': 0,
            'microstructure': {},
            'largeOrders': {'bids': [], 'asks': [], 'threshold': 0},
            'supportResistance': {'support': [], 'resistance': []}
        }
    
    def _calculate_spread(self, bids: List, asks: List) -> float:
        """Calculate bid-ask spread"""
        if not bids or not asks:
            return 0
        return asks[0]['price'] - bids[0]['price']
    
    def _calculate_spread_percentage(self, bids: List, asks: List) -> float:
        """Calculate spread as percentage of mid price"""
        spread = self._calculate_spread(bids, asks)
        mid_price = self._calculate_mid_price(bids, asks)
        return (spread / mid_price * 100) if mid_price > 0 else 0
    
    def _calculate_mid_price(self, bids: List, asks: List) -> float:
        """Calculate mid price"""
        if not bids or not asks:
            return 0
        return (bids[0]['price'] + asks[0]['price']) / 2
    
    def _calculate_imbalance(self, bids: List, asks: List) -> float:
        """Calculate order book imbalance ratio"""
        bid_volume = sum(bid['size'] for bid in bids[:10])
        ask_volume = sum(ask['size'] for ask in asks[:10])
        total_volume = bid_volume + ask_volume
        
        if total_volume == 0:
            return 0
        
        # Returns value between -1 (all sell pressure) and 1 (all buy pressure)
        return (bid_volume - ask_volume) / total_volume
    
    def _calculate_depth(self, bids: List, asks: List) -> Dict:
        """Calculate depth at various percentage levels"""
        depth_levels = [0.1, 0.2, 0.5, 1.0, 2.0]  # Percentage from mid price
        mid_price = self._calculate_mid_price(bids, asks)
        
        depth = {'bids': {}, 'asks': {}}
        
        for level in depth_levels:
            bid_threshold = mid_price * (1 - level / 100)
            ask_threshold = mid_price * (1 + level / 100)
            
            bid_depth = sum(
                bid['size'] * bid['price']
                for bid in bids
                if bid['price'] >= bid_threshold
            )
            
            ask_depth = sum(
                ask['size'] * ask['price']
                for ask in asks
                if ask['price'] <= ask_threshold
            )
            
            depth['bids'][str(level)] = bid_depth
            depth['asks'][str(level)] = ask_depth
        
        return depth
    
    def _calculate_skew(self, bids: List, asks: List) -> float:
        """Calculate weighted average price skew"""
        mid_price = self._calculate_mid_price(bids, asks)
        if mid_price == 0:
            return 0
        
        price_range = mid_price * 0.01  # 1% range
        
        bids_in_range = [bid for bid in bids if bid['price'] >= mid_price - price_range]
        asks_in_range = [ask for ask in asks if ask['price'] <= mid_price + price_range]
        
        bid_weight = sum(bid['size'] for bid in bids_in_range)
        ask_weight = sum(ask['size'] for ask in asks_in_range)
        
        total_weight = bid_weight + ask_weight
        if total_weight == 0:
            return 0
        
        # Positive skew indicates more buying pressure
        return (bid_weight - ask_weight) / total_weight
    
    def _calculate_pressure(self, bids: List, asks: List) -> Dict:
        """Calculate buy and sell pressure"""
        levels = min(20, len(bids), len(asks))
        
        buy_pressure = sum(
            bid['size'] / (i + 1)
            for i, bid in enumerate(bids[:levels])
        )
        
        sell_pressure = sum(
            ask['size'] / (i + 1)
            for i, ask in enumerate(asks[:levels])
        )
        
        total_pressure = buy_pressure + sell_pressure
        
        return {
            'buy': buy_pressure,
            'sell': sell_pressure,
            'ratio': buy_pressure / total_pressure if total_pressure > 0 else 0.5
        }
    
    def _calculate_vwap(self, bids: List, asks: List, depth: int = 10) -> Dict:
        """Calculate Volume Weighted Average Price"""
        bid_levels = bids[:depth]
        ask_levels = asks[:depth]
        
        bid_vwap = self._compute_vwap(bid_levels)
        ask_vwap = self._compute_vwap(ask_levels)
        
        return {
            'bid': bid_vwap,
            'ask': ask_vwap,
            'spread': ask_vwap - bid_vwap if bid_vwap > 0 and ask_vwap > 0 else 0
        }
    
    def _compute_vwap(self, levels: List[Dict]) -> float:
        """Compute VWAP for a list of price levels"""
        if not levels:
            return 0
        
        total_value = sum(level['price'] * level['size'] for level in levels)
        total_volume = sum(level['size'] for level in levels)
        
        return total_value / total_volume if total_volume > 0 else 0
    
    def _calculate_liquidity(self, bids: List, asks: List) -> Dict:
        """Calculate available liquidity"""
        mid_price = self._calculate_mid_price(bids, asks)
        if mid_price == 0:
            return {'bid': 0, 'ask': 0, 'total': 0, 'ratio': 0}
        
        bid_liquidity = sum(
            bid['size'] * bid['price'] * np.exp(-(mid_price - bid['price']) / mid_price * 100)
            for bid in bids
        )
        
        ask_liquidity = sum(
            ask['size'] * ask['price'] * np.exp(-(ask['price'] - mid_price) / mid_price * 100)
            for ask in asks
        )
        
        total_liquidity = bid_liquidity + ask_liquidity
        
        return {
            'bid': bid_liquidity,
            'ask': ask_liquidity,
            'total': total_liquidity,
            'ratio': bid_liquidity / total_liquidity if total_liquidity > 0 else 0.5
        }
    
    def _calculate_order_flow(self, bids: List, asks: List) -> float:
        """Estimate order flow imbalance"""
        top_bids = bids[:5]
        top_asks = asks[:5]
        
        bid_flow = sum(
            bid['size'] / (i + 1)
            for i, bid in enumerate(top_bids)
        )
        
        ask_flow = sum(
            ask['size'] / (i + 1)
            for i, ask in enumerate(top_asks)
        )
        
        total_flow = bid_flow + ask_flow
        
        # Normalized between -1 and 1
        return (bid_flow - ask_flow) / total_flow if total_flow > 0 else 0
    
    def _calculate_microstructure(self, bids: List, asks: List) -> Dict:
        """Calculate microstructure metrics"""
        spread = self._calculate_spread(bids, asks)
        
        # Order size distribution
        all_sizes = [order['size'] for order in bids + asks]
        if not all_sizes:
            return {}
        
        mean_size = np.mean(all_sizes)
        std_size = np.std(all_sizes)
        
        # Price levels concentration
        price_levels = len(set(order['price'] for order in bids + asks))
        
        return {
            'effectiveSpread': spread,
            'realizedSpread': spread * 0.5,  # Simplified estimate
            'priceImpact': self._calculate_price_impact(bids, asks),
            'orderConcentration': price_levels,
            'sizeDistribution': {
                'mean': mean_size,
                'stdDev': std_size,
                'skewness': self._calculate_size_skewness(all_sizes, mean_size, std_size)
            },
            'resilience': self._calculate_resilience(bids, asks)
        }
    
    def _calculate_price_impact(self, bids: List, asks: List, trade_size: float = None) -> Dict:
        """Calculate price impact for buy and sell orders"""
        mid_price = self._calculate_mid_price(bids, asks)
        
        if trade_size is None:
            all_sizes = [order['size'] for order in bids + asks]
            trade_size = np.mean(all_sizes) if all_sizes else 0
        
        if trade_size == 0 or mid_price == 0:
            return {'buy': 0, 'sell': 0, 'average': 0}
        
        # Calculate buy impact
        buy_impact = 0
        remaining_size = trade_size
        for ask in asks:
            if remaining_size <= 0:
                break
            fill_size = min(remaining_size, ask['size'])
            buy_impact += (ask['price'] - mid_price) * fill_size
            remaining_size -= fill_size
        
        # Calculate sell impact
        sell_impact = 0
        remaining_size = trade_size
        for bid in bids:
            if remaining_size <= 0:
                break
            fill_size = min(remaining_size, bid['size'])
            sell_impact += (mid_price - bid['price']) * fill_size
            remaining_size -= fill_size
        
        buy_impact = buy_impact / trade_size if trade_size > 0 else 0
        sell_impact = sell_impact / trade_size if trade_size > 0 else 0
        
        return {
            'buy': buy_impact,
            'sell': sell_impact,
            'average': (buy_impact + sell_impact) / 2
        }
    
    def _calculate_size_skewness(self, sizes: List[float], mean: float, std_dev: float) -> float:
        """Calculate skewness of order sizes"""
        if std_dev == 0 or not sizes:
            return 0
        
        n = len(sizes)
        skewness = sum(((size - mean) / std_dev) ** 3 for size in sizes) / n
        return skewness
    
    def _calculate_resilience(self, bids: List, asks: List) -> Dict:
        """Measure orderbook resilience"""
        depths = [1, 5, 10, 20]
        resilience = {}
        
        for depth in depths:
            bid_volume = sum(bid['size'] for bid in bids[:depth])
            ask_volume = sum(ask['size'] for ask in asks[:depth])
            
            resilience[f'level_{depth}'] = {
                'bid': bid_volume,
                'ask': ask_volume,
                'ratio': bid_volume / ask_volume if ask_volume > 0 else 0
            }
        
        return resilience
    
    def _detect_large_orders(self, bids: List, asks: List) -> Dict:
        """Detect unusually large orders"""
        all_sizes = [order['size'] for order in bids + asks]
        
        if not all_sizes:
            return {'bids': [], 'asks': [], 'threshold': 0}
        
        mean = np.mean(all_sizes)
        std_dev = np.std(all_sizes)
        
        # 2 standard deviations threshold
        threshold = mean + (2 * std_dev)
        
        large_bids = [
            {
                'price': bid['price'],
                'size': bid['size'],
                'zscore': (bid['size'] - mean) / std_dev if std_dev > 0 else 0
            }
            for bid in bids
            if bid['size'] > threshold
        ]
        
        large_asks = [
            {
                'price': ask['price'],
                'size': ask['size'],
                'zscore': (ask['size'] - mean) / std_dev if std_dev > 0 else 0
            }
            for ask in asks
            if ask['size'] > threshold
        ]
        
        return {
            'bids': large_bids[:5],  # Limit to top 5
            'asks': large_asks[:5],
            'threshold': threshold
        }
    
    def _find_support_resistance(self, bids: List, asks: List) -> Dict:
        """Find support and resistance levels"""
        mid_price = self._calculate_mid_price(bids, asks)
        if mid_price == 0:
            return {'support': [], 'resistance': []}
        
        price_range = mid_price * 0.001  # 0.1% price buckets
        
        # Group bids by price range (support levels)
        bid_buckets = {}
        for bid in bids:
            bucket = int(bid['price'] / price_range) * price_range
            bid_buckets[bucket] = bid_buckets.get(bucket, 0) + bid['size']
        
        # Group asks by price range (resistance levels)
        ask_buckets = {}
        for ask in asks:
            bucket = int(ask['price'] / price_range) * price_range
            ask_buckets[bucket] = ask_buckets.get(bucket, 0) + ask['size']
        
        # Sort and get top levels
        support = sorted(bid_buckets.items(), key=lambda x: x[1], reverse=True)[:3]
        resistance = sorted(ask_buckets.items(), key=lambda x: x[1], reverse=True)[:3]
        
        return {
            'support': [
                {'price': price, 'volume': volume, 'strength': volume / bids[0]['size'] if bids else 0}
                for price, volume in support
            ],
            'resistance': [
                {'price': price, 'volume': volume, 'strength': volume / asks[0]['size'] if asks else 0}
                for price, volume in resistance
            ]
        }
