const pool = require('../config/database');
const crypto = require('crypto');

const BankIntegration = {
  // Generate API key and secret
  generateCredentials() {
    const apiKey = 'agro_' + crypto.randomBytes(24).toString('hex');
    const apiSecret = crypto.randomBytes(48).toString('hex');
    return { apiKey, apiSecret };
  },

  // Generate webhook secret
  generateWebhookSecret() {
    return 'whsec_' + crypto.randomBytes(24).toString('hex');
  },

  // Create or update integration for a bank
  async upsert(bankId, webhookUrl = null) {
    // Check if integration already exists
    const existing = await pool.query(
      'SELECT id FROM bank_integrations WHERE bank_id = $1',
      [bankId]
    );

    if (existing.rows.length > 0) {
      // Update existing
      const { apiKey, apiSecret } = this.generateCredentials();
      const webhookSecret = webhookUrl ? this.generateWebhookSecret() : null;
      
      const result = await pool.query(
        `UPDATE bank_integrations 
         SET api_key = $1, api_secret = $2, webhook_url = $3, webhook_secret = $4, 
             updated_at = CURRENT_TIMESTAMP
         WHERE bank_id = $5
         RETURNING *`,
        [apiKey, apiSecret, webhookUrl, webhookSecret, bankId]
      );
      return result.rows[0];
    } else {
      // Create new
      const { apiKey, apiSecret } = this.generateCredentials();
      const webhookSecret = webhookUrl ? this.generateWebhookSecret() : null;
      
      const result = await pool.query(
        `INSERT INTO bank_integrations (bank_id, api_key, api_secret, webhook_url, webhook_secret)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [bankId, apiKey, apiSecret, webhookUrl, webhookSecret]
      );
      return result.rows[0];
    }
  },

  // Get integration by bank ID
  async findByBankId(bankId) {
    const result = await pool.query(
      'SELECT * FROM bank_integrations WHERE bank_id = $1',
      [bankId]
    );
    return result.rows[0];
  },

  // Get integration by API key
  async findByApiKey(apiKey) {
    const result = await pool.query(
      'SELECT * FROM bank_integrations WHERE api_key = $1 AND is_active = true',
      [apiKey]
    );
    return result.rows[0];
  },

  // Update last used timestamp
  async updateLastUsed(id) {
    await pool.query(
      'UPDATE bank_integrations SET last_used_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  },

  // Update webhook URL
  async updateWebhook(bankId, webhookUrl) {
    const webhookSecret = webhookUrl ? this.generateWebhookSecret() : null;
    
    const result = await pool.query(
      `UPDATE bank_integrations 
       SET webhook_url = $1, webhook_secret = $2, updated_at = CURRENT_TIMESTAMP
       WHERE bank_id = $3
       RETURNING *`,
      [webhookUrl, webhookSecret, bankId]
    );
    return result.rows[0];
  },

  // Deactivate integration
  async deactivate(bankId) {
    await pool.query(
      'UPDATE bank_integrations SET is_active = false WHERE bank_id = $1',
      [bankId]
    );
  },

  // Activate integration
  async activate(bankId) {
    await pool.query(
      'UPDATE bank_integrations SET is_active = true WHERE bank_id = $1',
      [bankId]
    );
  },

  // Log webhook call
  async logWebhook(bankIntegrationId, eventType, payload, responseStatus, responseBody, errorMessage = null) {
    await pool.query(
      `INSERT INTO webhook_logs (bank_integration_id, event_type, payload, response_status, response_body, error_message)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [bankIntegrationId, eventType, JSON.stringify(payload), responseStatus, responseBody, errorMessage]
    );
  },

  // Get webhook logs
  async getWebhookLogs(bankId, limit = 50) {
    const result = await pool.query(
      `SELECT wl.* 
       FROM webhook_logs wl
       JOIN bank_integrations bi ON bi.id = wl.bank_integration_id
       WHERE bi.bank_id = $1
       ORDER BY wl.created_at DESC
       LIMIT $2`,
      [bankId, limit]
    );
    return result.rows;
  }
};

module.exports = BankIntegration;
