const express = require('express');
const router = express.Router();
const sellerBankAccountController = require('../controllers/sellerBankAccountController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get all bank accounts for logged in user
router.get('/', sellerBankAccountController.getMyBankAccounts);

// Get bank account by ID
router.get('/:id', sellerBankAccountController.getById);

// Get default bank account
router.get('/default', sellerBankAccountController.getDefault);

// Get bank account for a specific seller (for payment orders)
router.get('/seller/:sellerId', sellerBankAccountController.getSellerBankAccount);

// Create new bank account
router.post('/', sellerBankAccountController.create);

// Set bank account as default
router.put('/:id/set-default', sellerBankAccountController.setDefault);

// Update bank account
router.put('/:id', sellerBankAccountController.update);

// Delete bank account
router.delete('/:id', sellerBankAccountController.delete);

// Bank verification routes
router.get('/unverified/all', sellerBankAccountController.getUnverified);
router.put('/:id/verify', sellerBankAccountController.verify);
router.put('/:id/reject', sellerBankAccountController.reject);

module.exports = router;
