import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from "../../services/api";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp, DollarSign, Calendar, Scale, CheckCircle, Clock, AlertCircle, Eye } from 'lucide-react';
import { formatPrice, formatWeight } from '../../utils/formatters';
import '../../styles/dashboard.css';

export default function MyTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/transactions/seller', {
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

  const calculateTotal = (transaction) => {
    if (transaction.seller_net_amount) {
      return parseFloat(transaction.seller_net_amount);
    }
    if (transaction.final_amount) {
      // Calculate net: final_amount - commissions
      const finalAmount = parseFloat(transaction.final_amount);
      return finalAmount * 0.97; // 3% total commission (1% platform + 2% bank)
    }
    return parseFloat(transaction.estimated_total) * 0.97 || 0;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando transacciones...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <h1>
          <TrendingUp size={32} />
          Mis Ventas
        </h1>
        <p className="subtitle">Transacciones en curso y completadas</p>
      </div>

      {transactions.length === 0 ? (
        <div className="empty-state">
          <TrendingUp size={64} style={{ opacity: 0.3 }} />
          <h3>No tienes ventas aún</h3>
          <p>Cuando aceptes una oferta, la transacción aparecerá aquí</p>
          <Link to="/vendedor/solicitudes" className="btn btn-primary">
            Ver Solicitudes de Compra
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Lote</th>
                <th>Comprador</th>
                <th>Precio/kg</th>
                <th>Peso</th>
                <th>Total Neto</th>
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
                  <td>
                    <div className="buyer-info">
                      <span>{transaction.buyer_name || 'N/A'}</span>
                    </div>
                  </td>
                  <td>
                    <span>{formatPrice(transaction.agreed_price_per_kg || 0)}/kg</span>
                  </td>
                  <td>
                    <div className="weight-info">
                      {transaction.actual_weight ? (
                        <div>
                          <strong>{formatWeight(transaction.actual_weight)}</strong>
                          <br />
                          <small className="text-muted">(real)</small>
                        </div>
                      ) : (
                        <div>
                          <span>{formatWeight(transaction.estimated_weight || 0)}</span>
                          <br />
                          <small className="text-muted">(estimado)</small>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div>
                      <strong className="total-price">
                        {formatPrice(calculateTotal(transaction))}
                      </strong>
                      <br />
                      <small className="text-muted">(después de comisiones)</small>
                    </div>
                  </td>
                  <td>
                    <span>{format(new Date(transaction.created_at), 'dd/MM/yyyy', { locale: es })}</span>
                  </td>
                  <td>
                    {getStatusBadge(transaction.status)}
                  </td>
                  <td>
                    <div className="action-buttons">
                      {transaction.status === 'pending_weight' && (
                        <Link
                          to={`/vendedor/actualizar-peso/${transaction.id}`}
                          className="btn btn-sm btn-primary"
                          title="Actualizar peso real"
                        >
                          <Scale size={16} />
                          <span className="btn-text">Actualizar Peso</span>
                        </Link>
                      )}
                      <Link 
                        to={`/vendedor/lote/${transaction.lote_id}`}
                        className="btn btn-sm btn-success"
                        title="Ver detalles del lote"
                      >
                        <Eye size={16} />
                        <span className="btn-text">Ver Lote</span>
                      </Link>
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
              <TrendingUp size={24} />
              <span className="stat-title">Total de Ventas</span>
            </div>
            <div className="stat-content">
              <h3 className="stat-value">{transactions.length}</h3>
            </div>
          </div>
          
          <div className="stat-card stat-warning">
            <div className="stat-header">
              <Clock size={24} />
              <span className="stat-title">Pendientes de Peso</span>
            </div>
            <div className="stat-content">
              <h3 className="stat-value">
                {transactions.filter(t => t.status === 'pending_weight').length}
              </h3>
            </div>
          </div>
          
          <div className="stat-card stat-info">
            <div className="stat-header">
              <AlertCircle size={24} />
              <span className="stat-title">En Proceso de Pago</span>
            </div>
            <div className="stat-content">
              <h3 className="stat-value">
                {transactions.filter(t => ['weight_confirmed', 'payment_pending', 'payment_processing'].includes(t.status)).length}
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
                {transactions.filter(t => t.status === 'completed').length}
              </h3>
            </div>
          </div>
          
          <div className="stat-card stat-green">
            <div className="stat-header">
              <DollarSign size={24} />
              <span className="stat-title">Ingresos Totales Netos</span>
            </div>
            <div className="stat-content">
              <h3 className="stat-value">
                {formatPrice(transactions
                  .filter(t => t.status === 'completed')
                  .reduce((sum, t) => sum + calculateTotal(t), 0))}
              </h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
