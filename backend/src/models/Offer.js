const pool = require('../config/database');

class Offer {
  // Create a new offer
  async create(buyerId, sellerId, loteId, offeredPrice, originalPrice) {
    const query = `
      INSERT INTO offers (buyer_id, seller_id, lote_id, offered_price, original_price, status, created_at)
      VALUES ($1, $2, $3, $4, $5, 'pendiente', NOW())
      RETURNING *
    `;
    const { rows } = await pool.query(query, [buyerId, sellerId, loteId, offeredPrice, originalPrice]);
    return rows[0];
  }

  // Get all offers for a seller
  async findBySellerId(sellerId) {
    const query = `
      SELECT 
        o.*,
        l.animal_type,
        l.breed,
        l.total_count,
        l.average_weight,
        u.name as buyer_name,
        u.email as buyer_email
      FROM offers o
      LEFT JOIN lotes l ON o.lote_id = l.id
      LEFT JOIN users u ON o.buyer_id = u.id
      WHERE o.seller_id = $1
      ORDER BY o.created_at DESC
    `;
    const { rows } = await pool.query(query, [sellerId]);
    return rows;
  }

  // Get all offers made by a buyer
  async findByBuyerId(buyerId) {
    const query = `
      SELECT 
        o.*,
        l.animal_type,
        l.breed,
        l.total_count,
        l.average_weight,
        u.name as seller_name
      FROM offers o
      LEFT JOIN lotes l ON o.lote_id = l.id
      LEFT JOIN users u ON o.seller_id = u.id
      WHERE o.buyer_id = $1
      ORDER BY o.created_at DESC
    `;
    const { rows } = await pool.query(query, [buyerId]);
    return rows;
  }

  // Get offer by ID
  async findById(offerId) {
    const query = 'SELECT * FROM offers WHERE id = $1';
    const { rows } = await pool.query(query, [offerId]);
    return rows[0];
  }

  // Update offer status
  async updateStatus(offerId, status) {
    const query = `
      UPDATE offers
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const { rows } = await pool.query(query, [status, offerId]);
    return rows[0];
  }

  // Get offers for a specific lote
  async findByLoteId(loteId) {
    const query = `
      SELECT 
        o.*,
        u.name as buyer_name,
        u.email as buyer_email
      FROM offers o
      LEFT JOIN users u ON o.buyer_id = u.id
      WHERE o.lote_id = $1
      ORDER BY o.created_at DESC
    `;
    const { rows } = await pool.query(query, [loteId]);
    return rows;
  }

  // Delete an offer
  async delete(offerId) {
    const query = 'DELETE FROM offers WHERE id = $1 RETURNING *';
    const { rows } = await pool.query(query, [offerId]);
    return rows[0];
  }
}

module.exports = new Offer();
