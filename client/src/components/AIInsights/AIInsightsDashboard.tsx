import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, AlertTriangle, Target, BarChart3, Zap, Eye, Cpu } from 'lucide-react';
import { aiService } from '../../services/AIService';
import { mlService } from '../../services/MLService';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface AIInsightsDashboardProps {
  orderbook: any;
  metrics: any;
  historicalData: any[];
}

const AIInsightsDashboard: React.FC<AIInsightsDashboardProps> = ({
  orderbook,
  metrics,
  historicalData
}) => {
  const [sentiment, setSentiment] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [anomaly, setAnomaly] = useState<any>(null);
  const [pattern, setPattern] = useState<any>(null);
  const [volumeClusters, setVolumeClusters] = useState<any[]>([]);
  const [tradingSignal, setTradingSignal] = useState<any>(null);
  const [mlPrediction, setMlPrediction] = useState<any>(null);
  const [strategy, setStrategy] = useState<any>(null);
  const [explanation, setExplanation] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'ai' | 'ml' | 'signals'>('ai');

  useEffect(() => {
    if (!orderbook || !metrics) return;

    // Update AI Service history
    aiService.updateHistory(orderbook, metrics);

    // Get AI insights
    const sentimentData = aiService.analyzeSentiment(orderbook, metrics);
    setSentiment(sentimentData);

    const predictionData = aiService.predictPrice(orderbook, metrics, historicalData);
    setPrediction(predictionData);

    const anomalyData = aiService.detectAnomalies(orderbook, metrics);
    setAnomaly(anomalyData);

    const strategyData = aiService.recommendStrategy(orderbook, metrics, 'moderate');
    setStrategy(strategyData);

    const explanationText = aiService.explainMarketConditions(orderbook, metrics);
    setExplanation(explanationText);

    // Get ML insights
    const runMLAnalysis = async () => {
      // Pattern recognition
      const priceHistory = historicalData.map(d => d.metrics?.midPrice || 0).filter(p => p > 0);
      const volumeHistory = historicalData.map(d => d.metrics?.liquidity?.total || 0);
      const patternData = mlService.recognizePattern(priceHistory, volumeHistory);
      setPattern(patternData);

      // Volume clusters
      const clusters = mlService.analyzeVolumeClusters(orderbook);
      setVolumeClusters(clusters);

      // ML prediction
      const mlPred = await mlService.predictNextPrice(orderbook, metrics, historicalData);
      setMlPrediction(mlPred);

      // Trading signal
      const signal = mlService.generateTradingSignal(orderbook, metrics, patternData, clusters);
      setTradingSignal(signal);
    };

    runMLAnalysis();
  }, [orderbook, metrics, historicalData]);

  // Prepare data for radar chart (feature importance)
  const radarData = mlPrediction?.features?.slice(0, 6).map((f: any) => ({
    feature: f.name,
    importance: f.importance * 100,
    value: Math.abs(f.value) * 50
  })) || [];

  // Prepare confidence meters data
  const confidenceData = [
    { name: 'Sentiment', value: (sentiment?.confidence || 0) * 100, color: '#10B981' },
    { name: 'Price Pred', value: (prediction?.shortTerm?.confidence || 0) * 100, color: '#3B82F6' },
    { name: 'ML Model', value: (mlPrediction?.confidence || 0) * 100, color: '#8B5CF6' },
    { name: 'Signal', value: tradingSignal?.strength || 50, color: '#F59E0B' }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Brain className="w-8 h-8 text-purple-500" />
            <div>
              <h1 className="text-2xl font-bold text-white">AI/ML Insights</h1>
              <p className="text-sm text-gray-400">Intelligent market analysis powered by AI</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'ai'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              <Brain className="w-4 h-4" />
              <span>AI Analysis</span>
            </button>

            <button
              onClick={() => setActiveTab('ml')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'ml'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>ML Patterns</span>
            </button>

            <button
              onClick={() => setActiveTab('signals')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'signals'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Trading Signals</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'ai' && (
        <>
          {/* AI Sentiment & Predictions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Market Sentiment */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
                Market Sentiment Analysis
              </h2>
              
              {sentiment && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Overall Sentiment</span>
                    <span className={`text-lg font-bold ${
                      sentiment.overall === 'bullish' ? 'text-green-400' : 
                      sentiment.overall === 'bearish' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {sentiment.overall.toUpperCase()}
                    </span>
                  </div>

                  {/* Sentiment Score Meter */}
                  <div className="relative">
                    <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${
                          sentiment.score > 0 ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.abs(sentiment.score) * 50 + 50}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Bearish</span>
                      <span>Neutral</span>
                      <span>Bullish</span>
                    </div>
                  </div>

                  {/* Confidence */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Confidence</span>
                    <span className="text-white">{(sentiment.confidence * 100).toFixed(0)}%</span>
                  </div>

                  {/* Factors */}
                  <div className="space-y-2">
                    <span className="text-sm text-gray-400">Key Factors:</span>
                    {sentiment.factors.map((factor: string, i: number) => (
                      <div key={i} className="flex items-start space-x-2">
                        <span className="text-green-400 mt-0.5">•</span>
                        <span className="text-sm text-gray-300">{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Price Predictions */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-purple-500" />
                AI Price Predictions
              </h2>

              {prediction && (
                <div className="space-y-4">
                  {/* Short Term */}
                  <div className="p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Short Term (15 min)</span>
                      <span className={`text-sm ${
                        prediction.shortTerm.direction === 'up' ? 'text-green-400' : 
                        prediction.shortTerm.direction === 'down' ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {prediction.shortTerm.direction === 'up' ? '↑' : 
                         prediction.shortTerm.direction === 'down' ? '↓' : '→'} 
                        {prediction.shortTerm.direction.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-white">
                        ${prediction.shortTerm.price.toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-400">
                        {(prediction.shortTerm.confidence * 100).toFixed(0)}% conf
                      </span>
                    </div>
                  </div>

                  {/* Medium Term */}
                  <div className="p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Medium Term (1-4 hr)</span>
                      <span className={`text-sm ${
                        prediction.mediumTerm.direction === 'up' ? 'text-green-400' : 
                        prediction.mediumTerm.direction === 'down' ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {prediction.mediumTerm.direction === 'up' ? '↑' : 
                         prediction.mediumTerm.direction === 'down' ? '↓' : '→'} 
                        {prediction.mediumTerm.direction.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-white">
                        ${prediction.mediumTerm.price.toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-400">
                        {(prediction.mediumTerm.confidence * 100).toFixed(0)}% conf
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Anomaly Detection */}
          {anomaly?.hasAnomaly && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-${anomaly.severity === 'high' ? 'red' : anomaly.severity === 'medium' ? 'yellow' : 'blue'}-900/20 border border-${anomaly.severity === 'high' ? 'red' : anomaly.severity === 'medium' ? 'yellow' : 'blue'}-700 rounded-lg p-4`}
            >
              <div className="flex items-start space-x-3">
                <AlertTriangle className={`w-6 h-6 text-${anomaly.severity === 'high' ? 'red' : anomaly.severity === 'medium' ? 'yellow' : 'blue'}-500 mt-0.5`} />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Anomaly Detected: {anomaly.type?.replace('_', ' ').toUpperCase()}
                  </h3>
                  <p className="text-gray-300">{anomaly.description}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    <strong>Recommendation:</strong> {anomaly.recommendation}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  anomaly.severity === 'high' ? 'bg-red-600' : 
                  anomaly.severity === 'medium' ? 'bg-yellow-600' : 'bg-blue-600'
                } text-white`}>
                  {anomaly.severity.toUpperCase()}
                </span>
              </div>
            </motion.div>
          )}

          {/* Market Explanation */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Eye className="w-5 h-5 mr-2 text-green-500" />
              Market Analysis Summary
            </h2>
            <div className="prose prose-invert max-w-none text-sm text-gray-300 whitespace-pre-line">
              {explanation}
            </div>
          </div>
        </>
      )}

      {activeTab === 'ml' && (
        <>
          {/* ML Pattern Recognition */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pattern Detection */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4">Pattern Recognition</h2>
              
              {pattern && pattern.pattern !== 'none' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Pattern Detected</span>
                    <span className="text-lg font-bold text-purple-400">
                      {pattern.pattern.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Confidence</span>
                    <span className="text-white">{(pattern.confidence * 100).toFixed(0)}%</span>
                  </div>
                  
                  {pattern.breakoutDirection && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Expected Breakout</span>
                      <span className={`font-bold ${
                        pattern.breakoutDirection === 'up' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {pattern.breakoutDirection === 'up' ? '↑ UP' : '↓ DOWN'}
                      </span>
                    </div>
                  )}
                  
                  {pattern.targetPrice && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Target Price</span>
                      <span className="text-xl font-bold text-white">
                        ${pattern.targetPrice.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-400">No patterns detected in current price action</p>
              )}
            </div>

            {/* Volume Clusters */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4">Volume Clusters</h2>
              
              {volumeClusters.length > 0 ? (
                <div className="space-y-3">
                  {volumeClusters.slice(0, 5).map((cluster, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 text-xs rounded ${
                          cluster.type === 'support' ? 'bg-green-600' : 'bg-red-600'
                        } text-white`}>
                          {cluster.type.toUpperCase()}
                        </span>
                        <span className="text-white">${cluster.priceLevel.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-400">{cluster.volume.toFixed(4)} BTC</span>
                        <span className={`w-2 h-2 rounded-full ${
                          cluster.significance === 'high' ? 'bg-red-500' : 
                          cluster.significance === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No significant volume clusters detected</p>
              )}
            </div>
          </div>

          {/* ML Feature Importance */}
          {mlPrediction && mlPrediction.features.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4">ML Model Feature Analysis</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Radar Chart */}
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#374151" />
                      <PolarAngleAxis dataKey="feature" stroke="#9CA3AF" />
                      <PolarRadiusAxis stroke="#9CA3AF" />
                      <Radar name="Importance" dataKey="importance" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
                      <Radar name="Value" dataKey="value" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Feature List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">ML Prediction</span>
                    <span className="text-xl font-bold text-white">
                      ${mlPrediction.nextPrice.toFixed(2)}
                    </span>
                  </div>
                  
                  {mlPrediction.features.slice(0, 5).map((feature: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">{feature.name}</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-white">{feature.value.toFixed(3)}</span>
                        <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500"
                            style={{ width: `${feature.importance * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'signals' && (
        <>
          {/* Trading Signal */}
          {tradingSignal && (
            <div className={`bg-gray-800 rounded-lg p-6 border-2 ${
              tradingSignal.type === 'BUY' ? 'border-green-500' : 
              tradingSignal.type === 'SELL' ? 'border-red-500' : 'border-yellow-500'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <Zap className={`w-6 h-6 mr-2 ${
                    tradingSignal.type === 'BUY' ? 'text-green-500' : 
                    tradingSignal.type === 'SELL' ? 'text-red-500' : 'text-yellow-500'
                  }`} />
                  Trading Signal: {tradingSignal.type}
                </h2>
                
                {/* Signal Strength Meter */}
                <div className="flex items-center space-x-3">
                  <span className="text-gray-400">Strength</span>
                  <div className="w-32 h-3 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${
                        tradingSignal.strength > 65 ? 'bg-green-500' : 
                        tradingSignal.strength < 35 ? 'bg-red-500' : 'bg-yellow-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${tradingSignal.strength}%` }}
                    />
                  </div>
                  <span className="text-white font-bold">{tradingSignal.strength}%</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Signal Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Entry Price</span>
                    <span className="text-lg font-bold text-white">${tradingSignal.entryPrice.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Stop Loss</span>
                    <span className="text-red-400">${tradingSignal.stopLoss.toFixed(2)}</span>
                  </div>
                  
                  <div>
                    <span className="text-gray-400">Take Profit Targets</span>
                    <div className="mt-1 space-y-1">
                      {tradingSignal.takeProfit.map((tp: number, i: number) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">TP{i + 1}</span>
                          <span className="text-green-400">${tp.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Reasons */}
                <div>
                  <span className="text-gray-400 mb-2 block">Signal Reasons:</span>
                  <div className="space-y-2">
                    {tradingSignal.reasons.map((reason: string, i: number) => (
                      <div key={i} className="flex items-start space-x-2">
                        <span className="text-green-400 mt-0.5">✓</span>
                        <span className="text-sm text-gray-300">{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Strategy Recommendation */}
          {strategy && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4">Recommended Strategy</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Strategy Name</span>
                  <span className="text-lg font-bold text-purple-400">{strategy.strategy}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Expected Return</span>
                  <span className="text-green-400">{(strategy.expectedReturn * 100).toFixed(1)}%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Risk Level</span>
                  <span className={`px-3 py-1 rounded text-sm ${
                    strategy.riskLevel === 'low' ? 'bg-green-600' : 
                    strategy.riskLevel === 'medium' ? 'bg-yellow-600' : 'bg-red-600'
                  } text-white`}>
                    {strategy.riskLevel.toUpperCase()}
                  </span>
                </div>
                
                <div>
                  <span className="text-gray-400">Reasoning</span>
                  <p className="mt-1 text-sm text-gray-300">{strategy.reasoning}</p>
                </div>
                
                <div>
                  <span className="text-gray-400">Conditions</span>
                  <div className="mt-2 space-y-1">
                    {strategy.conditions.map((cond: any, i: number) => (
                      <div key={i} className="text-sm text-gray-300 font-mono">
                        {cond.metric} {cond.operator} {cond.value}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Confidence Meters */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Model Confidence Levels</h2>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {confidenceData.map((item, i) => (
                <div key={i} className="text-center">
                  <div className="relative w-24 h-24 mx-auto">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="36"
                        stroke="#374151"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="36"
                        stroke={item.color}
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 36}`}
                        strokeDashoffset={`${2 * Math.PI * 36 * (1 - item.value / 100)}`}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-white">{item.value.toFixed(0)}%</span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400 mt-2 block">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AIInsightsDashboard;
