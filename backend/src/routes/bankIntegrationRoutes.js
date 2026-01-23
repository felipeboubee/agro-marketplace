const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const bankIntegrationController = require('../controllers/bankIntegrationController');

// Middleware to ensure user is a bank
const requireBank = (req, res, next) => {
  if (req.userType !== 'banco') {
    return res.status(403).json({ error: 'Acceso restringido a bancos' });
  }
  next();
};

// All routes require authentication and bank role
router.use(auth, requireBank);

// Get current integration configuration
router.get('/config', bankIntegrationController.getMyIntegration);

// Regenerate API credentials
router.post('/regenerate', bankIntegrationController.regenerateCredentials);

// Update webhook URL
router.put('/webhook', bankIntegrationController.updateWebhook);

// Test webhook
router.post('/webhook/test', bankIntegrationController.testWebhook);

// Get webhook logs
router.get('/webhook/logs', bankIntegrationController.getWebhookLogs);

// Toggle integration active status
router.put('/toggle', bankIntegrationController.toggleActive);

module.exports = router;
