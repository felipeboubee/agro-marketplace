import React, { useState, useEffect } from 'react';
import { api } from "../../services/api";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DollarSign, Clock, CheckCircle, XCircle, TrendingUp, AlertCircle, Eye, Play, X } from 'lucide-react';
import { formatPrice } from '../../utils/formatters';
import '../../styles/dashboard.css';

export default function PaymentOrders() {
  const [orders, setOrders] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, processing, completed
  const [expandedOrders, setExpandedOrders] = useState({});
  const [paymentDetails, setPaymentDetails] = useState({});

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

  const fetchPaymentDetails = async (orderId, paymentMethodId, sellerBankAccountId) => {
    try {
      const token = localStorage.getItem('token');
      const details = {};
      
      // Fetch payment method details if exists
      if (paymentMethodId) {
        try {
          const pmResponse = await api.get(`/payment-methods/${paymentMethodId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          details.paymentMethod = pmResponse;
        } catch (e) {
          console.log('Payment method not found:', e);
        }
      }
      
      // Fetch seller bank account details if exists
      if (sellerBankAccountId) {
        try {
          const baResponse = await api.get(`/seller-bank-accounts/${sellerBankAccountId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          details.sellerBankAccount = baResponse;
        } catch (e) {
          console.log('Seller bank account not found:', e);
        }
      }
      
      setPaymentDetails(prev => ({
        ...prev,
        [orderId]: details
      }));
    } catch (error) {
      console.error('Error fetching payment details:', error);
    }
  };

  const toggleOrderExpanded = async (order) => {
    const orderId = order.id;
    const isExpanded = expandedOrders[orderId];
    
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !isExpanded
    }));
    
    // Load payment details if expanding and not already loaded
    if (!isExpanded && !paymentDetails[orderId]) {
      await fetchPaymentDetails(orderId, order.payment_method_id, order.seller_bank_account_id);
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
              <span className="stat-amount">{formatPrice(statistics.pending_amount || 0)}</span>
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
              <span className="stat-amount">{formatPrice(statistics.completed_amount || 0)}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon primary">
              <DollarSign size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Comisiones Banco</span>
              <span className="stat-value">{formatPrice(statistics.total_bank_commission || 0)}</span>
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
                <th></th>
                <th>ID</th>
                <th>Tipo</th>
                <th>Comprador</th>
                <th>Vendedor</th>
                <th>Monto Total</th>
                <th>Comisión Banco</th>
                <th>Plazo</th>
                <th>Vencimiento</th>
                <th>Método</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <React.Fragment key={order.id}>
                  <tr>
                    <td>
                      <button
                        onClick={() => toggleOrderExpanded(order)}
                        className="btn btn-sm"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', minWidth: '32px', minHeight: '32px', padding: '6px' }}
                        title="Ver detalles"
                      >
                        {expandedOrders[order.id] ? '▼' : '▶'}
                      </button>
                    </td>
                    <td>
                      <strong>#{order.id}</strong>
                    </td>
                    <td>
                      <span className={`order-type-badge ${order.order_type || 'final'}`}>
                        {order.order_type === 'provisional' ? 'Provisoria' : 'Final'}
                      </span>
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
                        {formatPrice(order.amount || 0)}
                      </strong>
                    </td>
                    <td>
                      <span className="commission-cell">
                        {formatPrice(order.bank_commission || 0)}
                      </span>
                    </td>
                    <td>
                      <span className="payment-term">
                        {order.payment_term === 'contado' ? 'Contado' : 
                         order.payment_term === '30_dias' ? '30 días' :
                         order.payment_term === '60_dias' ? '60 días' :
                         order.payment_term === '90_dias' ? '90 días' :
                         order.payment_term || '-'}
                      </span>
                    </td>
                    <td>
                      {order.due_date ? (
                        <span className={`due-date ${new Date(order.due_date) < new Date() ? 'overdue' : ''}`}>
                          {format(new Date(order.due_date), 'dd/MM/yyyy', { locale: es })}
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
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
                      <div className="action-buttons" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleProcess(order.id)}
                            className="btn btn-icon btn-sm action-btn action-btn-success"
                            title="Marcar como procesando"
                          >
                            <Play size={16} />
                            <span className="btn-text">Procesar</span>
                          </button>
                        )}
                        {order.status === 'processing' && (
                          <button
                            onClick={() => handleComplete(order.id)}
                            className="btn btn-icon btn-sm action-btn action-btn-primary"
                            title="Completar pago"
                          >
                            <CheckCircle size={16} />
                            <span className="btn-text">Completar</span>
                          </button>
                        )}
                        {['pending', 'processing'].includes(order.status) && (
                          <button
                            onClick={() => handleFail(order.id)}
                            className="btn btn-icon btn-sm action-btn action-btn-danger"
                            title="Rechazar pago"
                          >
                            <X size={16} />
                            <span className="btn-text">Rechazar</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedOrders[order.id] && (
                    <tr className="expanded-row">
                      <td colSpan="11">
                        <div className="payment-details">
                          <h4>Detalles de Pago</h4>
                          <div className="details-grid">
                            {/* Buyer Payment Method */}
                            <div className="detail-section">
                              <h5>Método de Pago del Comprador</h5>
                              {paymentDetails[order.id]?.paymentMethod ? (
                                <div className="detail-content">
                                  {paymentDetails[order.id].paymentMethod.payment_type === 'bank_transfer' && (
                                    <>
                                      <p><strong>Banco:</strong> {paymentDetails[order.id].paymentMethod.bank_name}</p>
                                      <p><strong>Titular:</strong> {paymentDetails[order.id].paymentMethod.account_holder_name}</p>
                                      <p><strong>CBU:</strong> {paymentDetails[order.id].paymentMethod.cbu}</p>
                                      {paymentDetails[order.id].paymentMethod.alias_cbu && (
                                        <p><strong>Alias:</strong> {paymentDetails[order.id].paymentMethod.alias_cbu}</p>
                                      )}
                                      <p><strong>Tipo:</strong> {paymentDetails[order.id].paymentMethod.account_type === 'cuenta_corriente' ? 'Cuenta Corriente' : 'Caja de Ahorro'}</p>
                                    </>
                                  )}
                                  {paymentDetails[order.id].paymentMethod.payment_type === 'credit_card' && (
                                    <>
                                      <p><strong>Titular:</strong> {paymentDetails[order.id].paymentMethod.card_holder_name}</p>
                                      <p><strong>Tarjeta:</strong> {paymentDetails[order.id].paymentMethod.card_brand?.toUpperCase()} **** {paymentDetails[order.id].paymentMethod.card_number_last4}</p>
                                      <p><strong>Vencimiento:</strong> {paymentDetails[order.id].paymentMethod.card_expiry_month}/{paymentDetails[order.id].paymentMethod.card_expiry_year}</p>
                                    </>
                                  )}
                                  {paymentDetails[order.id].paymentMethod.payment_type === 'check' && (
                                    <>
                                      <p><strong>Emisor:</strong> {paymentDetails[order.id].paymentMethod.check_issuer_name}</p>
                                      <p><strong>Banco:</strong> {paymentDetails[order.id].paymentMethod.check_bank_name}</p>
                                      <p><strong>Cuenta:</strong> {paymentDetails[order.id].paymentMethod.check_account_number}</p>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <p className="text-muted">Método de pago no disponible</p>
                              )}
                            </div>

                            {/* Seller Bank Account */}
                            <div className="detail-section">
                              <h5>Cuenta Bancaria del Vendedor</h5>
                              {paymentDetails[order.id]?.sellerBankAccount ? (
                                <div className="detail-content">
                                  <p><strong>Banco:</strong> {paymentDetails[order.id].sellerBankAccount.bank_name}</p>
                                  <p><strong>Titular:</strong> {paymentDetails[order.id].sellerBankAccount.account_holder_name}</p>
                                  <p><strong>CBU:</strong> {paymentDetails[order.id].sellerBankAccount.cbu}</p>
                                  {paymentDetails[order.id].sellerBankAccount.alias_cbu && (
                                    <p><strong>Alias:</strong> {paymentDetails[order.id].sellerBankAccount.alias_cbu}</p>
                                  )}
                                  <p><strong>Cuenta:</strong> {paymentDetails[order.id].sellerBankAccount.account_number}</p>
                                  <p><strong>Tipo:</strong> {paymentDetails[order.id].sellerBankAccount.account_type === 'cuenta_corriente' ? 'Cuenta Corriente' : 'Caja de Ahorro'}</p>
                                  {paymentDetails[order.id].sellerBankAccount.branch_number && (
                                    <p><strong>Sucursal:</strong> {paymentDetails[order.id].sellerBankAccount.branch_number}</p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-muted">Cuenta bancaria no disponible</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}



      <style>{`
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
          font-size: 14px;
          white-space: nowrap;
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

        .expanded-row {
          background: #f8f9fa;
        }

        .expanded-row td {
          padding: 24px !important;
        }

        .payment-details {
          max-width: 1200px;
        }

        .payment-details h4 {
          margin-bottom: 20px;
          color: #333;
          font-size: 18px;
          border-bottom: 2px solid #dee2e6;
          padding-bottom: 10px;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }

        .detail-section {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .detail-section h5 {
          margin-bottom: 16px;
          color: #0066cc;
          font-size: 16px;
          font-weight: 600;
        }

        .detail-content p {
          margin: 8px 0;
          color: #555;
          line-height: 1.6;
        }

        .detail-content strong {
          color: #333;
          min-width: 120px;
          display: inline-block;
        }

        .order-type-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .order-type-badge.provisional {
          background: #fff3cd;
          color: #856404;
        }

        .order-type-badge.final {
          background: #d1ecf1;
          color: #0c5460;
        }

        .due-date {
          font-weight: 600;
        }

        .due-date.overdue {
          color: #dc3545;
        }

        .text-muted {
          color: #999;
          font-style: italic;
        }

        .data-table tbody td {
          text-align: center;
          vertical-align: middle;
        }

        .data-table tbody td:first-child {
          text-align: center;
        }

        .action-btn {
          position: relative;
          padding: 8px;
          min-width: 36px;
          min-height: 36px;
          border-radius: 6px;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border: 1px solid transparent;
          overflow: hidden;
          width: auto;
        }

        .action-btn svg {
          flex-shrink: 0;
        }

        .action-btn .btn-text {
          max-width: 0;
          opacity: 0;
          overflow: hidden;
          white-space: nowrap;
          font-size: 13px;
          transition: max-width 0.3s ease, opacity 0.3s ease;
        }

        .action-btn:hover {
          padding: 8px 12px;
        }

        .action-btn:hover .btn-text {
          max-width: 100px;
          opacity: 1;
          margin-left: 2px;
        }

        .action-btn-success {
          background: #28a745;
          color: white;
          border-color: #28a745;
        }

        .action-btn-success:hover {
          background: #218838;
          border-color: #1e7e34;
        }

        .action-btn-primary {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .action-btn-primary:hover {
          background: #0056b3;
          border-color: #004085;
        }

        .action-btn-danger {
          background: #dc3545;
          color: white;
          border-color: #dc3545;
        }

        .action-btn-danger:hover {
          background: #c82333;
          border-color: #bd2130;
        }
      `}</style>
    </div>
  );
}
