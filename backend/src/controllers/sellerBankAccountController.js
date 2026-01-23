const SellerBankAccount = require('../models/SellerBankAccount');
const { validateCBU, validateCBUAlias } = require('../utils/paymentValidations');

const sellerBankAccountController = {
  // Create new bank account
  async create(req, res) {
    try {
      const userId = req.userId;
      const { cbu, alias_cbu, ...restData } = req.body;

      // Validar CBU
      if (!cbu) {
        return res.status(400).json({ error: 'CBU es requerido' });
      }
      if (!validateCBU(cbu)) {
        return res.status(400).json({ 
          error: 'CBU inválido. Debe tener 22 dígitos y pasar la validación de dígitos verificadores' 
        });
      }

      // Validar alias si está presente
      if (alias_cbu && !validateCBUAlias(alias_cbu)) {
        return res.status(400).json({ 
          error: 'Alias inválido. Debe tener 6-20 caracteres alfanuméricos, puntos o guiones' 
        });
      }

      const accountData = {
        user_id: userId,
        cbu,
        alias_cbu,
        ...restData
      };

      const bankAccount = await SellerBankAccount.create(accountData);
      res.status(201).json(bankAccount);
    } catch (error) {
      console.error('Error creating bank account:', error);
      res.status(500).json({ error: 'Error al crear cuenta bancaria' });
    }
  },

  // Get all bank accounts for logged in user
  async getMyBankAccounts(req, res) {
    try {
      const userId = req.userId;
      const bankAccounts = await SellerBankAccount.findByUserId(userId);
      res.json(bankAccounts);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      res.status(500).json({ error: 'Error al obtener cuentas bancarias' });
    }
  },

  // Get bank account by ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const bankAccount = await SellerBankAccount.findById(id);
      
      if (!bankAccount) {
        return res.status(404).json({ error: 'Cuenta bancaria no encontrada' });
      }

      res.json(bankAccount);
    } catch (error) {
      console.error('Error fetching bank account:', error);
      res.status(500).json({ error: 'Error al obtener cuenta bancaria' });
    }
  },

  // Get default bank account
  async getDefault(req, res) {
    try {
      const userId = req.userId;
      const bankAccount = await SellerBankAccount.getDefault(userId);
      
      if (!bankAccount) {
        return res.status(404).json({ error: 'No hay cuenta bancaria predeterminada' });
      }

      res.json(bankAccount);
    } catch (error) {
      console.error('Error fetching default bank account:', error);
      res.status(500).json({ error: 'Error al obtener cuenta bancaria predeterminada' });
    }
  },

  // Set bank account as default
  async setDefault(req, res) {
    try {
      const userId = req.userId;
      const { id } = req.params;

      const bankAccount = await SellerBankAccount.setDefault(id, userId);
      
      if (!bankAccount) {
        return res.status(404).json({ error: 'Cuenta bancaria no encontrada' });
      }

      res.json(bankAccount);
    } catch (error) {
      console.error('Error setting default bank account:', error);
      res.status(500).json({ error: 'Error al establecer cuenta bancaria predeterminada' });
    }
  },

  // Update bank account
  async update(req, res) {
    try {
      const userId = req.userId;
      const { id } = req.params;
      
      const bankAccount = await SellerBankAccount.update(id, userId, req.body);
      
      if (!bankAccount) {
        return res.status(404).json({ error: 'Cuenta bancaria no encontrada' });
      }

      res.json(bankAccount);
    } catch (error) {
      console.error('Error updating bank account:', error);
      res.status(500).json({ error: 'Error al actualizar cuenta bancaria' });
    }
  },

  // Delete bank account
  async delete(req, res) {
    try {
      const userId = req.userId;
      const { id } = req.params;

      const bankAccount = await SellerBankAccount.delete(id, userId);
      
      if (!bankAccount) {
        return res.status(404).json({ error: 'Cuenta bancaria no encontrada' });
      }

      res.json({ message: 'Cuenta bancaria eliminada exitosamente' });
    } catch (error) {
      console.error('Error deleting bank account:', error);
      res.status(500).json({ error: 'Error al eliminar cuenta bancaria' });
    }
  },

  // Get bank account for a specific seller (used in payment orders)
  async getSellerBankAccount(req, res) {
    try {
      const { sellerId } = req.params;
      const bankAccount = await SellerBankAccount.getDefault(sellerId);
      
      if (!bankAccount) {
        return res.status(404).json({ error: 'Vendedor no tiene cuenta bancaria configurada' });
      }

      res.json(bankAccount);
    } catch (error) {
      console.error('Error fetching seller bank account:', error);
      res.status(500).json({ error: 'Error al obtener cuenta bancaria del vendedor' });
    }
  },

  // Get all unverified bank accounts (for bank)
  async getUnverified(req, res) {
    try {
      const bankAccounts = await SellerBankAccount.findUnverified();
      res.json(bankAccounts);
    } catch (error) {
      console.error('Error fetching unverified bank accounts:', error);
      res.status(500).json({ error: 'Error al obtener cuentas bancarias no verificadas' });
    }
  },

  // Verify bank account (for bank)
  async verify(req, res) {
    try {
      const { id } = req.params;
      const bankAccount = await SellerBankAccount.verify(id);
      
      if (!bankAccount) {
        return res.status(404).json({ error: 'Cuenta bancaria no encontrada' });
      }

      res.json({ message: 'Cuenta bancaria verificada exitosamente', bankAccount });
    } catch (error) {
      console.error('Error verifying bank account:', error);
      res.status(500).json({ error: 'Error al verificar cuenta bancaria' });
    }
  },

  // Reject bank account (for bank)
  async reject(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const bankAccount = await SellerBankAccount.reject(id, reason);
      
      if (!bankAccount) {
        return res.status(404).json({ error: 'Cuenta bancaria no encontrada' });
      }

      res.json({ message: 'Cuenta bancaria rechazada', bankAccount });
    } catch (error) {
      console.error('Error rejecting bank account:', error);
      res.status(500).json({ error: 'Error al rechazar cuenta bancaria' });
    }
  }
};

module.exports = sellerBankAccountController;
