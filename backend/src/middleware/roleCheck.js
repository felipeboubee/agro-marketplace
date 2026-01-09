const roleCheck = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.userType) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!allowedRoles.includes(req.userType)) {
      return res.status(403).json({ error: 'Acceso denegado. Rol no autorizado.' });
    }

    next();
  };
};

module.exports = roleCheck;