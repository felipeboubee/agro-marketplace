const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { check } = require('express-validator');

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', [
  check('email', 'Por favor incluye un email válido').isEmail(),
  check('password', 'La contraseña debe tener al menos 6 caracteres').isLength({ min: 6 }),
  check('name', 'El nombre es requerido').not().isEmpty(),
  check('user_type', 'El tipo de usuario es requerido').isIn(['comprador', 'vendedor', 'banco', 'admin'])
], authController.register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  check('email', 'Por favor incluye un email válido').isEmail(),
  check('password', 'La contraseña es requerida').exists()
], authController.login);

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', auth, authController.changePassword);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, authController.updateProfile);

module.exports = router;