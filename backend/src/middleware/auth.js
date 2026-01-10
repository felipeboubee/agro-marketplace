const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Acceso denegado. No hay token proporcionado.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_agro_marketplace');
    
    // Adjuntar información del usuario al request
    req.userId = decoded.userId;
    req.userType = decoded.userType;
    req.email = decoded.email;
    
    next();
  } catch (error) {
    console.error('Error de autenticación:', error.message);
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

module.exports = auth;