const pool = require('../config/database');

const Certification = {
  async create(certificationData) {
    const {
      user_id,
      bank_name,
      personal_info,
      employment_info,
      financial_info,
      income_proof_path,
      status
    } = certificationData;

    const query = `
      INSERT INTO certifications (
        user_id, 
        bank_name, 
        personal_info,
        employment_info, 
        financial_info,
        income_proof_path,
        status, 
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `;
    
    const values = [
      user_id, 
      bank_name, 
      JSON.stringify(personal_info),
      JSON.stringify(employment_info),
      JSON.stringify(financial_info),
      income_proof_path,
      status
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  async findByUser(user_id) {
    const query = 'SELECT * FROM certifications WHERE user_id = $1 ORDER BY created_at DESC';
    const { rows } = await pool.query(query, [user_id]);
    return rows;
  },

  async findByBank(bank_name) {
    const query = `
      SELECT c.*, u.name as user_name, u.email, u.phone
      FROM certifications c
      JOIN users u ON c.user_id = u.id
      WHERE c.bank_name = $1
      ORDER BY c.created_at DESC
    `;
    const { rows } = await pool.query(query, [bank_name]);
    return rows;
  },

  async updateStatus(id, status) {
    const query = 'UPDATE certifications SET status = $1 WHERE id = $2 RETURNING *';
    const { rows } = await pool.query(query, [status, id]);
    return rows[0];
  },

  async getStats() {
    const query = `
      SELECT 
        bank_name,
        status,
        COUNT(*) as count
      FROM certifications
      GROUP BY bank_name, status
      ORDER BY bank_name, status
    `;
    const { rows } = await pool.query(query);
    return rows;
  }
};

module.exports = Certification;