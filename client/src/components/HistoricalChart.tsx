import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface HistoricalChartProps {
  data: any[];
}

const HistoricalChart: React.FC<HistoricalChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="timestamp" stroke="#9CA3AF" />
        <YAxis stroke="#9CA3AF" />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
          labelStyle={{ color: '#9CA3AF' }}
        />
        <Legend />
        <Line type="monotone" dataKey="imbalance" stroke="#8B5CF6" name="Imbalance" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="skew" stroke="#F59E0B" name="Skew" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="orderFlow" stroke="#10B981" name="Order Flow" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default HistoricalChart;
