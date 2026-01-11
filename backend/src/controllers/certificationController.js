const Certification = require('../models/Certification');
const User = require('../models/User');
const pool = require('../config/database');

const certificationController = {
  // Aplicar para certificación
  async applyForCertification(req, res) {
    try {
      const user_id = req.userId;
      const { bank_name, personal_info, employment_info, financial_info } = req.body;

      // Validar que el usuario es comprador
      const user = await User.findById(user_id);
      if (user.user_type !== 'comprador') {
        return res.status(400).json({ error: 'Solo los compradores pueden solicitar certificación' });
      }

      // Verificar si ya tiene una solicitud pendiente con este banco
      const existingCert = await pool.query(
        `SELECT * FROM certifications 
         WHERE user_id = $1 AND bank_name = $2 AND status = 'pendiente_aprobacion'`,
        [user_id, bank_name]
      );

      if (existingCert.rows.length > 0) {
        return res.status(400).json({ 
          error: 'Ya tienes una solicitud pendiente con este banco' 
        });
      }

      // Verificar si fue rechazado recientemente (30 días)
      const rejectedCert = await pool.query(
        `SELECT * FROM certifications 
         WHERE user_id = $1 AND bank_name = $2 AND status = 'rechazado'
         AND created_at > NOW() - INTERVAL '30 days'`,
        [user_id, bank_name]
      );

      if (rejectedCert.rows.length > 0) {
        return res.status(400).json({ 
          error: 'Debes esperar 30 días después de un rechazo para volver a solicitar' 
        });
      }

      // Preparar datos de certificación
      let income_proof_path = null;
      if (req.file) {
        income_proof_path = `/uploads/certifications/${req.file.filename}`;
      }

      // Crear la certificación con nuevo formato
      const certification = await Certification.create({
        user_id,
        bank_name,
        personal_info: personal_info ? JSON.parse(personal_info) : {},
        employment_info: employment_info ? JSON.parse(employment_info) : {},
        financial_info: financial_info ? JSON.parse(financial_info) : {},
        income_proof_path,
        status: 'pendiente_aprobacion'
      });

      // Actualizar estado del comprador a pendiente_aprobacion
      await pool.query(
        `UPDATE users SET buyer_status = 'pendiente_aprobacion' WHERE id = $1`,
        [user_id]
      );

      res.status(201).json({
        message: 'Solicitud de certificación enviada exitosamente',
        certification
      });
    } catch (error) {
      console.error('Error applying for certification:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener certificaciones del usuario
  async getUserCertifications(req, res) {
    try {
      const certifications = await Certification.findByUser(req.userId);
      res.json(certifications);
    } catch (error) {
      console.error('Error fetching user certifications:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener certificaciones pendientes para un banco
  async getBankPendingCertifications(req, res) {
    try {
      // Obtener el nombre del banco del usuario
      const user = await User.findById(req.userId);
      const bank_name = user.name; // Asumiendo que el nombre del usuario banco es el nombre del banco

      const certifications = await Certification.findByBank(bank_name);
      
      // Filtrar solo pendientes
      const pending = certifications.filter(cert => cert.status === 'pendiente');
      
      res.json(pending);
    } catch (error) {
      console.error('Error fetching bank certifications:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener todas las certificaciones para un banco
  async getBankAllCertifications(req, res) {
    try {
      const user = await User.findById(req.userId);
      const bank_name = user.name;

      const certifications = await Certification.findByBank(bank_name);
      res.json(certifications);
    } catch (error) {
      console.error('Error fetching all bank certifications:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Actualizar estado de certificación
  async updateCertificationStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const reviewed_by = req.userId;

      // Verificar que el usuario es un banco
      const reviewer = await User.findById(reviewed_by);
      if (reviewer.user_type !== 'banco') {
        return res.status(403).json({ error: 'Solo los bancos pueden actualizar certificaciones' });
      }

      // Obtener la certificación
      const certQuery = await pool.query(
        'SELECT * FROM certifications WHERE id = $1',
        [id]
      );

      if (certQuery.rows.length === 0) {
        return res.status(404).json({ error: 'Certificación no encontrada' });
      }

      const certification = certQuery.rows[0];

      // Verificar que el banco es el correcto
      if (reviewer.name !== certification.bank_name) {
        return res.status(403).json({ error: 'No tienes permiso para modificar esta certificación' });
      }

      // Actualizar estado
      const updatedCert = await Certification.updateStatus(id, status);

      // Agregar notas y reviewer si se proporcionan
      const updateFields = [];
      const values = [];
      let paramCount = 1;

      if (notes) {
        updateFields.push(`notes = $${paramCount}`);
        values.push(notes);
        paramCount++;
      }

      if (status === 'aprobado' || status === 'rechazado') {
        updateFields.push(`reviewed_by = $${paramCount}`);
        values.push(reviewed_by);
        paramCount++;
        
        updateFields.push(`reviewed_at = NOW()`);
      }

      if (updateFields.length > 0) {
        const updateQuery = `
          UPDATE certifications 
          SET ${updateFields.join(', ')}
          WHERE id = $${paramCount}
          RETURNING *
        `;
        values.push(id);
        
        const result = await pool.query(updateQuery, values);
        Object.assign(updatedCert, result.rows[0]);
      }

      // Crear notificación para el usuario
      const user = await User.findById(certification.user_id);
      let message = '';
      
      switch(status) {
        case 'aprobado':
          message = `¡Felicidades! Tu certificación con ${certification.bank_name} ha sido aprobada.`;
          break;
        case 'rechazado':
          message = `Tu solicitud de certificación con ${certification.bank_name} ha sido rechazada. Podrás volver a solicitar en 30 días.`;
          break;
        case 'mas_datos':
          message = `${certification.bank_name} requiere más información para procesar tu certificación. Por favor, completa los datos adicionales.`;
          break;
      }

      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, data)
         VALUES ($1, 'certification_update', 'Actualización de certificación', $2, $3)`,
        [certification.user_id, message, { certification_id: id, status }]
      );

      res.json({
        message: 'Estado de certificación actualizado',
        certification: updatedCert
      });
    } catch (error) {
      console.error('Error updating certification status:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener estadísticas de certificaciones (admin)
  async getCertificationStats(req, res) {
    try {
      const stats = await Certification.getStats();
      
      // Calcular totales
      const totals = {
        pending: 0,
        approved: 0,
        rejected: 0,
        more_data: 0,
        total: 0
      };

      stats.forEach(stat => {
        totals[stat.status] = (totals[stat.status] || 0) + parseInt(stat.count);
        totals.total += parseInt(stat.count);
      });

      // Obtener bancos con más solicitudes
      const topBanksQuery = `
        SELECT bank_name, COUNT(*) as request_count
        FROM certifications
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY bank_name
        ORDER BY request_count DESC
        LIMIT 5
      `;
      const topBanksResult = await pool.query(topBanksQuery);

      // Obtener tasa de aprobación por banco
      const approvalRateQuery = `
        SELECT 
          bank_name,
          COUNT(*) as total_requests,
          COUNT(CASE WHEN status = 'aprobado' THEN 1 END) as approved,
          ROUND(
            COUNT(CASE WHEN status = 'aprobado' THEN 1 END) * 100.0 / COUNT(*), 
            2
          ) as approval_rate
        FROM certifications
        GROUP BY bank_name
        ORDER BY approval_rate DESC
      `;
      const approvalRateResult = await pool.query(approvalRateQuery);

      res.json({
        totals,
        byBank: stats.reduce((acc, stat) => {
          if (!acc[stat.bank_name]) {
            acc[stat.bank_name] = {};
          }
          acc[stat.bank_name][stat.status] = parseInt(stat.count);
          return acc;
        }, {}),
        topBanks: topBanksResult.rows,
        approvalRates: approvalRateResult.rows,
        timeframe: 'all_time'
      });
    } catch (error) {
      console.error('Error fetching certification stats:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = certificationController;