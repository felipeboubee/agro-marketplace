const User = require('../models/User');
const bcrypt = require('bcryptjs');

const userController = {
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      // No enviar la contraseña
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  async updateProfile(req, res) {
    try {
      const { name, email, phone, location, currentPassword, newPassword } = req.body;
      const updates = {};

      // Obtener usuario actual
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Validar contraseña actual si se quiere cambiar la contraseña
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'La contraseña actual es requerida' });
        }
        
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
          return res.status(401).json({ error: 'Contraseña actual incorrecta' });
        }

        // Hashear nueva contraseña
        updates.password = await bcrypt.hash(newPassword, 10);
      }

      // Actualizar otros campos
      if (name) updates.name = name;
      if (email && email !== user.email) {
        // Verificar si el nuevo email ya existe
        const existingUser = await User.findByEmail(email);
        if (existingUser && existingUser.id !== req.userId) {
          return res.status(400).json({ error: 'El email ya está en uso' });
        }
        updates.email = email;
      }
      if (phone !== undefined) updates.phone = phone;
      if (location !== undefined) updates.location = location;

      // Actualizar usuario
      const updatedUser = await User.update(req.userId, updates);
      const { password: _, ...userWithoutPassword } = updatedUser;

      res.json({
        message: 'Perfil actualizado exitosamente',
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  async getAllUsers(req, res) {
    try {
      // Solo para administradores
      if (req.userType !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado' });
      }

      const users = await User.getAll();
      res.json(users);
    } catch (error) {
      console.error('Error fetching all users:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  async getUserById(req, res) {
    try {
      // Solo para administradores
      if (req.userType !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado' });
      }

      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  async getUsersByType(req, res) {
    try {
      // Solo para administradores
      if (req.userType !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado' });
      }

      const { type } = req.params;
      const validTypes = ['comprador', 'vendedor', 'banco', 'admin'];
      
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'Tipo de usuario inválido' });
      }

      const users = await User.getByType(type);
      res.json(users);
    } catch (error) {
      console.error('Error fetching users by type:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = userController;