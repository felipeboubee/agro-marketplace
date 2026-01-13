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
      limit = 50,
      activity_type = '',
      user_id = '',
      start_date = '',
      end_date = ''
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Construir array de condiciones WHERE
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;
    
    if (user_id) {
      whereConditions.push(`user_id = $${paramIndex}`);
      params.push(user_id);
      paramIndex++;
    }
    
    if (start_date) {
      whereConditions.push(`created_at >= $${paramIndex}`);
      params.push(start_date);
      paramIndex++;
    }
    
    if (end_date) {
      whereConditions.push(`created_at <= $${paramIndex}`);
      params.push(end_date);
      paramIndex++;
    }
    
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    
    // Query para registro de usuarios
    const userQuery = `
      SELECT 
        u.id,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.created_at,
        NULL as status,
        u.user_type as bank_name,
        'user_registration' as activity_type,
        'Usuario registrado: ' || u.user_type as description
      FROM users u
      ${whereClause}
    `;
    
    // Query base para certificaciones (solicitud inicial)
    const certQuery = `
      SELECT 
        c.id,
        c.user_id,
        u.name as user_name,
        u.email as user_email,
        c.created_at,
        c.status,
        c.bank_name,
        'certification_request' as activity_type,
        'Solicitud de certificación financiera enviada a ' || c.bank_name as description
      FROM certifications c
      LEFT JOIN users u ON u.id = c.user_id
      ${whereClause}
    `;
    
    // Query para actualizaciones de estado de certificaciones
    let statusWhereConditions = [];
    let statusParamIndex = 1;
    
    if (user_id) {
      statusWhereConditions.push(`c.user_id = $${statusParamIndex}`);
      statusParamIndex++;
    }
    
    if (start_date) {
      statusWhereConditions.push(`c.reviewed_at >= $${statusParamIndex}`);
      statusParamIndex++;
    }
    
    if (end_date) {
      statusWhereConditions.push(`c.reviewed_at <= $${statusParamIndex}`);
      statusParamIndex++;
    }
    
    statusWhereConditions.push('c.reviewed_at IS NOT NULL');
    const statusWhereClause = 'WHERE ' + statusWhereConditions.join(' AND ');
    
    const certStatusQuery = `
      SELECT 
        c.id,
        c.user_id,
        u.name as user_name,
        u.email as user_email,
        c.reviewed_at as created_at,
        c.status,
        c.bank_name,
        'certification_' || c.status as activity_type,
        CASE 
          WHEN c.status = 'aprobado' THEN 'Certificación aprobada por ' || c.bank_name
          WHEN c.status = 'rechazado' THEN 'Certificación rechazada por ' || c.bank_name
          WHEN c.status = 'mas_datos' THEN 'Banco ' || c.bank_name || ' solicitó más datos'
          ELSE 'Certificación actualizada'
        END as description
      FROM certifications c
      LEFT JOIN users u ON u.id = c.user_id
      ${statusWhereClause}
    `;
    
    // Query para lotes publicados
    let lotesWhereConditions = [];
    let lotesParamIndex = 1;
    
    if (user_id) {
      lotesWhereConditions.push(`l.seller_id = $${lotesParamIndex}`);
      lotesParamIndex++;
    }
    
    if (start_date) {
      lotesWhereConditions.push(`l.created_at >= $${lotesParamIndex}`);
      lotesParamIndex++;
    }
    
    if (end_date) {
      lotesWhereConditions.push(`l.created_at <= $${lotesParamIndex}`);
      lotesParamIndex++;
    }
    
    const lotesWhereClause = lotesWhereConditions.length > 0 ? 'WHERE ' + lotesWhereConditions.join(' AND ') : '';
    
    const lotesQuery = `
      SELECT 
        l.id,
        l.seller_id as user_id,
        u.name as user_name,
        u.email as user_email,
        l.created_at,
        l.status,
        '' as bank_name,
        'lote_publicado' as activity_type,
        'Lote publicado: ' || l.animal_type || ' - ' || l.total_count || ' cabezas' as description
      FROM lotes l
      LEFT JOIN users u ON u.id = l.seller_id
      ${lotesWhereClause}
    `;
    
    // Construir la consulta UNION según el filtro de tipo
    let unionParts = [];
    
    if (!activity_type || activity_type === 'user_registration') {
      unionParts.push(userQuery);
    }
    
    if (!activity_type || activity_type === 'certification_request') {
      unionParts.push(certQuery);
    }
    
    if (!activity_type || ['certification_aprobado', 'certification_rechazado', 'certification_mas_datos'].includes(activity_type)) {
      if (activity_type && activity_type.startsWith('certification_') && activity_type !== 'certification_request') {
        // Filtrar por estado específico
        const status = activity_type.replace('certification_', '');
        const specificStatusQuery = certStatusQuery.replace(
          statusWhereClause,
          statusWhereClause + ` AND c.status = '${status}'`
        );
        unionParts.push(specificStatusQuery);
      } else if (!activity_type) {
        unionParts.push(certStatusQuery);
      }
    }
    
    if (!activity_type || activity_type === 'lote_publicado') {
      unionParts.push(lotesQuery);
    }
    
    if (unionParts.length === 0) {
      // No hay queries que coincidan con el filtro
      return res.json({
        activities: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 0
        },
        filters: {
          activityTypes: [
            'user_registration',
            'certification_request',
            'certification_aprobado',
            'certification_rechazado',
            'certification_mas_datos',
            'lote_publicado'
          ]
        }
      });
    }
    
    const unionQuery = unionParts.join(' UNION ALL ');
    
    // Obtener el total sin paginación
    const countQuery = `SELECT COUNT(*) as total FROM (${unionQuery}) as combined`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || 0);
    
    // Obtener actividades con paginación y agregar número de fila por tipo
    params.push(limit);
    params.push(offset);
    
    const finalQuery = `
      WITH ordered_activities AS (
        SELECT *,
          ROW_NUMBER() OVER (PARTITION BY activity_type ORDER BY created_at ASC) as type_sequence
        FROM (${unionQuery}) as combined
      )
      SELECT *
      FROM ordered_activities
      ORDER BY created_at DESC NULLS LAST
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const result = await pool.query(finalQuery, params);
    
    // Generar IDs únicos por tipo
    const activities = result.rows.map(activity => {
      let prefix = 'A'; // Default
      
      switch(activity.activity_type) {
        case 'user_registration':
          prefix = 'U';
          break;
        case 'certification_request':
          prefix = 'CR';
          break;
        case 'certification_aprobado':
          prefix = 'CA';
          break;
        case 'certification_rechazado':
          prefix = 'CX';
          break;
        case 'certification_mas_datos':
          prefix = 'CD';
          break;
        case 'lote_publicado':
          prefix = 'L';
          break;
      }
      
      return {
        ...activity,
        display_id: `${prefix}${activity.type_sequence}`
      };
    });
    
    // Obtener tipos de actividad disponibles
    const activityTypes = [
      'user_registration',
      'certification_request',
      'certification_aprobado',
      'certification_rechazado',
      'certification_mas_datos',
      'lote_publicado'
    ];

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
        u.id, 
        u.name, 
        u.email, 
        u.user_type,
        u.bank_name,
        u.is_active, 
        u.created_at,
        (
          SELECT MAX(activity_date)
          FROM (
            SELECT MAX(created_at) as activity_date FROM certifications WHERE user_id = u.id
            UNION ALL
            SELECT MAX(reviewed_at) as activity_date FROM certifications WHERE user_id = u.id AND reviewed_at IS NOT NULL
            UNION ALL
            SELECT MAX(updated_at) as activity_date FROM certifications WHERE user_id = u.id AND updated_at IS NOT NULL
            UNION ALL
            SELECT MAX(created_at) as activity_date FROM lotes WHERE seller_id = u.id
          ) activities
        ) as last_activity
      FROM users u
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (user_type) {
      query += ` AND u.user_type = $${paramCount}`;
      params.push(user_type);
      paramCount++;
    }

    if (is_active !== '') {
      query += ` AND u.is_active = $${paramCount}`;
      params.push(is_active === 'true');
      paramCount++;
    }

    // Contar total (sin GROUP BY porque ya no usamos JOIN)
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as subquery`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || 0);

    // Obtener datos con paginación
    query += ` ORDER BY u.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const usersResult = await pool.query(query, params);

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
      users: usersResult.rows,
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

// Obtener actividad de un usuario específico
exports.getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID es requerido' });
    }

    // Consultas para obtener toda la actividad del usuario
    const userQuery = `
      SELECT 
        id,
        created_at,
        'user_registration' as activity_type,
        'Usuario registrado' as description
      FROM users
      WHERE id = $1
    `;

    const certQuery = `
      SELECT 
        id,
        created_at,
        'certification_request' as activity_type,
        'Solicitud de certificación enviada a ' || bank_name as description
      FROM certifications
      WHERE user_id = $1 AND status = 'pendiente_aprobacion'
      
      UNION ALL
      
      SELECT 
        id,
        reviewed_at as created_at,
        'certification_approved' as activity_type,
        'Certificación aprobada por ' || bank_name as description
      FROM certifications
      WHERE user_id = $1 AND status = 'aprobado' AND reviewed_at IS NOT NULL
      
      UNION ALL
      
      SELECT 
        id,
        reviewed_at as created_at,
        'certification_rejected' as activity_type,
        'Certificación rechazada por ' || bank_name as description
      FROM certifications
      WHERE user_id = $1 AND status = 'rechazado' AND reviewed_at IS NOT NULL
      
      UNION ALL
      
      SELECT 
        id,
        reviewed_at as created_at,
        'certification_more_data' as activity_type,
        'Banco ' || bank_name || ' solicitó más datos' as description
      FROM certifications
      WHERE user_id = $1 AND status = 'mas_datos' AND reviewed_at IS NOT NULL
    `;

    const lotesQuery = `
      SELECT 
        id,
        created_at,
        'lote_published' as activity_type,
        'Lote publicado: ' || animal_type || ' (' || total_count || ' unidades)' as description
      FROM lotes
      WHERE seller_id = $1
    `;

    const ordersQuery = `
      SELECT 
        id,
        created_at,
        'order_created' as activity_type,
        'Orden creada' as description
      FROM orders
      WHERE user_id = $1
    `;

    // Combinar todas las queries
    const unionQuery = `
      ${userQuery}
      UNION ALL
      ${certQuery}
      UNION ALL
      ${lotesQuery}
    `;

    // Ejecutar la consulta principal
    let result;
    try {
      result = await pool.query(`
        SELECT * FROM (${unionQuery}) as combined
        ORDER BY created_at DESC
      `, [userId]);
    } catch (certError) {
      // Si falla (por ejemplo, tabla certifications no existe), intentar sin certificaciones
      console.log('Trying without certifications table:', certError.message);
      result = await pool.query(`
        SELECT * FROM (
          ${userQuery}
          UNION ALL
          ${lotesQuery}
        ) as combined
        ORDER BY created_at DESC
      `, [userId]);
    }

    // Intentar agregar órdenes si la tabla existe
    try {
      const ordersResult = await pool.query(ordersQuery, [userId]);
      if (ordersResult.rows.length > 0) {
        result.rows = [...result.rows, ...ordersResult.rows].sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
      }
    } catch (ordersError) {
      console.log('Orders table not available:', ordersError.message);
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Error al obtener actividad del usuario', details: error.message });
  }
};