import React, { useState } from 'react';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface MobileAIInsightsProps {
  metrics: any;
  orderbook: any;
}

const MobileAIInsights: React.FC<MobileAIInsightsProps> = ({ metrics, orderbook }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('sentiment');

  // Simulated AI insights (in production, these would come from your AI service)
  const generateInsights = () => {
    const imbalance = metrics?.imbalance || 0;
    const spread = metrics?.spreadPercentage || 0;
    const skew = metrics?.skew || 0;
    
    return {
      sentiment: {
        value: imbalance > 0.1 ? 'Bullish' : imbalance < -0.1 ? 'Bearish' : 'Neutral',
        score: imbalance,
        confidence: Math.abs(imbalance) * 100,
        factors: [
          `Imbalance: ${(imbalance * 100).toFixed(1)}%`,
          `Skew: ${(skew * 100).toFixed(1)}%`,
          `Buy pressure: ${metrics?.pressure?.ratio ? (metrics.pressure.ratio * 100).toFixed(0) : 50}%`
        ]
      },
      prediction: {
        direction: imbalance > 0 ? 'up' : 'down',
        confidence: Math.min(Math.abs(imbalance) * 100, 85),
        timeframe: '5-15 min',
        target: metrics?.midPrice * (1 + imbalance * 0.002)
      },
      anomalies: [
        spread > 0.1 && {
          type: 'High Spread',
          severity: 'medium',
          message: `Spread is ${spread.toFixed(2)}% - Low liquidity detected`
        },
        metrics?.largeOrders?.bids?.length > 0 && {
          type: 'Whale Activity',
          severity: 'high',
          message: `Large buy orders detected`
        }
      ].filter(Boolean),
      recommendations: [
        {
          action: imbalance > 0.2 ? 'BUY' : imbalance < -0.2 ? 'SELL' : 'HOLD',
          confidence: Math.abs(imbalance) * 100,
          reasoning: `Market shows ${Math.abs(imbalance) > 0.2 ? 'strong' : 'moderate'} ${imbalance > 0 ? 'buying' : 'selling'} pressure`
        }
      ]
    };
  };

  const insights = generateInsights();

  const sections = [
    {
      id: 'sentiment',
      title: 'Market Sentiment',
      icon: Brain,
      content: insights.sentiment
    },
    {
      id: 'prediction',
      title: 'Price Prediction',
      icon: TrendingUp,
      content: insights.prediction
    },
    {
      id: 'anomalies',
      title: 'Anomaly Detection',
      icon: AlertTriangle,
      content: insights.anomalies
    },
    {
      id: 'recommendations',
      title: 'AI Recommendations',
      icon: Lightbulb,
      content: insights.recommendations
    }
  ];

  return (
    <div className="h-full overflow-y-auto bg-dark-100 pb-20">
      <div className="p-4">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-white">AI Market Analysis</h2>
          <p className="text-xs text-gray-400 mt-1">
            Powered by ML models • Updated in real-time
          </p>
        </div>

        {/* Quick Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-4 mb-4 border border-blue-800"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">Overall Signal</span>
            <span className={`text-lg font-bold ${
              insights.sentiment.value === 'Bullish' ? 'text-green-400' : 
              insights.sentiment.value === 'Bearish' ? 'text-red-400' : 'text-yellow-400'
            }`}>
              {insights.sentiment.value.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {insights.sentiment.value === 'Bullish' ? (
              <TrendingUp className="w-5 h-5 text-green-400" />
            ) : insights.sentiment.value === 'Bearish' ? (
              <TrendingDown className="w-5 h-5 text-red-400" />
            ) : (
              <Brain className="w-5 h-5 text-yellow-400" />
            )}
            <div className="flex-1">
              <div className="text-xs text-gray-400">Confidence</div>
              <div className="w-full bg-dark-100 rounded-full h-2 mt-1">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                  style={{ width: `${insights.sentiment.confidence}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-bold text-white">
              {insights.sentiment.confidence.toFixed(0)}%
            </span>
          </div>
        </motion.div>

        {/* Expandable Sections */}
        <div className="space-y-3">
          {sections.map((section, index) => {
            const Icon = section.icon;
            const isExpanded = expandedSection === section.id;
            
            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-dark-200 rounded-lg border border-gray-800"
              >
                <button
                  onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                  className="w-full p-3 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5 text-blue-400" />
                    <span className="text-sm font-medium text-white">{section.title}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`} />
                </button>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-3 pb-3"
                    >
                      {section.id === 'sentiment' && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-400">Market State</span>
                            <span className={`text-sm font-bold ${
                              insights.sentiment.value === 'Bullish' ? 'text-green-400' :
                              insights.sentiment.value === 'Bearish' ? 'text-red-400' :
                              'text-yellow-400'
                            }`}>
                              {insights.sentiment.value}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {insights.sentiment.factors.map((factor: string, i: number) => (
                              <div key={i} className="text-xs text-gray-300">• {factor}</div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {section.id === 'prediction' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Direction</span>
                            <span className={`text-sm font-bold flex items-center ${
                              insights.prediction.direction === 'up' ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {insights.prediction.direction === 'up' ? (
                                <TrendingUp className="w-4 h-4 mr-1" />
                              ) : (
                                <TrendingDown className="w-4 h-4 mr-1" />
                              )}
                              {insights.prediction.direction.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-400">Target Price</span>
                            <span className="text-sm text-white font-mono">
                              ${insights.prediction.target.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-400">Timeframe</span>
                            <span className="text-sm text-white">{insights.prediction.timeframe}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-400">Confidence</span>
                            <span className="text-sm text-white">{insights.prediction.confidence.toFixed(0)}%</span>
                          </div>
                        </div>
                      )}
                      
                      {section.id === 'anomalies' && (
                        <div className="space-y-2">
                          {insights.anomalies.length > 0 ? (
                            insights.anomalies.map((anomaly: any, i: number) => (
                              <div key={i} className="bg-dark-100 rounded p-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-orange-400">
                                    {anomaly.type}
                                  </span>
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                                    anomaly.severity === 'high' ? 'bg-red-900/30 text-red-400' :
                                    anomaly.severity === 'medium' ? 'bg-orange-900/30 text-orange-400' :
                                    'bg-yellow-900/30 text-yellow-400'
                                  }`}>
                                    {anomaly.severity}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-300">{anomaly.message}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-gray-400">No anomalies detected</p>
                          )}
                        </div>
                      )}
                      
                      {section.id === 'recommendations' && (
                        <div className="space-y-2">
                          {insights.recommendations.map((rec: any, i: number) => (
                            <div key={i} className="bg-dark-100 rounded p-2">
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-sm font-bold ${
                                  rec.action === 'BUY' ? 'text-green-400' :
                                  rec.action === 'SELL' ? 'text-red-400' :
                                  'text-yellow-400'
                                }`}>
                                  {rec.action}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {rec.confidence.toFixed(0)}% confidence
                                </span>
                              </div>
                              <p className="text-xs text-gray-300">{rec.reasoning}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* AI Explanation */}
        <div className="mt-4 p-3 bg-dark-200/50 rounded-lg border border-gray-800">
          <div className="flex items-start space-x-2">
            <Brain className="w-4 h-4 text-purple-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-300">
                This analysis is generated using machine learning models trained on historical orderbook patterns. 
                Predictions are probabilistic and should be used alongside other analysis tools.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileAIInsights;
