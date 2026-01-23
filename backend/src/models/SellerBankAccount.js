const pool = require('../config/database');

const SellerBankAccount = {
  // Create a new bank account
  async create(accountData) {
    const {
      user_id,
      bank_name,
      account_holder_name,
      account_number,
      cbu,
      alias_cbu,
      account_type,
      branch_number,
      swift_code,
      is_default
    } = accountData;

    // If this is set as default, unset other defaults for this user
    if (is_default !== false) {
      await pool.query(
        'UPDATE seller_bank_accounts SET is_default = FALSE WHERE user_id = $1',
        [user_id]
      );
    }

    const query = `
      INSERT INTO seller_bank_accounts (
        user_id, bank_name, account_holder_name, account_number,
        cbu, alias_cbu, account_type, branch_number, swift_code, is_default
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await pool.query(query, [
      user_id, bank_name, account_holder_name, account_number,
      cbu, alias_cbu, account_type, branch_number, swift_code,
      is_default !== false
    ]);

    return result.rows[0];
  },

  // Find bank account by ID
  async findById(id) {
    const query = `
      SELECT * FROM seller_bank_accounts
      WHERE id = $1 AND status = 'active'
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Get all bank accounts for a user
  async findByUserId(userId) {
    const query = `
      SELECT * FROM seller_bank_accounts 
      WHERE user_id = $1 AND status = 'active'
      ORDER BY is_default DESC, created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  },

  // Get default bank account for a user
  async getDefault(userId) {
    const query = `
      SELECT * FROM seller_bank_accounts 
      WHERE user_id = $1 AND is_default = TRUE AND status = 'active'
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  },

  // Get bank account by ID
  async findById(id) {
    const query = 'SELECT * FROM seller_bank_accounts WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Set bank account as default
  async setDefault(id, userId) {
    // First, unset all defaults for this user
    await pool.query(
      'UPDATE seller_bank_accounts SET is_default = FALSE WHERE user_id = $1',
      [userId]
    );

    // Then set this one as default
    const query = `
      UPDATE seller_bank_accounts 
      SET is_default = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  },

  // Delete bank account (soft delete)
  async delete(id, userId) {
    const query = `
      UPDATE seller_bank_accounts 
      SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  },

  // Update bank account
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
      UPDATE seller_bank_accounts 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Find all unverified bank accounts
  async findUnverified() {
    const query = `
      SELECT sba.*, u.name as user_name, u.email as user_email
      FROM seller_bank_accounts sba
      JOIN users u ON sba.user_id = u.id
      WHERE sba.is_verified = FALSE AND sba.status = 'active'
      ORDER BY sba.created_at ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  // Verify a bank account
  async verify(id) {
    const query = `
      UPDATE seller_bank_accounts
      SET is_verified = TRUE, verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Reject a bank account
  async reject(id, reason = null) {
    const query = `
      UPDATE seller_bank_accounts
      SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
};

module.exports = SellerBankAccount;
