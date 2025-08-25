const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const ownerRoutes = require('./routes/ownerRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const taskRoutes = require('./routes/taskRoutes');
const messageRoutes = require('./routes/messageRoutes');
const { initializeFirebase } = require('./services/firebaseService');
const { setupSocketHandlers } = require('./services/socketService');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ["https://your-frontend-domain.com"] 
      : ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  }
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ["https://your-frontend-domain.com"] 
    : ["http://localhost:3000"],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Firebase
initializeFirebase();

// Setup Socket.IO
setupSocketHandlers(io);

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/owner', ownerRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/messages', messageRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Socket.IO enabled for real-time communication`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = { app, server, io };
