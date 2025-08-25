import { io } from 'socket.io-client';
class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }
  connect(token) {
    if (this.socket?.connected) {
      return this.socket;
    }
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    this.socket = io(socketUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });
    this.setupEventListeners();
    return this.socket;
  }
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  setupEventListeners() {
    if (!this.socket) return;
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
    });
    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });
    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    this.listeners.forEach((callback, event) => {
      this.socket.on(event, callback);
    });
  }
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
    this.listeners.set(event, callback);
  }
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
    this.listeners.delete(event);
  }
  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
  joinChat(otherUserId) {
    this.emit('join-chat', { otherUserId });
  }
  sendMessage(toUserId, message, type = 'text') {
    this.emit('send-message', { toUserId, message, type });
  }
  startTyping(toUserId) {
    this.emit('typing-start', { toUserId });
  }
  stopTyping(toUserId) {
    this.emit('typing-stop', { toUserId });
  }
  notifyTaskUpdate(taskData) {
    this.emit('task-updated', taskData);
  }
  isConnected() {
    return this.socket?.connected || false;
  }
  getSocketId() {
    return this.socket?.id;
  }
}
const socketService = new SocketService();
export default socketService;
