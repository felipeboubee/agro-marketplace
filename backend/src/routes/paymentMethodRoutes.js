const express = require('express');
const router = express.Router();
const paymentMethodController = require('../controllers/paymentMethodController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get all payment methods for logged in user
router.get('/', paymentMethodController.getMyPaymentMethods);

// Get payment method by ID
router.get('/:id', paymentMethodController.getById);

// Get default payment method
router.get('/default', paymentMethodController.getDefault);

// Create new payment method
router.post('/', paymentMethodController.create);

// Set payment method as default
router.put('/:id/set-default', paymentMethodController.setDefault);

// Update payment method
router.put('/:id', paymentMethodController.update);

// Delete payment method
router.delete('/:id', paymentMethodController.delete);

// Bank verification routes
router.get('/unverified/all', paymentMethodController.getUnverified);
router.put('/:id/verify', paymentMethodController.verify);
router.put('/:id/reject', paymentMethodController.reject);

module.exports = router;
