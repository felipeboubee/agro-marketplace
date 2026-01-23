const Transaction = require('../models/Transaction');
const Offer = require('../models/Offer');
const PaymentOrder = require('../models/PaymentOrder');
const Lote = require('../models/Lote');
const notificationService = require('../services/notificationService');
const pool = require('../config/database');

const transactionController = {
  // Create transaction after offer is accepted
  async createTransaction(req, res) {
    try {
      const { offer_id } = req.body;
      
      // Get offer details
      const offer = await Offer.findById(offer_id);
      if (!offer) {
        return res.status(404).json({ error: 'Oferta no encontrada' });
      }

      // Check if offer is accepted
      if (offer.status !== 'aceptada') {
        return res.status(400).json({ error: 'La oferta debe estar aceptada' });
      }

      // Check if transaction already exists
      const existingTransaction = await Transaction.findByOfferId(offer_id);
      if (existingTransaction) {
        return res.status(400).json({ error: 'Ya existe una transacción para esta oferta' });
      }

      // Get lote details to calculate estimated total
      const lote = await Lote.findById(offer.lote_id);
      const estimatedWeight = parseFloat(lote.total_count) * parseFloat(lote.average_weight);
      const estimatedTotal = parseFloat(offer.offered_price) * estimatedWeight;

      // Create transaction
      const transaction = await Transaction.create({
        offer_id: offer.id,
        buyer_id: offer.buyer_id,
        seller_id: offer.seller_id,
        lote_id: offer.lote_id,
        agreed_price_per_kg: offer.offered_price,
        estimated_weight: estimatedWeight,
        estimated_total: estimatedTotal
      });

      res.status(201).json({
        message: 'Transacción creada exitosamente',
        transaction
      });
    } catch (error) {
      console.error('Error creating transaction:', error);
      res.status(500).json({ error: 'Error al crear la transacción' });
    }
  },

  // Get transaction by ID
  async getTransaction(req, res) {
    try {
      const { id } = req.params;
      const transaction = await Transaction.findById(id);
      
      if (!transaction) {
        return res.status(404).json({ error: 'Transacción no encontrada' });
      }

      // Verify user has access to this transaction
      if (transaction.buyer_id !== req.userId && transaction.seller_id !== req.userId) {
        return res.status(403).json({ error: 'No tienes acceso a esta transacción' });
      }

      res.json(transaction);
    } catch (error) {
      console.error('Error fetching transaction:', error);
      res.status(500).json({ error: 'Error al obtener la transacción' });
    }
  },

  // Get my transactions (buyer or seller)
  async getMyTransactions(req, res) {
    try {
      const userId = req.userId;
      const user = await require('../models/User').findById(userId);
      const userType = user.user_type;

      let transactions;
      if (userType === 'comprador') {
        transactions = await Transaction.findByBuyerId(userId);
      } else if (userType === 'vendedor') {
        transactions = await Transaction.findBySellerId(userId);
      } else {
        return res.status(403).json({ error: 'Tipo de usuario no válido' });
      }

      res.json(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: 'Error al obtener las transacciones' });
    }
  },

  // Update weight from balance (seller only)
  async updateWeight(req, res) {
    try {
      const { id } = req.params;
      const { actual_weight, balance_ticket_url } = req.body;

      // Get transaction
      const transaction = await Transaction.findById(id);
      if (!transaction) {
        return res.status(404).json({ error: 'Transacción no encontrada' });
      }

      // Verify seller owns this transaction
      if (transaction.seller_id !== req.userId) {
        return res.status(403).json({ error: 'Solo el vendedor puede actualizar el peso' });
      }

      // Verify transaction status
      if (transaction.status !== 'pending_weight') {
        return res.status(400).json({ error: 'El peso ya fue actualizado' });
      }

      // Validate input
      if (!actual_weight || actual_weight <= 0) {
        return res.status(400).json({ error: 'Peso inválido' });
      }

      // Update weight
      const updatedTransaction = await Transaction.updateWeight(id, {
        actual_weight,
        balance_ticket_url
      });

      // Get seller name for notification
      const sellerResult = await pool.query('SELECT name FROM users WHERE id = $1', [req.userId]);
      const sellerName = sellerResult.rows[0]?.name || 'Vendedor';

      // Notify buyer about weight update
      await notificationService.notifyWeightUpdated(
        transaction.buyer_id,
        id,
        sellerName,
        actual_weight
      ).catch(err => console.error('Error sending notification:', err));

      res.json(updatedTransaction);
    } catch (error) {
      console.error('Error updating weight:', error);
      res.status(500).json({ error: 'Error al actualizar el peso' });
    }
  },

  // Buyer confirms weight
  async confirmWeight(req, res) {
    try {
      const { id } = req.params;

      // Get transaction
      const transaction = await Transaction.findById(id);
      if (!transaction) {
        return res.status(404).json({ error: 'Transacción no encontrada' });
      }

      // Verify buyer owns this transaction
      if (transaction.buyer_id !== req.userId) {
        return res.status(403).json({ error: 'Solo el comprador puede confirmar el peso' });
      }

      // Verify transaction status
      if (transaction.status !== 'weight_confirmed') {
        return res.status(400).json({ error: 'El peso aún no ha sido actualizado por el vendedor' });
      }

      // Get offer details for payment terms
      const offer = await Offer.findById(transaction.offer_id);
      if (!offer) {
        return res.status(404).json({ error: 'Oferta no encontrada' });
      }

      // Get seller's default bank account
      const SellerBankAccount = require('../models/SellerBankAccount');
      let sellerBankAccount = null;
      try {
        sellerBankAccount = await SellerBankAccount.getDefault(transaction.seller_id);
      } catch (error) {
        console.log('Seller has no bank account configured:', error.message);
      }

      // Confirm weight (this calculates commissions and creates payment order)
      const confirmedTransaction = await Transaction.confirmWeight(id);

      // Calculate final amount with IVA (10.5%)
      const baseAmount = parseFloat(confirmedTransaction.actual_weight) * parseFloat(confirmedTransaction.agreed_price_per_kg);
      const ivaAmount = baseAmount * 0.105;
      const finalAmountWithIVA = baseAmount + ivaAmount;

      // Create final payment order with IVA
      const paymentOrder = await PaymentOrder.create({
        transaction_id: confirmedTransaction.id,
        buyer_id: confirmedTransaction.buyer_id,
        seller_id: confirmedTransaction.seller_id,
        amount: finalAmountWithIVA,
        order_type: 'final',
        payment_term: offer.payment_term || 'contado',
        payment_method: offer.payment_method || 'transferencia',
        payment_method_id: offer.payment_method_id || null,
        seller_bank_account_id: sellerBankAccount ? sellerBankAccount.id : null,
        platform_commission: confirmedTransaction.platform_commission,
        bank_commission: confirmedTransaction.bank_commission,
        seller_net_amount: confirmedTransaction.seller_net_amount,
        iva_amount: ivaAmount,
        base_amount: baseAmount
      });

      // Get negotiation_date from transaction
      const transactionDataResult = await pool.query(
        'SELECT negotiation_date, payment_term FROM transactions WHERE id = $1',
        [id]
      );
      const transactionData = transactionDataResult.rows[0];
      const paymentTerm = offer.payment_term || 'contado';
      
      // Calculate due_date
      let dueDate;
      if (paymentTerm === 'contado') {
        // For contado, due date is when buyer confirms weight (now)
        dueDate = new Date();
      } else {
        // For other terms, calculate from negotiation_date
        if (transactionData.negotiation_date) {
          dueDate = new Date(transactionData.negotiation_date);
          const daysMatch = paymentTerm.match(/(\\d+)_dias/);
          if (daysMatch) {
            const days = parseInt(daysMatch[1]);
            dueDate.setDate(dueDate.getDate() + days);
          }
        }
      }

      // Update payment order with dates
      if (dueDate) {
        await pool.query(
          'UPDATE payment_orders SET negotiation_date = $1, due_date = $2 WHERE id = $3',
          [transactionData.negotiation_date, dueDate, paymentOrder.id]
        );
      }

      // Also update provisional payment order due_date if it's contado
      if (paymentTerm === 'contado') {
        await pool.query(
          'UPDATE payment_orders SET due_date = $1 WHERE transaction_id = $2 AND order_type = $3',
          [dueDate, id, 'provisional']
        );
      }

      // Get bank from payment method
      if (offer.payment_method_id) {
        const paymentMethodResult = await pool.query(
          'SELECT bank_id FROM payment_methods WHERE id = $1',
          [offer.payment_method_id]
        );
        
        if (paymentMethodResult.rows.length > 0 && paymentMethodResult.rows[0].bank_id) {
          const bankId = paymentMethodResult.rows[0].bank_id;
          
          // Get buyer name for notification
          const buyerResult = await pool.query('SELECT name FROM users WHERE id = $1', [confirmedTransaction.buyer_id]);
          const buyerName = buyerResult.rows[0]?.name || 'Comprador';
          
          // Get bank name for webhook
          const bankNameResult = await pool.query('SELECT bank_name FROM users WHERE id = $1', [bankId]);
          const bankName = bankNameResult.rows[0]?.bank_name;
          
          // This is the final payment order with IVA
          const isProvisional = false;
          
          // Notify bank about final payment order
          await notificationService.notifyFinalPaymentOrderReceived(
            bankId,
            paymentOrder.id,
            finalAmountWithIVA,
            buyerName
          ).catch(err => console.error('Error sending notification:', err));
          
          // Continue with existing code
          if (false) {
            await notificationService.notifyProvisionalPaymentOrderReceived(
              bankId,
              paymentOrder.id,
              confirmedTransaction.final_amount,
              buyerName
            ).catch(err => console.error('Error sending notification:', err));
          }
          
          // Send webhook to bank if configured
          if (bankName) {
            const webhookService = require('../services/webhookService');
            webhookService.sendWebhook(bankName, 'payment_order.created', {
              payment_order_id: paymentOrder.id,
              transaction_id: confirmedTransaction.id,
              buyer_id: confirmedTransaction.buyer_id,
              buyer_name: buyerName,
              seller_id: confirmedTransaction.seller_id,
              amount: finalAmountWithIVA,
              base_amount: baseAmount,
              iva_amount: ivaAmount,
              payment_term: offer.payment_term,
              payment_method: offer.payment_method,
              order_type: 'final',
              created_at: paymentOrder.created_at
            }).catch(err => console.error('Error sending webhook:', err));
          }
        }
      }

      // Update transaction status to payment_processing
      await Transaction.updateStatus(id, 'payment_processing');

      // Get buyer name for notification
      const buyerResult = await pool.query('SELECT name FROM users WHERE id = $1', [req.userId]);
      const buyerName = buyerResult.rows[0]?.name || 'Comprador';

      // Notify seller about weight confirmation
      await notificationService.notifyWeightConfirmed(
        transaction.seller_id,
        id,
        buyerName,
        confirmedTransaction.actual_weight
      ).catch(err => console.error('Error sending notification:', err));

      res.json({
        transaction: confirmedTransaction,
        paymentOrder: paymentOrder
      });
    } catch (error) {
      console.error('Error confirming weight:', error);
      res.status(500).json({ error: 'Error al confirmar el peso' });
    }
  },

  // Check if lote has active transaction
  async checkLoteTransaction(req, res) {
    try {
      const { loteId } = req.params;
      const hasTransaction = await Transaction.hasActiveTransaction(loteId);
      res.json({ hasTransaction });
    } catch (error) {
      console.error('Error checking lote transaction:', error);
      res.status(500).json({ error: 'Error al verificar transacción' });
    }
  },

  async getBuyerTransactions(req, res) {
    try {
      const transactions = await Transaction.findByBuyerId(req.userId);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching buyer transactions:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  async getBuyerStats(req, res) {
    try {
      const buyer_id = req.userId;
      const pool = require('../config/database');

      console.log('getBuyerStats - buyer_id:', buyer_id, 'userType:', req.userType);

      // Total de compras
      const totalResult = await pool.query(
        'SELECT COUNT(*) as count FROM transactions WHERE buyer_id = $1',
        [buyer_id]
      );
      console.log('getBuyerStats - totalResult:', totalResult.rows[0]);

      // Compras activas (pendiente o aprobado)
      const activeResult = await pool.query(
        `SELECT COUNT(*) as count FROM transactions 
         WHERE buyer_id = $1 AND status IN ('pendiente', 'aprobado', 'pending_weight', 'weight_confirmed', 'payment_pending')`,
        [buyer_id]
      );

      // Transacciones completadas
      const completedResult = await pool.query(
        `SELECT COUNT(*) as count FROM transactions 
         WHERE buyer_id = $1 AND status = 'completed'`,
        [buyer_id]
      );

      // Total gastado (suma de transacciones completadas)
      const spentResult = await pool.query(
        `SELECT COALESCE(SUM(COALESCE(final_amount, estimated_total)), 0) as total 
         FROM transactions 
         WHERE buyer_id = $1 AND status = 'completed'`,
        [buyer_id]
      );

      // Estado de certificación - obtener todas las certificaciones
      const certResult = await pool.query(
        `SELECT status, bank_name, created_at, reviewed_at 
         FROM certifications 
         WHERE user_id = $1 
         ORDER BY created_at DESC`,
        [buyer_id]
      );

      let certificationStatus = 'no_certified';
      let certificationDetails = null;

      if (certResult.rows.length > 0) {
        const certs = certResult.rows;
        // Buscar si hay alguna aprobada
        const approved = certs.find(c => c.status === 'aprobado');
        if (approved) {
          certificationStatus = 'certified';
          certificationDetails = {
            bank: approved.bank_name,
            approvedAt: approved.reviewed_at,
            count: certs.filter(c => c.status === 'aprobado').length
          };
        } else {
          // Si no hay aprobada, verificar si hay pendiente
          const pending = certs.find(c => c.status === 'pendiente_aprobacion');
          if (pending) {
            certificationStatus = 'pending';
            certificationDetails = {
              bank: pending.bank_name,
              requestedAt: pending.created_at,
              count: certs.filter(c => c.status === 'pendiente_aprobacion').length
            };
          } else {
            // Si no hay pendiente ni aprobada, debe haber rechazada
            const rejected = certs.find(c => c.status === 'rechazado');
            if (rejected) {
              certificationStatus = 'rejected';
              certificationDetails = {
                bank: rejected.bank_name,
                rejectedAt: rejected.reviewed_at
              };
            }
          }
        }
      }

      const result = {
        totalPurchases: parseInt(totalResult.rows[0].count),
        activePurchases: parseInt(activeResult.rows[0].count),
        completedTransactions: parseInt(completedResult.rows[0].count),
        totalSpent: parseFloat(spentResult.rows[0].total),
        certificationStatus,
        certificationDetails
      };

      console.log('getBuyerStats result:', JSON.stringify(result, null, 2));
      res.json(result);
    } catch (error) {
      console.error('Error fetching buyer stats:', error);
      console.error('Error stack:', error.stack);
      console.error('Error details:', error.message);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  async getSellerTransactions(req, res) {
    try {
      const transactions = await Transaction.findBySellerId(req.userId);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching seller transactions:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  async updateTransactionStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const validStatuses = ['pendiente', 'aprobado', 'completo', 'cancelado'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Estado inválido' });
      }

      // Verificar que la transacción exista
      const pool = require('../config/database');
      const transactionQuery = await pool.query(
        'SELECT * FROM transactions WHERE id = $1',
        [id]
      );

      if (transactionQuery.rows.length === 0) {
        return res.status(404).json({ error: 'Transacción no encontrada' });
      }

      const transaction = transactionQuery.rows[0];

      // Verificar permisos (solo vendedor o comprador involucrado)
      if (req.userId !== transaction.seller_id && req.userId !== transaction.buyer_id) {
        return res.status(403).json({ error: 'No tienes permiso para modificar esta transacción' });
      }

      const updatedTransaction = await Transaction.updateStatus(id, status);
      
      // Agregar notas si se proporcionan
      if (notes) {
        await pool.query(
          'UPDATE transactions SET notes = $1 WHERE id = $2',
          [notes, id]
        );
      }

      res.json({
        message: 'Estado de transacción actualizado',
        transaction: updatedTransaction
      });
    } catch (error) {
      console.error('Error updating transaction status:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  async getAllTransactions(req, res) {
    try {
      // Solo para administradores
      if (req.userType !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado' });
      }

      const transactions = await Transaction.getAll();
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching all transactions:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  async getTransactionStats(req, res) {
    try {
      // Solo para administradores
      if (req.userType !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado' });
      }

      const pool = require('../config/database');
      
      const statsQuery = `
        SELECT 
          DATE_TRUNC('day', created_at) as date,
          COUNT(*) as transaction_count,
          SUM(price) as total_volume,
          AVG(price) as avg_price,
          status
        FROM transactions
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE_TRUNC('day', created_at), status
        ORDER BY date DESC
      `;

      const { rows } = await pool.query(statsQuery);

      // Resumir estadísticas
      const summary = {
        totalTransactions: rows.reduce((sum, row) => sum + parseInt(row.transaction_count), 0),
        totalVolume: rows.reduce((sum, row) => sum + parseFloat(row.total_volume || 0), 0),
        avgTransactionValue: rows.length > 0 ? 
          rows.reduce((sum, row) => sum + parseFloat(row.avg_price || 0), 0) / rows.length : 0,
        byStatus: {}
      };

      rows.forEach(row => {
        if (!summary.byStatus[row.status]) {
          summary.byStatus[row.status] = 0;
        }
        summary.byStatus[row.status] += parseInt(row.transaction_count);
      });

      res.json({
        dailyStats: rows,
        summary
      });
    } catch (error) {
      console.error('Error fetching transaction stats:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = transactionController;