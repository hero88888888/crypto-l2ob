import React from 'react';

interface LargeOrdersTableProps {
  largeOrders: {
    bids: Array<{ price: number; size: number; zscore: number }>;
    asks: Array<{ price: number; size: number; zscore: number }>;
    threshold: number;
  };
}

const LargeOrdersTable: React.FC<LargeOrdersTableProps> = ({ largeOrders }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Large Buy Orders */}
      <div>
        <h3 className="text-sm font-semibold text-green-400 mb-3">Large Buy Orders</h3>
        <div className="space-y-2">
          {largeOrders.bids.length === 0 ? (
            <p className="text-gray-500 text-sm">No large buy orders detected</p>
          ) : (
            largeOrders.bids.map((order, index) => (
              <div key={index} className="bg-dark-100 rounded p-3 border border-green-500/20">
                <div className="flex justify-between items-center">
                  <span className="text-green-400">${order.price.toFixed(2)}</span>
                  <span className="text-white font-bold">{order.size.toFixed(4)}</span>
                  <span className="text-yellow-400 text-xs">Z: {order.zscore.toFixed(1)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Large Sell Orders */}
      <div>
        <h3 className="text-sm font-semibold text-red-400 mb-3">Large Sell Orders</h3>
        <div className="space-y-2">
          {largeOrders.asks.length === 0 ? (
            <p className="text-gray-500 text-sm">No large sell orders detected</p>
          ) : (
            largeOrders.asks.map((order, index) => (
              <div key={index} className="bg-dark-100 rounded p-3 border border-red-500/20">
                <div className="flex justify-between items-center">
                  <span className="text-red-400">${order.price.toFixed(2)}</span>
                  <span className="text-white font-bold">{order.size.toFixed(4)}</span>
                  <span className="text-yellow-400 text-xs">Z: {order.zscore.toFixed(1)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LargeOrdersTable;
