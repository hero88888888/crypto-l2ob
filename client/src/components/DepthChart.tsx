import React from 'react';
import { OrderbookData } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DepthChartProps {
  orderbook: OrderbookData;
}

const DepthChart: React.FC<DepthChartProps> = ({ orderbook }) => {
  const prepareData = () => {
    let bidCumulative = 0;
    const bidData = orderbook.bids.slice(0, 30).map(bid => {
      bidCumulative += bid.size;
      return { price: bid.price, bidSize: bidCumulative, askSize: 0 };
    }).reverse();

    let askCumulative = 0;
    const askData = orderbook.asks.slice(0, 30).map(ask => {
      askCumulative += ask.size;
      return { price: ask.price, bidSize: 0, askSize: askCumulative };
    });

    return [...bidData, ...askData];
  };

  const data = prepareData();

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="price" stroke="#9CA3AF" />
        <YAxis stroke="#9CA3AF" />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
          labelStyle={{ color: '#9CA3AF' }}
        />
        <Area type="stepAfter" dataKey="bidSize" stroke="#22C55E" fill="#22C55E" fillOpacity={0.3} />
        <Area type="stepBefore" dataKey="askSize" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default DepthChart;
