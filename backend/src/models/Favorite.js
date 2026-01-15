const pool = require('../config/database');

class Favorite {
  // Add a favorite
  async create(userId, loteId) {
    const query = `
      INSERT INTO favorites (user_id, lote_id, created_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id, lote_id) DO NOTHING
      RETURNING *
    `;
    const { rows } = await pool.query(query, [userId, loteId]);
    return rows[0];
  }

  // Remove a favorite
  async delete(userId, loteId) {
    const query = `
      DELETE FROM favorites
      WHERE user_id = $1 AND lote_id = $2
      RETURNING *
    `;
    const { rows } = await pool.query(query, [userId, loteId]);
    return rows[0];
  }

  // Check if a lote is favorited by a user
  async isFavorite(userId, loteId) {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM favorites
        WHERE user_id = $1 AND lote_id = $2
      ) as is_favorite
    `;
    const { rows } = await pool.query(query, [userId, loteId]);
    return rows[0].is_favorite;
  }

  // Get all favorites for a user
  async findByUserId(userId) {
    const query = `
      SELECT 
        f.id,
        f.created_at,
        l.*,
        u.name as seller_name
      FROM favorites f
      LEFT JOIN lotes l ON f.lote_id = l.id
      LEFT JOIN users u ON l.seller_id = u.id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows;
  }

  // Get favorite count for a lote
  async getCountByLoteId(loteId) {
    const query = `
      SELECT COUNT(*) as count
      FROM favorites
      WHERE lote_id = $1
    `;
    const { rows } = await pool.query(query, [loteId]);
    return parseInt(rows[0].count);
  }
}

module.exports = new Favorite();
