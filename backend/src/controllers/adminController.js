const pool = require('../config/database.js');

// Health check
exports.healthCheck = async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'OK', 
      message: 'Conexión a la base de datos establecida',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Error de conexión a la base de datos',
      error: error.message 
    });
  }
};

// Obtener estadísticas básicas
exports.getStats = async (req, res) => {
  try {
    // Consultas básicas
    const [totalUsers, activeUsers, newUsersToday] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query("SELECT COUNT(*) as count FROM users WHERE is_active = true"),
      pool.query(`
        SELECT COUNT(*) as count FROM users 
        WHERE DATE(created_at) = CURRENT_DATE
      `)
    ]);

    // Consultas condicionales para tablas que pueden no existir
    let totalOrders = 0;
    let pendingOrders = 0;
    let revenue = 0;
    let avgOrderValue = 0;
    let dailyActivity = 0;

    try {
      const ordersResult = await pool.query('SELECT COUNT(*) as count FROM orders');
      totalOrders = parseInt(ordersResult.rows[0]?.count || 0);
      
      const pendingResult = await pool.query("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'");
      pendingOrders = parseInt(pendingResult.rows[0]?.count || 0);
      
      const revenueResult = await pool.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'completed'");
      revenue = parseFloat(revenueResult.rows[0]?.total || 0);
      
      const avgResult = await pool.query("SELECT COALESCE(AVG(total_amount), 0) as avg FROM orders WHERE status = 'completed'");
      avgOrderValue = parseFloat(avgResult.rows[0]?.avg || 0);
    } catch (error) {
      console.log('Tabla orders no disponible para estadísticas:', error.message);
    }

    try {
      const activityResult = await pool.query(`
        SELECT COUNT(*) as count FROM user_activity 
        WHERE DATE(created_at) = CURRENT_DATE
      `);
      dailyActivity = parseInt(activityResult.rows[0]?.count || 0);
    } catch (error) {
      console.log('Tabla user_activity no disponible:', error.message);
    }

    res.json({
      summary: {
        totalUsers: parseInt(totalUsers.rows[0].count),
        activeUsers: parseInt(activeUsers.rows[0].count),
        totalOrders,
        pendingOrders,
        revenue,
        newUsersToday: parseInt(newUsersToday.rows[0].count),
        avgOrderValue,
        dailyActivity
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas', details: error.message });
  }
};

// Obtener actividad reciente
exports.getActivity = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    let activities = [];
    
    // Try to get activities from user_activity table
    const result = await pool.query(`
      SELECT 
        ua.*,
        u.name as user_name,
        u.email as user_email
      FROM user_activity ua
      LEFT JOIN users u ON u.id = ua.user_id
      ORDER BY ua.created_at DESC
      LIMIT $1
    `, [limit]);
    
    activities = result.rows;
    
    // If no activities, generate demo data from users
    if (activities.length === 0) {
      const usersResult = await pool.query(`
        SELECT 
          id,
          name as user_name,
          email as user_email,
          created_at,
          'user_registration' as activity_type,
          'Usuario registrado en el sistema' as description
        FROM users
        ORDER BY created_at DESC
        LIMIT $1
      `, [limit]);
      
      activities = usersResult.rows.map(user => ({
        ...user,
        id: user.id,
        user_id: user.id,
        activity_type: 'user_registration',
        description: 'Usuario registrado en el sistema'
      }));
    }

    res.json(activities);
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ error: 'Error al obtener actividad', details: error.message });
  }
};

// Obtener estadísticas detalladas
exports.getDetailedStats = async (req, res) => {
  try {
    const { period = '30days' } = req.query;
    let interval = '30 days';
    
    switch(period) {
      case '7days': interval = '7 days'; break;
      case '30days': interval = '30 days'; break;
      case '90days': interval = '90 days'; break;
      case '1year': interval = '365 days'; break;
    }

    // Crecimiento de usuarios (siempre disponible)
    const userGrowth = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_users
      FROM users
      WHERE created_at >= NOW() - INTERVAL '${interval}'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    // Distribución de tipos de usuario
    const userTypes = await pool.query(`
      SELECT 
        user_type,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users), 2) as percentage
      FROM users
      GROUP BY user_type
    `);

    // Datos condicionales
    let revenueTrend = [];
    let orderStats = [];
    let activityByHour = [];

    try {
      const revenueResult = await pool.query(`
        SELECT 
          DATE(created_at) as date,
          COALESCE(SUM(total_amount), 0) as daily_revenue,
          COUNT(*) as orders_count
        FROM orders
        WHERE status = 'completed' 
          AND created_at >= NOW() - INTERVAL '${interval}'
        GROUP BY DATE(created_at)
        ORDER BY date
      `);
      revenueTrend = revenueResult.rows;
    } catch (error) {
      console.log('No se pudieron obtener tendencias de ingresos:', error.message);
    }

    try {
      const orderStatsResult = await pool.query(`
        SELECT 
          status,
          COUNT(*) as count,
          COALESCE(AVG(total_amount), 0) as avg_value
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '${interval}'
        GROUP BY status
      `);
      orderStats = orderStatsResult.rows;
    } catch (error) {
      console.log('No se pudieron obtener estadísticas de pedidos:', error.message);
    }

    try {
      const activityResult = await pool.query(`
        SELECT 
          EXTRACT(HOUR FROM created_at) as hour,
          COUNT(*) as activity_count
        FROM user_activity
        WHERE DATE(created_at) = CURRENT_DATE
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY hour
      `);
      activityByHour = activityResult.rows;
    } catch (error) {
      console.log('No se pudo obtener actividad por hora:', error.message);
    }

    res.json({
      userGrowth: userGrowth.rows,
      revenueTrend,
      orderStats,
      userTypes: userTypes.rows,
      activityByHour
    });
  } catch (error) {
    console.error('Error fetching detailed stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas detalladas', details: error.message });
  }
};

// Obtener actividad detallada
exports.getDetailedActivity = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let activities = [];
    let total = 0;
    let activityTypes = [];
    let hasUserActivity = false;

    try {
      // Verificar si la tabla user_activity existe y tiene datos
      const countResult = await pool.query('SELECT COUNT(*) as total FROM user_activity');
      total = parseInt(countResult.rows[0]?.total || 0);
      
      if (total > 0) {
        hasUserActivity = true;
        
        // Obtener datos
        const result = await pool.query(`
          SELECT 
            ua.*,
            u.name as user_name,
            u.email as user_email
          FROM user_activity ua
          LEFT JOIN users u ON u.id = ua.user_id
          ORDER BY ua.created_at DESC
          LIMIT $1 OFFSET $2
        `, [limit, offset]);
        
        activities = result.rows;

        // Obtener tipos de actividad
        const typesResult = await pool.query(`
          SELECT DISTINCT activity_type 
          FROM user_activity 
          ORDER BY activity_type
        `);
        activityTypes = typesResult.rows.map(row => row.activity_type);
      }
    } catch (error) {
      console.log('Error consultando user_activity, ignorando:', error.message);
    }

    // Si no hay actividades en user_activity, usar usuarios como actividad
    if (!hasUserActivity || activities.length === 0) {
      console.log('Usando datos de usuarios como actividad...');
      
      // Contar total de usuarios
      const userCountResult = await pool.query('SELECT COUNT(*) as total FROM users');
      total = parseInt(userCountResult.rows[0]?.total || 0);
      
      // Obtener usuarios
      const usersResult = await pool.query(`
        SELECT 
          id,
          name as user_name,
          email as user_email,
          created_at,
          'user_registration' as activity_type,
          'Usuario registrado en el sistema' as description,
          NULL as ip_address,
          id as user_id
        FROM users
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);
      
      activities = usersResult.rows;
      activityTypes = ['user_registration'];
      
      console.log(`Actividades cargadas: ${activities.length} registros, Total: ${total}`);
    }

    res.json({
      activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        activityTypes
      }
    });
  } catch (error) {
    console.error('Error fetching detailed activity:', error);
    res.status(500).json({ error: 'Error al obtener actividad detallada', details: error.message });
  }
};

// Obtener usuarios
exports.getUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20,
      search = '',
      user_type = '',
      is_active = ''
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        id, name, email, user_type, is_active, created_at
      FROM users
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (user_type) {
      query += ` AND user_type = $${paramCount}`;
      params.push(user_type);
      paramCount++;
    }

    if (is_active !== '') {
      query += ` AND is_active = $${paramCount}`;
      params.push(is_active === 'true');
      paramCount++;
    }

    // Contar total
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as subquery`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || 0);

    // Obtener datos con paginación
    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const users = await pool.query(query, params);

    // Estadísticas adicionales
    const statsQuery = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
        COUNT(CASE WHEN user_type = 'admin' THEN 1 END) as admin_count,
        COUNT(CASE WHEN user_type = 'comprador' THEN 1 END) as comprador_count,
        COUNT(CASE WHEN user_type = 'vendedor' THEN 1 END) as vendedor_count,
        COUNT(CASE WHEN user_type = 'banco' THEN 1 END) as banco_count,
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as new_today
      FROM users
    `);

    res.json({
      users: users.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: statsQuery.rows[0]
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error al obtener usuarios', details: error.message });
  }
};