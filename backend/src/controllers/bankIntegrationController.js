const BankIntegration = require('../models/BankIntegration');
const axios = require('axios');

const bankIntegrationController = {
  // Get or create integration for current bank
  async getMyIntegration(req, res) {
    try {
      const bankId = req.userId;
      
      let integration = await BankIntegration.findByBankId(bankId);
      
      if (!integration) {
        integration = await BankIntegration.upsert(bankId);
      }

      // Don't send the secret in the response (only show it once on creation)
      const { api_secret, webhook_secret, ...safeIntegration } = integration;
      
      res.json({
        ...safeIntegration,
        api_secret_preview: api_secret ? `${api_secret.substring(0, 8)}...` : null,
        webhook_secret_preview: webhook_secret ? `${webhook_secret.substring(0, 8)}...` : null
      });
    } catch (error) {
      console.error('Error getting integration:', error);
      res.status(500).json({ error: 'Error al obtener configuración de integración' });
    }
  },

  // Regenerate API credentials
  async regenerateCredentials(req, res) {
    try {
      const bankId = req.userId;
      
      const integration = await BankIntegration.upsert(bankId);
      
      // Return full credentials only on regeneration
      res.json({
        message: 'Credenciales regeneradas exitosamente. Guarda estos valores, no se volverán a mostrar completos.',
        api_key: integration.api_key,
        api_secret: integration.api_secret,
        webhook_secret: integration.webhook_secret
      });
    } catch (error) {
      console.error('Error regenerating credentials:', error);
      res.status(500).json({ error: 'Error al regenerar credenciales' });
    }
  },

  // Update webhook URL
  async updateWebhook(req, res) {
    try {
      const bankId = req.userId;
      const { webhook_url } = req.body;

      if (webhook_url && !webhook_url.startsWith('https://')) {
        return res.status(400).json({ error: 'La URL del webhook debe usar HTTPS' });
      }

      const integration = await BankIntegration.updateWebhook(bankId, webhook_url);
      
      res.json({
        message: 'Webhook actualizado exitosamente',
        webhook_url: integration.webhook_url,
        webhook_secret: integration.webhook_secret
      });
    } catch (error) {
      console.error('Error updating webhook:', error);
      res.status(500).json({ error: 'Error al actualizar webhook' });
    }
  },

  // Test webhook
  async testWebhook(req, res) {
    try {
      const bankId = req.userId;
      
      const integration = await BankIntegration.findByBankId(bankId);
      
      if (!integration || !integration.webhook_url) {
        return res.status(400).json({ error: 'No hay webhook configurado' });
      }

      const testPayload = {
        event: 'test',
        timestamp: new Date().toISOString(),
        message: 'Este es un webhook de prueba desde Agro Marketplace'
      };

      try {
        const response = await axios.post(integration.webhook_url, testPayload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Secret': integration.webhook_secret
          },
          timeout: 10000
        });

        await BankIntegration.logWebhook(
          integration.id,
          'test',
          testPayload,
          response.status,
          JSON.stringify(response.data)
        );

        res.json({
          success: true,
          status: response.status,
          message: 'Webhook enviado exitosamente'
        });
      } catch (webhookError) {
        await BankIntegration.logWebhook(
          integration.id,
          'test',
          testPayload,
          webhookError.response?.status || 0,
          null,
          webhookError.message
        );

        res.status(500).json({
          success: false,
          error: 'Error al enviar webhook',
          details: webhookError.message
        });
      }
    } catch (error) {
      console.error('Error testing webhook:', error);
      res.status(500).json({ error: 'Error al probar webhook' });
    }
  },

  // Get webhook logs
  async getWebhookLogs(req, res) {
    try {
      const bankId = req.userId;
      const { limit = 50 } = req.query;
      
      const logs = await BankIntegration.getWebhookLogs(bankId, parseInt(limit));
      
      res.json(logs);
    } catch (error) {
      console.error('Error getting webhook logs:', error);
      res.status(500).json({ error: 'Error al obtener logs de webhooks' });
    }
  },

  // Toggle integration active status
  async toggleActive(req, res) {
    try {
      const bankId = req.userId;
      const { is_active } = req.body;

      if (is_active) {
        await BankIntegration.activate(bankId);
      } else {
        await BankIntegration.deactivate(bankId);
      }

      res.json({ message: 'Estado actualizado exitosamente', is_active });
    } catch (error) {
      console.error('Error toggling integration:', error);
      res.status(500).json({ error: 'Error al actualizar estado' });
    }
  }
};

module.exports = bankIntegrationController;
