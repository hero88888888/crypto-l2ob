# 🗄️ Database & Authentication Setup Guide

## Overview
This guide will walk you through setting up a complete database and authentication system for the L2 Orderbook Analyzer, making strategies, trades, and user accounts persistent.

## 🎯 Recommended Stack: Supabase (Free Tier)

**Why Supabase?**
- ✅ Free PostgreSQL database (500MB)
- ✅ Built-in authentication (Email, OAuth providers)
- ✅ Real-time subscriptions
- ✅ Row-level security
- ✅ RESTful API auto-generated
- ✅ No credit card required

## 📋 Step-by-Step Setup

### Step 1: Create Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub (uses your education pack account)
4. Create a new project:
   - **Project Name**: `crypto-l2ob`
   - **Database Password**: Generate strong password (SAVE THIS!)
   - **Region**: Choose closest to you
   - **Plan**: Free tier

### Step 2: Database Schema Setup

Once your project is ready (takes ~2 minutes), go to SQL Editor and run these schemas:

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  settings JSONB DEFAULT '{}',
  paper_balance DECIMAL(15, 2) DEFAULT 10000.00
);

-- Trading strategies table
CREATE TABLE public.strategies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  conditions JSONB NOT NULL,
  action TEXT CHECK (action IN ('BUY', 'SELL')),
  order_type TEXT CHECK (order_type IN ('MARKET', 'LIMIT')),
  size DECIMAL(10, 8) NOT NULL,
  size_type TEXT CHECK (size_type IN ('FIXED', 'PERCENTAGE')),
  stop_loss DECIMAL(5, 2),
  take_profit DECIMAL(5, 2),
  limit_offset DECIMAL(10, 2),
  cooldown_period INTEGER,
  max_position_size DECIMAL(10, 8),
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Paper trades table
CREATE TABLE public.paper_trades (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_id UUID REFERENCES public.strategies(id) ON DELETE SET NULL,
  strategy_name TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  action TEXT CHECK (action IN ('BUY', 'SELL')),
  price DECIMAL(15, 2) NOT NULL,
  size DECIMAL(10, 8) NOT NULL,
  value DECIMAL(15, 2) NOT NULL,
  exchange TEXT NOT NULL,
  symbol TEXT NOT NULL,
  status TEXT CHECK (status IN ('OPEN', 'CLOSED')),
  closed_at TIMESTAMP WITH TIME ZONE,
  close_price DECIMAL(15, 2),
  pnl DECIMAL(15, 2),
  pnl_percent DECIMAL(10, 4),
  stop_loss DECIMAL(15, 2),
  take_profit DECIMAL(15, 2),
  closed_reason TEXT CHECK (closed_reason IN ('STOP_LOSS', 'TAKE_PROFIT', 'MANUAL', 'OPPOSITE_SIGNAL'))
);

-- Trading performance table
CREATE TABLE public.trading_performance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  total_pnl DECIMAL(15, 2) DEFAULT 0,
  win_rate DECIMAL(5, 2) DEFAULT 0,
  profit_factor DECIMAL(10, 2) DEFAULT 0,
  max_drawdown DECIMAL(10, 2) DEFAULT 0,
  sharpe_ratio DECIMAL(10, 2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, date)
);

-- Watchlists table
CREATE TABLE public.watchlists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  symbols JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for performance
CREATE INDEX idx_strategies_user_id ON public.strategies(user_id);
CREATE INDEX idx_paper_trades_user_id ON public.paper_trades(user_id);
CREATE INDEX idx_paper_trades_strategy_id ON public.paper_trades(strategy_id);
CREATE INDEX idx_paper_trades_status ON public.paper_trades(status);
CREATE INDEX idx_trading_performance_user_date ON public.trading_performance(user_id, date);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see/edit their own data
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own strategies" ON public.strategies
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own trades" ON public.paper_trades
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own performance" ON public.trading_performance
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own watchlists" ON public.watchlists
  FOR ALL USING (auth.uid() = user_id);

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, username)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'username');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON public.strategies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Step 3: Get Your API Keys

1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://YOUR_PROJECT_ID.supabase.co`
   - **Anon/Public Key**: `eyJhbGc...` (safe for frontend)
   - **Service Role Key**: `eyJhbGc...` (backend only, KEEP SECRET!)

### Step 4: Install Dependencies

```bash
# Frontend dependencies
cd client
npm install @supabase/supabase-js

# Backend dependencies (if using Node.js backend)
cd ../server
npm install @supabase/supabase-js dotenv bcryptjs jsonwebtoken

# Python backend dependencies
cd ../python_server
pip install supabase python-dotenv
```

### Step 5: Environment Variables

Create `.env.local` in client folder:
```env
REACT_APP_SUPABASE_URL=your_project_url
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
```

Create `.env` in python_server folder:
```env
SUPABASE_URL=your_project_url
SUPABASE_SERVICE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret_here
```

### Step 6: Configure Supabase Client

The implementation files will be created next...

## 🔄 Alternative: MongoDB Atlas Setup

If you prefer MongoDB (NoSQL):

### Step 1: MongoDB Atlas Setup
1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up with GitHub (education pack)
3. Claim your $200 credits from GitHub Student Pack
4. Create a free cluster (M0)

### Step 2: Database Configuration
```javascript
// MongoDB Schemas
const UserSchema = {
  email: String,
  username: String,
  passwordHash: String,
  createdAt: Date,
  settings: Object,
  paperBalance: Number
};

const StrategySchema = {
  userId: ObjectId,
  name: String,
  description: String,
  conditions: Array,
  action: String,
  orderType: String,
  size: Number,
  sizeType: String,
  stopLoss: Number,
  takeProfit: Number,
  enabled: Boolean,
  createdAt: Date,
  updatedAt: Date
};

const TradeSchema = {
  userId: ObjectId,
  strategyId: ObjectId,
  timestamp: Date,
  action: String,
  price: Number,
  size: Number,
  exchange: String,
  symbol: String,
  status: String,
  pnl: Number,
  closePrice: Number,
  closedAt: Date
};
```

## 🔐 Authentication Options

### Option 1: Supabase Auth (Recommended)
- Built-in email/password
- OAuth (Google, GitHub, etc.)
- Magic links
- Phone authentication

### Option 2: Auth0 (Free tier)
- 7,000 active users free
- Social logins included
- Available through GitHub Education

### Option 3: Custom JWT
- Build your own with bcrypt + JWT
- More control but more work

## 📦 Next Steps

After database setup:
1. Implement authentication UI
2. Add database service layer
3. Update paper trading to persist
4. Add user dashboard
5. Implement strategy sharing (optional)

## 🎓 GitHub Education Benefits

Your pack includes:
- **MongoDB Atlas**: $200 credits
- **DigitalOcean**: $200 credits (for hosting)
- **Heroku**: Was free, now paid
- **Auth0**: Free account upgrade
- **DataDog**: Free monitoring
- **Sentry**: Error tracking

## 🚀 Deployment Options

With your credits:
1. **Vercel**: Frontend (free)
2. **Railway**: Backend ($5 credit)
3. **DigitalOcean**: Full stack ($200 credit)
4. **Render**: Full stack (free tier)

Choose Supabase for the fastest setup with least configuration!
