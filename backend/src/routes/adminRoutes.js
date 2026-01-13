const express = require('express');
const router = express.Router();  // Asegúrate de usar express.Router()
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');

const requireAdmin = (req, res, next) => {
  if (req.userType !== 'admin') {
    return res.status(403).json({ error: 'Acceso restringido a administradores' });
  }
  next();
};

// Health check (sin autenticación para debugging)
router.get('/health', adminController.healthCheck);

// Dashboard resumen
router.get('/dashboard/stats', auth, requireAdmin, adminController.getStats);
router.get('/dashboard/activity', auth, requireAdmin, adminController.getActivity);

// Vistas detalladas
router.get('/stats/detailed', auth, requireAdmin, adminController.getDetailedStats);
router.get('/activity/detailed', auth, requireAdmin, adminController.getDetailedActivity);
router.get('/users', auth, requireAdmin, adminController.getUsers);
router.get('/users/:userId/activity', auth, requireAdmin, adminController.getUserActivity);

module.exports = router;