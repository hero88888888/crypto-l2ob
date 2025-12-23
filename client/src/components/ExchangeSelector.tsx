import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface ExchangeSelectorProps {
  exchanges: any[];
  selectedExchange: string;
  selectedSymbol: string;
  onSelect: (exchange: string, symbol: string) => void;
}

const ExchangeSelector: React.FC<ExchangeSelectorProps> = ({
  exchanges,
  selectedExchange,
  selectedSymbol,
  onSelect
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const currentExchange = exchanges.find(e => e.id === selectedExchange);
  const symbols = currentExchange?.supportedPairs || [];

  return (
    <div className="flex items-center space-x-2">
      {/* Exchange Selector */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-dark-100 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-700 transition"
        >
          <span className="capitalize">{selectedExchange}</span>
          <ChevronDown className="w-4 h-4" />
        </button>
        
        {isOpen && (
          <div className="absolute top-full mt-2 w-48 bg-dark-100 border border-gray-700 rounded-lg shadow-lg z-50">
            {exchanges.map(exchange => (
              <button
                key={exchange.id}
                onClick={() => {
                  onSelect(exchange.id, exchange.supportedPairs[0]);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition"
              >
                {exchange.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Symbol Selector */}
      <select
        value={selectedSymbol}
        onChange={(e) => onSelect(selectedExchange, e.target.value)}
        className="bg-dark-100 text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
      >
        {symbols.map((symbol: string) => (
          <option key={symbol} value={symbol}>
            {symbol}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ExchangeSelector;
