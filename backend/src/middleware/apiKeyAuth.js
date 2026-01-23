const BankIntegration = require('../models/BankIntegration');

/**
 * Middleware to authenticate requests using API key
 * Expects header: X-API-Key: agro_xxxxx
 */
const apiKeyAuth = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({ 
        error: 'API key requerida',
        message: 'Incluye el header X-API-Key con tu clave de API'
      });
    }

    const integration = await BankIntegration.findByApiKey(apiKey);

    if (!integration) {
      return res.status(401).json({ 
        error: 'API key inválida o inactiva'
      });
    }

    // Update last used timestamp
    await BankIntegration.updateLastUsed(integration.id);

    // Attach bank info to request
    req.bankId = integration.bank_id;
    req.integrationId = integration.id;

    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    res.status(500).json({ error: 'Error de autenticación' });
  }
};

module.exports = apiKeyAuth;
