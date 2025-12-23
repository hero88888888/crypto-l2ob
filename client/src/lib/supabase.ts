import { createClient } from '@supabase/supabase-js';

// These should be in .env.local
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
  settings: any;
  paper_balance: number;
}

export interface Strategy {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  conditions: any[];
  action: 'BUY' | 'SELL';
  order_type: 'MARKET' | 'LIMIT';
  size: number;
  size_type: 'FIXED' | 'PERCENTAGE';
  stop_loss?: number;
  take_profit?: number;
  limit_offset?: number;
  cooldown_period?: number;
  max_position_size?: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaperTrade {
  id: string;
  user_id: string;
  strategy_id?: string;
  strategy_name: string;
  timestamp: string;
  action: 'BUY' | 'SELL';
  price: number;
  size: number;
  value: number;
  exchange: string;
  symbol: string;
  status: 'OPEN' | 'CLOSED';
  closed_at?: string;
  close_price?: number;
  pnl?: number;
  pnl_percent?: number;
  stop_loss?: number;
  take_profit?: number;
  closed_reason?: 'STOP_LOSS' | 'TAKE_PROFIT' | 'MANUAL' | 'OPPOSITE_SIGNAL';
}

export interface TradingPerformance {
  id: string;
  user_id: string;
  date: string;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  total_pnl: number;
  win_rate: number;
  profit_factor: number;
  max_drawdown: number;
  sharpe_ratio: number;
  updated_at: string;
}
