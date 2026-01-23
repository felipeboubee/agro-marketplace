const pool = require('../config/database');

const PaymentMethod = {
  // Create a new payment method
  async create(paymentMethodData) {
    const {
      user_id,
      payment_type,
      bank_id,
      bank_name,
      account_holder_name,
      account_number,
      cbu,
      alias_cbu,
      account_type,
      card_holder_name,
      card_number_last4,
      card_brand,
      card_expiry_month,
      card_expiry_year,
      check_issuer_name,
      check_bank_name,
      check_account_number,
      is_default
    } = paymentMethodData;

    // If this is set as default, unset other defaults for this user
    if (is_default) {
      await pool.query(
        'UPDATE payment_methods SET is_default = FALSE WHERE user_id = $1',
        [user_id]
      );
    }

    const query = `
      INSERT INTO payment_methods (
        user_id, payment_type, bank_id, bank_name, account_holder_name, account_number,
        cbu, alias_cbu, account_type, card_holder_name, card_number_last4,
        card_brand, card_expiry_month, card_expiry_year, check_issuer_name,
        check_bank_name, check_account_number, is_default
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;

    const result = await pool.query(query, [
      user_id, payment_type, bank_id, bank_name, account_holder_name, account_number,
      cbu, alias_cbu, account_type, card_holder_name, card_number_last4,
      card_brand, card_expiry_month, card_expiry_year, check_issuer_name,
      check_bank_name, check_account_number, is_default || false
    ]);

    return result.rows[0];
  },
  // Find payment method by ID
  async findById(id) {
    const query = `
      SELECT * FROM payment_methods
      WHERE id = $1 AND status = 'active'
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },
  // Get all payment methods for a user
  async findByUserId(userId) {
    const query = `
      SELECT * FROM payment_methods 
      WHERE user_id = $1 AND status = 'active'
      ORDER BY is_default DESC, created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  },

  // Get default payment method for a user
  async getDefault(userId) {
    const query = `
      SELECT * FROM payment_methods 
      WHERE user_id = $1 AND is_default = TRUE AND status = 'active'
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  },

  // Get payment method by ID
  async findById(id) {
    const query = 'SELECT * FROM payment_methods WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Set payment method as default
  async setDefault(id, userId) {
    // First, unset all defaults for this user
    await pool.query(
      'UPDATE payment_methods SET is_default = FALSE WHERE user_id = $1',
      [userId]
    );

    // Then set this one as default
    const query = `
      UPDATE payment_methods 
      SET is_default = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  },

  // Delete payment method
  async delete(id, userId) {
    const query = `
      UPDATE payment_methods 
      SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  },

  // Update payment method
  async update(id, userId, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, userId);

    const query = `
      UPDATE payment_methods 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Find all unverified payment methods
  async findUnverified() {
    const query = `
      SELECT pm.*, u.name as user_name, u.email as user_email
      FROM payment_methods pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.is_verified = FALSE AND pm.status = 'active'
      ORDER BY pm.created_at ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  // Verify a payment method
  async verify(id) {
    const query = `
      UPDATE payment_methods
      SET is_verified = TRUE, verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Reject a payment method
  async reject(id, reason = null) {
    const query = `
      UPDATE payment_methods
      SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
};

module.exports = PaymentMethod;
