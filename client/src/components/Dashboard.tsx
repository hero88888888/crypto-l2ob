import React, { useMemo } from 'react';
import OrderbookVisualizer from './OrderbookVisualizer';
import MetricsPanel from './MetricsPanel';
import DepthChart from './DepthChart';
import HistoricalChart from './HistoricalChart';
import HeatmapChart from './HeatmapChart';
import LargeOrdersTable from './LargeOrdersTable';
import DataVerification from './DataVerification';
import RawDataStream from './RawDataStream';
import DataIntegrity from './DataIntegrity';
import { OrderbookData, Metrics } from '../types';
import { TrendingUp, AlertCircle } from 'lucide-react';

interface DashboardProps {
  orderbookData: OrderbookData | null;
  metrics: Metrics | null;
  historicalMetrics: any[];
  exchange: string;
  symbol: string;
}

const Dashboard: React.FC<DashboardProps> = ({
  orderbookData,
  metrics,
  historicalMetrics,
  exchange,
  symbol
}) => {
  // Create verification data for transparency features
  const verificationData = useMemo(() => {
    const wsUrls: { [key: string]: string } = {
      binance: 'wss://stream.binance.com:9443/ws',
      coinbase: 'wss://ws-feed.exchange.coinbase.com',
      kraken: 'wss://ws.kraken.com',
      bitfinex: 'wss://api-pub.bitfinex.com/ws/2',
      bybit: 'wss://stream.bybit.com/v5/public/spot',
      okx: 'wss://ws.okx.com:8443/ws/v5/public'
    };

    return {
      exchange: exchange,
      symbol: symbol,
      timestamp: orderbookData?.timestamp || Date.now(),
      latency: Math.floor(Math.random() * 30) + 10, // Simulated for now, should be calculated from actual data
      connectionStatus: orderbookData ? 'connected' as const : 'disconnected' as const,
      lastUpdate: Date.now(),
      dataSource: {
        type: 'websocket' as const,
        url: wsUrls[exchange.toLowerCase()] || 'wss://unknown',
        protocol: 'WebSocket L2 Orderbook Stream'
      }
    };
  }, [exchange, symbol, orderbookData]);

  if (!orderbookData || !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">Waiting for orderbook data...</p>
          <p className="text-sm text-gray-500 mt-2">
            Select an exchange and symbol to start
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Data Verification and Raw Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DataVerification 
          verificationData={verificationData}
          orderbook={orderbookData}
        />
        
        <RawDataStream
          exchange={exchange}
          symbol={symbol}
          orderbook={orderbookData}
        />
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-dark-200 rounded-lg p-4 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Exchange</p>
              <p className="text-xl font-bold text-white capitalize">{exchange}</p>
            </div>
            <TrendingUp className="w-6 h-6 text-blue-500" />
          </div>
        </div>
        <div className="bg-dark-200 rounded-lg p-4 border border-gray-800">
          <div>
            <p className="text-gray-400 text-sm">Symbol</p>
            <p className="text-xl font-bold text-white">{symbol}</p>
          </div>
        </div>
        <div className="bg-dark-200 rounded-lg p-4 border border-gray-800">
          <div>
            <p className="text-gray-400 text-sm">Mid Price</p>
            <p className="text-xl font-bold text-white">
              ${metrics.midPrice.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="bg-dark-200 rounded-lg p-4 border border-gray-800">
          <div>
            <p className="text-gray-400 text-sm">Spread</p>
            <p className="text-xl font-bold text-white">
              {metrics.spreadPercentage.toFixed(4)}%
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orderbook Visualizer */}
        <div className="bg-dark-200 rounded-lg p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">Order Book</h2>
          <OrderbookVisualizer 
            orderbook={orderbookData} 
            exchange={exchange}
            symbol={symbol}
          />
        </div>

        {/* Depth Chart */}
        <div className="bg-dark-200 rounded-lg p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">Depth Chart</h2>
          <DepthChart orderbook={orderbookData} />
        </div>
      </div>

      {/* Data Integrity Check */}
      <DataIntegrity orderbook={orderbookData} exchange={exchange} />
      
      {/* Metrics Panel */}
      <MetricsPanel metrics={metrics} />

      {/* Historical Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-200 rounded-lg p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">Historical Metrics</h2>
          <HistoricalChart data={historicalMetrics} />
        </div>

        <div className="bg-dark-200 rounded-lg p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">Liquidity Heatmap</h2>
          <HeatmapChart orderbook={orderbookData} />
        </div>
      </div>

      {/* Large Orders Detection */}
      {metrics.largeOrders && (metrics.largeOrders.bids.length > 0 || metrics.largeOrders.asks.length > 0) && (
        <div className="bg-dark-200 rounded-lg p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">Large Orders Detection</h2>
          <LargeOrdersTable largeOrders={metrics.largeOrders} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
