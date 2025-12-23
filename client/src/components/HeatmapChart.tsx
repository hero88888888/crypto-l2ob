import React from 'react';
import { OrderbookData } from '../types';

interface HeatmapChartProps {
  orderbook: OrderbookData;
}

const HeatmapChart: React.FC<HeatmapChartProps> = ({ orderbook }) => {
  const maxBidSize = Math.max(...orderbook.bids.slice(0, 20).map(b => b.size));
  const maxAskSize = Math.max(...orderbook.asks.slice(0, 20).map(a => a.size));
  const maxSize = Math.max(maxBidSize, maxAskSize);

  const getHeatmapColor = (size: number, isBid: boolean) => {
    const intensity = size / maxSize;
    const baseColor = isBid ? '34, 197, 94' : '239, 68, 68';
    return `rgba(${baseColor}, ${0.2 + intensity * 0.8})`;
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-10 gap-1">
        {orderbook.asks.slice(0, 20).reverse().map((ask, index) => (
          <div
            key={`ask-${index}`}
            className="h-8 rounded"
            style={{ backgroundColor: getHeatmapColor(ask.size, false) }}
            title={`Price: $${ask.price.toFixed(2)}, Size: ${ask.size.toFixed(4)}`}
          />
        ))}
      </div>
      <div className="border-t border-gray-600 my-2" />
      <div className="grid grid-cols-10 gap-1">
        {orderbook.bids.slice(0, 20).map((bid, index) => (
          <div
            key={`bid-${index}`}
            className="h-8 rounded"
            style={{ backgroundColor: getHeatmapColor(bid.size, true) }}
            title={`Price: $${bid.price.toFixed(2)}, Size: ${bid.size.toFixed(4)}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeatmapChart;
