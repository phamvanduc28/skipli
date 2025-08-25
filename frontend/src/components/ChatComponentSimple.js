import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { messageAPI, handleApiError } from '../services/api';
import { toast } from 'react-toastify';

const ChatComponent = ({ recipientId, recipientName, recipientType = 'employee' }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  const handleNewMessage = (message) => {
    if (message.senderId === recipientId || message.recipientId === recipientId) {
      setMessages(prev => [...prev, message]);
    }
  };

  const handleMessageDelivered = (data) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === data.messageId ? { ...msg, status: 'delivered' } : msg
      )
    );
  };

  useEffect(() => {
    if (recipientId) {
      loadMessages();
    }
  }, [recipientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (socket && isConnected) {
      socket.on('newMessage', handleNewMessage);
      socket.on('messageDelivered', handleMessageDelivered);

      return () => {
        socket.off('newMessage', handleNewMessage);
        socket.off('messageDelivered', handleMessageDelivered);
      };
    }
  }, [socket, isConnected, recipientId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await messageAPI.getMessages(recipientId);
      setMessages(response.data.data);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNewMessage = (message) => {
    if (message.senderId === recipientId || message.recipientId === recipientId) {
      setMessages(prev => [...prev, message]);
    }
  };

  const handleMessageDelivered = (data) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === data.messageId ? { ...msg, status: 'delivered' } : msg
      )
    );
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending || !recipientId) return;

    try {
      setSending(true);
      const messageData = {
        recipientId,
        recipientType,
        content: newMessage.trim(),
        type: 'text'
      };

      const response = await messageAPI.sendMessage(messageData);
      
      // Add message to local state immediately
      setMessages(prev => [...prev, response.data.data]);
      setNewMessage('');

      // Emit via socket for real-time delivery
      if (socket && isConnected) {
        socket.emit('sendMessage', response.data.data);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(handleApiError(error));
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatMessageDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const shouldShowDateSeparator = (currentMsg, prevMsg) => {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.createdAt).toDateString();
    const prevDate = new Date(prevMsg.createdAt).toDateString();
    return currentDate !== prevDate;
  };

  if (!recipientId) {
    return (
      <div className="chat-component">
        <div className="no-chat">
          <div className="no-chat-content">
            <h3>No conversation selected</h3>
            <p>Select an employee to start messaging</p>
          </div>
        </div>
        <style jsx>{`
          .chat-component {
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
          }
          .no-chat-content {
            text-align: center;
            color: #666;
          }
          .no-chat-content h3 {
            margin: 0 0 8px 0;
            font-size: 1.2rem;
            color: #333;
          }
          .no-chat-content p {
            margin: 0;
            font-size: 14px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="chat-component">
      <div className="chat-header">
        <div className="chat-header-info">
          <h3>{recipientName || 'Chat'}</h3>
          <div className="connection-status">
            {isConnected ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>

      <div className="messages-container">
        {loading ? (
          <div className="loading">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="empty-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((message, index) => {
              const showDateSeparator = shouldShowDateSeparator(message, messages[index - 1]);
              const isOwn = message.senderId === user.uid;

              return (
                <React.Fragment key={message.id}>
                  {showDateSeparator && (
                    <div className="date-separator">
                      <span>{formatMessageDate(message.createdAt)}</span>
                    </div>
                  )}
                  <div className={`message ${isOwn ? 'own' : 'other'}`}>
                    <div className="message-bubble">
                      <div className="message-content">{message.content}</div>
                      <div className="message-meta">
                        <span className="message-time">
                          {formatMessageTime(message.createdAt)}
                        </span>
                        {isOwn && (
                          <span className={`message-status ${message.status || 'sent'}`}>
                            {message.status === 'delivered' ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} className="message-input-form">
        <div className="message-input-container">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending || !isConnected}
            className="message-input"
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim() || sending || !isConnected}
            className="send-button"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .chat-component {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: white;
        }

        .chat-header {
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          padding: 16px 20px;
          flex-shrink: 0;
        }

        .chat-header-info h3 {
          margin: 0 0 4px 0;
          font-size: 1rem;
          font-weight: 600;
          color: #1a202c;
        }

        .connection-status {
          font-size: 12px;
          color: ${isConnected ? '#10b981' : '#ef4444'};
          font-weight: 500;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
        }

        .loading,
        .empty-messages {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #666;
          font-size: 14px;
        }

        .messages-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .date-separator {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 16px 0;
        }

        .date-separator span {
          background: #f1f5f9;
          color: #64748b;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .message {
          display: flex;
          margin-bottom: 8px;
        }

        .message.own {
          justify-content: flex-end;
        }

        .message.other {
          justify-content: flex-start;
        }

        .message-bubble {
          max-width: 70%;
          padding: 12px 16px;
          border-radius: 18px;
          position: relative;
        }

        .message.own .message-bubble {
          background: #3b82f6;
          color: white;
          border-bottom-right-radius: 4px;
        }

        .message.other .message-bubble {
          background: #f1f5f9;
          color: #1a202c;
          border-bottom-left-radius: 4px;
        }

        .message-content {
          font-size: 14px;
          line-height: 1.4;
          word-wrap: break-word;
        }

        .message-meta {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
          margin-top: 4px;
        }

        .message-time {
          font-size: 11px;
          opacity: 0.7;
        }

        .message-status {
          font-size: 12px;
          opacity: 0.7;
        }

        .message-status.delivered {
          color: #10b981;
        }

        .message-input-form {
          padding: 16px 20px;
          border-top: 1px solid #e2e8f0;
          background: white;
          flex-shrink: 0;
        }

        .message-input-container {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .message-input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 20px;
          font-size: 14px;
          outline: none;
        }

        .message-input:focus {
          border-color: #3b82f6;
        }

        .message-input:disabled {
          background: #f9fafb;
          color: #9ca3af;
        }

        .send-button {
          padding: 10px 20px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .send-button:hover:not(:disabled) {
          background: #2563eb;
        }

        .send-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .chat-header {
            padding: 12px 16px;
          }

          .messages-container {
            padding: 16px;
          }

          .message-bubble {
            max-width: 85%;
            padding: 10px 14px;
          }

          .message-input-form {
            padding: 12px 16px;
          }

          .message-input-container {
            gap: 8px;
          }

          .send-button {
            padding: 8px 16px;
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatComponent;
