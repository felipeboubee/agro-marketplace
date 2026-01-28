const pool = require('../config/database');

const Lote = {
  async create(loteData) {
    const {
      seller_id,
      estancia_name,
      localidad,
      provincia,
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
      description,
      videos
    } = loteData;

    // Mapear campos del frontend a base de datos
    const location = estancia_name ? `${estancia_name}, ${localidad}` : '';
    const city = localidad || '';
    const province = provincia || '';

    const query = `
      INSERT INTO lotes (
        seller_id, location, city, province, animal_type, male_count, female_count,
        total_count, average_weight, breed, base_price, feeding_type,
        video_url, photos, videos, description, status, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
      RETURNING *
    `;
    
    // Convertir strings vacíos a null para campos numéricos
    function toIntOrNull(val) {
      if (val === '' || val === undefined || val === null) return null;
      return parseInt(val);
    }
    function toFloatOrNull(val) {
      if (val === '' || val === undefined || val === null) return null;
      return parseFloat(val);
    }
    // Para text[] en postgres, debe ser un array de strings o null
    function toPgArray(arr) {
      if (!arr || arr.length === 0) return null;
      return arr;
    }
    const values = [
      seller_id,
      location,
      city,
      province,
      animal_type,
      toIntOrNull(male_count),
      toIntOrNull(female_count),
      toIntOrNull(total_count),
      toFloatOrNull(average_weight),
      breed,
      toFloatOrNull(base_price),
      feeding_type,
      video_url,
      toPgArray(photos),
      toPgArray(videos),
      description,
      'ofertado'
    ];
    
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  async findBySeller(seller_id) {
    const query = `
      SELECT l.*, 
        t.id as transaction_id,
        t.status as transaction_status,
        t.buyer_id,
        u.name as buyer_name
      FROM lotes l
      LEFT JOIN transactions t ON l.id = t.lote_id
      LEFT JOIN users u ON t.buyer_id = u.id
      WHERE l.seller_id = $1 
      ORDER BY l.created_at DESC
    `;
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
      LEFT JOIN transactions t ON l.id = t.lote_id 
        AND t.status NOT IN ('completo', 'cancelado')
      WHERE l.status = 'ofertado' AND t.id IS NULL
      ORDER BY l.created_at DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  },

  async hasActiveTransaction(lote_id) {
    const query = `
      SELECT COUNT(*) as count
      FROM transactions
      WHERE lote_id = $1 
        AND status NOT IN ('completo', 'cancelado')
    `;
    const { rows } = await pool.query(query, [lote_id]);
    return parseInt(rows[0].count) > 0;
  }
};

module.exports = Lote;