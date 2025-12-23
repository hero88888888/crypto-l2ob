import React, { useState } from 'react';
import { Bot, Plus, Settings, History, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StrategyBuilder, { TradingStrategy } from './StrategyBuilder';
import PaperTradingEngine from './PaperTradingEngine';
import TradeHistory from './TradeHistory';

interface PaperTradingDashboardProps {
  orderbook: any;
  metrics: any;
  exchange: string;
  symbol: string;
}

const PaperTradingDashboard: React.FC<PaperTradingDashboardProps> = ({
  orderbook,
  metrics,
  exchange,
  symbol
}) => {
  const [activeTab, setActiveTab] = useState<'strategies' | 'trading' | 'history'>('strategies');
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [showStrategyBuilder, setShowStrategyBuilder] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<TradingStrategy | undefined>();

  const handleSaveStrategy = (strategy: TradingStrategy) => {
    if (editingStrategy) {
      // Update existing strategy
      setStrategies(prev => prev.map(s => 
        s.id === strategy.id ? strategy : s
      ));
      setEditingStrategy(undefined);
    } else {
      // Add new strategy
      setStrategies(prev => [...prev, strategy]);
    }
    setShowStrategyBuilder(false);
  };

  const handleEditStrategy = (strategy: TradingStrategy) => {
    setEditingStrategy(strategy);
    setShowStrategyBuilder(true);
  };

  const handleDeleteStrategy = (strategyId: string) => {
    setStrategies(prev => prev.filter(s => s.id !== strategyId));
  };

  const toggleStrategyEnabled = (strategyId: string) => {
    setStrategies(prev => prev.map(s => 
      s.id === strategyId ? { ...s, enabled: !s.enabled } : s
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Bot className="w-8 h-8 text-purple-500" />
            <div>
              <h1 className="text-2xl font-bold text-white">Paper Trading Simulator</h1>
              <p className="text-sm text-gray-400">Test your strategies without risking real money</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-400">Trading Pair</p>
            <p className="text-lg font-semibold text-white">{symbol}</p>
            <p className="text-xs text-gray-500">{exchange}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('strategies')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'strategies'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Strategies ({strategies.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('trading')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'trading'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Live Trading</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'history'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Trade History</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'strategies' && (
          <motion.div
            key="strategies"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Strategy List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Trading Strategies</h2>
                <button
                  onClick={() => {
                    setEditingStrategy(undefined);
                    setShowStrategyBuilder(true);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Strategy</span>
                </button>
              </div>

              {strategies.length === 0 ? (
                <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 text-center">
                  <Bot className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-400 mb-2">No Strategies Yet</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Create your first automated trading strategy to get started
                  </p>
                  <button
                    onClick={() => setShowStrategyBuilder(true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    Create Strategy
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {strategies.map(strategy => (
                    <div
                      key={strategy.id}
                      className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-white">{strategy.name}</h3>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleStrategyEnabled(strategy.id)}
                            className={`px-2 py-1 rounded text-xs ${
                              strategy.enabled
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-600 text-gray-400'
                            }`}
                          >
                            {strategy.enabled ? 'Enabled' : 'Disabled'}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-gray-500">Conditions:</span>
                          <div className="mt-1">
                            {strategy.conditions.map((cond, i) => (
                              <div key={cond.id} className="text-gray-400">
                                {i > 0 && <span className="text-purple-400">{cond.combineOperator} </span>}
                                {cond.metric} {cond.operator} {cond.value}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Action:</span>
                          <span className={`font-medium ${
                            strategy.action === 'BUY' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {strategy.action} {strategy.size} {strategy.sizeType === 'PERCENTAGE' ? '%' : 'BTC'}
                          </span>
                        </div>

                        {(strategy.stopLoss || strategy.takeProfit) && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Risk:</span>
                            <span className="text-gray-400">
                              {strategy.stopLoss && `SL: ${strategy.stopLoss}%`}
                              {strategy.stopLoss && strategy.takeProfit && ' / '}
                              {strategy.takeProfit && `TP: ${strategy.takeProfit}%`}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700">
                        <button
                          onClick={() => handleEditStrategy(strategy)}
                          className="text-blue-400 hover:text-blue-300 text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteStrategy(strategy.id)}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Strategy Builder Modal */}
              {showStrategyBuilder && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                  onClick={() => setShowStrategyBuilder(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <StrategyBuilder
                      onSaveStrategy={handleSaveStrategy}
                      existingStrategy={editingStrategy}
                    />
                    <button
                      onClick={() => setShowStrategyBuilder(false)}
                      className="mt-4 w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'trading' && (
          <motion.div
            key="trading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <PaperTradingEngine
              strategies={strategies}
              orderbook={orderbook}
              metrics={metrics}
              exchange={exchange}
            />
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <TradeHistory />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaperTradingDashboard;
