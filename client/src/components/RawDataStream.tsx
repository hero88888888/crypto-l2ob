import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Pause, Play, Download, Copy } from 'lucide-react';
import { motion } from 'framer-motion';

interface RawDataStreamProps {
  exchange: string;
  symbol: string;
  orderbook: any;
}

const RawDataStream: React.FC<RawDataStreamProps> = ({ exchange, symbol, orderbook }) => {
  const [messages, setMessages] = useState<string[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const maxMessages = 50;

  useEffect(() => {
    if (!isPaused && orderbook) {
      const timestamp = new Date().toISOString();
      const message = JSON.stringify({
        timestamp,
        exchange,
        symbol,
        type: 'L2_UPDATE',
        data: {
          bids_count: orderbook.bids?.length || 0,
          asks_count: orderbook.asks?.length || 0,
          best_bid: orderbook.bids?.[0] || null,
          best_ask: orderbook.asks?.[0] || null,
          mid_price: orderbook.bids?.[0] && orderbook.asks?.[0] 
            ? (orderbook.bids[0].price + orderbook.asks[0].price) / 2 
            : null
        }
      }, null, 2);
      
      setMessages(prev => [...prev.slice(-maxMessages + 1), message]);
    }
  }, [orderbook, isPaused, exchange, symbol]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCopy = () => {
    const allMessages = messages.join('\n\n');
    navigator.clipboard.writeText(allMessages);
  };

  const handleDownload = () => {
    const blob = new Blob([messages.join('\n\n')], { type: 'text/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exchange}_${symbol}_stream_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-green-500" />
          <h3 className="text-sm font-semibold text-gray-300">Raw WebSocket Stream</h3>
          <span className="text-xs text-gray-500">({messages.length} messages)</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded hover:bg-gray-700/50"
          >
            {showRaw ? 'Hide' : 'Show'} Stream
          </button>
          
          {showRaw && (
            <>
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="p-1 rounded hover:bg-gray-700/50 text-gray-400 hover:text-gray-300"
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
              
              <button
                onClick={handleCopy}
                className="p-1 rounded hover:bg-gray-700/50 text-gray-400 hover:text-gray-300"
                title="Copy all"
              >
                <Copy className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleDownload}
                className="p-1 rounded hover:bg-gray-700/50 text-gray-400 hover:text-gray-300"
                title="Download JSON"
              >
                <Download className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {showRaw && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="relative"
        >
          <div className="h-64 overflow-y-auto p-4 font-mono text-xs">
            {messages.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                Waiting for WebSocket messages...
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative"
                  >
                    <div className="absolute left-0 top-0 text-gray-600 select-none">
                      {String(index + 1).padStart(3, '0')}
                    </div>
                    <pre className="ml-10 text-gray-300 whitespace-pre-wrap break-all">
                      {msg}
                    </pre>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          {isPaused && (
            <div className="absolute top-2 right-2 bg-yellow-500/20 px-2 py-1 rounded text-xs text-yellow-500">
              PAUSED
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default RawDataStream;
