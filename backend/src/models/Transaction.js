const pool = require('../config/database');

const Transaction = {
  // Create a new transaction after offer is accepted
  async create(offerData) {
    const {
      offer_id,
      buyer_id,
      seller_id,
      lote_id,
      agreed_price_per_kg,
      estimated_weight,
      estimated_total
    } = offerData;

    const query = `
      INSERT INTO transactions (
        offer_id, buyer_id, seller_id, lote_id,
        agreed_price_per_kg, estimated_weight, estimated_total,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending_weight')
      RETURNING *
    `;

    const result = await pool.query(query, [
      offer_id,
      buyer_id,
      seller_id,
      lote_id,
      agreed_price_per_kg,
      estimated_weight,
      estimated_total
    ]);

    return result.rows[0];
  },

  // Get transaction by ID
  async findById(transactionId) {
    const query = `
      SELECT 
        t.*,
        l.animal_type, l.breed, l.location,
        buyer.name as buyer_name, buyer.email as buyer_email,
        seller.name as seller_name, seller.email as seller_email,
        o.payment_term, o.payment_method
      FROM transactions t
      JOIN lotes l ON t.lote_id = l.id
      JOIN users buyer ON t.buyer_id = buyer.id
      JOIN users seller ON t.seller_id = seller.id
      LEFT JOIN offers o ON t.offer_id = o.id
      WHERE t.id = $1
    `;

    const result = await pool.query(query, [transactionId]);
    return result.rows[0];
  },

  // Get transaction by offer ID
  async findByOfferId(offerId) {
    const query = `
      SELECT 
        t.*,
        l.animal_type, l.breed, l.location,
        buyer.name as buyer_name, buyer.email as buyer_email,
        seller.name as seller_name, seller.email as seller_email,
        o.payment_term, o.payment_method
      FROM transactions t
      JOIN lotes l ON t.lote_id = l.id
      JOIN users buyer ON t.buyer_id = buyer.id
      JOIN users seller ON t.seller_id = seller.id
      LEFT JOIN offers o ON t.offer_id = o.id
      WHERE t.offer_id = $1
    `;

    const result = await pool.query(query, [offerId]);
    return result.rows[0];
  },

  // Get all transactions for a buyer
  async findByBuyerId(buyerId) {
    const query = `
      SELECT 
        t.*,
        l.animal_type, l.breed, l.location, l.total_count, l.average_weight,
        seller.name as seller_name, seller.email as seller_email,
        o.payment_term, o.payment_method
      FROM transactions t
      JOIN lotes l ON t.lote_id = l.id
      JOIN users seller ON t.seller_id = seller.id
      LEFT JOIN offers o ON t.offer_id = o.id
      WHERE t.buyer_id = $1
      ORDER BY t.created_at DESC
    `;

    const result = await pool.query(query, [buyerId]);
    return result.rows;
  },

  // Get all transactions for a seller
  async findBySellerId(sellerId) {
    const query = `
      SELECT 
        t.*,
        l.animal_type, l.breed, l.location, l.total_count, l.average_weight,
        buyer.name as buyer_name, buyer.email as buyer_email,
        o.payment_term, o.payment_method
      FROM transactions t
      JOIN lotes l ON t.lote_id = l.id
      JOIN users buyer ON t.buyer_id = buyer.id
      LEFT JOIN offers o ON t.offer_id = o.id
      WHERE t.seller_id = $1
      ORDER BY t.created_at DESC
    `;

    const result = await pool.query(query, [sellerId]);
    return result.rows;
  },

  // Update weight from balance
  async updateWeight(transactionId, weightData) {
    const {
      actual_weight,
      balance_ticket_url
    } = weightData;

    const query = `
      UPDATE transactions
      SET 
        actual_weight = $1,
        balance_ticket_url = $2,
        weight_updated_at = CURRENT_TIMESTAMP,
        status = 'weight_confirmed',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;

    const result = await pool.query(query, [
      actual_weight,
      balance_ticket_url,
      transactionId
    ]);

    return result.rows[0];
  },

  // Buyer confirms weight
  async confirmWeight(transactionId) {
    // Calculate final amounts with commissions
    const transaction = await this.findById(transactionId);
    
    const finalAmount = parseFloat(transaction.agreed_price_per_kg) * parseFloat(transaction.actual_weight);
    const platformCommission = finalAmount * 0.01; // 1%
    const bankCommission = finalAmount * 0.02; // 2%
    const sellerNetAmount = finalAmount - platformCommission - bankCommission;

    const query = `
      UPDATE transactions
      SET 
        buyer_confirmed_weight = true,
        buyer_confirmed_at = CURRENT_TIMESTAMP,
        final_amount = $1,
        platform_commission = $2,
        bank_commission = $3,
        seller_net_amount = $4,
        status = 'payment_pending',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;

    const result = await pool.query(query, [
      finalAmount,
      platformCommission,
      bankCommission,
      sellerNetAmount,
      transactionId
    ]);

    return result.rows[0];
  },

  // Update transaction status
  async updateStatus(transactionId, status) {
    const query = `
      UPDATE transactions
      SET 
        status = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [status, transactionId]);
    return result.rows[0];
  },

  // Check if lote has active transaction
  async hasActiveTransaction(loteId) {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM transactions
        WHERE lote_id = $1 
        AND status IN ('pending_weight', 'weight_confirmed', 'payment_pending', 'payment_processing')
      ) as has_transaction
    `;

    const result = await pool.query(query, [loteId]);
    return result.rows[0].has_transaction;
  },

  async getAll() {
    const query = `
      SELECT t.*, 
        s.name as seller_name, 
        b.name as buyer_name,
        s.email as seller_email,
        b.email as buyer_email
      FROM transactions t
      LEFT JOIN users s ON t.seller_id = s.id
      LEFT JOIN users b ON t.buyer_id = b.id
      ORDER BY t.created_at DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }
};

module.exports = Transaction;