import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, X, User } from 'lucide-react';
import { api } from '../services/api';
import '../styles/chat.css';

export default function ChatBox({ transactionId, otherUserName, isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  
  // Get current user ID from localStorage
  const getCurrentUserId = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.id;
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
      }
    }
    return null;
  };
  
  const currentUserId = getCurrentUserId();

  useEffect(() => {
    if (isOpen && transactionId) {
      fetchMessages();
      // Poll for new messages every 5 seconds
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, transactionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/messages/transaction/${transactionId}`);
      setMessages(response);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const message = await api.post('/messages', {
        transaction_id: transactionId,
        message_text: newMessage.trim()
      });

      setMessages([...messages, message]);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error al enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-AR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('es-AR', { 
        day: '2-digit', 
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chat-overlay">
      <div className="chat-container">
        <div className="chat-header">
          <div className="chat-header-info">
            <User size={20} />
            <div>
              <h3>{otherUserName}</h3>
              <span className="chat-status">Chat de la transacción</span>
            </div>
          </div>
          <button className="chat-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="chat-messages">
          {loading ? (
            <div className="chat-loading">Cargando mensajes...</div>
          ) : messages.length === 0 ? (
            <div className="chat-empty">
              <MessageCircle size={48} />
              <p>No hay mensajes aún</p>
              <p className="chat-empty-hint">Envía un mensaje para iniciar la conversación</p>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                // Ensure both IDs are compared as numbers
                const isOwnMessage = parseInt(message.sender_id) === parseInt(currentUserId);
                return (
                  <div
                    key={message.id}
                    className={`chat-message ${isOwnMessage ? 'own-message sent' : 'other-message received'}`}
                  >
                    <div className={`message-bubble ${isOwnMessage ? 'sent' : 'received'}`}>
                      <div className="message-text">{message.message_text}</div>
                      <div className="message-time">{formatTime(message.created_at)}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <form className="chat-input-container" onSubmit={handleSendMessage}>
          <input
            type="text"
            className="chat-input"
            placeholder="Escribe un mensaje..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={sending || !newMessage.trim()}
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
