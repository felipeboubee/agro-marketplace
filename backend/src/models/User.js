const pool = require('../config/database');

const User = {
  async create(userData) {
    const { email, password, name, user_type, phone, location, bank_name, dni, cuit_cuil } = userData;
    const query = `
      INSERT INTO users (email, password, name, user_type, phone, location, bank_name, dni, cuit_cuil, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING id, email, name, user_type, bank_name, created_at
    `;
    const values = [email, password, name, user_type, phone, location, bank_name, dni, cuit_cuil];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const { rows } = await pool.query(query, [email]);
    return rows[0];
  },

  async findByEmailAndType(email, user_type) {
    const query = 'SELECT * FROM users WHERE email = $1 AND user_type = $2';
    const { rows } = await pool.query(query, [email, user_type]);
    return rows[0];
  },

  async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  },

  async update(id, updates) {
    const keys = Object.keys(updates);
    const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
    const values = Object.values(updates);
    values.push(id);
    const query = `UPDATE users SET ${setClause} WHERE id = $${values.length} RETURNING *`;
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  async getAll() {
    const query = 'SELECT id, email, name, user_type, bank_name, created_at FROM users ORDER BY created_at DESC';
    const { rows } = await pool.query(query);
    return rows;
  },

  async getByType(user_type) {
    const query = 'SELECT id, email, name, user_type, bank_name, created_at FROM users WHERE user_type = $1';
    const { rows } = await pool.query(query, [user_type]);
    return rows;
  }
};

module.exports = User;