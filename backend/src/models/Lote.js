const pool = require('../config/database');

const Lote = {
  async create(loteData) {
    const {
      seller_id,
      location,
      animal_type,
      male_count,
      female_count,
      total_count,
      average_weight,
      breed,
      base_price,
      feeding_type,
      video_url,
      photos,
      description
    } = loteData;

    const query = `
      INSERT INTO lotes (
        seller_id, location, animal_type, male_count, female_count,
        total_count, average_weight, breed, base_price, feeding_type,
        video_url, photos, description, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      RETURNING *
    `;
    
    const values = [
      seller_id, location, animal_type, male_count, female_count,
      total_count, average_weight, breed, base_price, feeding_type,
      video_url, photos, description
    ];
    
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  async findBySeller(seller_id) {
    const query = 'SELECT * FROM lotes WHERE seller_id = $1 ORDER BY created_at DESC';
    const { rows } = await pool.query(query, [seller_id]);
    return rows;
  },

  async findById(id) {
    const query = `
      SELECT l.*, u.name as seller_name, u.email as seller_email, u.phone as seller_phone
      FROM lotes l
      JOIN users u ON l.seller_id = u.id
      WHERE l.id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  },

  async update(id, updates) {
    const keys = Object.keys(updates);
    const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
    const values = Object.values(updates);
    values.push(id);
    const query = `UPDATE lotes SET ${setClause} WHERE id = $${values.length} RETURNING *`;
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  async delete(id) {
    const query = 'DELETE FROM lotes WHERE id = $1 RETURNING *';
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  },

  async getAll() {
    const query = `
      SELECT l.*, u.name as seller_name, u.email as seller_email
      FROM lotes l
      JOIN users u ON l.seller_id = u.id
      WHERE l.status = 'ofertado'
      ORDER BY l.created_at DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }
};

module.exports = Lote;