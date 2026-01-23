import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from "../../services/api";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ShoppingBag, Package, DollarSign, Eye, CheckCircle, Clock, AlertCircle, Truck, MessageCircle } from 'lucide-react';
import { formatPrice, formatWeight } from '../../utils/formatters';
import ChatBox from '../../components/ChatBox';
import '../../styles/dashboard.css';

export default function MyPurchases() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/transactions/buyer', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setTransactions(response);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const calculateTotal = (transaction) => {
    if (transaction.final_amount) {
      return parseFloat(transaction.final_amount);
    }
    return parseFloat(transaction.estimated_total) || 0;
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending_weight': { label: 'Esperando Peso', class: 'badge-warning', icon: Clock },
      'weight_confirmed': { label: 'Peso Confirmado', class: 'badge-info', icon: AlertCircle },
      'payment_pending': { label: 'Pago Pendiente', class: 'badge-warning', icon: DollarSign },
      'payment_processing': { label: 'Procesando Pago', class: 'badge-info', icon: Clock },
      'completed': { label: 'Completada', class: 'badge-success', icon: CheckCircle }
    };
    const badge = badges[status] || { label: status, class: 'badge-default', icon: AlertCircle };
    const Icon = badge.icon;
    
    return (
      <span className={`status-badge ${badge.class}`}>
        <Icon size={16} />
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando compras...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <h1>
          <ShoppingBag size={32} />
          Mis Compras
        </h1>
        <p className="subtitle">Transacciones en curso y completadas</p>
      </div>

      {transactions.length === 0 ? (
        <div className="empty-state">
          <ShoppingBag size={64} style={{ opacity: 0.3 }} />
          <h3>No tienes compras aún</h3>
          <p>Cuando un vendedor acepte tu oferta, aparecerá aquí</p>
          <Link to="/comprador/lotes" className="btn btn-primary">
            Ver Lotes Disponibles
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Lote</th>
                <th>Vendedor</th>
                <th>Precio/kg</th>
                <th>Peso</th>
                <th>Total</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>
                    <div className="lote-info">
                      <strong>{transaction.animal_type || 'N/A'}</strong>
                      <span className="text-muted">{transaction.breed || ''}</span>
                    </div>
                  </td>
                  <td className="text-center">
                    <span>{transaction.seller_name || 'N/A'}</span>
                  </td>
                  <td className="text-center">
                    <span>{formatPrice(transaction.agreed_price_per_kg)}/kg</span>
                  </td>
                  <td>
                    <div className="weight-info">
                      {transaction.actual_weight ? (
                        <div>
                          <strong>{formatWeight(transaction.actual_weight)}</strong>
                          <small className="text-muted"> (real)</small>
                        </div>
                      ) : (
                        <div>
                          <span>{formatWeight(transaction.estimated_weight || 0)}</span>
                          <small className="text-muted"> (estimado)</small>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <strong className="total-price">
                      ${calculateTotal(transaction).toLocaleString('es-AR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </strong>
                  </td>
                  <td>
                    <span>{format(new Date(transaction.created_at), 'dd/MM/yyyy', { locale: es })}</span>
                  </td>
                  <td>
                    {getStatusBadge(transaction.status)}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link 
                        to={`/comprador/lote/${transaction.lote_id}`}
                        className="btn btn-sm btn-success"
                        title="Ver detalles del lote"
                      >
                        <Eye size={16} />
                        <span className="btn-text">Ver Lote</span>
                      </Link>
                      <button
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setChatOpen(true);
                        }}
                        className="btn btn-sm btn-primary"
                        title="Chatear con el vendedor"
                      >
                        <MessageCircle size={16} />
                        <span className="btn-text">Chat</span>
                      </button>
                      {transaction.status === 'weight_confirmed' && (
                        <Link
                          to={`/comprador/confirmar-peso/${transaction.id}`}
                          className="btn btn-sm btn-success"
                          title="Confirmar peso y proceder al pago"
                        >
                          <CheckCircle size={16} /> Confirmar Peso
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {transactions.length > 0 && (
        <div className="stats-grid" style={{ marginTop: '24px' }}>
          <div className="stat-card stat-primary">
            <div className="stat-header">
              <ShoppingBag size={24} />
              <span className="stat-title">Total de Compras</span>
            </div>
            <div className="stat-content">
              <h3 className="stat-value">{transactions.length}</h3>
            </div>
          </div>
          
          <div className="stat-card stat-warning">
            <div className="stat-header">
              <Clock size={24} />
              <span className="stat-title">En Proceso</span>
            </div>
            <div className="stat-content">
              <h3 className="stat-value">
                {transactions.filter(t => !['completed', 'completo'].includes(t.status)).length}
              </h3>
            </div>
          </div>
          
          <div className="stat-card stat-success">
            <div className="stat-header">
              <CheckCircle size={24} />
              <span className="stat-title">Completadas</span>
            </div>
            <div className="stat-content">
              <h3 className="stat-value">
                {transactions.filter(t => ['completed', 'completo'].includes(t.status)).length}
              </h3>
            </div>
          </div>
          
          <div className="stat-card stat-green">
            <div className="stat-header">
              <DollarSign size={24} />
              <span className="stat-title">Monto Total</span>
            </div>
            <div className="stat-content">
              <h3 className="stat-value">
                ${transactions.reduce((sum, t) => sum + calculateTotal(t), 0).toLocaleString('es-AR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </h3>
            </div>
          </div>
        </div>
      )}

      {chatOpen && selectedTransaction && (
        <ChatBox
          transactionId={selectedTransaction.id}
          otherUserName={selectedTransaction.seller_name}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
}
