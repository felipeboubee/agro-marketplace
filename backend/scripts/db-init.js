const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function initDatabase() {
  console.log('🔧 Verificando configuración de base de datos...');
  
  const dbName = process.env.DB_NAME || 'agro_marketplace';
  console.log(`📊 Usando base de datos: ${dbName}`);

  // 1. Crear la base de datos si no existe
  await createDatabaseIfNotExists(dbName);
  
  // 2. Conectar a la base de datos y ejecutar el script
  await executeDatabaseScript(dbName);
}

async function createDatabaseIfNotExists(dbName) {
  console.log(`🔍 Verificando existencia de base de datos '${dbName}'...`);
  
  const adminPool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
  });

  try {
    // Verificar si la base de datos ya existe
    const result = await adminPool.query(`
      SELECT 1 FROM pg_database WHERE datname = $1
    `, [dbName]);
    
    if (result.rows.length === 0) {
      console.log(`📦 Creando base de datos '${dbName}'...`);
      await adminPool.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Base de datos '${dbName}' creada exitosamente`);
    } else {
      console.log(`✅ Base de datos '${dbName}' ya existe`);
    }
    
  } catch (error) {
    console.error(`❌ Error al verificar/crear base de datos:`, error.message);
    throw error;
  } finally {
    await adminPool.end();
  }
}

async function executeDatabaseScript(dbName) {
  console.log(`📋 Conectando a '${dbName}' para ejecutar script...`);
  
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: dbName,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
  });

  try {
    // Verificar conexión
    await pool.query('SELECT 1');
    console.log(`✅ Conexión establecida a '${dbName}'`);
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'init-database.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');
    
    console.log('🧹 Limpiando y preparando SQL...');
    
    // Eliminar comentarios extensos y líneas problemáticas
    let cleanSql = sql
      // Eliminar comentarios de bloque (/* ... */)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Eliminar líneas que crean la base de datos o usuarios (ya lo hicimos)
      .replace(/CREATE DATABASE.*?;/gi, '')
      .replace(/CREATE USER.*?;/gi, '')
      .replace(/GRANT.*?;/gi, '')
      .replace(/ALTER USER.*?;/gi, '')
      .replace(/\\[a-z].*/gi, '')
      // Eliminar líneas vacías múltiples
      .replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Ahora vamos a ejecutar el SQL en ORDEN CORRECTO
    
    // PRIMERO: Ejecutar todo el SQL principal (tablas, vistas, funciones) EXCEPTO índices
    console.log('📝 Ejecutando tablas, vistas y funciones...');
    
    // Dividir el SQL por punto y coma, pero mantener bloques juntos
    const statements = [];
    let currentStatement = '';
    let inDollarQuote = false;
    let inMultilineStatement = false;
    
    const lines = cleanSql.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Verificar si estamos en un bloque $$
      if (line.includes('$$')) {
        inDollarQuote = !inDollarQuote;
      }
      
      // Si la línea está vacía o es solo comentario, continuar
      if (!inDollarQuote && (line.trim() === '' || line.trim().startsWith('--'))) {
        continue;
      }
      
      currentStatement += line + '\n';
      
      // Si no estamos en un bloque $$ y la línea termina con ;, es fin de sentencia
      if (!inDollarQuote && line.trim().endsWith(';')) {
        statements.push(currentStatement.trim());
        currentStatement = '';
        inMultilineStatement = false;
      } else if (!inDollarQuote && currentStatement.trim().length > 0) {
        inMultilineStatement = true;
      }
    }
    
    // Si queda algo, agregarlo
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }
    
    console.log(`📊 Se encontraron ${statements.length} sentencias SQL`);
    
    // Filtrar y ejecutar en el orden correcto
    const tableStatements = [];
    const indexStatements = [];
    const otherStatements = [];
    
    for (const stmt of statements) {
      const upperStmt = stmt.toUpperCase();
      if (upperStmt.includes('CREATE INDEX') || upperStmt.includes('CREATE TRIGGER')) {
        indexStatements.push(stmt);
      } else if (upperStmt.includes('CREATE TABLE') || upperStmt.includes('CREATE VIEW') || 
                 upperStmt.includes('CREATE FUNCTION') || upperStmt.includes('CREATE PROCEDURE')) {
        tableStatements.push(stmt);
      } else if (stmt.trim()) {
        otherStatements.push(stmt);
      }
    }
    
    // Ejecutar en orden: tablas/vistas/funciones primero
    console.log(`🏗️  Creando ${tableStatements.length} tablas, vistas y funciones...`);
    for (let i = 0; i < tableStatements.length; i++) {
      try {
        await pool.query(tableStatements[i]);
        console.log(`✓ Tabla/vista/función ${i + 1}/${tableStatements.length} creada`);
      } catch (error) {
        // Ignorar errores de "ya existe"
        if (error.code === '42P07' || error.code === '42710' || error.code === '42P06') {
          console.log(`⏭️  Ya existe: ${error.message.split('\n')[0]}`);
        } else {
          console.error(`❌ Error al crear tabla/vista ${i + 1}:`, error.message);
          console.error('SQL:', tableStatements[i].substring(0, 200));
        }
      }
    }
    
    // Luego: otros statements (INSERTS, etc.)
    console.log(`📝 Ejecutando ${otherStatements.length} otros statements...`);
    for (let i = 0; i < otherStatements.length; i++) {
      try {
        await pool.query(otherStatements[i]);
        console.log(`✓ Otro statement ${i + 1}/${otherStatements.length} ejecutado`);
      } catch (error) {
        // Ignorar errores de duplicados en INSERTS
        if (error.code === '23505') {
          console.log(`⏭️  Datos ya existentes en statement ${i + 1}`);
        } else {
          console.error(`⚠️  Error en statement ${i + 1}:`, error.message);
        }
      }
    }
    
    // FINALMENTE: índices y triggers
    console.log(`📊 Creando ${indexStatements.length} índices y triggers...`);
    for (let i = 0; i < indexStatements.length; i++) {
      try {
        await pool.query(indexStatements[i]);
        console.log(`✓ Índice/trigger ${i + 1}/${indexStatements.length} creado`);
      } catch (error) {
        // Ignorar errores de índices/triggers ya existentes
        if (error.code === '42P07' || error.code === '42710') {
          console.log(`⏭️  Índice/trigger ya existe: ${error.message.split('\n')[0]}`);
        } else if (error.code === '42703' && error.message.includes('does not exist')) {
          console.log(`⚠️  Tabla no existe para índice ${i + 1}, omitiendo...`);
        } else {
          console.error(`⚠️  Error al crear índice/trigger ${i + 1}:`, error.message);
        }
      }
    }
    
    console.log('✅ Script de base de datos ejecutado');
    
    // Insertar datos de prueba si está en desarrollo
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      console.log('🌱 Insertando datos de prueba...');
      await insertTestData(pool);
    }
    
  } catch (error) {
    console.error('❌ Error al ejecutar script de base de datos:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function insertTestData(pool) {
  try {
    // Primero verificar si ya hay usuarios
    const result = await pool.query('SELECT COUNT(*) as count FROM users');
    
    if (parseInt(result.rows[0].count) > 0) {
      console.log('📊 Ya existen usuarios en la base de datos, omitiendo datos de prueba');
      return;
    }
    
    
    
  } catch (error) {
    console.error('❌ Error al insertar datos de prueba:', error.message);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initDatabase().catch(console.error);
}

module.exports = { initDatabase };