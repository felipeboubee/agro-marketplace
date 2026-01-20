import React, { useState, useEffect } from 'react';
import { api } from "../../services/api";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DollarSign, Clock, CheckCircle, XCircle, TrendingUp, AlertCircle } from 'lucide-react';
import '../../styles/dashboard.css';

export default function PaymentOrders() {
  const [orders, setOrders] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, processing, completed

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/payment-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching payment orders:', error);
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/payment-orders/statistics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatistics(response);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchStatistics();
  }, []);

  const handleProcess = async (orderId) => {
    const reference = prompt('Ingresa la referencia bancaria:');
    if (!reference) return;

    try {
      const token = localStorage.getItem('token');
      await api.put(`/payment-orders/${orderId}/process`, 
        { bank_reference: reference },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Orden marcada como en proceso');
      fetchOrders();
      fetchStatistics();
    } catch (error) {
      console.error('Error processing order:', error);
      alert(error.response?.data?.error || 'Error al procesar la orden');
    }
  };

  const handleComplete = async (orderId) => {
    // TODO: INTEGRATION POINT - Call your bank's payment API here
    // Example structure:
    /*
    const bankResponse = await yourBankAPI.processPayment({
      amount: order.amount,
      buyer_account: order.buyer_account,
      seller_account: order.seller_account,
      payment_method: order.payment_method,
      reference: orderId
    });
    */

    const apiResponse = prompt('Ingresa la respuesta del API del banco (JSON o referencia):');
    if (!apiResponse) return;

    if (!window.confirm('¿Confirmar que el pago fue completado exitosamente?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await api.put(`/payment-orders/${orderId}/complete`, 
        { bank_api_response: apiResponse },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Pago completado exitosamente');
      fetchOrders();
      fetchStatistics();
    } catch (error) {
      console.error('Error completing order:', error);
      alert(error.response?.data?.error || 'Error al completar el pago');
    }
  };

  const handleFail = async (orderId) => {
    const reason = prompt('Ingresa el motivo del fallo:');
    if (!reason) return;

    if (!window.confirm('¿Marcar este pago como fallido?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await api.put(`/payment-orders/${orderId}/fail`, 
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Pago marcado como fallido');
      fetchOrders();
      fetchStatistics();
    } catch (error) {
      console.error('Error failing order:', error);
      alert(error.response?.data?.error || 'Error al marcar como fallido');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': { label: 'Pendiente', class: 'badge-warning', icon: Clock },
      'processing': { label: 'Procesando', class: 'badge-info', icon: TrendingUp },
      'completed': { label: 'Completado', class: 'badge-success', icon: CheckCircle },
      'failed': { label: 'Fallido', class: 'badge-danger', icon: XCircle },
      'refunded': { label: 'Reembolsado', class: 'badge-secondary', icon: DollarSign }
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

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando órdenes de pago...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <h1>
          <DollarSign size={32} />
          Órdenes de Pago
        </h1>
        <p className="subtitle">Gestión de pagos de la plataforma</p>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon warning">
              <Clock size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Pendientes</span>
              <span className="stat-value">{statistics.pending_orders || 0}</span>
              <span className="stat-amount">${parseFloat(statistics.pending_amount || 0).toLocaleString('es-AR')}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon info">
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Procesando</span>
              <span className="stat-value">{statistics.processing_orders || 0}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon success">
              <CheckCircle size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Completadas</span>
              <span className="stat-value">{statistics.completed_orders || 0}</span>
              <span className="stat-amount">${parseFloat(statistics.completed_amount || 0).toLocaleString('es-AR')}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon primary">
              <DollarSign size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Comisiones Banco</span>
              <span className="stat-value">${parseFloat(statistics.total_bank_commission || 0).toLocaleString('es-AR')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="filter-buttons">
        <button 
          className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFilter('all')}
        >
          Todas ({orders.length})
        </button>
        <button 
          className={`btn btn-sm ${filter === 'pending' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFilter('pending')}
        >
          Pendientes ({orders.filter(o => o.status === 'pending').length})
        </button>
        <button 
          className={`btn btn-sm ${filter === 'processing' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFilter('processing')}
        >
          Procesando ({orders.filter(o => o.status === 'processing').length})
        </button>
        <button 
          className={`btn btn-sm ${filter === 'completed' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFilter('completed')}
        >
          Completadas ({orders.filter(o => o.status === 'completed').length})
        </button>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="empty-state">
          <DollarSign size={64} style={{ opacity: 0.3 }} />
          <h3>No hay órdenes {filter !== 'all' ? `en estado ${filter}` : ''}</h3>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Comprador</th>
                <th>Vendedor</th>
                <th>Monto Total</th>
                <th>Comisión Banco</th>
                <th>Plazo</th>
                <th>Método</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>#{order.id}</strong>
                  </td>
                  <td>
                    <div className="user-info">
                      <span>{order.buyer_name || 'N/A'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="user-info">
                      <span>{order.seller_name || 'N/A'}</span>
                    </div>
                  </td>
                  <td>
                    <strong className="amount-cell">
                      ${parseFloat(order.amount || 0).toLocaleString('es-AR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </strong>
                  </td>
                  <td>
                    <span className="commission-cell">
                      ${parseFloat(order.bank_commission || 0).toLocaleString('es-AR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </td>
                  <td>
                    <span className="payment-term">
                      {order.payment_term === 'contado' ? 'Contado' : 
                       order.payment_term === '30' ? '30 días' :
                       order.payment_term === '30-60' ? '30-60 días' :
                       order.payment_term || '-'}
                    </span>
                  </td>
                  <td>
                    <span className="payment-method">
                      {order.payment_method === 'transferencia' ? 'Transferencia' :
                       order.payment_method === 'tarjeta' ? 'Tarjeta' :
                       order.payment_method === 'cheque' ? 'Cheque' :
                       order.payment_method || '-'}
                    </span>
                  </td>
                  <td>
                    <small>{format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}</small>
                  </td>
                  <td>
                    {getStatusBadge(order.status)}
                  </td>
                  <td>
                    <div className="action-buttons">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleProcess(order.id)}
                          className="btn btn-sm btn-warning"
                          title="Marcar como procesando"
                        >
                          Procesar
                        </button>
                      )}
                      {order.status === 'processing' && (
                        <button
                          onClick={() => handleComplete(order.id)}
                          className="btn btn-sm btn-success"
                          title="Completar pago"
                        >
                          Completar
                        </button>
                      )}
                      {['pending', 'processing'].includes(order.status) && (
                        <button
                          onClick={() => handleFail(order.id)}
                          className="btn btn-sm btn-danger"
                          title="Marcar como fallido"
                        >
                          Fallar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bank API Integration Info */}
      <div className="integration-info">
        <h3>
          <AlertCircle size={24} />
          Integración con API del Banco
        </h3>
        <p>
          Esta sección está preparada para conectarse con el API de su banco. 
          Cuando esté listo para integrar, modifique la función <code>handleComplete</code> en este archivo 
          para llamar al endpoint de su banco.
        </p>
        <div className="code-example">
          <pre>{`
// Ejemplo de integración:
const bankResponse = await yourBankAPI.processPayment({
  amount: order.amount,
  buyer_account: order.buyer_account,
  seller_account: order.seller_account,
  payment_method: order.payment_method,
  payment_term: order.payment_term,
  reference: order.id
});

// Luego actualizar la orden con la respuesta
await api.put(\`/payment-orders/\${orderId}/complete\`, 
  { bank_api_response: JSON.stringify(bankResponse) }
);
          `}</pre>
        </div>
      </div>

      <style jsx>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          display: flex;
          gap: 16px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon.warning { background: #fff3cd; color: #856404; }
        .stat-icon.info { background: #d1ecf1; color: #0c5460; }
        .stat-icon.success { background: #d4edda; color: #155724; }
        .stat-icon.primary { background: #cce5ff; color: #004085; }

        .stat-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-label {
          font-size: 14px;
          color: #666;
        }

        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #333;
        }

        .stat-amount {
          font-size: 14px;
          color: #666;
        }

        .filter-buttons {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }

        .amount-cell {
          color: #0066cc;
          font-size: 16px;
        }

        .commission-cell {
          color: #28a745;
        }

        .integration-info {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 24px;
          margin-top: 32px;
          border-left: 4px solid #0066cc;
        }

        .integration-info h3 {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          color: #333;
        }

        .integration-info p {
          margin-bottom: 16px;
          color: #666;
          line-height: 1.6;
        }

        .code-example {
          background: #2d2d2d;
          border-radius: 6px;
          padding: 16px;
          overflow-x: auto;
        }

        .code-example pre {
          margin: 0;
          color: #f8f8f2;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.5;
        }

        .code-example code {
          background: rgba(255,255,255,0.1);
          padding: 2px 6px;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}
