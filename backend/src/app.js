const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const certificationRoutes = require('./routes/certificationRoutes');

dotenv.config();

const app = express();


// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/certifications', certificationRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor funcionando' });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal!' });
});

// Al final de backend/src/app.js, antes de app.listen():
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
      console.log('📦 Base de datos no inicializada. Ejecutando script...');
      const { initDatabase } = require('../scripts/db-init');
      await initDatabase();
    }
  } catch (error) {
    console.error('Error al inicializar base de datos:', error);
  }
}

// Llamar a la función de inicialización
initializeDatabase().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor backend corriendo en puerto ${PORT}`);
  console.log(`🌐 Accesible desde: http://localhost:${PORT}`);
  console.log(`🔗 Frontend debería usar: http://localhost:5173`);
});
