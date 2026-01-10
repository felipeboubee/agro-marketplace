const path = require('path');
const fs = require('fs');

// La ruta correcta es ../src/config/database.js
const pool = require('../src/config/database.js');

async function initAdminTables() {
  console.log('🔄 Inicializando tablas del admin dashboard...\n');
  
  try {
    // Primero, verificar que podemos conectar a la BD
    console.log('1. Verificando conexión a la base de datos...');
    await pool.query('SELECT 1');
    console.log('   ✅ Conexión exitosa');
    
    // Leer el script SQL
    const sqlPath = path.join(__dirname, 'createAdminTables.sql');
    
    if (!fs.existsSync(sqlPath)) {
      console.error(`❌ Archivo SQL no encontrado: ${sqlPath}`);
      return;
    }
    
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('\n2. Ejecutando script SQL...');
    
    // Dividir el script en sentencias separadas
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      
      // Saltar comentarios y bloques vacíos
      if (!statement || statement.startsWith('--') || statement.startsWith('/*')) {
        continue;
      }
      
      try {
        await pool.query(statement + ';');
        console.log(`   ✅ Sentencia ${i + 1}/${statements.length} ejecutada`);
      } catch (error) {
        // Manejar errores comunes de forma específica
        const errorMsg = error.message.toLowerCase();
        
        if (errorMsg.includes('already exists') || 
            errorMsg.includes('duplicate') ||
            errorMsg.includes('ya existe')) {
          console.log(`   ⚠️  Advertencia: ${error.message.split('\n')[0]}`);
        } else if (errorMsg.includes('notice')) {
          console.log(`   ℹ️  ${error.message}`);
        } else {
          console.error(`   ❌ Error en sentencia ${i + 1}: ${error.message}`);
        }
      }
    }
    
    console.log('\n3. Verificando tablas creadas...');
    
    // Verificar las tablas creadas
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN ('user_activity', 'orders')
      ORDER BY table_name
    `);
    
    console.log('✅ Tablas disponibles:', result.rows.map(r => r.table_name));
    
    // Verificar conteos
    console.log('\n4. Conteo de registros...');
    
    try {
      const activityCount = await pool.query('SELECT COUNT(*) FROM user_activity');
      console.log(`   📝 user_activity: ${activityCount.rows[0].count} registros`);
    } catch (error) {
      console.log(`   📝 user_activity: No disponible - ${error.message}`);
    }
    
    try {
      const ordersCount = await pool.query('SELECT COUNT(*) FROM orders');
      console.log(`   🛒 orders: ${ordersCount.rows[0].count} registros`);
    } catch (error) {
      console.log(`   🛒 orders: No disponible - ${error.message}`);
    }
    
    console.log('\n🎉 Inicialización completada con éxito!');
    
  } catch (error) {
    console.error('❌ Error inicializando tablas:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  initAdminTables()
    .then(() => {
      console.log('\n✅ Script completado. Saliendo...');
      setTimeout(() => process.exit(0), 2000);
    })
    .catch(error => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = initAdminTables;