const pool = require('../config/database');

class Offer {
  // Create a new offer with payment details
  async create(buyerId, sellerId, loteId, offeredPrice, originalPrice, paymentTerm, paymentMethod, hasCertification) {
    const query = `
      INSERT INTO offers (
        buyer_id, seller_id, lote_id, offered_price, original_price, 
        payment_term, payment_method, has_buyer_certification, 
        status, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pendiente', NOW())
      RETURNING *
    `;
    const { rows } = await pool.query(query, [
      buyerId, sellerId, loteId, offeredPrice, originalPrice,
      paymentTerm, paymentMethod, hasCertification
    ]);
    return rows[0];
  }

  // Create a counter offer from seller
  async createCounterOffer(originalOfferId, counterPrice) {
    // Get original offer
    const originalOffer = await this.findById(originalOfferId);
    
    const query = `
      INSERT INTO offers (
        buyer_id, seller_id, lote_id, offered_price, original_price,
        payment_term, payment_method, has_buyer_certification,
        counter_offer_price, is_counter_offer, parent_offer_id,
        status, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, 'pendiente', NOW())
      RETURNING *
    `;
    
    const { rows } = await pool.query(query, [
      originalOffer.buyer_id,
      originalOffer.seller_id,
      originalOffer.lote_id,
      counterPrice, // New counter offer price
      originalOffer.original_price,
      originalOffer.payment_term,
      originalOffer.payment_method,
      originalOffer.has_buyer_certification,
      counterPrice,
      originalOfferId
    ]);
    
    // Update original offer status to 'counter_offered'
    await this.updateStatus(originalOfferId, 'counter_offered');
    
    return rows[0];
  }

  // Get all offers for a seller with payment details
  async findBySellerId(sellerId) {
    const query = `
      SELECT 
        o.*,
        l.animal_type,
        l.breed,
        l.total_count,
        l.average_weight,
        u.name as buyer_name,
        u.email as buyer_email,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM transactions t 
            WHERE t.offer_id = o.id 
            AND t.status IN ('pending_weight', 'weight_confirmed', 'payment_pending', 'payment_processing')
          ) THEN true 
          ELSE false 
        END as has_active_transaction
      FROM offers o
      LEFT JOIN lotes l ON o.lote_id = l.id
      LEFT JOIN users u ON o.buyer_id = u.id
      WHERE o.seller_id = $1
      AND o.is_counter_offer = false
      ORDER BY o.created_at DESC
    `;
    const { rows } = await pool.query(query, [sellerId]);
    return rows;
  }

  // Get all offers made by a buyer with counter offers
  async findByBuyerId(buyerId) {
    const query = `
      SELECT 
        o.*,
        l.animal_type,
        l.breed,
        l.total_count,
        l.average_weight,
        u.name as seller_name,
        CASE 
          WHEN o.is_counter_offer THEN (
            SELECT offered_price FROM offers WHERE id = o.parent_offer_id
          )
          ELSE NULL
        END as original_buyer_offer
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
