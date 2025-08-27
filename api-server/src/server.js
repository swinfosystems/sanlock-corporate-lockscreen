const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const { authMiddleware } = require('./middleware/auth');
const deviceRoutes = require('./routes/devices');
const authRoutes = require('./routes/auth');
const permissionRoutes = require('./routes/permissions');
const socketHandler = require('./socket/socketHandler');

// Initialize Supabase client (FREE TIER)
const supabase = createClient(
  process.env.SUPABASE_URL || 'your-supabase-url',
  process.env.SUPABASE_SERVICE_KEY || 'your-service-key'
);

const app = express();
const server = http.createServer(app);

// Socket.io setup for real-time communication (FREE)
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Security middleware (FREE)
app.use(helmet());
app.use(compression()); // Reduce bandwidth usage
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting for free tier protection
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // For screenshots
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'SanLock API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', authMiddleware, deviceRoutes);
app.use('/api/permissions', authMiddleware, permissionRoutes);

// Socket.io connection handling
socketHandler(io, supabase);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 SanLock API Server running on port ${PORT}`);
  console.log(`💰 Running on FREE TIER - No costs involved!`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = { app, server, io, supabase };
