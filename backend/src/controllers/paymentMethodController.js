const PaymentMethod = require('../models/PaymentMethod');
const { validateCreditCard, validateCBU, validateCardExpiry } = require('../utils/paymentValidations');

const paymentMethodController = {
  // Create new payment method
  async create(req, res) {
    try {
      const userId = req.userId;
      const { payment_type, ...paymentData } = req.body;

      // Validar según el tipo de método de pago
      if (payment_type === 'bank_transfer') {
        if (!paymentData.cbu) {
          return res.status(400).json({ error: 'CBU es requerido' });
        }
        if (!validateCBU(paymentData.cbu)) {
          return res.status(400).json({ 
            error: 'CBU inválido. Debe tener 22 dígitos y pasar la validación de dígitos verificadores' 
          });
        }
      }

      if (payment_type === 'credit_card') {
        // Validar número de tarjeta con algoritmo de Luhn
        if (paymentData.card_number && !validateCreditCard(paymentData.card_number)) {
          return res.status(400).json({ error: 'Número de tarjeta inválido' });
        }

        // Validar fecha de vencimiento
        if (paymentData.expiry_month && paymentData.expiry_year) {
          if (!validateCardExpiry(parseInt(paymentData.expiry_month), parseInt(paymentData.expiry_year))) {
            return res.status(400).json({ error: 'La tarjeta ha vencido o la fecha es inválida' });
          }
        }
      }

      const paymentMethodData = {
        user_id: userId,
        payment_type,
        ...paymentData
      };

      const paymentMethod = await PaymentMethod.create(paymentMethodData);
      res.status(201).json(paymentMethod);
    } catch (error) {
      console.error('Error creating payment method:', error);
      res.status(500).json({ error: 'Error al crear método de pago' });
    }
  },

  // Get all payment methods for logged in user
  async getMyPaymentMethods(req, res) {
    try {
      const userId = req.userId;
      const paymentMethods = await PaymentMethod.findByUserId(userId);
      res.json(paymentMethods);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      res.status(500).json({ error: 'Error al obtener métodos de pago' });
    }
  },

  // Get payment method by ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const paymentMethod = await PaymentMethod.findById(id);
      
      if (!paymentMethod) {
        return res.status(404).json({ error: 'Método de pago no encontrado' });
      }

      res.json(paymentMethod);
    } catch (error) {
      console.error('Error fetching payment method:', error);
      res.status(500).json({ error: 'Error al obtener método de pago' });
    }
  },

  // Get default payment method
  async getDefault(req, res) {
    try {
      const userId = req.userId;
      const paymentMethod = await PaymentMethod.getDefault(userId);
      
      if (!paymentMethod) {
        return res.status(404).json({ error: 'No hay método de pago predeterminado' });
      }

      res.json(paymentMethod);
    } catch (error) {
      console.error('Error fetching default payment method:', error);
      res.status(500).json({ error: 'Error al obtener método de pago predeterminado' });
    }
  },

  // Set payment method as default
  async setDefault(req, res) {
    try {
      const userId = req.userId;
      const { id } = req.params;

      const paymentMethod = await PaymentMethod.setDefault(id, userId);
      
      if (!paymentMethod) {
        return res.status(404).json({ error: 'Método de pago no encontrado' });
      }

      res.json(paymentMethod);
    } catch (error) {
      console.error('Error setting default payment method:', error);
      res.status(500).json({ error: 'Error al establecer método de pago predeterminado' });
    }
  },

  // Update payment method
  async update(req, res) {
    try {
      const userId = req.userId;
      const { id } = req.params;
      
      const paymentMethod = await PaymentMethod.update(id, userId, req.body);
      
      if (!paymentMethod) {
        return res.status(404).json({ error: 'Método de pago no encontrado' });
      }

      res.json(paymentMethod);
    } catch (error) {
      console.error('Error updating payment method:', error);
      res.status(500).json({ error: 'Error al actualizar método de pago' });
    }
  },

  // Delete payment method
  async delete(req, res) {
    try {
      const userId = req.userId;
      const { id } = req.params;

      const paymentMethod = await PaymentMethod.delete(id, userId);
      
      if (!paymentMethod) {
        return res.status(404).json({ error: 'Método de pago no encontrado' });
      }

      res.json({ message: 'Método de pago eliminado exitosamente' });
    } catch (error) {
      console.error('Error deleting payment method:', error);
      res.status(500).json({ error: 'Error al eliminar método de pago' });
    }
  },

  // Get all unverified payment methods (for bank)
  async getUnverified(req, res) {
    try {
      const paymentMethods = await PaymentMethod.findUnverified();
      res.json(paymentMethods);
    } catch (error) {
      console.error('Error fetching unverified payment methods:', error);
      res.status(500).json({ error: 'Error al obtener métodos de pago no verificados' });
    }
  },

  // Verify payment method (for bank)
  async verify(req, res) {
    try {
      const { id } = req.params;
      const paymentMethod = await PaymentMethod.verify(id);
      
      if (!paymentMethod) {
        return res.status(404).json({ error: 'Método de pago no encontrado' });
      }

      res.json({ message: 'Método de pago verificado exitosamente', paymentMethod });
    } catch (error) {
      console.error('Error verifying payment method:', error);
      res.status(500).json({ error: 'Error al verificar método de pago' });
    }
  },

  // Reject payment method (for bank)
  async reject(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const paymentMethod = await PaymentMethod.reject(id, reason);
      
      if (!paymentMethod) {
        return res.status(404).json({ error: 'Método de pago no encontrado' });
      }

      res.json({ message: 'Método de pago rechazado', paymentMethod });
    } catch (error) {
      console.error('Error rejecting payment method:', error);
      res.status(500).json({ error: 'Error al rechazar método de pago' });
    }
  }
};

module.exports = paymentMethodController;
