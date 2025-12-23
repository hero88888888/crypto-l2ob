const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const ExchangeManager = require('./exchanges/ExchangeManager');
const OrderbookAnalyzer = require('./analysis/OrderbookAnalyzer');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

const exchangeManager = new ExchangeManager();
const analyzer = new OrderbookAnalyzer();

// Store active subscriptions
const activeSubscriptions = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('subscribe', async (data) => {
    const { exchange, symbol } = data;
    const key = `${exchange}_${symbol}`;
    
    if (!activeSubscriptions.has(key)) {
      const subscription = await exchangeManager.subscribe(exchange, symbol, (orderbook) => {
        // Analyze orderbook
        const metrics = analyzer.calculateMetrics(orderbook);
        
        // Emit to all clients subscribed to this symbol
        io.emit('orderbook_update', {
          exchange,
          symbol,
          orderbook,
          metrics,
          timestamp: Date.now()
        });
      });
      
      activeSubscriptions.set(key, subscription);
    }
    
    socket.join(key);
  });

  socket.on('unsubscribe', (data) => {
    const { exchange, symbol } = data;
    const key = `${exchange}_${symbol}`;
    socket.leave(key);
    
    // Check if no other clients are subscribed
    const room = io.sockets.adapter.rooms.get(key);
    if (!room || room.size === 0) {
      exchangeManager.unsubscribe(exchange, symbol);
      activeSubscriptions.delete(key);
    }
  });

  socket.on('get_exchanges', () => {
    socket.emit('exchanges', exchangeManager.getAvailableExchanges());
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    exchanges: exchangeManager.getAvailableExchanges(),
    activeSubscriptions: Array.from(activeSubscriptions.keys())
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
