const PaymentOrder = require('../models/PaymentOrder');
const Transaction = require('../models/Transaction');
const notificationService = require('../services/notificationService');
const webhookService = require('../services/webhookService');
const pool = require('../config/database');

const paymentOrderController = {
  // Get all payment orders (bank only)
  async getAllOrders(req, res) {
    try {
      // Verify user is banco
      const user = await require('../models/User').findById(req.userId);
      if (user.user_type !== 'banco') {
        return res.status(403).json({ error: 'Acceso denegado' });
      }

      const orders = await PaymentOrder.findAll();
      res.json(orders);
    } catch (error) {
      console.error('Error fetching payment orders:', error);
      res.status(500).json({ error: 'Error al obtener las órdenes de pago' });
    }
  },

  // Get pending payment orders (bank only)
  async getPendingOrders(req, res) {
    try {
      // Verify user is banco
      const user = await require('../models/User').findById(req.userId);
      if (user.user_type !== 'banco') {
        return res.status(403).json({ error: 'Acceso denegado' });
      }

      const orders = await PaymentOrder.findPending();
      res.json(orders);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      res.status(500).json({ error: 'Error al obtener órdenes pendientes' });
    }
  },

  // Get payment order by ID
  async getOrder(req, res) {
    try {
      const { id } = req.params;
      const order = await PaymentOrder.findById(id);

      if (!order) {
        return res.status(404).json({ error: 'Orden de pago no encontrada' });
      }

      // Verify access
      const user = await require('../models/User').findById(req.userId);
      if (user.user_type !== 'banco' && order.buyer_id !== req.userId && order.seller_id !== req.userId) {
        return res.status(403).json({ error: 'No tienes acceso a esta orden' });
      }

      res.json(order);
    } catch (error) {
      console.error('Error fetching payment order:', error);
      res.status(500).json({ error: 'Error al obtener la orden de pago' });
    }
  },

  // Process payment order (bank only)
  async processOrder(req, res) {
    try {
      const { id } = req.params;
      const { bank_reference } = req.body;

      // Verify user is banco
      const user = await require('../models/User').findById(req.userId);
      if (user.user_type !== 'banco') {
        return res.status(403).json({ error: 'Acceso denegado' });
      }

      // Get order
      const order = await PaymentOrder.findById(id);
      if (!order) {
        return res.status(404).json({ error: 'Orden de pago no encontrada' });
      }

      // Update order status to processing
      const updatedOrder = await PaymentOrder.updateStatus(id, {
        status: 'processing',
        bank_reference: bank_reference || `REF-${Date.now()}`
      });

      res.json(updatedOrder);
    } catch (error) {
      console.error('Error processing payment order:', error);
      res.status(500).json({ error: 'Error al procesar la orden' });
    }
  },

  // Complete payment order (bank only) - This is where bank would call their API
  async completeOrder(req, res) {
    try {
      const { id } = req.params;
      const { bank_api_response } = req.body;

      // Verify user is banco
      const user = await require('../models/User').findById(req.userId);
      if (user.user_type !== 'banco') {
        return res.status(403).json({ error: 'Acceso denegado' });
      }

      // Get order
      const order = await PaymentOrder.findById(id);
      if (!order) {
        return res.status(404).json({ error: 'Orden de pago no encontrada' });
      }

      // Update order status to completed
      const updatedOrder = await PaymentOrder.updateStatus(id, {
        status: 'completed',
        bank_api_response: JSON.stringify(bank_api_response || { completed: true, timestamp: new Date() })
      });

      // Update transaction status to completed
      await Transaction.updateStatus(order.transaction_id, 'completed');

      // Mark lote as sold when transaction is completed
      const transactionLoteResult = await pool.query(
        'SELECT lote_id FROM transactions WHERE id = $1',
        [order.transaction_id]
      );
      if (transactionLoteResult.rows.length > 0 && transactionLoteResult.rows[0].lote_id) {
        await pool.query(
          'UPDATE lotes SET status = $1 WHERE id = $2',
          ['completo', transactionLoteResult.rows[0].lote_id]
        );
      }

      // Get transaction details for notifications
      const transactionResult = await pool.query(
        'SELECT buyer_id, seller_id, final_amount FROM transactions WHERE id = $1',
        [order.transaction_id]
      );
      const transaction = transactionResult.rows[0];

      // Determine if provisional or final payment
      const isProvisional = order.order_type === 'provisional';

      // Notify buyer
      if (isProvisional) {
        await notificationService.notifyBuyerProvisionalPaymentApproved(
          transaction.buyer_id,
          order.transaction_id,
          order.amount
        ).catch(err => console.error('Error sending notification:', err));

        // Also notify seller about provisional payment
        await notificationService.notifyProvisionalPaymentApproved(
          transaction.seller_id,
          order.transaction_id,
          order.amount
        ).catch(err => console.error('Error sending notification:', err));
      } else {
        await notificationService.notifyBuyerFinalPaymentApproved(
          transaction.buyer_id,
          order.transaction_id,
          order.amount
        ).catch(err => console.error('Error sending notification:', err));

        // Also notify seller about final payment
        await notificationService.notifyFinalPaymentApproved(
          transaction.seller_id,
          order.transaction_id,
          order.amount
        ).catch(err => console.error('Error sending notification:', err));

        // Notify both about transaction completion
        await notificationService.notifyTransactionCompleted(
          transaction.seller_id,
          order.transaction_id,
          transaction.final_amount
        ).catch(err => console.error('Error sending notification:', err));

        await notificationService.notifyBuyerTransactionCompleted(
          transaction.buyer_id,
          order.transaction_id,
          transaction.final_amount
        ).catch(err => console.error('Error sending notification:', err));
      }

      res.json(updatedOrder);
    } catch (error) {
      console.error('Error completing payment order:', error);
      res.status(500).json({ error: 'Error al completar la orden' });
    }
  },

  // Fail payment order (bank only)
  async failOrder(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      // Verify user is banco
      const user = await require('../models/User').findById(req.userId);
      if (user.user_type !== 'banco') {
        return res.status(403).json({ error: 'Acceso denegado' });
      }

      // Update order status to failed
      const updatedOrder = await PaymentOrder.updateStatus(id, {
        status: 'failed',
        bank_api_response: JSON.stringify({ error: reason, timestamp: new Date() })
      });

      res.json(updatedOrder);
    } catch (error) {
      console.error('Error failing payment order:', error);
      res.status(500).json({ error: 'Error al marcar orden como fallida' });
    }
  },

  // Get payment statistics (bank only)
  async getStatistics(req, res) {
    try {
      // Verify user is banco
      const user = await require('../models/User').findById(req.userId);
      if (user.user_type !== 'banco') {
        return res.status(403).json({ error: 'Acceso denegado' });
      }

      const stats = await PaymentOrder.getStatistics();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching payment statistics:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }
};

module.exports = paymentOrderController;
