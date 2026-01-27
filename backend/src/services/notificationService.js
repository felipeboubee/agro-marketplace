const pool = require('../config/database');

const notificationService = {
  /**
   * Create a notification for a user
   * @param {number} userId - User ID to receive the notification
   * @param {string} type - Notification type
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {object} data - Additional data (optional)
   */
  async create(userId, type, title, message, data = {}) {
    try {
      const result = await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, data, is_read)
         VALUES ($1, $2, $3, $4, $5, false)
         RETURNING *`,
        [userId, type, title, message, JSON.stringify(data)]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  // ============ VENDEDOR NOTIFICATIONS ============

  async notifyLotePublished(sellerId, loteId, animalType) {
    return this.create(
      sellerId,
      'lote_published',
      'Lote publicado exitosamente',
      `Tu lote de ${animalType} ha sido publicado y está disponible para recibir ofertas.`,
      { lote_id: loteId }
    );
  },

  async notifyOfferReceived(sellerId, offerId, loteId, buyerName, offerAmount) {
    return this.create(
      sellerId,
      'offer_received',
      'Nueva oferta recibida',
      `${buyerName} ha realizado una oferta de $${offerAmount.toLocaleString()} por tu lote.`,
      { offer_id: offerId, lote_id: loteId }
    );
  },

  async notifyCounterOfferResponse(sellerId, offerId, accepted, buyerName) {
    return this.create(
      sellerId,
      accepted ? 'counter_offer_accepted' : 'counter_offer_rejected',
      accepted ? 'Contraoferta aceptada' : 'Contraoferta rechazada',
      accepted 
        ? `${buyerName} aceptó tu contraoferta. La transacción ha sido creada.`
        : `${buyerName} rechazó tu contraoferta.`,
      { offer_id: offerId }
    );
  },

  async notifyWeightConfirmed(sellerId, transactionId, buyerName, confirmedWeight) {
    return this.create(
      sellerId,
      'weight_confirmed',
      'Peso confirmado por comprador',
      `${buyerName} confirmó el peso de ${confirmedWeight} kg. Puedes proceder con el envío.`,
      { transaction_id: transactionId }
    );
  },

  async notifyProvisionalPaymentApproved(sellerId, transactionId, amount) {
    return this.create(
      sellerId,
      'provisional_payment_approved',
      'Orden de pago previsoria aprobada',
      `El banco aprobó la orden de pago previsoria por $${amount.toLocaleString()}. Procede con el envío del ganado.`,
      { transaction_id: transactionId }
    );
  },

  async notifyFinalPaymentApproved(sellerId, transactionId, amount) {
    return this.create(
      sellerId,
      'final_payment_approved',
      'Orden de pago final aprobada',
      `El banco aprobó el pago final por $${amount.toLocaleString()}. El dinero está en camino.`,
      { transaction_id: transactionId }
    );
  },

  async notifyTransactionCompleted(sellerId, transactionId, amount) {
    return this.create(
      sellerId,
      'transaction_completed',
      'Transacción completada',
      `La transacción por $${amount.toLocaleString()} se ha completado exitosamente.`,
      { transaction_id: transactionId }
    );
  },

  // ============ COMPRADOR NOTIFICATIONS ============

  async notifyCertificationApproved(buyerId, certificationId, bankName) {
    return this.create(
      buyerId,
      'certification_approved',
      'Certificación aprobada',
      `${bankName} aprobó tu solicitud de certificación financiera. Ya puedes realizar ofertas.`,
      { certification_id: certificationId }
    );
  },

  async notifyOfferResponse(buyerId, offerId, accepted, sellerName) {
    return this.create(
      buyerId,
      accepted ? 'offer_accepted' : 'offer_rejected',
      accepted ? 'Oferta aceptada' : 'Oferta rechazada',
      accepted
        ? `${sellerName} aceptó tu oferta. La transacción ha sido creada.`
        : `${sellerName} rechazó tu oferta.`,
      { offer_id: offerId }
    );
  },

  async notifyCounterOfferReceived(buyerId, offerId, sellerName, counterAmount) {
    return this.create(
      buyerId,
      'counter_offer_received',
      'Contraoferta recibida',
      `${sellerName} envió una contraoferta por $${counterAmount.toLocaleString()}.`,
      { offer_id: offerId }
    );
  },

  async notifyWeightUpdated(buyerId, transactionId, sellerName, newWeight) {
    return this.create(
      buyerId,
      'weight_updated',
      'Peso actualizado por vendedor',
      `${sellerName} actualizó el peso del ganado a ${newWeight} kg. Por favor, revisa y confirma.`,
      { transaction_id: transactionId }
    );
  },

  async notifyBuyerProvisionalPaymentApproved(buyerId, transactionId, amount) {
    return this.create(
      buyerId,
      'provisional_payment_approved',
      'Orden de pago previsoria aprobada',
      `El banco aprobó la orden de pago previsoria por $${amount.toLocaleString()}. El vendedor procederá con el envío.`,
      { transaction_id: transactionId }
    );
  },

  async notifyBuyerFinalPaymentApproved(buyerId, transactionId, amount) {
    return this.create(
      buyerId,
      'final_payment_approved',
      'Orden de pago final aprobada',
      `El banco aprobó el pago final por $${amount.toLocaleString()}.`,
      { transaction_id: transactionId }
    );
  },

  async notifyBuyerTransactionCompleted(buyerId, transactionId, amount) {
    return this.create(
      buyerId,
      'transaction_completed',
      'Transacción completada',
      `La transacción por $${amount.toLocaleString()} se ha completado exitosamente.`,
      { transaction_id: transactionId }
    );
  },

  // ============ BANCO NOTIFICATIONS ============

  async notifyCertificationReceived(bankId, certificationId, userName) {
    return this.create(
      bankId,
      'certification_received',
      'Nueva solicitud de certificación',
      `${userName} ha solicitado una certificación financiera. Revisa y procesa la solicitud.`,
      { certification_id: certificationId }
    );
  },

  async notifyProvisionalPaymentOrderReceived(bankId, paymentOrderId, amount, buyerName) {
    return this.create(
      bankId,
      'provisional_payment_order_received',
      'Nueva orden de pago previsoria',
      `Orden de pago previsoria de ${buyerName} por $${amount.toLocaleString()}. Requiere aprobación.`,
      { payment_order_id: paymentOrderId }
    );
  },

  async notifyFinalPaymentOrderReceived(bankId, paymentOrderId, amount, buyerName) {
    return this.create(
      bankId,
      'final_payment_order_received',
      'Nueva orden de pago final',
      `Orden de pago final de ${buyerName} por $${amount.toLocaleString()}. Requiere procesamiento.`,
      { payment_order_id: paymentOrderId }
    );
  },

  // ============ UTILITY METHODS ============

  async getUserNotifications(userId, options = {}) {
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    const unreadOnly = options.unreadOnly || false;
    
    let query = `SELECT * FROM notifications WHERE user_id = $1`;
    const params = [userId];
    
    if (unreadOnly) {
      query += ' AND is_read = false';
    }
    
    query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    return result.rows;
  },

  async getUnreadCount(userId) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    return parseInt(result.rows[0].count);
  },

  async markAsRead(notificationId, userId) {
    await pool.query(
      'UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    );
  },

  async markAllAsRead(userId) {
    await pool.query(
      'UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND is_read = false',
      [userId]
    );
  }
};

module.exports = notificationService;
