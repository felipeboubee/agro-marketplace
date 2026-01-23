import { api } from './api';

export const notificationService = {
  // Get user's notifications
  getNotifications: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await api.get(`/notifications${queryParams ? '?' + queryParams : ''}`);
    return response;
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.count;
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response;
  }
};
