const pool = require('../config/database');

const adminController = {
  async getStats(req, res) {
    try {
      // Estadísticas generales
      const statsQuery = `
        SELECT 
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM users WHERE last_login > NOW() - INTERVAL '7 days') as active_users,
          (SELECT COUNT(*) FROM transactions) as total_transactions,
          (SELECT COALESCE(SUM(price), 0) FROM transactions WHERE status = 'completo') as total_volume,
          (SELECT COUNT(*) FROM lotes WHERE status = 'ofertado') as active_lotes
      `;

      const statsResult = await pool.query(statsQuery);
      const stats = statsResult.rows[0];

      // Distribución de usuarios por tipo
      const userDistributionQuery = `
        SELECT user_type, COUNT(*) as count
        FROM users
        GROUP BY user_type
      `;
      const userDistributionResult = await pool.query(userDistributionQuery);
      const userDistribution = {};
      userDistributionResult.rows.forEach(row => {
        userDistribution[row.user_type] = parseInt(row.count);
      });

      // Tendencia de transacciones (últimos 30 días)
      const transactionTrendQuery = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count,
          COALESCE(SUM(price), 0) as volume
        FROM transactions
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date
      `;
      const transactionTrendResult = await pool.query(transactionTrendQuery);

      res.json({
        ...stats,
        userDistribution,
        transactionTrends: transactionTrendResult.rows
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  },

  async getActivity(req, res) {
    try {
      const query = `
        SELECT 
          'user_signup' as type,
          'Nuevo usuario registrado: ' || name as description,
          created_at as timestamp
        FROM users
        WHERE created_at > NOW() - INTERVAL '7 days'
        
        UNION ALL
        
        SELECT 
          'transaction' as type,
          'Nueva transacción: $' || price as description,
          created_at as timestamp
        FROM transactions
        WHERE created_at > NOW() - INTERVAL '7 days'
        
        UNION ALL
        
        SELECT 
          'lote_created' as type,
          'Nuevo lote publicado: ' || animal_type as description,
          created_at as timestamp
        FROM lotes
        WHERE created_at > NOW() - INTERVAL '7 days'
        
        ORDER BY timestamp DESC
        LIMIT 20
      `;

      const { rows } = await pool.query(query);
      res.json(rows);
    } catch (error) {
      console.error('Error fetching activity:', error);
      res.status(500).json({ error: 'Error al obtener actividad' });
    }
  }
};

module.exports = adminController;