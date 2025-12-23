import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, DollarSign, Activity, Layers, ArrowUpDown, ExternalLink } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface ExchangeData {
  exchange: string;
  symbol: string;
  orderbook: any;
  metrics: any;
  connected: boolean;
  lastUpdate: number;
}

interface AggregatedViewProps {
  exchangesData: ExchangeData[];
}

const AggregatedView: React.FC<AggregatedViewProps> = ({ exchangesData }) => {
  // Calculate aggregated metrics
  const aggregatedData = useMemo(() => {
    const activeExchanges = exchangesData.filter(e => e.connected && e.orderbook);
    
    if (activeExchanges.length === 0) {
      return null;
    }

    // Find best bid and ask across all exchanges
    let bestBid = { price: 0, size: 0, exchange: '' };
    let bestAsk = { price: Infinity, size: 0, exchange: '' };
    
    // Aggregate all bids and asks
    const allBids: any[] = [];
    const allAsks: any[] = [];
    
    activeExchanges.forEach(({ exchange, orderbook }) => {
      if (orderbook?.bids?.[0]) {
        const topBid = orderbook.bids[0];
        if (topBid.price > bestBid.price) {
          bestBid = { price: topBid.price, size: topBid.size, exchange };
        }
        orderbook.bids.forEach((bid: any) => {
          allBids.push({ ...bid, exchange });
        });
      }
      
      if (orderbook?.asks?.[0]) {
        const topAsk = orderbook.asks[0];
        if (topAsk.price < bestAsk.price) {
          bestAsk = { price: topAsk.price, size: topAsk.size, exchange };
        }
        orderbook.asks.forEach((ask: any) => {
          allAsks.push({ ...ask, exchange });
        });
      }
    });

    // Sort and group by price level for aggregated orderbook
    const aggregatedBids = new Map<number, { size: number; exchanges: Set<string> }>();
    const aggregatedAsks = new Map<number, { size: number; exchanges: Set<string> }>();
    
    allBids.forEach(bid => {
      const existing = aggregatedBids.get(bid.price) || { size: 0, exchanges: new Set() };
      existing.size += bid.size;
      existing.exchanges.add(bid.exchange);
      aggregatedBids.set(bid.price, existing);
    });
    
    allAsks.forEach(ask => {
      const existing = aggregatedAsks.get(ask.price) || { size: 0, exchanges: new Set() };
      existing.size += ask.size;
      existing.exchanges.add(ask.exchange);
      aggregatedAsks.set(ask.price, existing);
    });

    // Calculate arbitrage opportunity
    const arbitrageOpportunity = bestBid.price > bestAsk.price ? {
      exists: true,
      profit: bestBid.price - bestAsk.price,
      profitPercent: ((bestBid.price - bestAsk.price) / bestAsk.price) * 100,
      buyExchange: bestAsk.exchange,
      sellExchange: bestBid.exchange,
      buyPrice: bestAsk.price,
      sellPrice: bestBid.price
    } : null;

    // Calculate combined metrics
    const totalBidVolume = Array.from(aggregatedBids.values()).reduce((sum, level) => sum + level.size, 0);
    const totalAskVolume = Array.from(aggregatedAsks.values()).reduce((sum, level) => sum + level.size, 0);
    const imbalance = (totalBidVolume - totalAskVolume) / (totalBidVolume + totalAskVolume);
    
    // Price comparison across exchanges
    const priceComparison = activeExchanges.map(({ exchange, orderbook, metrics }) => ({
      exchange,
      bidPrice: orderbook?.bids?.[0]?.price || 0,
      askPrice: orderbook?.asks?.[0]?.price || 0,
      spread: metrics?.spread || 0,
      midPrice: metrics?.midPrice || 0
    }));

    return {
      bestBid,
      bestAsk,
      aggregatedBids: Array.from(aggregatedBids.entries())
        .sort((a, b) => b[0] - a[0])
        .slice(0, 20)
        .map(([price, data]) => ({ price, ...data })),
      aggregatedAsks: Array.from(aggregatedAsks.entries())
        .sort((a, b) => a[0] - b[0])
        .slice(0, 20)
        .map(([price, data]) => ({ price, ...data })),
      arbitrageOpportunity,
      totalBidVolume,
      totalAskVolume,
      imbalance,
      priceComparison,
      activeExchangeCount: activeExchanges.length
    };
  }, [exchangesData]);

  if (!aggregatedData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Layers className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No data available from exchanges</p>
          <p className="text-sm text-gray-500 mt-2">Connect to exchanges to see aggregated data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Active Exchanges</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-white">{aggregatedData.activeExchangeCount}</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Best Bid</span>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-xl font-bold text-green-400">${aggregatedData.bestBid.price.toFixed(2)}</p>
          <p className="text-xs text-gray-500">{aggregatedData.bestBid.exchange}</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Best Ask</span>
            <TrendingUp className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-xl font-bold text-red-400">${aggregatedData.bestAsk.price.toFixed(2)}</p>
          <p className="text-xs text-gray-500">{aggregatedData.bestAsk.exchange}</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Global Spread</span>
            <ArrowUpDown className="w-4 h-4 text-yellow-500" />
          </div>
          <p className="text-xl font-bold text-yellow-400">
            ${(aggregatedData.bestAsk.price - aggregatedData.bestBid.price).toFixed(2)}
          </p>
          <p className="text-xs text-gray-500">
            {((aggregatedData.bestAsk.price - aggregatedData.bestBid.price) / aggregatedData.bestAsk.price * 100).toFixed(3)}%
          </p>
        </div>
      </div>

      {/* Arbitrage Alert */}
      {aggregatedData.arbitrageOpportunity && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-900/20 border border-green-700 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-green-500" />
              <div>
                <h3 className="text-lg font-semibold text-green-400">Arbitrage Opportunity Detected!</h3>
                <p className="text-sm text-gray-300 mt-1">
                  Buy on <span className="font-bold">{aggregatedData.arbitrageOpportunity.buyExchange}</span> at 
                  <span className="text-green-400 font-bold"> ${aggregatedData.arbitrageOpportunity.buyPrice.toFixed(2)}</span>
                  , sell on <span className="font-bold">{aggregatedData.arbitrageOpportunity.sellExchange}</span> at 
                  <span className="text-red-400 font-bold"> ${aggregatedData.arbitrageOpportunity.sellPrice.toFixed(2)}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-400">
                +${aggregatedData.arbitrageOpportunity.profit.toFixed(2)}
              </p>
              <p className="text-sm text-green-500">
                {aggregatedData.arbitrageOpportunity.profitPercent.toFixed(3)}%
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Multi-Exchange Orderbook */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Multi-Exchange Orderbook</h2>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {exchangesData
              .filter(exchange => exchange.connected && exchange.orderbook)
              .map(exchange => {
                const bestBid = exchange.orderbook.bids[0];
                const bestAsk = exchange.orderbook.asks[0];
                const spread = bestAsk && bestBid ? (bestAsk.price - bestBid.price).toFixed(2) : 'N/A';
                
                return (
                  <div key={exchange.exchange} className="bg-gray-900/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white capitalize">{exchange.exchange}</span>
                      <span className="text-xs text-gray-400">Spread: ${spread}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {/* Bids */}
                      <div>
                        <h4 className="text-xs font-medium text-green-400 mb-1">Bids</h4>
                        <div className="space-y-0.5">
                          {exchange.orderbook.bids.slice(0, 5).map((bid: any, i: number) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">${bid.price.toFixed(2)}</span>
                              <div className="flex-1 mx-1">
                                <div 
                                  className="h-2 bg-green-500/30 rounded"
                                  style={{ 
                                    width: `${Math.min((bid.size / exchange.orderbook.bids[0].size) * 100, 100)}%` 
                                  }}
                                />
                              </div>
                              <span className="text-gray-500">{bid.size.toFixed(4)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Asks */}
                      <div>
                        <h4 className="text-xs font-medium text-red-400 mb-1">Asks</h4>
                        <div className="space-y-0.5">
                          {exchange.orderbook.asks.slice(0, 5).map((ask: any, i: number) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">${ask.price.toFixed(2)}</span>
                              <div className="flex-1 mx-1">
                                <div 
                                  className="h-2 bg-red-500/30 rounded"
                                  style={{ 
                                    width: `${Math.min((ask.size / exchange.orderbook.asks[0].size) * 100, 100)}%` 
                                  }}
                                />
                              </div>
                              <span className="text-gray-500">{ask.size.toFixed(4)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-gray-500">Total Bid Volume</span>
                <p className="text-green-400 font-bold">{aggregatedData.totalBidVolume.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-gray-500">Total Ask Volume</span>
                <p className="text-red-400 font-bold">{aggregatedData.totalAskVolume.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-gray-500">Global Imbalance</span>
                <p className={`font-bold ${aggregatedData.imbalance > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {(aggregatedData.imbalance * 100).toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Price Comparison Chart */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Exchange Price Comparison</h2>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={aggregatedData.priceComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="exchange" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" domain={['dataMin - 10', 'dataMax + 10']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#9CA3AF' }}
              />
              <Legend />
              <Bar dataKey="bidPrice" fill="#10B981" name="Bid" />
              <Bar dataKey="askPrice" fill="#EF4444" name="Ask" />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-4 space-y-2">
            {aggregatedData.priceComparison.map((exchange) => (
              <div key={exchange.exchange} className="flex items-center justify-between text-xs p-2 bg-gray-900/50 rounded">
                <span className="text-gray-400 font-medium">{exchange.exchange}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-green-400">Bid: ${exchange.bidPrice.toFixed(2)}</span>
                  <span className="text-red-400">Ask: ${exchange.askPrice.toFixed(2)}</span>
                  <span className="text-yellow-400">Spread: ${exchange.spread.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Exchange Status Grid */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">Exchange Status</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {exchangesData.map((exchange) => (
            <div 
              key={exchange.exchange}
              className={`p-3 rounded-lg border ${
                exchange.connected 
                  ? 'bg-green-900/20 border-green-700' 
                  : 'bg-gray-900/50 border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white capitalize">{exchange.exchange}</span>
                <div className={`w-2 h-2 rounded-full ${
                  exchange.connected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                }`} />
              </div>
              
              {exchange.connected && exchange.orderbook ? (
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Bid:</span>
                    <span className="text-green-400">
                      ${exchange.orderbook.bids[0]?.price.toFixed(2) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ask:</span>
                    <span className="text-red-400">
                      ${exchange.orderbook.asks[0]?.price.toFixed(2) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Updated:</span>
                    <span className="text-gray-400">
                      {new Date(exchange.lastUpdate).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500">Disconnected</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AggregatedView;
