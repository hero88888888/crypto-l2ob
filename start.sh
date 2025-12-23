#!/bin/bash

echo "🚀 Starting Crypto L2 Orderbook Analyzer..."
echo ""
echo "📦 Installing dependencies if needed..."

# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..

echo ""
echo "🔧 Starting servers..."
echo ""

# Start both server and client
npm run dev

echo ""
echo "✅ Application is running!"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all services"
