const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const ownerRoutes = require('./src/routes/ownerRoutes');
const employeeRoutes = require('./src/routes/employeeRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const messageRoutes = require('./src/routes/messageRoutes');
const { initializeFirebase } = require('./src/services/firebaseService');
const { setupSocketHandlers } = require('./src/services/socketService');
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "http:
    methods: ["GET", "POST"]
  }
});
initializeFirebase();
app.use(cors({
  origin: "http:
}));
app.use(express.json());
initializeFirebase();
setupSocketHandlers(io);
app.use((req, res, next) => {
  req.io = io;
  next();
});
app.use('/api/owner', ownerRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/messages', messageRoutes);
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
module.exports = { app, server, io };
