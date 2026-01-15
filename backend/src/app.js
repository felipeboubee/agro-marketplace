const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const loteRoutes = require('./routes/loteRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const certificationRoutes = require('./routes/certificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const questionRoutes = require('./routes/questionRoutes');
const offerRoutes = require('./routes/offerRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const initAdminTables = require('../scripts/initAdminTables');
const requestLogger = require('./middleware/requestLogger');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos para uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads/certifications', express.static(path.join(__dirname, '../uploads/certifications')));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/lotes', loteRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/certifications', certificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use(requestLogger);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor funcionando' });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal!' });
});

// Inicializar base de datos
async function initializeDatabase() {
  try {
    const pool = require('./config/database');
    
    // Verificar si las tablas principales existen
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `;
    
    const result = await pool.query(checkQuery);
    
    if (!result.rows[0].exists) {
      console.log('📦 Base de datos no inicializada. Ejecutando script de inicialización...');
      const { initDatabase } = require('../scripts/db-init');
      await initDatabase();
    }
  } catch (error) {
    console.error('Error al inicializar base de datos:', error);
  }
}

const PORT = process.env.PORT || 5000;

// Iniciar servidor único
initializeDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`✅ Servidor backend corriendo en puerto ${PORT}`);
    console.log(`🌐 Accesible desde: http://localhost:${PORT}`);
    console.log(`🔗 Frontend debería usar: http://localhost:5173`);
    
    // Inicializar tablas del admin dashboard
    await initAdminTables();
  });
}).catch(error => {
  console.error('❌ Error al inicializar:', error);
  process.exit(1);
});