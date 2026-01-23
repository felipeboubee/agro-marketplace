import React, { useState, useEffect } from 'react';
import { MessageCircle, User } from 'lucide-react';
import { api } from '../services/api';
import ChatBox from '../components/ChatBox';
import '../styles/chat.css';

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    fetchConversations();
    // Poll for new messages every 10 seconds
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/messages/conversations');
      setConversations(response);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = (conversation) => {
    setSelectedConversation(conversation);
    setChatOpen(true);
  };

  const handleCloseChat = () => {
    setChatOpen(false);
    // Refresh conversations to update unread count
    fetchConversations();
  };

  const getTotalUnread = () => {
    return conversations.reduce((sum, conv) => sum + parseInt(conv.unread_count || 0), 0);
  };

  if (loading) {
    return <div className="loading">Cargando conversaciones...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>
          <MessageCircle size={32} />
          Mensajes
        </h1>
        <p>Conversaciones con compradores y vendedores</p>
        {getTotalUnread() > 0 && (
          <div className="alert alert-info">
            Tienes {getTotalUnread()} mensaje{getTotalUnread() !== 1 ? 's' : ''} sin leer
          </div>
        )}
      </div>

      <div className="conversations-container">
        {conversations.length === 0 ? (
          <div className="empty-state">
            <MessageCircle size={64} />
            <h3>No tienes conversaciones</h3>
            <p>Cuando realices una transacción, podrás chatear con la otra parte aquí</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.transaction_id}
              className="conversation-card"
              onClick={() => handleOpenChat(conversation)}
            >
              <div className="conversation-info">
                <h3>
                  <User size={18} style={{ display: 'inline', marginRight: '8px' }} />
                  {conversation.other_user_name}
                </h3>
                <p>
                  <strong>{conversation.animal_type}</strong> - {conversation.breed}
                </p>
                <p style={{ fontSize: '12px', color: '#999' }}>
                  {conversation.last_message_preview}
                </p>
              </div>
              {conversation.unread_count > 0 && (
                <div className="conversation-badge">
                  {conversation.unread_count}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {chatOpen && selectedConversation && (
        <ChatBox
          transactionId={selectedConversation.transaction_id}
          otherUserName={selectedConversation.other_user_name}
          isOpen={chatOpen}
          onClose={handleCloseChat}
        />
      )}

      <style>{`
        .page-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .page-header h1 {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .empty-state {
          text-align: center;
          padding: 64px 32px;
          color: #666;
        }

        .empty-state svg {
          color: #ccc;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          margin-bottom: 8px;
          color: #333;
        }

        .alert-info {
          padding: 12px;
          background: #e3f2fd;
          border-left: 4px solid #2196f3;
          border-radius: 4px;
          margin-top: 16px;
          color: #1565c0;
        }
      `}</style>
    </div>
  );
}
