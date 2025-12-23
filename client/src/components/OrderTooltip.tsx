import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Hash, DollarSign, Package, Clock } from 'lucide-react';

interface OrderTooltipProps {
  order: {
    price: number;
    size: number;
    total?: number;
  };
  type: 'bid' | 'ask';
  exchange: string;
  symbol: string;
  position: { x: number; y: number };
  timestamp: number;
  orderIndex: number;
}

const OrderTooltip: React.FC<OrderTooltipProps> = ({
  order,
  type,
  exchange,
  symbol,
  position,
  timestamp,
  orderIndex
}) => {
  const getExchangeOrderUrl = () => {
    // Direct links to exchange orderbooks at specific price levels
    const baseUrls: { [key: string]: string } = {
      binance: `https://www.binance.com/en/trade/${symbol.replace('USDT', '_USDT')}?type=spot`,
      coinbase: `https://pro.coinbase.com/trade/${symbol}`,
      kraken: `https://pro.kraken.com/app/trade/${symbol.replace('/', '-')}`,
    };
    return baseUrls[exchange.toLowerCase()] || '#';
  };

  const getExchangeApiUrl = () => {
    // Links to API documentation for verification
    const apiUrls: { [key: string]: string } = {
      binance: 'https://binance-docs.github.io/apidocs/spot/en/#order-book',
      coinbase: 'https://docs.cloud.coinbase.com/exchange/reference/exchangerestapi_getproductbook',
      kraken: 'https://docs.kraken.com/rest/#tag/Market-Data/operation/getOrderBook',
    };
    return apiUrls[exchange.toLowerCase()] || '#';
  };

  const formatNumber = (num: number, decimals: number = 8) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: decimals
    });
  };

  const total = order.price * order.size;
  const timeSince = Date.now() - timestamp;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -110%)',
        zIndex: 9999,
      }}
      className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-4 min-w-[320px]"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${type === 'bid' ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm font-semibold text-white">
            {type === 'bid' ? 'Buy Order' : 'Sell Order'}
          </span>
          <span className="text-xs text-gray-400">#{orderIndex + 1}</span>
        </div>
        <span className="text-xs text-gray-400 uppercase">{exchange}</span>
      </div>

      {/* Order Details */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 text-gray-400">
            <DollarSign className="w-3 h-3" />
            <span className="text-xs">Price</span>
          </div>
          <span className={`text-sm font-mono ${type === 'bid' ? 'text-green-400' : 'text-red-400'}`}>
            ${formatNumber(order.price)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 text-gray-400">
            <Package className="w-3 h-3" />
            <span className="text-xs">Size</span>
          </div>
          <span className="text-sm font-mono text-gray-300">
            {formatNumber(order.size)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 text-gray-400">
            <Hash className="w-3 h-3" />
            <span className="text-xs">Total Value</span>
          </div>
          <span className="text-sm font-mono text-yellow-400">
            ${formatNumber(total, 2)}
          </span>
        </div>
      </div>

      {/* Data Source Info */}
      <div className="bg-gray-800/50 rounded p-2 mb-3">
        <div className="text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Data Stream</span>
            <span className="text-gray-400">WebSocket L2</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Symbol</span>
            <span className="text-gray-400 font-mono">{symbol}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-gray-500" />
              <span className="text-gray-500">Freshness</span>
            </div>
            <span className={`text-xs ${
              timeSince < 1000 ? 'text-green-400' : 
              timeSince < 5000 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {timeSince < 1000 ? 'Real-time' : `${(timeSince / 1000).toFixed(1)}s ago`}
            </span>
          </div>
        </div>
      </div>

      {/* Verification Links */}
      <div className="flex justify-between text-xs">
        <a
          href={getExchangeOrderUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <span>View on Exchange</span>
          <ExternalLink className="w-3 h-3" />
        </a>
        
        <a
          href={getExchangeApiUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1 text-gray-400 hover:text-gray-300 transition-colors"
        >
          <span>API Docs</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Note about off-chain data */}
      <div className="mt-3 pt-2 border-t border-gray-700">
        <p className="text-xs text-gray-500 italic">
          Note: Orderbook data is off-chain and provided directly by {exchange} via WebSocket. 
          Individual orders are not blockchain transactions until executed.
        </p>
      </div>
    </motion.div>
  );
};

export default OrderTooltip;
