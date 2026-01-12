const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// @route   POST /api/transactions
// @desc    Create a new transaction
// @access  Private/Comprador
router.post('/', 
  auth, 
  roleCheck('comprador'), 
  transactionController.createTransaction
);

// @route   GET /api/transactions/buyer
// @desc    Get buyer's transactions
// @access  Private/Comprador
router.get('/buyer', 
  auth, 
  roleCheck('comprador'), 
  transactionController.getBuyerTransactions
);

// @route   GET /api/transactions/buyer/stats
// @desc    Get buyer's statistics
// @access  Private/Comprador
router.get('/buyer/stats', 
  auth, 
  roleCheck('comprador'), 
  transactionController.getBuyerStats
);

// @route   GET /api/transactions/seller
// @desc    Get seller's transactions
// @access  Private/Vendedor
router.get('/seller', 
  auth, 
  roleCheck('vendedor'), 
  transactionController.getSellerTransactions
);

// @route   PUT /api/transactions/:id/status
// @desc    Update transaction status
// @access  Private (seller or buyer)
router.put('/:id/status', 
  auth, 
  transactionController.updateTransactionStatus
);

// @route   GET /api/transactions/admin/all
// @desc    Get all transactions (admin only)
// @access  Private/Admin
router.get('/admin/all', 
  auth, 
  roleCheck('admin'), 
  transactionController.getAllTransactions
);

// @route   GET /api/transactions/admin/stats
// @desc    Get transaction statistics (admin only)
// @access  Private/Admin
router.get('/admin/stats', 
  auth, 
  roleCheck('admin'), 
  transactionController.getTransactionStats
);

module.exports = router;