import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileOrderbookProps {
  orderbook: any;
  metrics: any;
  compact: boolean;
}

const MobileOrderbook: React.FC<MobileOrderbookProps> = ({ orderbook, metrics, compact }) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Swipe detection
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    // Handle swipe actions if needed
  };

  const formatPrice = (price: number) => {
    return price?.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) || '0.00';
  };

  const formatSize = (size: number) => {
    return size?.toFixed(4) || '0.0000';
  };

  const getMaxSize = () => {
    if (!orderbook) return 1;
    const maxBid = Math.max(...(orderbook.bids?.map((b: any) => b.size) || [0]));
    const maxAsk = Math.max(...(orderbook.asks?.map((a: any) => a.size) || [0]));
    return Math.max(maxBid, maxAsk);
  };

  const maxSize = getMaxSize();
  const visibleLevels = compact ? 8 : 15;

  if (!orderbook) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Waiting for data...</div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col h-full bg-dark-100"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <div className="flex justify-between px-4 py-2 border-b border-gray-800 text-xs font-medium text-gray-400">
        <span>Size</span>
        <span>Price</span>
        <span>Total</span>
      </div>

      {/* Asks (Sells) */}
      <div className="flex-1 overflow-hidden" ref={scrollRef}>
        <div className="flex flex-col-reverse">
          <AnimatePresence>
            {orderbook.asks?.slice(0, visibleLevels).reverse().map((ask: any, index: number) => (
              <motion.div
                key={`ask-${ask.price}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, delay: index * 0.01 }}
                className="flex justify-between items-center px-4 py-1.5 hover:bg-dark-200 transition-colors relative"
              >
                {/* Background bar */}
                <div 
                  className="absolute inset-y-0 left-0 bg-red-900/20"
                  style={{ width: `${(ask.size / maxSize) * 100}%` }}
                />
                
                {/* Content */}
                <div className="relative flex justify-between w-full">
                  <span className="text-xs font-mono text-red-400">
                    {formatSize(ask.size)}
                  </span>
                  <span className="text-xs font-mono font-bold text-white">
                    ${formatPrice(ask.price)}
                  </span>
                  <span className="text-xs font-mono text-gray-500">
                    ${formatPrice(ask.price * ask.size)}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Spread Indicator */}
      <div className="px-4 py-2 bg-dark-200 border-y border-gray-800">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400">Spread</span>
          <span className="font-mono font-bold text-yellow-400">
            ${formatPrice(metrics?.spread || 0)}
          </span>
          <span className="text-gray-400">
            ({metrics?.spreadPercentage?.toFixed(3) || 0}%)
          </span>
        </div>
      </div>

      {/* Bids (Buys) */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence>
          {orderbook.bids?.slice(0, visibleLevels).map((bid: any, index: number) => (
            <motion.div
              key={`bid-${bid.price}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2, delay: index * 0.01 }}
              className="flex justify-between items-center px-4 py-1.5 hover:bg-dark-200 transition-colors relative"
            >
              {/* Background bar */}
              <div 
                className="absolute inset-y-0 left-0 bg-green-900/20"
                style={{ width: `${(bid.size / maxSize) * 100}%` }}
              />
              
              {/* Content */}
              <div className="relative flex justify-between w-full">
                <span className="text-xs font-mono text-green-400">
                  {formatSize(bid.size)}
                </span>
                <span className="text-xs font-mono font-bold text-white">
                  ${formatPrice(bid.price)}
                </span>
                <span className="text-xs font-mono text-gray-500">
                  ${formatPrice(bid.price * bid.size)}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Quick Stats Footer */}
      <div className="px-4 py-2 bg-dark-200 border-t border-gray-800 flex justify-between text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">Imbalance:</span>
          <span className={`font-bold ${metrics?.imbalance > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {((metrics?.imbalance || 0) * 100).toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">Skew:</span>
          <span className={`font-bold ${metrics?.skew > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {((metrics?.skew || 0) * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default MobileOrderbook;
