const notificationService = require('../services/notificationService');

const notificationController = {
  // Get user's notifications
  async getMyNotifications(req, res) {
    try {
      const userId = req.userId;
      const { limit, offset, unread_only } = req.query;
      
      const options = {
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0,
        unreadOnly: unread_only === 'true'
      };
      
      const notifications = await notificationService.getUserNotifications(userId, options);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Error al obtener notificaciones' });
    }
  },

  // Get unread count
  async getUnreadCount(req, res) {
    try {
      const userId = req.userId;
      const count = await notificationService.getUnreadCount(userId);
      res.json({ count });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({ error: 'Error al obtener contador de no leídas' });
    }
  },

  // Mark notification as read
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;
      
      await notificationService.markAsRead(id, userId);
      res.json({ message: 'Notificación marcada como leída' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Error al marcar notificación' });
    }
  },

  // Mark all notifications as read
  async markAllAsRead(req, res) {
    try {
      const userId = req.userId;
      
      await notificationService.markAllAsRead(userId);
      res.json({ message: 'Todas las notificaciones marcadas como leídas' });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ error: 'Error al marcar notificaciones' });
    }
  }
};

module.exports = notificationController;
