import { supabase, Strategy, PaperTrade, TradingPerformance, UserProfile } from '../lib/supabase';

class DatabaseService {
  // ===== User Profile Operations =====
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    
    return data;
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
    
    return data;
  }

  async updatePaperBalance(userId: string, newBalance: number) {
    return this.updateUserProfile(userId, { paper_balance: newBalance });
  }

  // ===== Strategy Operations =====
  async getStrategies(userId: string): Promise<Strategy[]> {
    const { data, error } = await supabase
      .from('strategies')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching strategies:', error);
      return [];
    }
    
    return data || [];
  }

  async getStrategy(strategyId: string): Promise<Strategy | null> {
    const { data, error } = await supabase
      .from('strategies')
      .select('*')
      .eq('id', strategyId)
      .single();
    
    if (error) {
      console.error('Error fetching strategy:', error);
      return null;
    }
    
    return data;
  }

  async createStrategy(userId: string, strategy: Omit<Strategy, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('strategies')
      .insert([{ ...strategy, user_id: userId }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating strategy:', error);
      throw error;
    }
    
    return data;
  }

  async updateStrategy(strategyId: string, updates: Partial<Strategy>) {
    const { data, error } = await supabase
      .from('strategies')
      .update(updates)
      .eq('id', strategyId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating strategy:', error);
      throw error;
    }
    
    return data;
  }

  async deleteStrategy(strategyId: string) {
    const { error } = await supabase
      .from('strategies')
      .delete()
      .eq('id', strategyId);
    
    if (error) {
      console.error('Error deleting strategy:', error);
      throw error;
    }
  }

  async toggleStrategyEnabled(strategyId: string, enabled: boolean) {
    return this.updateStrategy(strategyId, { enabled });
  }

  // ===== Paper Trade Operations =====
  async getTrades(userId: string, limit = 100): Promise<PaperTrade[]> {
    const { data, error } = await supabase
      .from('paper_trades')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching trades:', error);
      return [];
    }
    
    return data || [];
  }

  async getOpenPositions(userId: string): Promise<PaperTrade[]> {
    const { data, error } = await supabase
      .from('paper_trades')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'OPEN')
      .order('timestamp', { ascending: false });
    
    if (error) {
      console.error('Error fetching open positions:', error);
      return [];
    }
    
    return data || [];
  }

  async createTrade(userId: string, trade: Omit<PaperTrade, 'id' | 'user_id'>) {
    const { data, error } = await supabase
      .from('paper_trades')
      .insert([{ ...trade, user_id: userId }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating trade:', error);
      throw error;
    }
    
    return data;
  }

  async closeTrade(tradeId: string, closeData: {
    close_price: number;
    pnl: number;
    pnl_percent: number;
    closed_reason: 'STOP_LOSS' | 'TAKE_PROFIT' | 'MANUAL' | 'OPPOSITE_SIGNAL';
  }) {
    const { data, error } = await supabase
      .from('paper_trades')
      .update({
        ...closeData,
        status: 'CLOSED',
        closed_at: new Date().toISOString()
      })
      .eq('id', tradeId)
      .select()
      .single();
    
    if (error) {
      console.error('Error closing trade:', error);
      throw error;
    }
    
    return data;
  }

  async getTradesByStrategy(strategyId: string, limit = 50): Promise<PaperTrade[]> {
    const { data, error } = await supabase
      .from('paper_trades')
      .select('*')
      .eq('strategy_id', strategyId)
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching strategy trades:', error);
      return [];
    }
    
    return data || [];
  }

  // ===== Performance Operations =====
  async getPerformance(userId: string, days = 30): Promise<TradingPerformance[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data, error } = await supabase
      .from('trading_performance')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Error fetching performance:', error);
      return [];
    }
    
    return data || [];
  }

  async updateDailyPerformance(userId: string, performance: Omit<TradingPerformance, 'id' | 'user_id' | 'date' | 'updated_at'>) {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('trading_performance')
      .upsert([
        {
          ...performance,
          user_id: userId,
          date: today
        }
      ], {
        onConflict: 'user_id,date'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error updating performance:', error);
      throw error;
    }
    
    return data;
  }

  // ===== Watchlist Operations =====
  async getWatchlist(userId: string) {
    const { data, error } = await supabase
      .from('watchlists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching watchlist:', error);
      return [];
    }
    
    return data || [];
  }

  async createWatchlist(userId: string, name: string, symbols: string[]) {
    const { data, error } = await supabase
      .from('watchlists')
      .insert([{
        user_id: userId,
        name,
        symbols
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating watchlist:', error);
      throw error;
    }
    
    return data;
  }

  async updateWatchlist(watchlistId: string, symbols: string[]) {
    const { data, error } = await supabase
      .from('watchlists')
      .update({ symbols })
      .eq('id', watchlistId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating watchlist:', error);
      throw error;
    }
    
    return data;
  }

  // ===== Real-time Subscriptions =====
  subscribeToTrades(userId: string, callback: (trade: PaperTrade) => void) {
    return supabase
      .channel(`trades:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'paper_trades',
          filter: `user_id=eq.${userId}`
        },
        (payload: any) => {
          callback(payload.new as PaperTrade);
        }
      )
      .subscribe();
  }

  subscribeToStrategies(userId: string, callback: (strategy: Strategy) => void) {
    return supabase
      .channel(`strategies:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'strategies',
          filter: `user_id=eq.${userId}`
        },
        (payload: any) => {
          callback(payload.new as Strategy);
        }
      )
      .subscribe();
  }

  // ===== Bulk Operations =====
  async resetPaperTrading(userId: string) {
    // Close all open trades
    await supabase
      .from('paper_trades')
      .update({ 
        status: 'CLOSED',
        closed_at: new Date().toISOString(),
        closed_reason: 'MANUAL'
      })
      .eq('user_id', userId)
      .eq('status', 'OPEN');
    
    // Reset balance
    await this.updatePaperBalance(userId, 10000);
  }

  async exportTrades(userId: string, format: 'csv' | 'json' = 'csv'): Promise<string> {
    const trades = await this.getTrades(userId, 1000);
    
    if (format === 'json') {
      return JSON.stringify(trades, null, 2);
    }
    
    // Convert to CSV
    const headers = [
      'Timestamp', 'Strategy', 'Action', 'Price', 'Size', 
      'Exchange', 'Symbol', 'Status', 'Close Price', 'P&L', 'P&L %'
    ];
    
    const rows = trades.map(trade => [
      trade.timestamp,
      trade.strategy_name,
      trade.action,
      trade.price,
      trade.size,
      trade.exchange,
      trade.symbol,
      trade.status,
      trade.close_price || '',
      trade.pnl || '',
      trade.pnl_percent || ''
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    return csv;
  }

  // ===== Analytics =====
  async getStrategyStats(strategyId: string) {
    const trades = await this.getTradesByStrategy(strategyId);
    const closedTrades = trades.filter(t => t.status === 'CLOSED');
    
    const wins = closedTrades.filter(t => (t.pnl || 0) > 0);
    const losses = closedTrades.filter(t => (t.pnl || 0) < 0);
    
    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalWins = wins.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalLosses = Math.abs(losses.reduce((sum, t) => sum + (t.pnl || 0), 0));
    
    return {
      totalTrades: closedTrades.length,
      winningTrades: wins.length,
      losingTrades: losses.length,
      winRate: closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0,
      totalPnL,
      averageWin: wins.length > 0 ? totalWins / wins.length : 0,
      averageLoss: losses.length > 0 ? totalLosses / losses.length : 0,
      profitFactor: totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0
    };
  }
}

export const databaseService = new DatabaseService();
