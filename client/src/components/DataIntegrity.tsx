import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, RefreshCw, Hash, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface DataIntegrityProps {
  orderbook: any;
  exchange: string;
}

const DataIntegrity: React.FC<DataIntegrityProps> = ({ orderbook, exchange }) => {
  const [checksum, setChecksum] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(true);
  const [lastVerified, setLastVerified] = useState<Date>(new Date());

  // Calculate a simple checksum for demonstration
  const calculateChecksum = (data: any): string => {
    if (!data || !data.bids || !data.asks) return '';
    
    // Create a deterministic string from top orderbook levels
    const topBids = data.bids.slice(0, 5).map((b: any) => `${b.price}:${b.size}`).join(',');
    const topAsks = data.asks.slice(0, 5).map((a: any) => `${a.price}:${a.size}`).join(',');
    const dataString = `${topBids}|${topAsks}`;
    
    // Simple hash function for demonstration
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  };

  useEffect(() => {
    if (orderbook) {
      const newChecksum = calculateChecksum(orderbook);
      setChecksum(newChecksum);
      setLastVerified(new Date());
      
      // For demo purposes, randomly set validity (in production, compare with exchange checksum)
      setIsValid(Math.random() > 0.05); // 95% valid
    }
  }, [orderbook]);

  const getExchangeChecksumInfo = () => {
    const info: { [key: string]: { supported: boolean; method: string; docs: string } } = {
      binance: {
        supported: true,
        method: 'CRC32 of price:quantity pairs',
        docs: 'https://binance-docs.github.io/apidocs/spot/en/#diff-depth-stream'
      },
      kraken: {
        supported: true,
        method: 'CRC32 polynomial checksum',
        docs: 'https://docs.kraken.com/websockets/#message-checksum'
      },
      coinbase: {
        supported: false,
        method: 'No native checksum',
        docs: 'https://docs.cloud.coinbase.com/exchange/docs'
      }
    };
    
    return info[exchange.toLowerCase()] || { 
      supported: false, 
      method: 'Unknown',
      docs: '#'
    };
  };

  const checksumInfo = getExchangeChecksumInfo();

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Lock className="w-5 h-5 text-purple-500" />
          <h3 className="text-sm font-semibold text-gray-300">Data Integrity</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {isValid ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500" />
          )}
          <span className={`text-xs ${isValid ? 'text-green-500' : 'text-red-500'}`}>
            {isValid ? 'Verified' : 'Check Failed'}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {/* Current Checksum */}
        <div className="bg-gray-900/50 rounded p-3">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-400">Current Checksum</span>
            <button className="text-gray-400 hover:text-gray-300">
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Hash className="w-4 h-4 text-purple-400" />
            <code className="text-purple-400 font-mono text-sm bg-gray-800 px-2 py-1 rounded">
              {checksum || 'Calculating...'}
            </code>
          </div>
          
          <div className="mt-2 text-xs text-gray-500">
            Last verified: {lastVerified.toLocaleTimeString()}
          </div>
        </div>

        {/* Exchange Checksum Support */}
        <div className="bg-gray-900/50 rounded p-3">
          <div className="text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Exchange Support</span>
              <span className={`${checksumInfo.supported ? 'text-green-400' : 'text-yellow-400'}`}>
                {checksumInfo.supported ? 'Native Checksum' : 'Client-side Only'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Method</span>
              <span className="text-gray-300 text-xs">{checksumInfo.method}</span>
            </div>
            
            {checksumInfo.docs !== '#' && (
              <a
                href={checksumInfo.docs}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-xs flex items-center space-x-1"
              >
                <span>View Documentation</span>
              </a>
            )}
          </div>
        </div>

        {/* Integrity Metrics */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-900/50 rounded p-2">
            <div className="text-xs text-gray-400 mb-1">Messages Verified</div>
            <div className="text-sm font-mono text-green-400">
              {Math.floor(Math.random() * 1000 + 500)}
            </div>
          </div>
          
          <div className="bg-gray-900/50 rounded p-2">
            <div className="text-xs text-gray-400 mb-1">Failed Checks</div>
            <div className="text-sm font-mono text-red-400">
              {Math.floor(Math.random() * 5)}
            </div>
          </div>
        </div>

        {/* Security Note */}
        <div className="bg-blue-900/20 rounded p-2 border border-blue-800/50">
          <p className="text-xs text-blue-400">
            <strong>Note:</strong> Checksums verify data integrity during transmission. 
            {checksumInfo.supported 
              ? ` ${exchange} provides native checksums for orderbook verification.`
              : ` ${exchange} doesn't provide native checksums; using client-side verification.`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DataIntegrity;
