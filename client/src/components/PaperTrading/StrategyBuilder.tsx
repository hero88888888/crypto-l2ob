import React, { useState } from 'react';
import { Plus, Trash2, Save, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TradingCondition {
  id: string;
  metric: 'skew' | 'imbalance' | 'spread' | 'bidLiquidity' | 'askLiquidity' | 'vwap' | 'orderFlow';
  operator: '>' | '<' | '=' | '>=' | '<=' | '!=';
  value: number;
  combineOperator?: 'AND' | 'OR';
}

export interface TradingStrategy {
  id: string;
  name: string;
  enabled: boolean;
  conditions: TradingCondition[];
  action: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT';
  size: number;
  sizeType: 'FIXED' | 'PERCENTAGE';
  limitOffset?: number; // For limit orders - offset from best bid/ask
  stopLoss?: number; // Percentage
  takeProfit?: number; // Percentage
  maxPositionSize?: number;
  cooldownPeriod?: number; // Seconds between trades
  description?: string;
  createdAt: Date;
}

interface StrategyBuilderProps {
  onSaveStrategy: (strategy: TradingStrategy) => void;
  existingStrategy?: TradingStrategy;
}

const StrategyBuilder: React.FC<StrategyBuilderProps> = ({ onSaveStrategy, existingStrategy }) => {
  const [strategy, setStrategy] = useState<TradingStrategy>(existingStrategy || {
    id: Date.now().toString(),
    name: '',
    enabled: true,
    conditions: [{
      id: Date.now().toString(),
      metric: 'imbalance',
      operator: '>',
      value: 0.3
    }],
    action: 'BUY',
    orderType: 'MARKET',
    size: 0.01,
    sizeType: 'FIXED',
    stopLoss: 2,
    takeProfit: 5,
    cooldownPeriod: 60,
    createdAt: new Date()
  });

  const metricDescriptions: { [key: string]: string } = {
    skew: 'Ratio of bid volume to ask volume',
    imbalance: 'Order imbalance: (bids - asks) / (bids + asks)',
    spread: 'Difference between best ask and best bid',
    bidLiquidity: 'Total bid volume within 1% of best bid',
    askLiquidity: 'Total ask volume within 1% of best ask',
    vwap: 'Volume-weighted average price',
    orderFlow: 'Net order flow (buys - sells)'
  };

  const addCondition = () => {
    setStrategy({
      ...strategy,
      conditions: [
        ...strategy.conditions,
        {
          id: Date.now().toString(),
          metric: 'skew',
          operator: '>',
          value: 0,
          combineOperator: 'AND'
        }
      ]
    });
  };

  const removeCondition = (id: string) => {
    setStrategy({
      ...strategy,
      conditions: strategy.conditions.filter(c => c.id !== id)
    });
  };

  const updateCondition = (id: string, field: keyof TradingCondition, value: any) => {
    setStrategy({
      ...strategy,
      conditions: strategy.conditions.map(c => 
        c.id === id ? { ...c, [field]: value } : c
      )
    });
  };

  const handleSave = () => {
    if (!strategy.name) {
      alert('Please enter a strategy name');
      return;
    }
    
    if (strategy.conditions.length === 0) {
      alert('Please add at least one condition');
      return;
    }
    
    onSaveStrategy(strategy);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Strategy Builder</h2>
        <button
          onClick={handleSave}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save Strategy</span>
        </button>
      </div>

      <div className="space-y-6">
        {/* Strategy Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Strategy Name</label>
          <input
            type="text"
            value={strategy.name}
            onChange={(e) => setStrategy({ ...strategy, name: e.target.value })}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            placeholder="e.g., Momentum Buy on High Imbalance"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
          <textarea
            value={strategy.description || ''}
            onChange={(e) => setStrategy({ ...strategy, description: e.target.value })}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            rows={2}
            placeholder="Describe your strategy..."
          />
        </div>

        {/* Conditions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-300">Conditions</label>
            <button
              onClick={addCondition}
              className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Condition</span>
            </button>
          </div>

          <AnimatePresence>
            {strategy.conditions.map((condition, index) => (
              <motion.div
                key={condition.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-gray-700 rounded-lg p-4 mb-3"
              >
                {index > 0 && (
                  <div className="mb-3">
                    <select
                      value={condition.combineOperator || 'AND'}
                      onChange={(e) => updateCondition(condition.id, 'combineOperator', e.target.value as 'AND' | 'OR')}
                      className="px-3 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                    >
                      <option value="AND">AND</option>
                      <option value="OR">OR</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Metric</label>
                    <select
                      value={condition.metric}
                      onChange={(e) => updateCondition(condition.id, 'metric', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                    >
                      {Object.keys(metricDescriptions).map(metric => (
                        <option key={metric} value={metric}>{metric}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Operator</label>
                    <select
                      value={condition.operator}
                      onChange={(e) => updateCondition(condition.id, 'operator', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                    >
                      <option value=">">{'>'}</option>
                      <option value="<">{'<'}</option>
                      <option value=">=">{'>='}</option>
                      <option value="<=">{'<='}</option>
                      <option value="=">{'='}</option>
                      <option value="!=">{'!='}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Value</label>
                    <input
                      type="number"
                      value={condition.value}
                      onChange={(e) => updateCondition(condition.id, 'value', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                      step="0.01"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => removeCondition(condition.id)}
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-2 flex items-start space-x-1">
                  <Info className="w-3 h-3 text-gray-400 mt-0.5" />
                  <p className="text-xs text-gray-400">
                    {metricDescriptions[condition.metric]}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Action Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Action</label>
            <select
              value={strategy.action}
              onChange={(e) => setStrategy({ ...strategy, action: e.target.value as 'BUY' | 'SELL' })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Order Type</label>
            <select
              value={strategy.orderType}
              onChange={(e) => setStrategy({ ...strategy, orderType: e.target.value as 'MARKET' | 'LIMIT' })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="MARKET">Market Order</option>
              <option value="LIMIT">Limit Order</option>
            </select>
          </div>
        </div>

        {/* Order Size */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Size</label>
            <input
              type="number"
              value={strategy.size}
              onChange={(e) => setStrategy({ ...strategy, size: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              step="0.001"
              min="0.001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Size Type</label>
            <select
              value={strategy.sizeType}
              onChange={(e) => setStrategy({ ...strategy, sizeType: e.target.value as 'FIXED' | 'PERCENTAGE' })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="FIXED">Fixed Amount (BTC)</option>
              <option value="PERCENTAGE">% of Balance</option>
            </select>
          </div>
        </div>

        {/* Risk Management */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Stop Loss (%)</label>
            <input
              type="number"
              value={strategy.stopLoss || ''}
              onChange={(e) => setStrategy({ ...strategy, stopLoss: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              step="0.1"
              placeholder="e.g., 2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Take Profit (%)</label>
            <input
              type="number"
              value={strategy.takeProfit || ''}
              onChange={(e) => setStrategy({ ...strategy, takeProfit: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              step="0.1"
              placeholder="e.g., 5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Cooldown (sec)</label>
            <input
              type="number"
              value={strategy.cooldownPeriod || ''}
              onChange={(e) => setStrategy({ ...strategy, cooldownPeriod: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              step="1"
              placeholder="e.g., 60"
            />
          </div>
        </div>

        {/* Limit Order Settings */}
        {strategy.orderType === 'LIMIT' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Limit Offset ($)
            </label>
            <input
              type="number"
              value={strategy.limitOffset || ''}
              onChange={(e) => setStrategy({ ...strategy, limitOffset: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              step="0.1"
              placeholder="Offset from best bid/ask (e.g., 1.0)"
            />
            <p className="text-xs text-gray-400 mt-1">
              For BUY: Place limit at (Best Bid - Offset). For SELL: Place limit at (Best Ask + Offset)
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StrategyBuilder;
