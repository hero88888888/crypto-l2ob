import React from 'react';
import { Metrics } from '../types';
import { TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react';

interface MetricsPanelProps {
  metrics: Metrics;
}

const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics }) => {
  const getImbalanceColor = (imbalance: number) => {
    if (imbalance > 0.2) return 'text-green-400';
    if (imbalance < -0.2) return 'text-red-400';
    return 'text-yellow-400';
  };

  const getPressureIcon = (ratio: number) => {
    if (ratio > 0.6) return <TrendingUp className="w-5 h-5 text-green-400" />;
    if (ratio < 0.4) return <TrendingDown className="w-5 h-5 text-red-400" />;
    return <Activity className="w-5 h-5 text-yellow-400" />;
  };

  return (
    <div className="bg-dark-200 rounded-lg p-6 border border-gray-800">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
        <BarChart3 className="w-5 h-5 mr-2" />
        Market Metrics
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Order Imbalance */}
        <div className="bg-dark-100 rounded p-4">
          <p className="text-xs text-gray-400 mb-1">Order Imbalance</p>
          <p className={`text-xl font-bold ${getImbalanceColor(metrics.imbalance)}`}>
            {(metrics.imbalance * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {metrics.imbalance > 0 ? 'Buy Pressure' : 'Sell Pressure'}
          </p>
        </div>

        {/* Skew */}
        <div className="bg-dark-100 rounded p-4">
          <p className="text-xs text-gray-400 mb-1">Market Skew</p>
          <p className={`text-xl font-bold ${getImbalanceColor(metrics.skew)}`}>
            {(metrics.skew * 100).toFixed(1)}%
          </p>
        </div>

        {/* Pressure Ratio */}
        <div className="bg-dark-100 rounded p-4">
          <p className="text-xs text-gray-400 mb-1">Buy/Sell Pressure</p>
          <div className="flex items-center space-x-2">
            <p className="text-xl font-bold text-white">
              {(metrics.pressure.ratio * 100).toFixed(0)}%
            </p>
            {getPressureIcon(metrics.pressure.ratio)}
          </div>
        </div>

        {/* Order Flow */}
        <div className="bg-dark-100 rounded p-4">
          <p className="text-xs text-gray-400 mb-1">Order Flow</p>
          <p className={`text-xl font-bold ${getImbalanceColor(metrics.orderFlow)}`}>
            {(metrics.orderFlow * 100).toFixed(1)}%
          </p>
        </div>

        {/* VWAP Spread */}
        <div className="bg-dark-100 rounded p-4">
          <p className="text-xs text-gray-400 mb-1">VWAP Spread</p>
          <p className="text-xl font-bold text-white">
            ${metrics.vwap.spread.toFixed(2)}
          </p>
        </div>

        {/* Liquidity Ratio */}
        <div className="bg-dark-100 rounded p-4">
          <p className="text-xs text-gray-400 mb-1">Liquidity Ratio</p>
          <p className="text-xl font-bold text-white">
            {(metrics.liquidity.ratio * 100).toFixed(0)}%
          </p>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-red-500 h-2 rounded-full"
              style={{ width: `${metrics.liquidity.ratio * 100}%` }}
            />
          </div>
        </div>

        {/* Price Impact */}
        <div className="bg-dark-100 rounded p-4">
          <p className="text-xs text-gray-400 mb-1">Price Impact</p>
          <div className="flex justify-between text-xs">
            <span className="text-green-400">
              Buy: ${metrics.microstructure.priceImpact.buy.toFixed(3)}
            </span>
            <span className="text-red-400">
              Sell: ${metrics.microstructure.priceImpact.sell.toFixed(3)}
            </span>
          </div>
        </div>

        {/* Large Orders Count */}
        <div className="bg-dark-100 rounded p-4">
          <p className="text-xs text-gray-400 mb-1">Large Orders</p>
          <div className="flex justify-between">
            <span className="text-green-400 text-lg font-bold">
              {metrics.largeOrders.bids.length}
            </span>
            <span className="text-gray-400">/</span>
            <span className="text-red-400 text-lg font-bold">
              {metrics.largeOrders.asks.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsPanel;
