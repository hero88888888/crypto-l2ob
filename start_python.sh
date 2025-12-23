#!/bin/bash

echo "🐍 Starting L2 Orderbook Analyzer with High-Performance Python Backend"
echo "======================================================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed. Please install it first.${NC}"
    exit 1
fi

# Check Python version (need 3.8+)
PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
if (( $(echo "$PYTHON_VERSION < 3.8" | bc -l) )); then
    echo -e "${YELLOW}⚠️  Python $PYTHON_VERSION detected. Python 3.8+ recommended for best performance.${NC}"
fi

# Install dependencies if needed
echo -e "${GREEN}📦 Checking Python dependencies...${NC}"
cd python_server
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate 2>/dev/null || . venv/Scripts/activate 2>/dev/null

# Install requirements
pip install -q -r requirements.txt 2>/dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Installing dependencies (first time only)...${NC}"
    pip install -r requirements.txt
fi

# Check if uvloop is available (for better performance)
python3 -c "import uvloop" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ uvloop detected - maximum performance enabled!${NC}"
    SERVER_SCRIPT="server_async.py"
else
    echo -e "${YELLOW}ℹ️  uvloop not found - using standard asyncio${NC}"
    echo -e "${YELLOW}   Install with: pip install uvloop (recommended for 2-4x speed)${NC}"
    SERVER_SCRIPT="server_async.py"
fi

# Start Python backend
echo -e "${GREEN}🚀 Starting high-performance Python backend...${NC}"
python3 $SERVER_SCRIPT &
BACKEND_PID=$!

# Wait for backend to start
sleep 2

# Check if backend started successfully
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Backend failed to start. Check logs above.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install Node.js/npm for the frontend.${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start React frontend
echo -e "${GREEN}🎨 Starting React frontend...${NC}"
cd ../client

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies (first time only)...${NC}"
    npm install
fi

npm start &
FRONTEND_PID=$!

# Display status
echo ""
echo "======================================================================"
echo -e "${GREEN}✅ L2 Orderbook Analyzer is running!${NC}"
echo "======================================================================"
echo -e "📊 Backend (Python):  ${GREEN}http://localhost:3001${NC}"
echo -e "🌐 Frontend (React):  ${GREEN}http://localhost:3000${NC}"
echo "======================================================================"
echo -e "📈 Features:"
echo "   • 6 exchanges connected via WebSocket"
echo "   • Real-time orderbook streaming"
echo "   • 15+ advanced metrics"
echo "   • AI/ML insights"
echo "   • Paper trading simulator"
echo "======================================================================"
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    deactivate 2>/dev/null
    echo -e "${GREEN}✅ Stopped successfully${NC}"
    exit 0
}

# Set trap for clean shutdown
trap cleanup INT TERM

# Wait for processes
wait
