const Message = require('../models/Message');
const Transaction = require('../models/Transaction');

const messageController = {
  // Send a message
  async sendMessage(req, res) {
    try {
      const { transaction_id, message_text } = req.body;
      const sender_id = req.userId;

      // Get transaction to determine receiver
      const transaction = await Transaction.findById(transaction_id);
      if (!transaction) {
        return res.status(404).json({ error: 'Transacción no encontrada' });
      }

      // Verify sender is part of this transaction
      if (transaction.buyer_id !== sender_id && transaction.seller_id !== sender_id) {
        return res.status(403).json({ error: 'No tienes acceso a este chat' });
      }

      // Determine receiver
      const receiver_id = transaction.buyer_id === sender_id 
        ? transaction.seller_id 
        : transaction.buyer_id;

      // Create message
      const message = await Message.create({
        transaction_id,
        sender_id,
        receiver_id,
        message_text
      });

      res.status(201).json(message);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Error al enviar el mensaje' });
    }
  },

  // Get messages for a transaction
  async getMessages(req, res) {
    try {
      const { transactionId } = req.params;
      const userId = req.userId;

      // Verify user has access to this transaction
      const transaction = await Transaction.findById(transactionId);
      if (!transaction) {
        return res.status(404).json({ error: 'Transacción no encontrada' });
      }

      if (transaction.buyer_id !== userId && transaction.seller_id !== userId) {
        return res.status(403).json({ error: 'No tienes acceso a este chat' });
      }

      // Get messages
      const messages = await Message.findByTransactionId(transactionId);

      // Mark messages as read
      await Message.markAsRead(transactionId, userId);

      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Error al obtener los mensajes' });
    }
  },

  // Get unread count
  async getUnreadCount(req, res) {
    try {
      const { transactionId } = req.params;
      const userId = req.userId;

      const unreadCount = await Message.getUnreadCount(transactionId, userId);
      res.json({ unreadCount });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({ error: 'Error al obtener mensajes no leídos' });
    }
  },

  // Get all conversations for a user
  async getConversations(req, res) {
    try {
      const userId = req.userId;
      const conversations = await Message.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ error: 'Error al obtener las conversaciones' });
    }
  }
};

module.exports = messageController;
