import React, { useState } from 'react';
import { Book, BarChart3, Activity, Brain, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileNavigationProps {
  activeView: string;
  onViewChange: (view: any) => void;
  exchanges: any[];
  selectedExchange: string;
  selectedSymbol: string;
  onExchangeSelect: (exchange: string, symbol: string) => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeView,
  onViewChange,
  exchanges,
  selectedExchange,
  selectedSymbol,
  onExchangeSelect
}) => {
  const [showExchangePicker, setShowExchangePicker] = useState(false);

  const navItems = [
    { id: 'orderbook', label: 'Book', icon: Book },
    { id: 'metrics', label: 'Metrics', icon: Activity },
    { id: 'chart', label: 'Chart', icon: BarChart3 },
    { id: 'ai', label: 'AI', icon: Brain },
  ];

  const handleExchangeSelect = (exchange: string, symbol: string) => {
    onExchangeSelect(exchange, symbol);
    setShowExchangePicker(false);
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className="bg-dark-200 border-t border-gray-800 safe-area-bottom">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                  isActive ? 'text-blue-400' : 'text-gray-500'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute bottom-0 w-12 h-0.5 bg-blue-400"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
          
          {/* Settings/Exchange Picker */}
          <button
            onClick={() => setShowExchangePicker(true)}
            className="flex flex-col items-center justify-center p-2 rounded-lg text-gray-500"
          >
            <Settings className="w-5 h-5 mb-1" />
            <span className="text-xs">Exchange</span>
          </button>
        </div>
      </div>

      {/* Exchange Picker Modal */}
      <AnimatePresence>
        {showExchangePicker && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExchangePicker(false)}
              className="fixed inset-0 bg-black/60 z-40"
            />
            
            {/* Picker Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed bottom-0 left-0 right-0 bg-dark-200 rounded-t-2xl z-50 safe-area-bottom"
            >
              <div className="p-4 border-b border-gray-800">
                <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white">Select Exchange</h3>
              </div>
              
              <div className="max-h-96 overflow-y-auto p-4">
                {exchanges.map((exchange) => (
                  <div key={exchange.id} className="mb-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-2 uppercase">
                      {exchange.name}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {exchange.supportedPairs?.slice(0, 6).map((pair: string) => (
                        <button
                          key={`${exchange.id}-${pair}`}
                          onClick={() => handleExchangeSelect(exchange.id, pair)}
                          className={`p-3 rounded-lg border transition-colors ${
                            selectedExchange === exchange.id && selectedSymbol === pair
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'bg-dark-100 border-gray-700 text-gray-300 hover:border-gray-600'
                          }`}
                        >
                          <span className="text-sm font-mono">{pair}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-4 border-t border-gray-800">
                <button
                  onClick={() => setShowExchangePicker(false)}
                  className="w-full py-3 bg-gray-700 text-white rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileNavigation;
