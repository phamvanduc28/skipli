import React, { createContext, useContext, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import socketService from '../services/socketService';
import { useAuth } from './AuthContext';
const SocketContext = createContext();
export const SocketProvider = ({ children }) => {
  const { isAuthenticated, token, user } = useAuth();
  const connectedRef = useRef(false);
  useEffect(() => {
    if (isAuthenticated && token && !connectedRef.current) {
      socketService.connect(token);
      connectedRef.current = true;
      setupGlobalListeners();
      console.log('Socket connected for user:', user?.id);
    } else if (!isAuthenticated && connectedRef.current) {
      socketService.disconnect();
      connectedRef.current = false;
      console.log('Socket disconnected');
    }
    return () => {
      if (connectedRef.current) {
        socketService.disconnect();
        connectedRef.current = false;
      }
    };
  }, [isAuthenticated, token, user?.id]);
  const setupGlobalListeners = () => {
    socketService.on('connect', () => {
      console.log('Socket connected successfully');
      toast.success('Connected to real-time services');
    });
    socketService.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason !== 'io client disconnect') {
        toast.warn('Real-time connection lost. Attempting to reconnect...');
      }
    });
    socketService.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error('Failed to connect to real-time services');
    });
    socketService.on('new-message', (data) => {
      console.log('New message received:', data);
      const currentPath = window.location.pathname;
      const isInChatWithSender = currentPath.includes('/chat') && 
                                 currentPath.includes(data.from);
      if (!isInChatWithSender) {
        toast.info(`New message from ${data.senderRole === 'owner' ? 'Manager' : 'Employee'}`);
      }
    });
    socketService.on('message-sent', (data) => {
      console.log('Message sent successfully:', data);
    });
    socketService.on('message-error', (data) => {
      console.error('Message error:', data);
      toast.error('Failed to send message');
    });
    socketService.on('user-typing', (data) => {
      console.log('User typing:', data);
    });
    socketService.on('new-task-assigned', (data) => {
      console.log('New task assigned:', data);
      if (user?.role === 'employee' && data.assignedTo === user.id) {
        toast.info('You have been assigned a new task!');
      }
    });
    socketService.on('task-updated', (data) => {
      console.log('Task updated:', data);
      const isTaskCreator = data.task.createdBy === user?.id;
      const isTaskAssignee = data.task.assignedTo === user?.id;
      const updatedByCurrentUser = data.updatedBy === user?.id;
      if (!updatedByCurrentUser && (isTaskCreator || isTaskAssignee)) {
        const updaterRole = data.updatedByRole === 'owner' ? 'Manager' : 'Employee';
        toast.info(`Task "${data.task.title}" was updated by ${updaterRole}`);
      }
    });
    socketService.on('task-status-updated', (data) => {
      console.log('Task status updated:', data);
      if (user?.role === 'owner' && data.task.createdBy === user.id) {
        toast.info(`Task status updated: ${data.task.title} is now ${data.task.status}`);
      }
    });
    socketService.on('task-deleted', (data) => {
      console.log('Task deleted:', data);
      if (user?.role === 'employee' && data.assignedTo === user.id) {
        toast.info('One of your assigned tasks has been removed');
      }
    });
    socketService.on('employee-added', (data) => {
      console.log('New employee added:', data);
      if (user?.role === 'owner') {
        toast.success(`New employee added: ${data.employee.name}`);
      }
    });
    socketService.on('employee-updated', (data) => {
      console.log('Employee updated:', data);
      if (user?.role === 'owner') {
        toast.info(`Employee updated: ${data.employee.name}`);
      }
    });
    socketService.on('employee-deleted', (data) => {
      console.log('Employee deleted:', data);
      if (user?.role === 'owner') {
        toast.info('An employee has been removed from the system');
      }
    });
    socketService.on('task-notification', (data) => {
      console.log('Task notification:', data);
      switch (data.type) {
        case 'task-updated':
          toast.info(`Task notification: ${data.task.title}`);
          break;
        default:
          console.log('Unknown notification type:', data.type);
      }
    });
  };
  const sendMessage = (toUserId, message, type = 'text') => {
    socketService.sendMessage(toUserId, message, type);
  };
  const joinChat = (otherUserId) => {
    socketService.joinChat(otherUserId);
  };
  const startTyping = (toUserId) => {
    socketService.startTyping(toUserId);
  };
  const stopTyping = (toUserId) => {
    socketService.stopTyping(toUserId);
  };
  const notifyTaskUpdate = (taskData) => {
    socketService.notifyTaskUpdate(taskData);
  };
  const addEventListener = (event, callback) => {
    socketService.on(event, callback);
  };
  const removeEventListener = (event, callback) => {
    socketService.off(event, callback);
  };
  const isConnected = () => {
    return socketService.isConnected();
  };
  const getSocketId = () => {
    return socketService.getSocketId();
  };
  const value = {
    isConnected: connectedRef.current && socketService.isConnected(),
    sendMessage,
    joinChat,
    startTyping,
    stopTyping,
    notifyTaskUpdate,
    addEventListener,
    removeEventListener,
    getSocketId,
    socketService,
  };
  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
export default SocketContext;
