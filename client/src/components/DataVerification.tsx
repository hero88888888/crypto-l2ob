import React, { useState } from 'react';
import { Shield, ExternalLink, Clock, Activity, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VerificationData {
  exchange: string;
  symbol: string;
  timestamp: number;
  latency: number;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  lastUpdate: number;
  dataSource: {
    type: 'websocket' | 'rest';
    url: string;
    protocol: string;
  };
}

interface DataVerificationProps {
  verificationData: VerificationData;
  orderbook: any;
}

const DataVerification: React.FC<DataVerificationProps> = ({ verificationData, orderbook }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showRawData, setShowRawData] = useState(false);

  const getExchangeUrl = (exchange: string, symbol: string) => {
    const urls: { [key: string]: string } = {
      binance: `https://www.binance.com/en/trade/${symbol.replace('USDT', '_USDT')}`,
      coinbase: `https://pro.coinbase.com/trade/${symbol}`,
      kraken: `https://pro.kraken.com/app/trade/${symbol.replace('/', '-')}`,
      bitfinex: `https://trading.bitfinex.com/t/${symbol.replace('t', '')}`,
      bybit: `https://www.bybit.com/en-US/trade/spot/${symbol}`,
      okx: `https://www.okx.com/trade-spot/${symbol.toLowerCase()}`
    };
    return urls[exchange.toLowerCase()] || '#';
  };

  const getDataFreshness = () => {
    const now = Date.now();
    const diff = now - verificationData.lastUpdate;
    
    if (diff < 100) return { status: 'realtime', color: 'green', text: 'Real-time' };
    if (diff < 1000) return { status: 'fresh', color: 'green', text: `${diff}ms ago` };
    if (diff < 5000) return { status: 'recent', color: 'yellow', text: `${(diff / 1000).toFixed(1)}s ago` };
    return { status: 'stale', color: 'red', text: `${(diff / 1000).toFixed(0)}s ago` };
  };

  const freshness = getDataFreshness();

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Shield className={`w-5 h-5 ${
            verificationData.connectionStatus === 'connected' ? 'text-green-500' : 'text-yellow-500'
          }`} />
          <h3 className="text-sm font-semibold text-gray-300">Data Verification</h3>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full bg-${freshness.color}-500/20`}>
            <Activity className={`w-3 h-3 text-${freshness.color}-500`} />
            <span className={`text-xs text-${freshness.color}-500`}>{freshness.text}</span>
          </div>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {/* Connection Status */}
            <div className="bg-gray-900/50 rounded p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Connection Status</span>
                <div className="flex items-center space-x-1">
                  {verificationData.connectionStatus === 'connected' ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  )}
                  <span className={`${
                    verificationData.connectionStatus === 'connected' ? 'text-green-500' : 'text-yellow-500'
                  }`}>
                    {verificationData.connectionStatus}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Latency</span>
                <span className={`${
                  verificationData.latency < 50 ? 'text-green-400' : 
                  verificationData.latency < 200 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {verificationData.latency}ms
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Protocol</span>
                <span className="text-gray-300">{verificationData.dataSource.protocol}</span>
              </div>
            </div>

            {/* Data Source */}
            <div className="bg-gray-900/50 rounded p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Data Source</span>
                <a
                  href={getExchangeUrl(verificationData.exchange, verificationData.symbol)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300"
                >
                  <span>View on {verificationData.exchange}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">WebSocket URL</span>
                  <code className="text-gray-300 bg-gray-800 px-2 py-0.5 rounded text-xs">
                    {verificationData.dataSource.url}
                  </code>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Stream Type</span>
                  <span className="text-gray-300">L2 Orderbook ({verificationData.dataSource.type})</span>
                </div>
              </div>
            </div>

            {/* Timestamp Verification */}
            <div className="bg-gray-900/50 rounded p-3">
              <div className="flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-400">Exchange Timestamp</span>
                  </div>
                  <span className="text-gray-300 font-mono">
                    {new Date(verificationData.timestamp).toISOString()}
                  </span>
                </div>
              </div>
              
              <div className="mt-2 text-xs">
                <div className="flex items-center space-x-2">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-400">Local Timestamp</span>
                </div>
                <span className="text-gray-300 font-mono">
                  {new Date(verificationData.lastUpdate).toISOString()}
                </span>
              </div>
            </div>

            {/* Raw Data Preview */}
            <div className="bg-gray-900/50 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">Raw Data</span>
                <button
                  onClick={() => setShowRawData(!showRawData)}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  {showRawData ? 'Hide' : 'Show'} Raw JSON
                </button>
              </div>
              
              {showRawData && (
                <pre className="text-xs text-gray-300 bg-gray-800 p-2 rounded overflow-x-auto max-h-48">
                  {JSON.stringify({
                    exchange: verificationData.exchange,
                    symbol: verificationData.symbol,
                    timestamp: verificationData.timestamp,
                    bids: orderbook?.bids?.slice(0, 3),
                    asks: orderbook?.asks?.slice(0, 3),
                    checksum: orderbook?.checksum || 'N/A'
                  }, null, 2)}
                </pre>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DataVerification;
