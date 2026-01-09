const pool = require('../config/database');

const Transaction = {
  async create(transactionData) {
    const {
      seller_id,
      buyer_id,
      lote_id,
      price,
      quantity,
      animal_type,
      status,
      payment_method,
      location,
      average_weight,
      breed
    } = transactionData;

    const query = `
      INSERT INTO transactions (
        seller_id, buyer_id, lote_id, price, quantity, animal_type,
        status, payment_method, location, average_weight, breed, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *
    `;
    
    const values = [
      seller_id, buyer_id, lote_id, price, quantity, animal_type,
      status, payment_method, location, average_weight, breed
    ];
    
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  async findBySeller(seller_id) {
    const query = `
      SELECT t.*, u.name as buyer_name, u.email as buyer_email
      FROM transactions t
      LEFT JOIN users u ON t.buyer_id = u.id
      WHERE t.seller_id = $1
      ORDER BY t.created_at DESC
    `;
    const { rows } = await pool.query(query, [seller_id]);
    return rows;
  },

  async findByBuyer(buyer_id) {
    const query = `
      SELECT t.*, u.name as seller_name, u.email as seller_email
      FROM transactions t
      LEFT JOIN users u ON t.seller_id = u.id
      WHERE t.buyer_id = $1
      ORDER BY t.created_at DESC
    `;
    const { rows } = await pool.query(query, [buyer_id]);
    return rows;
  },

  async updateStatus(id, status) {
    const query = 'UPDATE transactions SET status = $1 WHERE id = $2 RETURNING *';
    const { rows } = await pool.query(query, [status, id]);
    return rows[0];
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