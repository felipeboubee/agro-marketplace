const express = require('express');
const router = express.Router();
const paymentOrderController = require('../controllers/paymentOrderController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All routes require authentication
router.use(auth);

// @route   GET /api/payment-orders
// @desc    Get all payment orders (bank only)
// @access  Private/Banco
router.get('/', 
  roleCheck('banco'),
  paymentOrderController.getAllOrders
);

// @route   GET /api/payment-orders/pending
// @desc    Get pending payment orders (bank only)
// @access  Private/Banco
router.get('/pending', 
  roleCheck('banco'),
  paymentOrderController.getPendingOrders
);

// @route   GET /api/payment-orders/statistics
// @desc    Get payment statistics (bank only)
// @access  Private/Banco
router.get('/statistics', 
  roleCheck('banco'),
  paymentOrderController.getStatistics
);

// @route   GET /api/payment-orders/:id
// @desc    Get payment order by ID
// @access  Private
router.get('/:id', paymentOrderController.getOrder);

// @route   PUT /api/payment-orders/:id/process
// @desc    Process payment order (bank only)
// @access  Private/Banco
router.put('/:id/process', 
  roleCheck('banco'),
  paymentOrderController.processOrder
);

// @route   PUT /api/payment-orders/:id/complete
// @desc    Complete payment order (bank only)
// @access  Private/Banco
router.put('/:id/complete', 
  roleCheck('banco'),
  paymentOrderController.completeOrder
);

// @route   PUT /api/payment-orders/:id/fail
// @desc    Mark payment order as failed (bank only)
// @access  Private/Banco
router.put('/:id/fail', 
  roleCheck('banco'),
  paymentOrderController.failOrder
);

module.exports = router;
