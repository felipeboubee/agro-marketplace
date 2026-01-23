const express = require('express');
const router = express.Router();
const apiKeyAuth = require('../middleware/apiKeyAuth');
const bankApiController = require('../controllers/bankApiController');

// All routes require API key authentication
router.use(apiKeyAuth);

// Get certifications
router.get('/certifications', bankApiController.getCertifications);
router.get('/certifications/:id', bankApiController.getCertificationDetails);

// Get payment orders
router.get('/payment-orders', bankApiController.getPaymentOrders);
router.get('/payment-orders/:id', bankApiController.getPaymentOrderDetails);

module.exports = router;
