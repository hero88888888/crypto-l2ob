import React, { useState } from 'react';
import { Download, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

const TradeHistory: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'wins' | 'losses'>('all');

  // Mock data - in production, this would come from PaperTradingEngine
  const mockTrades = [
    {
      id: '1',
      timestamp: new Date('2024-01-01T10:00:00'),
      strategy: 'High Imbalance Buy',
      action: 'BUY',
      price: 87500,
      size: 0.01,
      closePrice: 87750,
      pnl: 2.5,
      pnlPercent: 2.86,
      duration: '15 min',
      closedReason: 'TAKE_PROFIT'
    },
    {
      id: '2',
      timestamp: new Date('2024-01-01T11:00:00'),
      strategy: 'Momentum Short',
      action: 'SELL',
      price: 87800,
      size: 0.01,
      closePrice: 87650,
      pnl: 1.5,
      pnlPercent: 1.71,
      duration: '8 min',
      closedReason: 'TAKE_PROFIT'
    },
    {
      id: '3',
      timestamp: new Date('2024-01-01T12:00:00'),
      strategy: 'High Imbalance Buy',
      action: 'BUY',
      price: 87600,
      size: 0.01,
      closePrice: 87450,
      pnl: -1.5,
      pnlPercent: -1.71,
      duration: '12 min',
      closedReason: 'STOP_LOSS'
    }
  ];

  const performanceData = [
    { date: '12:00', balance: 10000, pnl: 0 },
    { date: '12:15', balance: 10025, pnl: 25 },
    { date: '12:30', balance: 10040, pnl: 40 },
    { date: '12:45', balance: 10025, pnl: 25 },
    { date: '13:00', balance: 10055, pnl: 55 },
    { date: '13:15', balance: 10070, pnl: 70 },
    { date: '13:30', balance: 10085, pnl: 85 },
  ];

  const strategyPerformance = [
    { strategy: 'High Imbalance Buy', wins: 8, losses: 2, pnl: 45 },
    { strategy: 'Momentum Short', wins: 6, losses: 4, pnl: 25 },
    { strategy: 'Mean Reversion', wins: 5, losses: 5, pnl: -5 },
    { strategy: 'Breakout Trade', wins: 7, losses: 3, pnl: 35 }
  ];

  const filteredTrades = mockTrades.filter(trade => {
    if (filter === 'wins') return trade.pnl > 0;
    if (filter === 'losses') return trade.pnl < 0;
    return true;
  });

  const downloadHistory = () => {
    const csvContent = [
      ['Timestamp', 'Strategy', 'Action', 'Price', 'Size', 'Close Price', 'P&L', 'P&L %', 'Duration', 'Reason'].join(','),
      ...filteredTrades.map(trade => [
        trade.timestamp.toISOString(),
        trade.strategy,
        trade.action,
        trade.price,
        trade.size,
        trade.closePrice,
        trade.pnl,
        trade.pnlPercent,
        trade.duration,
        trade.closedReason
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trade_history_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Performance Chart */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">Performance Overview</h2>
        
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={performanceData}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
              labelStyle={{ color: '#9CA3AF' }}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#10B981"
              fill="url(#colorBalance)"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="pnl"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Strategy Performance */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">Strategy Performance</h2>
        
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={strategyPerformance}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="strategy" stroke="#9CA3AF" angle={-45} textAnchor="end" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
              labelStyle={{ color: '#9CA3AF' }}
            />
            <Bar dataKey="wins" fill="#10B981" />
            <Bar dataKey="losses" fill="#EF4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Trade History Table */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Trade History</h2>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded text-sm ${
                  filter === 'all' ? 'bg-gray-600 text-white' : 'text-gray-400'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('wins')}
                className={`px-3 py-1 rounded text-sm ${
                  filter === 'wins' ? 'bg-green-600 text-white' : 'text-gray-400'
                }`}
              >
                Wins
              </button>
              <button
                onClick={() => setFilter('losses')}
                className={`px-3 py-1 rounded text-sm ${
                  filter === 'losses' ? 'bg-red-600 text-white' : 'text-gray-400'
                }`}
              >
                Losses
              </button>
            </div>
            
            <button
              onClick={downloadHistory}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-gray-700">
              <tr>
                <th className="px-4 py-2">Time</th>
                <th className="px-4 py-2">Strategy</th>
                <th className="px-4 py-2">Action</th>
                <th className="px-4 py-2">Entry</th>
                <th className="px-4 py-2">Exit</th>
                <th className="px-4 py-2">Size</th>
                <th className="px-4 py-2">P&L</th>
                <th className="px-4 py-2">Duration</th>
                <th className="px-4 py-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrades.map(trade => (
                <tr key={trade.id} className="border-b border-gray-700">
                  <td className="px-4 py-2">{trade.timestamp.toLocaleTimeString()}</td>
                  <td className="px-4 py-2">{trade.strategy}</td>
                  <td className={`px-4 py-2 ${trade.action === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                    {trade.action}
                  </td>
                  <td className="px-4 py-2">${trade.price.toLocaleString()}</td>
                  <td className="px-4 py-2">${trade.closePrice.toLocaleString()}</td>
                  <td className="px-4 py-2">{trade.size}</td>
                  <td className={`px-4 py-2 ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    <div className="flex items-center space-x-1">
                      {trade.pnl >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>
                        ${Math.abs(trade.pnl).toFixed(2)} ({trade.pnlPercent.toFixed(2)}%)
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2">{trade.duration}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      trade.closedReason === 'TAKE_PROFIT' ? 'bg-green-600/20 text-green-400' :
                      trade.closedReason === 'STOP_LOSS' ? 'bg-red-600/20 text-red-400' :
                      'bg-gray-600/20 text-gray-400'
                    }`}>
                      {trade.closedReason}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TradeHistory;
