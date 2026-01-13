const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authController = {
  async register(req, res) {
    try {
      const { email, password, name, user_type, phone, location, bank_name } = req.body;

      // Verificar si el usuario ya existe
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'El usuario ya existe' });
      }

      // Validar que si es banco, tenga bank_name
      if (user_type === 'banco' && !bank_name) {
        return res.status(400).json({ error: 'El nombre del banco es requerido para usuarios tipo banco' });
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear usuario
      const user = await User.create({
        email,
        password: hashedPassword,
        name,
        user_type,
        phone,
        location,
        bank_name: user_type === 'banco' ? bank_name : null
      });

      // Generar token
      const token = jwt.sign(
        { userId: user.id, userType: user.user_type },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          user_type: user.user_type,
          bank_name: user.bank_name
        },
        token
      });
    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Buscar usuario
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Generar token
      const token = jwt.sign(
        { userId: user.id, userType: user.user_type },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login exitoso',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          user_type: user.user_type,
          bank_name: user.bank_name,
          location: user.location
        },
        token
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  async changePassword(req, res) {
    try {
      const userId = req.userId;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Contraseñas requeridas' });
      }

      // Buscar usuario
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Verificar contraseña actual
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Contraseña actual incorrecta' });
      }

      // Hash de la nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Actualizar contraseña
      await User.update(userId, { password: hashedPassword });

      res.json({ message: 'Contraseña cambiada exitosamente' });
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  async updateProfile(req, res) {
    try {
      const userId = req.userId;
      const { name, email, phone, location } = req.body;

      // Buscar usuario
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Si el email cambió, verificar que no exista otro usuario con ese email
      if (email && email !== user.email) {
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
          return res.status(400).json({ error: 'El email ya está en uso' });
        }
      }

      // Actualizar perfil
      const updatedUser = await User.update(userId, {
        name: name || user.name,
        email: email || user.email,
        phone: phone || user.phone,
        location: location || user.location
      });

      res.json({
        message: 'Perfil actualizado exitosamente',
        user: updatedUser
      });
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = authController;