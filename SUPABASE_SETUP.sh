#!/bin/bash

# Supabase Setup Script for L2 Orderbook Analyzer
# This script will guide you through the complete setup

echo "🚀 L2 Orderbook Analyzer - Database Setup"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if Node and npm are installed
echo "📦 Step 1: Checking dependencies..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install it first.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed. Please install it first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js and npm are installed${NC}"
echo ""

# Step 2: Install Supabase dependencies
echo "📦 Step 2: Installing Supabase dependencies..."
echo ""

# Install in client directory
echo "Installing frontend dependencies..."
cd client
npm install @supabase/supabase-js
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
echo ""

# Install in Python backend (if using Python)
echo "Installing Python dependencies (optional)..."
cd ../python_server
pip3 install supabase python-dotenv
echo -e "${GREEN}✓ Python dependencies installed${NC}"
echo ""

cd ..

# Step 3: Create environment files
echo "📝 Step 3: Creating environment files..."
echo ""

# Check if .env.local exists
if [ ! -f "client/.env.local" ]; then
    echo "Creating client/.env.local..."
    cat > client/.env.local << EOL
# Supabase Configuration
# Get these from your Supabase project dashboard
REACT_APP_SUPABASE_URL=your_supabase_url_here
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
EOL
    echo -e "${GREEN}✓ Created client/.env.local${NC}"
else
    echo -e "${YELLOW}client/.env.local already exists${NC}"
fi

# Check if python .env exists
if [ ! -f "python_server/.env" ]; then
    echo "Creating python_server/.env..."
    cat > python_server/.env << EOL
# Supabase Configuration
# Get these from your Supabase project dashboard
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_KEY=your_service_role_key_here
JWT_SECRET=your_jwt_secret_here
EOL
    echo -e "${GREEN}✓ Created python_server/.env${NC}"
else
    echo -e "${YELLOW}python_server/.env already exists${NC}"
fi

echo ""
echo "=========================================="
echo ""

# Step 4: Instructions for Supabase setup
echo -e "${YELLOW}📋 Step 4: Manual Supabase Setup${NC}"
echo ""
echo "1. Go to https://supabase.com and sign up/login"
echo "2. Create a new project with these settings:"
echo "   - Project Name: crypto-l2ob"
echo "   - Database Password: [Generate a strong password]"
echo "   - Region: [Choose closest to you]"
echo ""
echo "3. Once project is created (takes ~2 minutes), go to:"
echo "   Settings → API"
echo ""
echo "4. Copy these values to your .env files:"
echo "   - Project URL → REACT_APP_SUPABASE_URL / SUPABASE_URL"
echo "   - anon public key → REACT_APP_SUPABASE_ANON_KEY"
echo "   - service_role key → SUPABASE_SERVICE_KEY (backend only)"
echo ""
echo "5. Go to SQL Editor in Supabase dashboard"
echo "6. Copy and run the SQL from DATABASE_SETUP_GUIDE.md"
echo ""

# Step 5: Create SQL file for easy copy-paste
echo "📄 Step 5: Creating SQL setup file..."
cat > supabase_schema.sql << 'EOL'
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_trades ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own strategies" ON public.strategies
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own trades" ON public.paper_trades
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
EOL

echo -e "${GREEN}✓ Created supabase_schema.sql${NC}"
echo ""

echo "=========================================="
echo -e "${GREEN}✅ Setup script complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Set up your Supabase project at https://supabase.com"
echo "2. Update .env files with your Supabase credentials"
echo "3. Run the SQL from supabase_schema.sql in Supabase SQL Editor"
echo "4. Restart your development servers"
echo ""
echo "Documentation:"
echo "- DATABASE_SETUP_GUIDE.md - Complete setup guide"
echo "- supabase_schema.sql - Database schema to run in Supabase"
echo ""
echo -e "${YELLOW}Need help? Check the DATABASE_SETUP_GUIDE.md for detailed instructions${NC}"
