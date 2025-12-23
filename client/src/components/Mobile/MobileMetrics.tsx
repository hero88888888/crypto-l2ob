import React from 'react';
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface MobileMetricsProps {
  metrics: any;
  exchange: string;
  symbol: string;
}

const MobileMetrics: React.FC<MobileMetricsProps> = ({ metrics, exchange, symbol }) => {
  const formatValue = (value: number, decimals: number = 2) => {
    return value?.toFixed(decimals) || '0';
  };

  const formatCurrency = (value: number) => {
    return value?.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }) || '$0.00';
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const getColorClass = (value: number, inverse: boolean = false) => {
    if (inverse) {
      return value > 0 ? 'text-red-400' : 'text-green-400';
    }
    return value > 0 ? 'text-green-400' : 'text-red-400';
  };

  const metricCards = [
    {
      title: 'Mid Price',
      value: formatCurrency(metrics?.midPrice || 0),
      icon: DollarSign,
      color: 'text-blue-400',
      description: 'Average of best bid and ask'
    },
    {
      title: 'Spread',
      value: formatCurrency(metrics?.spread || 0),
      subtitle: formatPercentage(metrics?.spreadPercentage / 100 || 0),
      icon: Activity,
      color: 'text-yellow-400',
      description: 'Difference between bid and ask'
    },
    {
      title: 'Imbalance',
      value: formatPercentage(metrics?.imbalance || 0),
      icon: metrics?.imbalance > 0 ? TrendingUp : TrendingDown,
      color: getColorClass(metrics?.imbalance || 0),
      description: 'Order book pressure'
    },
    {
      title: 'Skew',
      value: formatPercentage(metrics?.skew || 0),
      icon: BarChart,
      color: getColorClass(metrics?.skew || 0),
      description: 'Weighted average price skew'
    },
    {
      title: 'Buy Pressure',
      value: formatValue(metrics?.pressure?.buy || 0, 1),
      subtitle: `${formatPercentage(metrics?.pressure?.ratio || 0.5)}`,
      icon: TrendingUp,
      color: 'text-green-400',
      description: 'Weighted buy orders'
    },
    {
      title: 'Sell Pressure',
      value: formatValue(metrics?.pressure?.sell || 0, 1),
      subtitle: `${formatPercentage(1 - (metrics?.pressure?.ratio || 0.5))}`,
      icon: TrendingDown,
      color: 'text-red-400',
      description: 'Weighted sell orders'
    },
    {
      title: 'Bid Liquidity',
      value: formatValue(metrics?.liquidity?.bid || 0, 0),
      icon: Zap,
      color: 'text-green-400',
      description: 'Available buy liquidity'
    },
    {
      title: 'Ask Liquidity',
      value: formatValue(metrics?.liquidity?.ask || 0, 0),
      icon: Zap,
      color: 'text-red-400',
      description: 'Available sell liquidity'
    }
  ];

  return (
    <div className="h-full overflow-y-auto bg-dark-100 pb-20">
      <div className="p-4">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-white">Market Metrics</h2>
          <p className="text-xs text-gray-400 mt-1">
            {exchange.toUpperCase()} • {symbol} • Real-time Analysis
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {metricCards.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-dark-200 rounded-lg p-3 border border-gray-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-4 h-4 ${metric.color}`} />
                  <span className="text-xs text-gray-500">{metric.title}</span>
                </div>
                <div className={`text-lg font-bold ${metric.color}`}>
                  {metric.value}
                </div>
                {metric.subtitle && (
                  <div className="text-xs text-gray-400 mt-1">
                    {metric.subtitle}
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  {metric.description}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Large Orders Alert */}
        {metrics?.largeOrders && (metrics.largeOrders.bids.length > 0 || metrics.largeOrders.asks.length > 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 bg-orange-900/20 border border-orange-800 rounded-lg p-3"
          >
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-medium text-orange-400">Whale Alert</span>
            </div>
            <div className="space-y-1">
              {metrics.largeOrders.bids.slice(0, 2).map((order: any, i: number) => (
                <div key={`bid-${i}`} className="text-xs text-gray-300">
                  <span className="text-green-400">BUY</span> {order.size.toFixed(4)} @ ${order.price.toFixed(2)}
                </div>
              ))}
              {metrics.largeOrders.asks.slice(0, 2).map((order: any, i: number) => (
                <div key={`ask-${i}`} className="text-xs text-gray-300">
                  <span className="text-red-400">SELL</span> {order.size.toFixed(4)} @ ${order.price.toFixed(2)}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Support & Resistance */}
        {metrics?.supportResistance && (
          <div className="mt-4 bg-dark-200 rounded-lg p-3 border border-gray-800">
            <h3 className="text-sm font-medium text-white mb-2">Key Levels</h3>
            <div className="space-y-2">
              <div>
                <span className="text-xs text-gray-400">Support:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {metrics.supportResistance.support.slice(0, 3).map((level: any, i: number) => (
                    <span key={`sup-${i}`} className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded">
                      ${level.price.toFixed(2)}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-400">Resistance:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {metrics.supportResistance.resistance.slice(0, 3).map((level: any, i: number) => (
                    <span key={`res-${i}`} className="text-xs bg-red-900/30 text-red-400 px-2 py-1 rounded">
                      ${level.price.toFixed(2)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileMetrics;
