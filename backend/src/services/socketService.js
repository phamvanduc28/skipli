const jwt = require('jsonwebtoken');
const { dbHelpers } = require('./firebaseService');
class SocketService {
  constructor() {
    this.connectedUsers = new Map(); 
    this.userRoles = new Map(); 
  }
  setupSocketHandlers(io) {
    io.use(this.authenticateSocket.bind(this));
    io.on('connection', (socket) => {
      console.log(`🔌 User connected: ${socket.userId} (${socket.userRole})`);
      this.connectedUsers.set(socket.userId, socket.id);
      this.userRoles.set(socket.userId, socket.userRole);
      socket.join(socket.userId);
      socket.on('join-chat', (data) => {
        const { otherUserId } = data;
        const chatRoom = this.getChatRoomId(socket.userId, otherUserId);
        socket.join(chatRoom);
        console.log(`👥 User ${socket.userId} joined chat room: ${chatRoom}`);
      });
      socket.on('send-message', async (data) => {
        try {
          await this.handleSendMessage(socket, data);
        } catch (error) {
          console.error('❌ Error handling send message:', error);
          socket.emit('message-error', { error: 'Failed to send message' });
        }
      });
      socket.on('typing-start', (data) => {
        const { toUserId } = data;
        const targetSocketId = this.connectedUsers.get(toUserId);
        if (targetSocketId) {
          io.to(targetSocketId).emit('user-typing', {
            userId: socket.userId,
            typing: true
          });
        }
      });
      socket.on('typing-stop', (data) => {
        const { toUserId } = data;
        const targetSocketId = this.connectedUsers.get(toUserId);
        if (targetSocketId) {
          io.to(targetSocketId).emit('user-typing', {
            userId: socket.userId,
            typing: false
          });
        }
      });
      socket.on('task-updated', (data) => {
        this.broadcastTaskUpdate(io, data);
      });
      socket.on('disconnect', () => {
        console.log(`🔌 User disconnected: ${socket.userId}`);
        this.connectedUsers.delete(socket.userId);
        this.userRoles.delete(socket.userId);
      });
    });
  }
  async authenticateSocket(socket, next) {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      console.error('❌ Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  }
  async handleSendMessage(socket, data) {
    const { toUserId, message, type = 'text' } = data;
    if (!toUserId || !message) {
      socket.emit('message-error', { error: 'Invalid message data' });
      return;
    }
    const messageData = {
      from: socket.userId,
      to: toUserId,
      message,
      type,
      timestamp: new Date(),
      participants: [socket.userId, toUserId]
    };
    const savedMessage = await dbHelpers.createMessage(messageData);
    const recipientSocketId = this.connectedUsers.get(toUserId);
    const chatRoom = this.getChatRoomId(socket.userId, toUserId);
    if (recipientSocketId) {
      socket.to(chatRoom).emit('new-message', {
        id: savedMessage.id,
        from: socket.userId,
        to: toUserId,
        message,
        type,
        timestamp: savedMessage.timestamp,
        senderRole: socket.userRole
      });
    }
    socket.emit('message-sent', {
      id: savedMessage.id,
      from: socket.userId,
      to: toUserId,
      message,
      type,
      timestamp: savedMessage.timestamp
    });
    console.log(`💬 Message sent from ${socket.userId} to ${toUserId}`);
  }
  broadcastTaskUpdate(io, taskData) {
    if (taskData.assignedTo) {
      const assigneeSocketId = this.connectedUsers.get(taskData.assignedTo);
      if (assigneeSocketId) {
        io.to(assigneeSocketId).emit('task-notification', {
          type: 'task-updated',
          task: taskData
        });
      }
    }
    if (taskData.createdBy) {
      const creatorSocketId = this.connectedUsers.get(taskData.createdBy);
      if (creatorSocketId) {
        io.to(creatorSocketId).emit('task-notification', {
          type: 'task-updated',
          task: taskData
        });
      }
    }
  }
  broadcastToOwners(io, eventName, data) {
    this.userRoles.forEach((role, userId) => {
      if (role === 'owner') {
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
          io.to(socketId).emit(eventName, data);
        }
      }
    });
  }
  broadcastToEmployee(io, employeeId, eventName, data) {
    const socketId = this.connectedUsers.get(employeeId);
    if (socketId) {
      io.to(socketId).emit(eventName, data);
    }
  }
  getChatRoomId(userId1, userId2) {
    return [userId1, userId2].sort().join('-');
  }
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }
  getOnlineUsers() {
    return Array.from(this.connectedUsers.keys());
  }
  getUserRole(userId) {
    return this.userRoles.get(userId);
  }
}
const socketService = new SocketService();
module.exports = {
  setupSocketHandlers: (io) => socketService.setupSocketHandlers(io),
  socketService
};
