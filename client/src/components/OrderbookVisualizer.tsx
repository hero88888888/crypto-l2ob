import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';
import OrderTooltip from './OrderTooltip';

interface OrderbookVisualizerProps {
  orderbook: any;
  exchange?: string;
  symbol?: string;
}

const OrderbookVisualizer: React.FC<OrderbookVisualizerProps> = ({ 
  orderbook, 
  exchange = 'binance',
  symbol = 'BTCUSDT'
}) => {
  const [hoveredOrder, setHoveredOrder] = useState<{
    order: any;
    type: 'bid' | 'ask';
    position: { x: number; y: number };
    index: number;
  } | null>(null);

  if (!orderbook) return null;

  // Python equivalent: f"{price:,.2f}" or format(price, ',.2f')
  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Python equivalent: f"{size:,.4f}" or format(size, ',.4f')
  const formatSize = (size: number) => {
    return size.toLocaleString('en-US', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  };

  // Python equivalent: max([b['size'] for b in orderbook['bids']] + [a['size'] for a in orderbook['asks']])
  const getMaxSize = (orderbook: any | null) => {
    if (!orderbook) return 1;
    
    // Python: max_bid = max(b.size for b in orderbook.bids) if orderbook.bids else 0
    const maxBid = Math.max(...orderbook.bids.map((b: any) => b.size));
    // Python: max_ask = max(a.size for a in orderbook.asks) if orderbook.asks else 0
    const maxAsk = Math.max(...orderbook.asks.map((a: any) => a.size));
    
    // Python: return max(max_bid, max_ask)
    return Math.max(maxBid, maxAsk);
  };

  const maxSize = getMaxSize(orderbook);

  const handleMouseEnter = (order: any, type: 'bid' | 'ask', index: number, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHoveredOrder({
      order,
      type,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top
      },
      index
    });
  };

  const handleMouseLeave = () => {
    setHoveredOrder(null);
  };

  return (
    <>
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Orderbook</h3>
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400">Hover over orders for details</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Bids */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-green-400">Bids</h4>
            <div className="space-y-1">
              {orderbook.bids.slice(0, 10).map((bid: any, i: number) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-700/50 rounded px-1 transition-colors"
                  onMouseEnter={(e) => handleMouseEnter(bid, 'bid', i, e)}
                  onMouseLeave={handleMouseLeave}
                >
                  <span className="text-xs text-gray-400">${bid.price.toFixed(2)}</span>
                  <div className="flex-1 mx-2 relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(bid.size / maxSize) * 100}%` }}
                      className="h-4 bg-green-500/30 rounded relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-green-500/40 rounded" />
                    </motion.div>
                  </div>
                  <span className="text-xs text-gray-400">{bid.size.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Asks */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-red-400">Asks</h4>
            <div className="space-y-1">
              {orderbook.asks.slice(0, 10).map((ask: any, i: number) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-700/50 rounded px-1 transition-colors"
                  onMouseEnter={(e) => handleMouseEnter(ask, 'ask', i, e)}
                  onMouseLeave={handleMouseLeave}
                >
                  <span className="text-xs text-gray-400">${ask.price.toFixed(2)}</span>
                  <div className="flex-1 mx-2 relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(ask.size / maxSize) * 100}%` }}
                      className="h-4 bg-red-500/30 rounded relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-red-500/40 rounded" />
                    </motion.div>
                  </div>
                  <span className="text-xs text-gray-400">{ask.size.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredOrder && (
          <OrderTooltip
            order={hoveredOrder.order}
            type={hoveredOrder.type}
            exchange={exchange}
            symbol={symbol}
            position={hoveredOrder.position}
            timestamp={orderbook.timestamp || Date.now()}
            orderIndex={hoveredOrder.index}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default OrderbookVisualizer;
