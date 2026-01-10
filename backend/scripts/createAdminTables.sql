-- Tabla de actividad de usuarios (si no existe)
CREATE TABLE IF NOT EXISTS user_activity (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  activity_type VARCHAR(100) NOT NULL,
  description TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agregar columnas faltantes a user_activity si es necesario
DO $$
BEGIN
  -- Verificar y agregar columna ip_address si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_activity' AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE user_activity ADD COLUMN ip_address VARCHAR(45);
  END IF;
  
  -- Verificar y agregar columna user_agent si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_activity' AND column_name = 'user_agent'
  ) THEN
    ALTER TABLE user_activity ADD COLUMN user_agent TEXT;
  END IF;
END $$;

-- Tabla de pedidos (simplificada para el marketplace)
-- Primero verificar si la tabla ya existe con diferente estructura
DO $$
BEGIN
  -- Verificar si la tabla orders existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'orders'
  ) THEN
    -- Crear tabla si no existe
    CREATE TABLE orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      product_name VARCHAR(255) NOT NULL,
      quantity INTEGER NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  ELSE
    -- Si la tabla ya existe, agregar columnas faltantes
    
    -- Verificar y agregar columna product_name si no existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'product_name'
    ) THEN
      ALTER TABLE orders ADD COLUMN product_name VARCHAR(255);
    END IF;
    
    -- Verificar y agregar columna quantity si no existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'quantity'
    ) THEN
      ALTER TABLE orders ADD COLUMN quantity INTEGER DEFAULT 1;
    END IF;
    
    -- Verificar y agregar columna total_amount si no existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'total_amount'
    ) THEN
      ALTER TABLE orders ADD COLUMN total_amount DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    -- Verificar y agregar columna status si no existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'status'
    ) THEN
      ALTER TABLE orders ADD COLUMN status VARCHAR(50) DEFAULT 'pending';
    END IF;
    
    -- Verificar y agregar columna updated_at si no existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'updated_at'
    ) THEN
      ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
  END IF;
END $$;

-- Índices para mejor performance (solo si no existen)
DO $$
BEGIN
  -- Índices para user_activity
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_activity_user_id') THEN
    CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_activity_created_at') THEN
    CREATE INDEX idx_user_activity_created_at ON user_activity(created_at);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_activity_type') THEN
    CREATE INDEX idx_user_activity_type ON user_activity(activity_type);
  END IF;
  
  -- Índices para orders
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_user_id') THEN
    CREATE INDEX idx_orders_user_id ON orders(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_created_at') THEN
    CREATE INDEX idx_orders_created_at ON orders(created_at);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_status') THEN
    CREATE INDEX idx_orders_status ON orders(status);
  END IF;
END $$;

-- Insertar datos de ejemplo si las tablas están vacías
DO $$
DECLARE
  user_count INTEGER;
  activity_count INTEGER;
  order_count INTEGER;
BEGIN
  -- Contar registros existentes
  SELECT COUNT(*) INTO user_count FROM users;
  SELECT COUNT(*) INTO activity_count FROM user_activity;
  SELECT COUNT(*) INTO order_count FROM orders;
  
  -- Insertar actividad de ejemplo solo si hay usuarios y no hay actividad
  IF user_count > 0 AND activity_count = 0 THEN
    INSERT INTO user_activity (user_id, activity_type, description, created_at)
    SELECT 
      id,
      CASE 
        WHEN user_type = 'admin' THEN 'admin_login'
        WHEN user_type = 'comprador' THEN 'buyer_browsing'
        WHEN user_type = 'vendedor' THEN 'seller_listing'
        ELSE 'user_activity'
      END,
      'Actividad inicial del usuario',
      created_at + INTERVAL '1 hour'
    FROM users
    ORDER BY id
    LIMIT 20;
    
    RAISE NOTICE 'Insertadas % actividades de ejemplo', 20;
  END IF;
  
  -- Insertar pedidos de ejemplo solo si hay usuarios compradores/vendedores y no hay pedidos
  IF user_count > 0 AND order_count = 0 THEN
    -- Primero asegurarnos que la columna product_name existe
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'product_name'
    ) THEN
      INSERT INTO orders (user_id, product_name, quantity, total_amount, status, created_at)
      SELECT 
        u.id,
        CASE 
          WHEN u.user_type = 'comprador' THEN 'Producto Agrícola'
          WHEN u.user_type = 'vendedor' THEN 'Cosecha de Trigo'
          ELSE 'Producto Varios'
        END,
        FLOOR(RANDOM() * 10) + 1,
        (FLOOR(RANDOM() * 1000) + 100)::DECIMAL,
        CASE 
          WHEN RANDOM() > 0.5 THEN 'completed'
          ELSE 'pending'
        END,
        u.created_at + INTERVAL '2 days'
      FROM users u
      WHERE u.user_type IN ('comprador', 'vendedor')
      ORDER BY u.id
      LIMIT 15;
      
      RAISE NOTICE 'Insertados % pedidos de ejemplo', 15;
    END IF;
  END IF;
END $$;

-- Verificar y mostrar estado de las tablas
DO $$
BEGIN
  RAISE NOTICE '=== Estado de las tablas del Admin Dashboard ===';
  
  -- Mostrar información de user_activity
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_activity') THEN
    RAISE NOTICE 'Tabla user_activity: OK';
    EXECUTE 'SELECT COUNT(*) as total FROM user_activity' INTO activity_count;
    RAISE NOTICE '  Registros: %', activity_count;
  ELSE
    RAISE NOTICE 'Tabla user_activity: NO EXISTE';
  END IF;
  
  -- Mostrar información de orders
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    RAISE NOTICE 'Tabla orders: OK';
    EXECUTE 'SELECT COUNT(*) as total FROM orders' INTO order_count;
    RAISE NOTICE '  Registros: %', order_count;
    
    -- Mostrar columnas de orders
    RAISE NOTICE '  Columnas disponibles:';
    FOR col_info IN (
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      ORDER BY ordinal_position
    ) LOOP
      RAISE NOTICE '    - % (%)', col_info.column_name, col_info.data_type;
    END LOOP;
  ELSE
    RAISE NOTICE 'Tabla orders: NO EXISTE';
  END IF;
END $$;