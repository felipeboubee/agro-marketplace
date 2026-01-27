import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, CreditCard, Building, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import '../../styles/admin.css';

export default function VerificationRequests() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('payment_methods'); // 'payment_methods' or 'bank_accounts'

  useEffect(() => {
    fetchUnverified();
  }, []);

  const fetchUnverified = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const [pmResponse, baResponse] = await Promise.all([
        api.get('/payment-methods/unverified/all', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get('/seller-bank-accounts/unverified/all', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setPaymentMethods(pmResponse);
      setBankAccounts(baResponse);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching unverified items:', error);
      setLoading(false);
    }
  };

  const handleVerifyPaymentMethod = async (id) => {
    if (!window.confirm('¿Estás seguro de verificar este método de pago?')) return;

    try {
      const token = localStorage.getItem('token');
      await api.put(`/payment-methods/${id}/verify`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Método de pago verificado exitosamente');
      fetchUnverified();
    } catch (error) {
      console.error('Error verifying payment method:', error);
      alert('Error al verificar método de pago');
    }
  };

  const handleRejectPaymentMethod = async (id) => {
    const reason = window.prompt('Motivo del rechazo (opcional):');
    if (reason === null) return; // User cancelled

    try {
      const token = localStorage.getItem('token');
      await api.put(`/payment-methods/${id}/reject`, 
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Método de pago rechazado');
      fetchUnverified();
    } catch (error) {
      console.error('Error rejecting payment method:', error);
      alert('Error al rechazar método de pago');
    }
  };

  const handleVerifyBankAccount = async (id) => {
    if (!window.confirm('¿Estás seguro de verificar esta cuenta bancaria?')) return;

    try {
      const token = localStorage.getItem('token');
      await api.put(`/seller-bank-accounts/${id}/verify`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Cuenta bancaria verificada exitosamente');
      fetchUnverified();
    } catch (error) {
      console.error('Error verifying bank account:', error);
      alert('Error al verificar cuenta bancaria');
    }
  };

  const handleRejectBankAccount = async (id) => {
    const reason = window.prompt('Motivo del rechazo (opcional):');
    if (reason === null) return;

    try {
      const token = localStorage.getItem('token');
      await api.put(`/seller-bank-accounts/${id}/reject`, 
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Cuenta bancaria rechazada');
      fetchUnverified();
    } catch (error) {
      console.error('Error rejecting bank account:', error);
      alert('Error al rechazar cuenta bancaria');
    }
  };

  const renderPaymentMethodDetails = (pm) => {
    if (pm.payment_type === 'bank_transfer') {
      return (
        <div className="verification-details">
          <p><strong>Tipo:</strong> Transferencia Bancaria</p>
          <p><strong>Banco:</strong> {pm.bank_name}</p>
          <p><strong>Titular:</strong> {pm.account_holder_name}</p>
          <p><strong>CBU:</strong> {pm.cbu}</p>
          {pm.alias_cbu && <p><strong>Alias:</strong> {pm.alias_cbu}</p>}
          <p><strong>Cuenta:</strong> {pm.account_number}</p>
          <p><strong>Tipo de Cuenta:</strong> {pm.account_type === 'cuenta_corriente' ? 'Cuenta Corriente' : 'Caja de Ahorro'}</p>
        </div>
      );
    }

    if (pm.payment_type === 'credit_card') {
      return (
        <div className="verification-details">
          <p><strong>Tipo:</strong> Tarjeta de Crédito</p>
          <p><strong>Titular:</strong> {pm.card_holder_name}</p>
          <p><strong>Marca:</strong> {pm.card_brand?.toUpperCase()}</p>
          <p><strong>Últimos 4 dígitos:</strong> **** {pm.card_number_last4}</p>
          <p><strong>Vencimiento:</strong> {pm.card_expiry_month}/{pm.card_expiry_year}</p>
        </div>
      );
    }

    if (pm.payment_type === 'check') {
      return (
        <div className="verification-details">
          <p><strong>Tipo:</strong> Cheque</p>
          <p><strong>Emisor:</strong> {pm.check_issuer_name}</p>
          <p><strong>Banco:</strong> {pm.check_bank_name}</p>
          <p><strong>Cuenta:</strong> {pm.check_account_number}</p>
        </div>
      );
    }
  };

  const renderBankAccountDetails = (ba) => {
    return (
      <div className="verification-details">
        <p><strong>Banco:</strong> {ba.bank_name}</p>
        <p><strong>Titular:</strong> {ba.account_holder_name}</p>
        <p><strong>CBU:</strong> {ba.cbu}</p>
        {ba.alias_cbu && <p><strong>Alias:</strong> {ba.alias_cbu}</p>}
        <p><strong>Cuenta:</strong> {ba.account_number}</p>
        <p><strong>Tipo:</strong> {ba.account_type === 'cuenta_corriente' ? 'Cuenta Corriente' : 'Caja de Ahorro'}</p>
        {ba.branch_number && <p><strong>Sucursal:</strong> {ba.branch_number}</p>}
        {ba.swift_code && <p><strong>SWIFT:</strong> {ba.swift_code}</p>}
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Cargando solicitudes de verificación...</div>;
  }

  const totalPending = paymentMethods.length + bankAccounts.length;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Verificaciones Pendientes</h1>
          <p>Revisa y aprueba métodos de pago y cuentas bancarias</p>
        </div>
        <button onClick={fetchUnverified} className="btn btn-outline">
          <RefreshCw size={20} />
          Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card warning">
          <AlertCircle size={32} />
          <div>
            <div className="stat-value">{totalPending}</div>
            <div className="stat-label">Total Pendientes</div>
          </div>
        </div>
        <div className="stat-card info">
          <CreditCard size={32} />
          <div>
            <div className="stat-value">{paymentMethods.length}</div>
            <div className="stat-label">Métodos de Pago</div>
          </div>
        </div>
        <div className="stat-card success">
          <Building size={32} />
          <div>
            <div className="stat-value">{bankAccounts.length}</div>
            <div className="stat-label">Cuentas Bancarias</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'payment_methods' ? 'active' : ''}`}
          onClick={() => setActiveTab('payment_methods')}
        >
          <CreditCard size={20} />
          Métodos de Pago ({paymentMethods.length})
        </button>
        <button
          className={`tab ${activeTab === 'bank_accounts' ? 'active' : ''}`}
          onClick={() => setActiveTab('bank_accounts')}
        >
          <Building size={20} />
          Cuentas Bancarias ({bankAccounts.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'payment_methods' && (
        <div className="verification-list">
          {paymentMethods.length === 0 ? (
            <div className="empty-state">
              <CheckCircle size={64} style={{ opacity: 0.3, color: '#4caf50' }} />
              <h3>No hay métodos de pago pendientes</h3>
              <p>Todos los métodos de pago han sido verificados</p>
            </div>
          ) : (
            paymentMethods.map((pm) => (
              <div key={pm.id} className="verification-card">
                <div className="verification-header">
                  <div className="user-info">
                    <CreditCard size={24} className="icon-primary" />
                    <div>
                      <h3>{pm.user_name}</h3>
                      <p className="text-muted">{pm.user_email}</p>
                    </div>
                  </div>
                  <div className="verification-date">
                    <small>Creado: {format(new Date(pm.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}</small>
                  </div>
                </div>

                {renderPaymentMethodDetails(pm)}

                <div className="verification-actions">
                  <button
                    onClick={() => handleVerifyPaymentMethod(pm.id)}
                    className="btn btn-success"
                  >
                    <CheckCircle size={18} />
                    Verificar
                  </button>
                  <button
                    onClick={() => handleRejectPaymentMethod(pm.id)}
                    className="btn btn-danger"
                  >
                    <XCircle size={18} />
                    Rechazar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'bank_accounts' && (
        <div className="verification-list">
          {bankAccounts.length === 0 ? (
            <div className="empty-state">
              <CheckCircle size={64} style={{ opacity: 0.3, color: '#4caf50' }} />
              <h3>No hay cuentas bancarias pendientes</h3>
              <p>Todas las cuentas bancarias han sido verificadas</p>
            </div>
          ) : (
            bankAccounts.map((ba) => (
              <div key={ba.id} className="verification-card">
                <div className="verification-header">
                  <div className="user-info">
                    <Building size={24} className="icon-success" />
                    <div>
                      <h3>{ba.user_name}</h3>
                      <p className="text-muted">{ba.user_email}</p>
                    </div>
                  </div>
                  <div className="verification-date">
                    <small>Creado: {format(new Date(ba.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}</small>
                  </div>
                </div>

                {renderBankAccountDetails(ba)}

                <div className="verification-actions">
                  <button
                    onClick={() => handleVerifyBankAccount(ba.id)}
                    className="btn btn-success"
                  >
                    <CheckCircle size={18} />
                    Verificar
                  </button>
                  <button
                    onClick={() => handleRejectBankAccount(ba.id)}
                    className="btn btn-danger"
                  >
                    <XCircle size={18} />
                    Rechazar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <style>{`
        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: white;
          border-radius: 8px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .stat-card.warning { border-left: 4px solid #ff9800; }
        .stat-card.info { border-left: 4px solid #2196f3; }
        .stat-card.success { border-left: 4px solid #4caf50; }

        .stat-value {
          font-size: 32px;
          font-weight: bold;
          color: #333;
        }

        .stat-label {
          font-size: 14px;
          color: #666;
        }

        .tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          border-bottom: 2px solid #e0e0e0;
        }

        .tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          color: #666;
          font-weight: 500;
          transition: all 0.2s;
        }

        .tab:hover {
          color: #333;
          background: #f5f5f5;
        }

        .tab.active {
          color: #0066cc;
          border-bottom-color: #0066cc;
        }

        .verification-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .verification-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .verification-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e0e0e0;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-info h3 {
          margin: 0;
          font-size: 18px;
          color: #333;
        }

        .verification-date small {
          color: #999;
        }

        .verification-details {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .verification-details p {
          margin: 8px 0;
          color: #555;
        }

        .verification-details strong {
          color: #333;
          min-width: 140px;
          display: inline-block;
        }

        .verification-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .icon-primary {
          color: #2196f3;
        }

        .icon-success {
          color: #4caf50;
        }
      `}</style>
    </div>
  );
}
