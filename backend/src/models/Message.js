const pool = require('../config/database');

const Message = {
  // Create a new message
  async create(messageData) {
    const {
      transaction_id,
      sender_id,
      receiver_id,
      message_text
    } = messageData;

    const query = `
      INSERT INTO messages (
        transaction_id, sender_id, receiver_id, message_text
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(query, [
      transaction_id,
      sender_id,
      receiver_id,
      message_text
    ]);

    return result.rows[0];
  },

  // Get all messages for a transaction
  async findByTransactionId(transactionId) {
    const query = `
      SELECT 
        m.*,
        sender.name as sender_name,
        receiver.name as receiver_name
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      JOIN users receiver ON m.receiver_id = receiver.id
      WHERE m.transaction_id = $1
      ORDER BY m.created_at ASC
    `;

    const result = await pool.query(query, [transactionId]);
    return result.rows;
  },

  // Get unread messages for a user in a transaction
  async getUnreadCount(transactionId, userId) {
    const query = `
      SELECT COUNT(*) as unread_count
      FROM messages
      WHERE transaction_id = $1
      AND receiver_id = $2
      AND is_read = false
    `;

    const result = await pool.query(query, [transactionId, userId]);
    return parseInt(result.rows[0].unread_count);
  },

  // Mark messages as read
  async markAsRead(transactionId, userId) {
    const query = `
      UPDATE messages
      SET is_read = true
      WHERE transaction_id = $1
      AND receiver_id = $2
      AND is_read = false
      RETURNING *
    `;

    const result = await pool.query(query, [transactionId, userId]);
    return result.rows;
  },

  // Get all conversations for a user (grouped by transaction)
  async getUserConversations(userId) {
    const query = `
      SELECT DISTINCT
        t.id as transaction_id,
        t.lote_id,
        l.animal_type,
        l.breed,
        CASE 
          WHEN t.buyer_id = $1 THEN seller.name
          ELSE buyer.name
        END as other_user_name,
        CASE 
          WHEN t.buyer_id = $1 THEN seller.id
          ELSE buyer.id
        END as other_user_id,
        (
          SELECT COUNT(*)
          FROM messages m
          WHERE m.transaction_id = t.id
          AND m.receiver_id = $1
          AND m.is_read = false
        ) as unread_count,
        (
          SELECT m2.message_text
          FROM messages m2
          WHERE m2.transaction_id = t.id
          ORDER BY m2.created_at DESC
          LIMIT 1
        ) as last_message,
        (
          SELECT m2.created_at
          FROM messages m2
          WHERE m2.transaction_id = t.id
          ORDER BY m2.created_at DESC
          LIMIT 1
        ) as last_message_at
      FROM transactions t
      JOIN lotes l ON t.lote_id = l.id
      JOIN users buyer ON t.buyer_id = buyer.id
      JOIN users seller ON t.seller_id = seller.id
      WHERE t.buyer_id = $1 OR t.seller_id = $1
      ORDER BY last_message_at DESC NULLS LAST
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }
};

module.exports = Message;
