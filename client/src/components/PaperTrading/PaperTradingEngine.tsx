import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { TradingStrategy } from './StrategyBuilder';

export interface PaperTrade {
  id: string;
  strategyId: string;
  strategyName: string;
  timestamp: Date;
  action: 'BUY' | 'SELL';
  price: number;
  size: number;
  value: number;
  exchange: string;
  status: 'OPEN' | 'CLOSED';
  closedAt?: Date;
  closePrice?: number;
  pnl?: number;
  pnlPercent?: number;
  stopLoss?: number;
  takeProfit?: number;
  closedReason?: 'STOP_LOSS' | 'TAKE_PROFIT' | 'MANUAL' | 'OPPOSITE_SIGNAL';
}

export interface TradingPerformance {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnL: number;
  totalPnLPercent: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpeRatio: number;
  currentBalance: number;
  peakBalance: number;
}

interface PaperTradingEngineProps {
  strategies: TradingStrategy[];
  orderbook: any;
  metrics: any;
  exchange: string;
  initialBalance?: number;
}

const PaperTradingEngine: React.FC<PaperTradingEngineProps> = ({
  strategies,
  orderbook,
  metrics,
  exchange,
  initialBalance = 10000
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [trades, setTrades] = useState<PaperTrade[]>([]);
  const [openPositions, setOpenPositions] = useState<PaperTrade[]>([]);
  const [balance, setBalance] = useState(initialBalance);
  const [performance, setPerformance] = useState<TradingPerformance>({
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    totalPnL: 0,
    totalPnLPercent: 0,
    averageWin: 0,
    averageLoss: 0,
    profitFactor: 0,
    maxDrawdown: 0,
    sharpeRatio: 0,
    currentBalance: initialBalance,
    peakBalance: initialBalance
  });
  const [lastTradeTime, setLastTradeTime] = useState<{ [strategyId: string]: number }>({});
  const [tradeLog, setTradeLog] = useState<string[]>([]);

  // Check if conditions are met for a strategy
  const evaluateConditions = useCallback((strategy: TradingStrategy): boolean => {
    if (!metrics || !orderbook) return false;

    for (let i = 0; i < strategy.conditions.length; i++) {
      const condition = strategy.conditions[i];
      const metricValue = metrics[condition.metric];
      
      if (metricValue === undefined) continue;

      let conditionMet = false;
      switch (condition.operator) {
        case '>':
          conditionMet = metricValue > condition.value;
          break;
        case '<':
          conditionMet = metricValue < condition.value;
          break;
        case '>=':
          conditionMet = metricValue >= condition.value;
          break;
        case '<=':
          conditionMet = metricValue <= condition.value;
          break;
        case '=':
          conditionMet = Math.abs(metricValue - condition.value) < 0.0001;
          break;
        case '!=':
          conditionMet = Math.abs(metricValue - condition.value) >= 0.0001;
          break;
      }

      // Apply AND/OR logic
      if (i === 0) {
        if (!conditionMet) return false;
      } else {
        const combineOp = condition.combineOperator || 'AND';
        if (combineOp === 'AND' && !conditionMet) {
          return false;
        } else if (combineOp === 'OR' && conditionMet) {
          return true;
        }
      }
    }

    return true;
  }, [metrics, orderbook]);

  // Execute a trade
  const executeTrade = useCallback((strategy: TradingStrategy) => {
    if (!orderbook || orderbook.bids.length === 0 || orderbook.asks.length === 0) return;

    // Check cooldown period
    const lastTime = lastTradeTime[strategy.id] || 0;
    const now = Date.now();
    if (strategy.cooldownPeriod && (now - lastTime) < strategy.cooldownPeriod * 1000) {
      return;
    }

    // Determine execution price
    let executionPrice: number;
    if (strategy.orderType === 'MARKET') {
      executionPrice = strategy.action === 'BUY' ? 
        orderbook.asks[0].price : 
        orderbook.bids[0].price;
    } else {
      // LIMIT order
      const offset = strategy.limitOffset || 0;
      executionPrice = strategy.action === 'BUY' ? 
        orderbook.bids[0].price - offset : 
        orderbook.asks[0].price + offset;
    }

    // Calculate trade size
    let tradeSize: number;
    if (strategy.sizeType === 'PERCENTAGE') {
      tradeSize = (balance * (strategy.size / 100)) / executionPrice;
    } else {
      tradeSize = strategy.size;
    }

    // Check if we have enough balance
    const tradeValue = tradeSize * executionPrice;
    if (strategy.action === 'BUY' && tradeValue > balance) {
      addLog(`Insufficient balance for ${strategy.name}. Required: $${tradeValue.toFixed(2)}, Available: $${balance.toFixed(2)}`);
      return;
    }

    // Check if we have position to sell
    if (strategy.action === 'SELL') {
      const totalPosition = openPositions
        .filter(p => p.action === 'BUY')
        .reduce((sum, p) => sum + p.size, 0);
      
      if (totalPosition < tradeSize) {
        addLog(`Insufficient position for ${strategy.name}. Required: ${tradeSize}, Available: ${totalPosition}`);
        return;
      }
    }

    // Create new trade
    const newTrade: PaperTrade = {
      id: Date.now().toString(),
      strategyId: strategy.id,
      strategyName: strategy.name,
      timestamp: new Date(),
      action: strategy.action,
      price: executionPrice,
      size: tradeSize,
      value: tradeValue,
      exchange: exchange,
      status: 'OPEN',
      stopLoss: strategy.stopLoss ? 
        (strategy.action === 'BUY' ? 
          executionPrice * (1 - strategy.stopLoss / 100) :
          executionPrice * (1 + strategy.stopLoss / 100)
        ) : undefined,
      takeProfit: strategy.takeProfit ?
        (strategy.action === 'BUY' ? 
          executionPrice * (1 + strategy.takeProfit / 100) :
          executionPrice * (1 - strategy.takeProfit / 100)
        ) : undefined
    };

    // Update balance
    if (strategy.action === 'BUY') {
      setBalance(prev => prev - tradeValue);
    }

    // Add trade
    setTrades(prev => [...prev, newTrade]);
    setOpenPositions(prev => [...prev, newTrade]);
    
    // Update last trade time
    setLastTradeTime(prev => ({ ...prev, [strategy.id]: now }));
    
    // Add to log
    addLog(`${strategy.action} ${tradeSize.toFixed(4)} @ $${executionPrice.toFixed(2)} - ${strategy.name}`);
  }, [orderbook, balance, openPositions, exchange, lastTradeTime]);

  // Check and close positions based on stop loss or take profit
  const checkOpenPositions = useCallback(() => {
    if (!orderbook || orderbook.bids.length === 0 || orderbook.asks.length === 0) return;

    const currentPrice = (orderbook.bids[0].price + orderbook.asks[0].price) / 2;

    setOpenPositions(prev => {
      const updatedPositions: PaperTrade[] = [];
      const closedTrades: PaperTrade[] = [];

      prev.forEach(position => {
        let shouldClose = false;
        let closeReason: 'STOP_LOSS' | 'TAKE_PROFIT' | undefined;

        if (position.action === 'BUY') {
          if (position.stopLoss && currentPrice <= position.stopLoss) {
            shouldClose = true;
            closeReason = 'STOP_LOSS';
          } else if (position.takeProfit && currentPrice >= position.takeProfit) {
            shouldClose = true;
            closeReason = 'TAKE_PROFIT';
          }
        } else {
          if (position.stopLoss && currentPrice >= position.stopLoss) {
            shouldClose = true;
            closeReason = 'STOP_LOSS';
          } else if (position.takeProfit && currentPrice <= position.takeProfit) {
            shouldClose = true;
            closeReason = 'TAKE_PROFIT';
          }
        }

        if (shouldClose) {
          const pnl = position.action === 'BUY' ?
            (currentPrice - position.price) * position.size :
            (position.price - currentPrice) * position.size;
          
          const pnlPercent = (pnl / position.value) * 100;

          const closedTrade: PaperTrade = {
            ...position,
            status: 'CLOSED',
            closedAt: new Date(),
            closePrice: currentPrice,
            pnl,
            pnlPercent,
            closedReason: closeReason
          };

          closedTrades.push(closedTrade);
          
          // Update balance
          if (position.action === 'BUY') {
            setBalance(prev => prev + currentPrice * position.size);
          } else {
            setBalance(prev => prev - pnl);
          }

          addLog(`${closeReason}: Closed ${position.action} @ $${currentPrice.toFixed(2)}, PnL: $${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)`);
        } else {
          updatedPositions.push(position);
        }
      });

      // Update trades list with closed trades
      if (closedTrades.length > 0) {
        setTrades(prev => {
          const updated = [...prev];
          closedTrades.forEach(closed => {
            const index = updated.findIndex(t => t.id === closed.id);
            if (index !== -1) {
              updated[index] = closed;
            }
          });
          return updated;
        });
      }

      return updatedPositions;
    });
  }, [orderbook]);

  // Calculate performance metrics
  const calculatePerformance = useCallback(() => {
    const closedTrades = trades.filter(t => t.status === 'CLOSED');
    const wins = closedTrades.filter(t => (t.pnl || 0) > 0);
    const losses = closedTrades.filter(t => (t.pnl || 0) < 0);

    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalWins = wins.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalLosses = Math.abs(losses.reduce((sum, t) => sum + (t.pnl || 0), 0));

    // Calculate current position value
    const currentPositionValue = openPositions.reduce((sum, p) => {
      if (!orderbook) return sum;
      const currentPrice = (orderbook.bids[0]?.price + orderbook.asks[0]?.price) / 2 || p.price;
      return sum + (p.size * currentPrice);
    }, 0);

    const currentBalance = balance + currentPositionValue;
    const peakBalance = Math.max(currentBalance, performance.peakBalance);
    const drawdown = ((peakBalance - currentBalance) / peakBalance) * 100;

    setPerformance({
      totalTrades: closedTrades.length,
      winningTrades: wins.length,
      losingTrades: losses.length,
      winRate: closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0,
      totalPnL,
      totalPnLPercent: (totalPnL / initialBalance) * 100,
      averageWin: wins.length > 0 ? totalWins / wins.length : 0,
      averageLoss: losses.length > 0 ? totalLosses / losses.length : 0,
      profitFactor: totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0,
      maxDrawdown: Math.max(drawdown, performance.maxDrawdown),
      sharpeRatio: 0, // Would need returns history to calculate properly
      currentBalance,
      peakBalance
    });
  }, [trades, openPositions, balance, orderbook, initialBalance, performance.peakBalance, performance.maxDrawdown]);

  // Add log message
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTradeLog(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 100));
  };

  // Main trading loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      // Check each strategy
      strategies.forEach(strategy => {
        if (!strategy.enabled) return;

        const conditionsMet = evaluateConditions(strategy);
        if (conditionsMet) {
          executeTrade(strategy);
        }
      });

      // Check open positions for stop loss / take profit
      checkOpenPositions();

      // Update performance
      calculatePerformance();
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [isRunning, strategies, evaluateConditions, executeTrade, checkOpenPositions, calculatePerformance]);

  // Reset trading
  const handleReset = () => {
    setIsRunning(false);
    setTrades([]);
    setOpenPositions([]);
    setBalance(initialBalance);
    setPerformance({
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalPnL: 0,
      totalPnLPercent: 0,
      averageWin: 0,
      averageLoss: 0,
      profitFactor: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      currentBalance: initialBalance,
      peakBalance: initialBalance
    });
    setLastTradeTime({});
    setTradeLog([]);
    addLog('Trading system reset');
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Paper Trading</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isRunning
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Stop Trading</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Start Trading</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Balance</span>
              <DollarSign className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-xl font-bold text-white">${performance.currentBalance.toFixed(2)}</p>
            <p className={`text-xs ${performance.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {performance.totalPnL >= 0 ? '+' : ''}{performance.totalPnLPercent.toFixed(2)}%
            </p>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Total P&L</span>
              {performance.totalPnL >= 0 ? 
                <TrendingUp className="w-4 h-4 text-green-500" /> :
                <TrendingDown className="w-4 h-4 text-red-500" />
              }
            </div>
            <p className={`text-xl font-bold ${performance.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {performance.totalPnL >= 0 ? '+' : ''}${performance.totalPnL.toFixed(2)}
            </p>
            <p className="text-xs text-gray-400">{performance.totalTrades} trades</p>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Win Rate</span>
            </div>
            <p className="text-xl font-bold text-white">{performance.winRate.toFixed(1)}%</p>
            <p className="text-xs text-gray-400">
              {performance.winningTrades}W / {performance.losingTrades}L
            </p>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Profit Factor</span>
            </div>
            <p className="text-xl font-bold text-white">
              {performance.profitFactor === Infinity ? '∞' : performance.profitFactor.toFixed(2)}
            </p>
            <p className="text-xs text-gray-400">
              Max DD: {performance.maxDrawdown.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Open Positions */}
      {openPositions.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Open Positions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                <tr>
                  <th className="px-4 py-2">Time</th>
                  <th className="px-4 py-2">Strategy</th>
                  <th className="px-4 py-2">Action</th>
                  <th className="px-4 py-2">Size</th>
                  <th className="px-4 py-2">Entry</th>
                  <th className="px-4 py-2">Current</th>
                  <th className="px-4 py-2">P&L</th>
                  <th className="px-4 py-2">SL/TP</th>
                </tr>
              </thead>
              <tbody>
                {openPositions.map(position => {
                  const currentPrice = orderbook ? 
                    (orderbook.bids[0]?.price + orderbook.asks[0]?.price) / 2 : 
                    position.price;
                  const pnl = position.action === 'BUY' ?
                    (currentPrice - position.price) * position.size :
                    (position.price - currentPrice) * position.size;
                  const pnlPercent = (pnl / position.value) * 100;

                  return (
                    <tr key={position.id} className="border-b border-gray-700">
                      <td className="px-4 py-2">{new Date(position.timestamp).toLocaleTimeString()}</td>
                      <td className="px-4 py-2">{position.strategyName}</td>
                      <td className={`px-4 py-2 ${position.action === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                        {position.action}
                      </td>
                      <td className="px-4 py-2">{position.size.toFixed(4)}</td>
                      <td className="px-4 py-2">${position.price.toFixed(2)}</td>
                      <td className="px-4 py-2">${currentPrice.toFixed(2)}</td>
                      <td className={`px-4 py-2 ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${pnl.toFixed(2)} ({pnlPercent.toFixed(1)}%)
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {position.stopLoss && <span className="text-red-400">SL: ${position.stopLoss.toFixed(2)}</span>}
                        {position.stopLoss && position.takeProfit && ' / '}
                        {position.takeProfit && <span className="text-green-400">TP: ${position.takeProfit.toFixed(2)}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trade Log */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Trade Log</h3>
        <div className="bg-gray-900 rounded-lg p-4 max-h-48 overflow-y-auto">
          {tradeLog.length === 0 ? (
            <p className="text-gray-500 text-sm">No trades executed yet...</p>
          ) : (
            <div className="space-y-1">
              {tradeLog.map((log, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs text-gray-400 font-mono"
                >
                  {log}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaperTradingEngine;
