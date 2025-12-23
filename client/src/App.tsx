import React, { useState, useEffect, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import Dashboard from './components/Dashboard';
import ExchangeSelector from './components/ExchangeSelector';
import AggregatedView from './components/AggregatedView';
import PaperTradingDashboard from './components/PaperTrading/PaperTradingDashboard';
import AIInsightsDashboard from './components/AIInsights/AIInsightsDashboard';
import MobileApp from './components/Mobile/MobileApp';
import { OrderbookData, Metrics } from './types';
import { Activity, Layers, BarChart3, Bot, Brain } from 'lucide-react';
import './App.css';
import './styles/mobile.css';

const App: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState('binance');
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [orderbookData, setOrderbookData] = useState<OrderbookData | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [historicalMetrics, setHistoricalMetrics] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'single' | 'aggregated' | 'paper' | 'ai'>('single');
  const [aggregatedExchangesData, setAggregatedExchangesData] = useState<Map<string, any>>(new Map());
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                            window.innerWidth < 768;
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Python equivalent: useEffect -> async def setup() with asyncio.create_task()
  useEffect(() => {
    // Python: socketio.AsyncClient() or socketio.Client()
    const socketInstance = io('http://localhost:3001');
    
    // Python: @sio.event async def connect()
    socketInstance.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
      // Python: await sio.emit('get_exchanges')
      socketInstance.emit('get_exchanges');
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    socketInstance.on('exchanges', (data) => {
      setExchanges(data);
    });

    socketInstance.on('orderbook_update', (data) => {
      // Always update aggregated data
      setAggregatedExchangesData(prev => {
        const newMap = new Map(prev);
        newMap.set(data.exchange, {
          exchange: data.exchange,
          symbol: data.symbol,
          orderbook: data.orderbook,
          metrics: data.metrics,
          connected: true,
          lastUpdate: Date.now()
        });
        return newMap;
      });

      // Update single exchange view if it matches
      if (data.exchange === selectedExchange && data.symbol === selectedSymbol) {
        setOrderbookData(data.orderbook);
        setMetrics(data.metrics);
        
        // Store historical metrics (keep last 100 points)
        setHistoricalMetrics(prev => {
          const newMetric = {
            timestamp: data.timestamp,
            spread: data.metrics.spread,
            imbalance: data.metrics.imbalance,
            skew: data.metrics.skew,
            orderFlow: data.metrics.orderFlow,
            bidLiquidity: data.metrics.liquidity.bid,
            askLiquidity: data.metrics.liquidity.ask
          };
          return [...prev, newMetric].slice(-100);
        });
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [selectedExchange, selectedSymbol]);

  const handleSubscribe = useCallback((exchange: string, symbol: string) => {
    if (socket && connected) {
      // Unsubscribe from previous
      socket.emit('unsubscribe', { 
        exchange: selectedExchange, 
        symbol: selectedSymbol 
      });
      
      // Subscribe to new
      socket.emit('subscribe', { exchange, symbol });
      setSelectedExchange(exchange);
      setSelectedSymbol(symbol);
      
      // Clear data for new subscription
      setOrderbookData(null);
      setMetrics(null);
      setHistoricalMetrics([]);
    }
  }, [socket, connected, selectedExchange, selectedSymbol]);

  // Subscribe to multiple exchanges for aggregated view
  const subscribeToMultipleExchanges = useCallback((symbol: string) => {
    if (socket && connected && exchanges.length > 0) {
      // Clear previous aggregated data
      setAggregatedExchangesData(new Map());
      
      // Subscribe to the same symbol on all available exchanges
      const exchangesToSubscribe = ['binance', 'kraken', 'coinbase'];
      exchangesToSubscribe.forEach(exchange => {
        const exchangeData = exchanges.find(e => e.id === exchange);
        if (exchangeData) {
          // Map symbol format for each exchange
          let mappedSymbol = symbol;
          if (exchange === 'coinbase' && symbol === 'BTCUSDT') {
            mappedSymbol = 'BTC-USD';
          } else if (exchange === 'kraken' && symbol === 'BTCUSDT') {
            mappedSymbol = 'XBT/USD';
          }
          
          socket.emit('subscribe', { exchange, symbol: mappedSymbol });
        }
      });
    }
  }, [socket, connected, exchanges]);

  // Handle tab change
  const handleTabChange = useCallback((tab: 'single' | 'aggregated' | 'paper' | 'ai') => {
    setActiveTab(tab);
    
    if (tab === 'aggregated' && socket && connected) {
      // Unsubscribe from single exchange
      socket.emit('unsubscribe', { 
        exchange: selectedExchange, 
        symbol: selectedSymbol 
      });
      
      // Subscribe to multiple exchanges
      subscribeToMultipleExchanges('BTCUSDT');
    } else if ((tab === 'single' || tab === 'paper' || tab === 'ai') && socket && connected) {
      // Unsubscribe from all aggregated subscriptions
      aggregatedExchangesData.forEach((data) => {
        socket.emit('unsubscribe', { 
          exchange: data.exchange, 
          symbol: data.symbol 
        });
      });
      
      // Resubscribe to single exchange
      handleSubscribe(selectedExchange, selectedSymbol);
    }
  }, [socket, connected, selectedExchange, selectedSymbol, aggregatedExchangesData, subscribeToMultipleExchanges, handleSubscribe]);

  // Render mobile app for mobile devices
  if (isMobile) {
    return (
      <MobileApp
        orderbookData={orderbookData}
        metrics={metrics}
        exchange={selectedExchange}
        symbol={selectedSymbol}
        connected={connected}
        exchanges={exchanges}
        onExchangeSelect={handleSubscribe}
      />
    );
  }

  // Desktop version
  return (
    <div className="min-h-screen bg-dark-100">
      <header className="bg-dark-200 border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="w-8 h-8 text-blue-500" />
              <h1 className="text-2xl font-bold text-white">
                L2 Orderbook Analyzer
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {(activeTab === 'single' || activeTab === 'paper' || activeTab === 'ai') && (
                <ExchangeSelector
                  exchanges={exchanges}
                  selectedExchange={selectedExchange}
                  selectedSymbol={selectedSymbol}
                  onSelect={handleSubscribe}
                />
              )}
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                <span className="text-sm text-gray-400">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-dark-200 border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-1 py-2">
            <button
              onClick={() => handleTabChange('single')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'single'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Single Exchange</span>
            </button>
            
            <button
              onClick={() => handleTabChange('aggregated')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'aggregated'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Aggregated View</span>
            </button>
            
            <button
              onClick={() => handleTabChange('paper')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'paper'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>Paper Trading</span>
            </button>
            
            <button
              onClick={() => handleTabChange('ai')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'ai'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              <Brain className="w-4 h-4" />
              <span>AI Insights</span>
            </button>
            
            {activeTab === 'aggregated' && (
              <div className="ml-4 flex items-center space-x-2 text-sm text-gray-400">
                <span>Tracking:</span>
                <span className="text-white font-medium">
                  {aggregatedExchangesData.size} exchanges
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        {activeTab === 'single' ? (
          <Dashboard
            orderbookData={orderbookData}
            metrics={metrics}
            historicalMetrics={historicalMetrics}
            exchange={selectedExchange}
            symbol={selectedSymbol}
          />
        ) : activeTab === 'aggregated' ? (
          <AggregatedView
            exchangesData={Array.from(aggregatedExchangesData.values())}
          />
        ) : activeTab === 'paper' ? (
          <PaperTradingDashboard
            orderbook={orderbookData}
            metrics={metrics}
            exchange={selectedExchange}
            symbol={selectedSymbol}
          />
        ) : (
          <AIInsightsDashboard
            orderbook={orderbookData}
            metrics={metrics}
            historicalData={historicalMetrics}
          />
        )}
      </main>
    </div>
  );
};

export default App;
