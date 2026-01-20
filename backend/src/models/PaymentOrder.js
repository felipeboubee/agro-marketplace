const pool = require('../config/database');

const PaymentOrder = {
  // Create a new payment order
  async create(orderData) {
    const {
      transaction_id,
      buyer_id,
      seller_id,
      amount,
      payment_term,
      payment_method,
      platform_commission,
      bank_commission,
      seller_net_amount
    } = orderData;

    const query = `
      INSERT INTO payment_orders (
        transaction_id, buyer_id, seller_id, amount,
        payment_term, payment_method,
        platform_commission, bank_commission, seller_net_amount,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
      RETURNING *
    `;

    const result = await pool.query(query, [
      transaction_id,
      buyer_id,
      seller_id,
      amount,
      payment_term,
      payment_method,
      platform_commission,
      bank_commission,
      seller_net_amount
    ]);

    return result.rows[0];
  },

  // Get payment order by ID
  async findById(paymentOrderId) {
    const query = `
      SELECT 
        po.*,
        t.lote_id, t.actual_weight, t.agreed_price_per_kg,
        l.animal_type, l.breed, l.location,
        buyer.name as buyer_name, buyer.email as buyer_email,
        seller.name as seller_name, seller.email as seller_email
      FROM payment_orders po
      JOIN transactions t ON po.transaction_id = t.id
      JOIN lotes l ON t.lote_id = l.id
      JOIN users buyer ON po.buyer_id = buyer.id
      JOIN users seller ON po.seller_id = seller.id
      WHERE po.id = $1
    `;

    const result = await pool.query(query, [paymentOrderId]);
    return result.rows[0];
  },

  // Get payment order by transaction ID
  async findByTransactionId(transactionId) {
    const query = `
      SELECT 
        po.*,
        buyer.name as buyer_name, buyer.email as buyer_email,
        seller.name as seller_name, seller.email as seller_email
      FROM payment_orders po
      JOIN users buyer ON po.buyer_id = buyer.id
      JOIN users seller ON po.seller_id = seller.id
      WHERE po.transaction_id = $1
    `;

    const result = await pool.query(query, [transactionId]);
    return result.rows[0];
  },

  // Get all pending payment orders (for bank)
  async findPending() {
    const query = `
      SELECT 
        po.*,
        t.lote_id, t.actual_weight, t.agreed_price_per_kg,
        l.animal_type, l.breed, l.location,
        buyer.name as buyer_name, buyer.email as buyer_email,
        seller.name as seller_name, seller.email as seller_email
      FROM payment_orders po
      JOIN transactions t ON po.transaction_id = t.id
      JOIN lotes l ON t.lote_id = l.id
      JOIN users buyer ON po.buyer_id = buyer.id
      JOIN users seller ON po.seller_id = seller.id
      WHERE po.status = 'pending'
      ORDER BY po.created_at DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  },

  // Get all payment orders (for bank admin view)
  async findAll() {
    const query = `
      SELECT 
        po.*,
        t.lote_id, t.actual_weight, t.agreed_price_per_kg,
        l.animal_type, l.breed, l.location,
        buyer.name as buyer_name, buyer.email as buyer_email,
        seller.name as seller_name, seller.email as seller_email
      FROM payment_orders po
      JOIN transactions t ON po.transaction_id = t.id
      JOIN lotes l ON t.lote_id = l.id
      JOIN users buyer ON po.buyer_id = buyer.id
      JOIN users seller ON po.seller_id = seller.id
      ORDER BY po.created_at DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  },

  // Update payment order status
  async updateStatus(paymentOrderId, statusData) {
    const {
      status,
      bank_reference,
      bank_api_response
    } = statusData;

    let query, values;

    if (status === 'processing') {
      query = `
        UPDATE payment_orders
        SET 
          status = $1,
          bank_reference = $2,
          processed_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;
      values = [status, bank_reference, paymentOrderId];
    } else if (status === 'completed') {
      query = `
        UPDATE payment_orders
        SET 
          status = $1,
          bank_api_response = $2,
          completed_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;
      values = [status, bank_api_response, paymentOrderId];
    } else {
      query = `
        UPDATE payment_orders
        SET 
          status = $1,
          bank_api_response = $2
        WHERE id = $3
        RETURNING *
      `;
      values = [status, bank_api_response, paymentOrderId];
    }

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Get payment statistics (for bank dashboard)
  async getStatistics() {
    const query = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount END), 0) as pending_amount,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount END), 0) as completed_amount,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN bank_commission END), 0) as total_bank_commission
      FROM payment_orders
    `;

    const result = await pool.query(query);
    return result.rows[0];
  }
};

module.exports = PaymentOrder;
