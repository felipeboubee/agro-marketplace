const Transaction = require('../models/Transaction');
const User = require('../models/User');

const transactionController = {
  async createTransaction(req, res) {
    try {
      const {
        lote_id,
        seller_id,
        price,
        quantity,
        animal_type,
        payment_method,
        location,
        average_weight,
        breed,
        offer_price
      } = req.body;

      // Verificar que el vendedor exista
      const seller = await User.findById(seller_id);
      if (!seller || seller.user_type !== 'vendedor') {
        return res.status(404).json({ error: 'Vendedor no encontrado' });
      }

      // Para compradores, usar el ID del usuario autenticado
      const buyer_id = req.userId;

      // Crear transacción
      const transactionData = {
        seller_id,
        buyer_id,
        lote_id,
        price: offer_price || price,
        quantity,
        animal_type,
        status: 'pendiente',
        payment_method,
        location,
        average_weight,
        breed
      };

      const transaction = await Transaction.create(transactionData);

      // Actualizar stock del lote (si existe en otra tabla)
      // Esta lógica dependerá de tu estructura de base de datos

      res.status(201).json({
        message: 'Transacción creada exitosamente',
        transaction
      });
    } catch (error) {
      console.error('Error creating transaction:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  async getBuyerTransactions(req, res) {
    try {
      const transactions = await Transaction.findByBuyer(req.userId);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching buyer transactions:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  async getSellerTransactions(req, res) {
    try {
      const transactions = await Transaction.findBySeller(req.userId);
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