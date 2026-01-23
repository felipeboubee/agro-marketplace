const pool = require('../config/database');

const bankApiController = {
  // Get pending certifications for this bank
  async getCertifications(req, res) {
    try {
      const bankId = req.bankId;
      const { status = 'pendiente_aprobacion', limit = 100, offset = 0 } = req.query;

      // Get user info to find bank name
      const bankInfo = await pool.query(
        'SELECT name, bank_name FROM users WHERE id = $1',
        [bankId]
      );

      if (bankInfo.rows.length === 0) {
        return res.status(404).json({ error: 'Banco no encontrado' });
      }

      const bankName = bankInfo.rows[0].bank_name || bankInfo.rows[0].name;

      const query = `
        SELECT 
          c.*,
          u.name as user_name,
          u.email as user_email,
          u.user_type
        FROM certifications c
        JOIN users u ON u.id = c.user_id
        WHERE c.bank_name = $1 ${status ? 'AND c.status = $2' : ''}
        ORDER BY c.created_at DESC
        LIMIT $${status ? 3 : 2} OFFSET $${status ? 4 : 3}
      `;

      const params = status 
        ? [bankName, status, limit, offset]
        : [bankName, limit, offset];

      const result = await pool.query(query, params);

      const countResult = await pool.query(
        `SELECT COUNT(*) as total FROM certifications 
         WHERE bank_name = $1 ${status ? 'AND status = $2' : ''}`,
        status ? [bankName, status] : [bankName]
      );

      res.json({
        data: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Error getting certifications:', error);
      res.status(500).json({ error: 'Error al obtener certificaciones' });
    }
  },

  // Get payment orders for this bank
  async getPaymentOrders(req, res) {
    try {
      const bankId = req.bankId;
      const { status, limit = 100, offset = 0 } = req.query;

      let query = `
        SELECT 
          po.*,
          t.id as transaction_id,
          t.lote_id,
          t.status as transaction_status,
          buyer.name as buyer_name,
          buyer.email as buyer_email,
          seller.name as seller_name,
          seller.email as seller_email,
          l.animal_type,
          l.breed
        FROM payment_orders po
        JOIN transactions t ON t.id = po.transaction_id
        JOIN users buyer ON buyer.id = po.buyer_id
        JOIN users seller ON seller.id = po.seller_id
        LEFT JOIN lotes l ON l.id = t.lote_id
        WHERE po.bank_id = $1
      `;

      const params = [bankId];
      let paramCount = 2;

      if (status) {
        query += ` AND po.status = $${paramCount}`;
        params.push(status);
        paramCount++;
      }

      query += ` ORDER BY po.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      const countQuery = `
        SELECT COUNT(*) as total 
        FROM payment_orders 
        WHERE bank_id = $1 ${status ? 'AND status = $2' : ''}
      `;
      const countParams = status ? [bankId, status] : [bankId];
      const countResult = await pool.query(countQuery, countParams);

      res.json({
        data: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Error getting payment orders:', error);
      res.status(500).json({ error: 'Error al obtener órdenes de pago' });
    }
  },

  // Get single certification details
  async getCertificationDetails(req, res) {
    try {
      const bankId = req.bankId;
      const { id } = req.params;

      // Get bank name
      const bankInfo = await pool.query(
        'SELECT name, bank_name FROM users WHERE id = $1',
        [bankId]
      );

      if (bankInfo.rows.length === 0) {
        return res.status(404).json({ error: 'Banco no encontrado' });
      }

      const bankName = bankInfo.rows[0].bank_name || bankInfo.rows[0].name;

      const result = await pool.query(
        `SELECT 
          c.*,
          u.name as user_name,
          u.email as user_email,
          u.user_type
        FROM certifications c
        JOIN users u ON u.id = c.user_id
        WHERE c.id = $1 AND c.bank_name = $2`,
        [id, bankName]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Certificación no encontrada' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error getting certification details:', error);
      res.status(500).json({ error: 'Error al obtener detalles de certificación' });
    }
  },

  // Get single payment order details
  async getPaymentOrderDetails(req, res) {
    try {
      const bankId = req.bankId;
      const { id } = req.params;

      const result = await pool.query(
        `SELECT 
          po.*,
          t.id as transaction_id,
          t.lote_id,
          t.status as transaction_status,
          buyer.name as buyer_name,
          buyer.email as buyer_email,
          seller.name as seller_name,
          seller.email as seller_email,
          l.animal_type,
          l.breed,
          pm.payment_type,
          pm.bank_name as payment_method_bank,
          pm.cbu,
          pm.card_number_last4
        FROM payment_orders po
        JOIN transactions t ON t.id = po.transaction_id
        JOIN users buyer ON buyer.id = po.buyer_id
        JOIN users seller ON seller.id = po.seller_id
        LEFT JOIN lotes l ON l.id = t.lote_id
        LEFT JOIN payment_methods pm ON pm.id = po.payment_method_id
        WHERE po.id = $1 AND po.bank_id = $2`,
        [id, bankId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Orden de pago no encontrada' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error getting payment order details:', error);
      res.status(500).json({ error: 'Error al obtener detalles de orden de pago' });
    }
  }
};

module.exports = bankApiController;
