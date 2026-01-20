const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// @route   POST /api/messages
// @desc    Send a message
// @access  Private
router.post('/', messageController.sendMessage);

// @route   GET /api/messages/transaction/:transactionId
// @desc    Get messages for a transaction
// @access  Private
router.get('/transaction/:transactionId', messageController.getMessages);

// @route   GET /api/messages/transaction/:transactionId/unread
// @desc    Get unread count for a transaction
// @access  Private
router.get('/transaction/:transactionId/unread', messageController.getUnreadCount);

// @route   GET /api/messages/conversations
// @desc    Get all conversations for current user
// @access  Private
router.get('/conversations', messageController.getConversations);

module.exports = router;
