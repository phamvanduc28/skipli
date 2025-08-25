const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateAny } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { dbHelpers } = require('../services/firebaseService');
router.get('/:userId',
  authenticateAny,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user.userId;
    const limit = parseInt(req.query.limit) || 50;
    let otherUser;
    if (req.user.role === 'owner') {
      otherUser = await dbHelpers.findEmployeeById(userId);
      if (!otherUser) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }
    } else {
      otherUser = await dbHelpers.findById('owners', userId);
      if (!otherUser) {
        return res.status(404).json({
          success: false,
          message: 'Owner not found'
        });
      }
    }
    const messages = await dbHelpers.findMessagesBetweenUsers(currentUserId, userId, limit);
    res.json({
      success: true,
      data: messages,
      count: messages.length,
      otherUser: {
        id: otherUser.id,
        name: otherUser.name || `Owner ${otherUser.phoneNumber}`,
        role: req.user.role === 'owner' ? 'employee' : 'owner'
      }
    });
  })
);
router.post('/',
  [authenticateAny, validate(schemas.message)],
  asyncHandler(async (req, res) => {
    const { toUserId, message, type } = req.body;
    const fromUserId = req.user.userId;
    let recipient;
    if (req.user.role === 'owner') {
      recipient = await dbHelpers.findEmployeeById(toUserId);
      if (!recipient || !recipient.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Recipient employee not found or inactive'
        });
      }
    } else {
      recipient = await dbHelpers.findById('owners', toUserId);
      if (!recipient) {
        return res.status(404).json({
          success: false,
          message: 'Recipient owner not found'
        });
      }
    }
    const messageData = {
      from: fromUserId,
      to: toUserId,
      message,
      type: type || 'text',
      timestamp: new Date(),
      participants: [fromUserId, toUserId]
    };
    const newMessage = await dbHelpers.createMessage(messageData);
    if (req.io) {
      req.io.emit('new-message-created', {
        message: newMessage,
        from: fromUserId,
        to: toUserId
      });
    }
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage
    });
  })
);
router.get('/conversations/list',
  authenticateAny,
  asyncHandler(async (req, res) => {
    const currentUserId = req.user.userId;
    const allMessages = await dbHelpers.findMany('messages', [
      { field: 'participants', operator: 'array-contains', value: currentUserId }
    ]);
    const conversationsMap = new Map();
    allMessages.forEach(message => {
      const otherUserId = message.from === currentUserId ? message.to : message.from;
      if (!conversationsMap.has(otherUserId) || 
          new Date(message.timestamp) > new Date(conversationsMap.get(otherUserId).timestamp)) {
        conversationsMap.set(otherUserId, message);
      }
    });
    const conversations = await Promise.all(
      Array.from(conversationsMap.entries()).map(async ([otherUserId, lastMessage]) => {
        let otherUser;
        if (req.user.role === 'owner') {
          otherUser = await dbHelpers.findEmployeeById(otherUserId);
        } else {
          otherUser = await dbHelpers.findById('owners', otherUserId);
        }
        if (!otherUser) return null;
        const unreadCount = allMessages.filter(msg => 
          msg.from === otherUserId && 
          msg.to === currentUserId &&
          new Date(msg.timestamp) > new Date(lastMessage.timestamp)
        ).length;
        return {
          userId: otherUserId,
          user: {
            id: otherUser.id,
            name: otherUser.name || `Owner ${otherUser.phoneNumber}`,
            role: req.user.role === 'owner' ? 'employee' : 'owner',
            email: otherUser.email || null,
            department: otherUser.department || null
          },
          lastMessage: {
            id: lastMessage.id,
            message: lastMessage.message,
            timestamp: lastMessage.timestamp,
            from: lastMessage.from,
            type: lastMessage.type
          },
          unreadCount
        };
      })
    );
    const validConversations = conversations
      .filter(conv => conv !== null)
      .sort((a, b) => new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp));
    res.json({
      success: true,
      data: validConversations,
      count: validConversations.length
    });
  })
);
router.put('/conversations/:userId/read',
  authenticateAny,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user.userId;
    res.json({
      success: true,
      message: 'Conversation marked as read'
    });
  })
);
router.delete('/:messageId',
  authenticateAny,
  asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const currentUserId = req.user.userId;
    const message = await dbHelpers.findById('messages', messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    if (message.from !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }
    await dbHelpers.delete('messages', messageId);
    if (req.io) {
      req.io.emit('message-deleted', {
        messageId,
        from: currentUserId,
        to: message.to
      });
    }
    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  })
);
router.get('/search',
  authenticateAny,
  asyncHandler(async (req, res) => {
    const { q, userId, limit = 20 } = req.query;
    const currentUserId = req.user.userId;
    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }
    let messages = await dbHelpers.findMany('messages', [
      { field: 'participants', operator: 'array-contains', value: currentUserId }
    ]);
    if (userId) {
      messages = messages.filter(msg => 
        (msg.from === currentUserId && msg.to === userId) ||
        (msg.from === userId && msg.to === currentUserId)
      );
    }
    const searchResults = messages
      .filter(msg => msg.message.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, parseInt(limit));
    res.json({
      success: true,
      data: searchResults,
      count: searchResults.length,
      query: q
    });
  })
);
module.exports = router;
