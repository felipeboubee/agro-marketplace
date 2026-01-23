const axios = require('axios');
const BankIntegration = require('../models/BankIntegration');

const webhookService = {
  /**
   * Send webhook notification to bank
   * @param {number} bankId - Bank user ID
   * @param {string} eventType - Event type (certification.created, payment_order.created, etc.)
   * @param {object} payload - Event payload data
   */
  async notify(bankId, eventType, payload) {
    try {
      const integration = await BankIntegration.findByBankId(bankId);

      if (!integration || !integration.is_active || !integration.webhook_url) {
        console.log(`No active webhook configured for bank ${bankId}`);
        return;
      }

      const webhookPayload = {
        event: eventType,
        timestamp: new Date().toISOString(),
        data: payload
      };

      try {
        const response = await axios.post(integration.webhook_url, webhookPayload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Secret': integration.webhook_secret,
            'X-Event-Type': eventType
          },
          timeout: 15000
        });

        await BankIntegration.logWebhook(
          integration.id,
          eventType,
          webhookPayload,
          response.status,
          JSON.stringify(response.data)
        );

        console.log(`Webhook sent successfully to bank ${bankId} for event ${eventType}`);
        return true;
      } catch (webhookError) {
        const errorMessage = webhookError.response?.data 
          ? JSON.stringify(webhookError.response.data)
          : webhookError.message;

        await BankIntegration.logWebhook(
          integration.id,
          eventType,
          webhookPayload,
          webhookError.response?.status || 0,
          errorMessage,
          webhookError.message
        );

        console.error(`Webhook failed for bank ${bankId}:`, errorMessage);
        return false;
      }
    } catch (error) {
      console.error(`Error sending webhook to bank ${bankId}:`, error);
      return false;
    }
  },

  /**
   * Notify bank of new certification request
   */
  async notifyCertificationCreated(certification, bankId) {
    return this.notify(bankId, 'certification.created', {
      certification_id: certification.id,
      user_id: certification.user_id,
      user_name: certification.user_name,
      bank_name: certification.bank_name,
      status: certification.status,
      created_at: certification.created_at
    });
  },

  /**
   * Notify bank of new payment order
   */
  async notifyPaymentOrderCreated(paymentOrder, bankId) {
    return this.notify(bankId, 'payment_order.created', {
      payment_order_id: paymentOrder.id,
      transaction_id: paymentOrder.transaction_id,
      buyer_id: paymentOrder.buyer_id,
      seller_id: paymentOrder.seller_id,
      amount: paymentOrder.amount,
      status: paymentOrder.status,
      created_at: paymentOrder.created_at
    });
  }
};

module.exports = webhookService;
