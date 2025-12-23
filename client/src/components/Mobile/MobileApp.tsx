import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, TrendingDown, BarChart3, Brain, Bot, Layers } from 'lucide-react';
import MobileOrderbook from './MobileOrderbook';
import MobileMetrics from './MobileMetrics';
import MobileNavigation from './MobileNavigation';
import MobileAIInsights from './MobileAIInsights';

interface MobileAppProps {
  orderbookData: any;
  metrics: any;
  exchange: string;
  symbol: string;
  connected: boolean;
  exchanges: any[];
  onExchangeSelect: (exchange: string, symbol: string) => void;
}

const MobileApp: React.FC<MobileAppProps> = ({
  orderbookData,
  metrics,
  exchange,
  symbol,
  connected,
  exchanges,
  onExchangeSelect
}) => {
  const [activeView, setActiveView] = useState<'orderbook' | 'metrics' | 'chart' | 'ai'>('orderbook');
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const handleOrientationChange = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    handleOrientationChange();
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Add to home screen prompt for iOS
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    
    if (isIOS && !isStandalone) {
      const showInstallPrompt = !localStorage.getItem('installPromptShown');
      if (showInstallPrompt) {
        setTimeout(() => {
          if (window.confirm('Add L2 Orderbook to your home screen for the best experience. Tap the share button and select "Add to Home Screen"')) {
            localStorage.setItem('installPromptShown', 'true');
          }
        }, 3000);
      }
    }
  }, []);

  const formatPrice = (price: number) => {
    return price?.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) || '0.00';
  };

  const formatPercentage = (value: number) => {
    const formatted = (value * 100).toFixed(2);
    return value >= 0 ? `+${formatted}%` : `${formatted}%`;
  };

  return (
    <div className="flex flex-col h-screen bg-dark-100 text-white">
      {/* Status Bar */}
      <div className="bg-dark-200 px-4 py-2 border-b border-gray-800 safe-area-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className={`w-4 h-4 ${connected ? 'text-green-500' : 'text-red-500'}`} />
            <span className="text-xs font-medium">
              {exchange.toUpperCase()} • {symbol}
            </span>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <span className="text-gray-400">Mid:</span>
            <span className="font-mono font-bold">
              ${formatPrice(metrics?.midPrice)}
            </span>
            <span className={`flex items-center ${metrics?.imbalance > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {metrics?.imbalance > 0 ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {formatPercentage(metrics?.imbalance || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {isLandscape ? (
          // Landscape Layout - Side by side
          <div className="flex h-full">
            <div className="w-1/2 border-r border-gray-800">
              <MobileOrderbook 
                orderbook={orderbookData}
                metrics={metrics}
                compact={true}
              />
            </div>
            <div className="w-1/2">
              <MobileMetrics
                metrics={metrics}
                exchange={exchange}
                symbol={symbol}
              />
            </div>
          </div>
        ) : (
          // Portrait Layout - Swipeable views
          <div className="h-full">
            {activeView === 'orderbook' && (
              <MobileOrderbook 
                orderbook={orderbookData}
                metrics={metrics}
                compact={false}
              />
            )}
            {activeView === 'metrics' && (
              <MobileMetrics
                metrics={metrics}
                exchange={exchange}
                symbol={symbol}
              />
            )}
            {activeView === 'chart' && (
              <div className="p-4 flex items-center justify-center h-full">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">Depth Chart</p>
                  <p className="text-sm text-gray-500 mt-2">Coming Soon</p>
                </div>
              </div>
            )}
            {activeView === 'ai' && (
              <MobileAIInsights
                metrics={metrics}
                orderbook={orderbookData}
              />
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      {!isLandscape && (
        <MobileNavigation
          activeView={activeView}
          onViewChange={setActiveView}
          exchanges={exchanges}
          selectedExchange={exchange}
          selectedSymbol={symbol}
          onExchangeSelect={onExchangeSelect}
        />
      )}

      {/* Pull to Refresh Indicator */}
      {connected && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 pointer-events-none">
          <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full opacity-90">
            Live
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileApp;
