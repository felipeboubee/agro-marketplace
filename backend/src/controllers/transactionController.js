const Transaction = require('../models/Transaction');
const Offer = require('../models/Offer');
const PaymentOrder = require('../models/PaymentOrder');
const Lote = require('../models/Lote');

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

      // Confirm weight (this calculates commissions and creates payment order)
      const confirmedTransaction = await Transaction.confirmWeight(id);

      // Create payment order with payment terms from offer
      const paymentOrder = await PaymentOrder.create({
        transaction_id: confirmedTransaction.id,
        buyer_id: confirmedTransaction.buyer_id,
        seller_id: confirmedTransaction.seller_id,
        amount: confirmedTransaction.final_amount,
        payment_term: offer.payment_term || 'contado',
        payment_method: offer.payment_method || 'transferencia',
        platform_commission: confirmedTransaction.platform_commission,
        bank_commission: confirmedTransaction.bank_commission,
        seller_net_amount: confirmedTransaction.seller_net_amount
      });

      // Update transaction status to payment_processing
      await Transaction.updateStatus(id, 'payment_processing');

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