import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from "../../services/api";
import { CheckCircle, AlertCircle, DollarSign, Package, TrendingUp, ArrowLeft } from 'lucide-react';
import { formatPrice, formatWeight, formatPercentage } from '../../utils/formatters';
import '../../styles/dashboard.css';

export default function ConfirmarPeso() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  const fetchTransaction = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.status !== 'weight_confirmed') {
        alert('Esta transacción no está en estado de confirmación de peso');
        navigate('/comprador/mis-compras');
        return;
      }

      setTransaction(response);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transaction:', error);
      alert('Error al cargar la transacción');
      navigate('/comprador/mis-compras');
    }
  };

  useEffect(() => {
    fetchTransaction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleConfirm = async () => {
    if (!window.confirm('¿Confirmas que estás de acuerdo con el peso real y deseas proceder al pago?')) {
      return;
    }

    setConfirming(true);
    try {
      const token = localStorage.getItem('token');
      await api.post(`/transactions/${id}/confirm-weight`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Peso confirmado. La orden de pago ha sido enviada al banco para su procesamiento.');
      navigate('/comprador/mis-compras');
    } catch (error) {
      console.error('Error confirming weight:', error);
      alert(error.response?.data?.error || 'Error al confirmar el peso');
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando transacción...</p>
      </div>
    );
  }

  if (!transaction) {
    return null;
  }

  const baseAmount = parseFloat(transaction.actual_weight) * parseFloat(transaction.agreed_price_per_kg);
  const ivaAmount = baseAmount * 0.105;
  const finalAmount = baseAmount + ivaAmount;
  const platformCommission = baseAmount * 0.01;
  const bankCommission = baseAmount * 0.02;
  const sellerNet = baseAmount - platformCommission - bankCommission;
  const weightDifference = parseFloat(transaction.actual_weight) - parseFloat(transaction.estimated_weight);
  const weightDifferencePercent = (weightDifference / parseFloat(transaction.estimated_weight)) * 100;

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <Link to="/comprador/mis-compras" className="btn btn-outline">
          <ArrowLeft size={20} />
          Volver a Mis Compras
        </Link>
        <h1>
          <CheckCircle size={32} />
          Confirmar Peso Real
        </h1>
        <p className="subtitle">Revisa los detalles y confirma para proceder al pago</p>
      </div>

      <div className="confirmation-container">
        {/* Transaction Info */}
        <div className="info-card">
          <h3>
            <Package size={24} />
            Información del Lote
          </h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Vendedor:</span>
              <span className="info-value">{transaction.seller_name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Lote:</span>
              <span className="info-value">{transaction.animal_type} - {transaction.breed}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Precio acordado:</span>
              <span className="info-value">{formatPrice(transaction.agreed_price_per_kg)}/kg</span>
            </div>
          </div>
        </div>

        {/* Weight Comparison */}
        <div className="info-card highlight-card">
          <h3>
            <TrendingUp size={24} />
            Comparación de Peso
          </h3>
          <div className="weight-comparison-grid">
            <div className="weight-box">
              <span className="weight-label">Peso Estimado</span>
              <span className="weight-value">{formatWeight(transaction.estimated_weight)}</span>
              <span className="weight-sublabel">Inicial</span>
            </div>
            <div className="weight-arrow">→</div>
            <div className="weight-box weight-box-actual">
              <span className="weight-label">Peso Real</span>
              <span className="weight-value actual">{formatWeight(transaction.actual_weight)}</span>
              <span className="weight-sublabel">Balanza</span>
            </div>
          </div>
          
          <div className={`weight-difference ${weightDifference >= 0 ? 'positive' : 'negative'}`}>
            <AlertCircle size={20} />
            <span>
              Diferencia: {weightDifference >= 0 ? '+' : ''}{formatWeight(Math.abs(weightDifference)).replace(' kg', '')} kg 
              ({weightDifferencePercent >= 0 ? '+' : ''}{formatPercentage(Math.abs(weightDifferencePercent))})
            </span>
          </div>

          {transaction.balance_ticket_url && (
            <div className="ticket-link">
              <a 
                href={`http://localhost:5000${transaction.balance_ticket_url}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-sm btn-outline"
              >
                Ver Ticket de Balanza
              </a>
            </div>
          )}
        </div>

        {/* Payment Summary */}
        <div className="info-card">
          <h3>
            <DollarSign size={24} />
            Resumen de Pago
          </h3>
          <div className="payment-breakdown">
            <div className="payment-row">
              <span>Peso real:</span>
              <span className="payment-amount">{formatWeight(transaction.actual_weight)}</span>
            </div>
            <div className="payment-row">
              <span>Precio acordado por kg:</span>
              <span className="payment-amount">{formatPrice(transaction.agreed_price_per_kg)}/kg</span>
            </div>
            <div className="payment-row subtotal">
              <span>Subtotal:</span>
              <span className="payment-amount">{formatPrice(baseAmount)}</span>
            </div>
            <div className="payment-row iva">
              <span>IVA (10.5%):</span>
              <span className="payment-amount iva-amount">+ {formatPrice(ivaAmount)}</span>
            </div>
            <div className="payment-row total">
              <span><strong>Total a Pagar:</strong></span>
              <span className="payment-amount total-amount"><strong>{formatPrice(finalAmount)}</strong></span>
            </div>
          </div>
        </div>

        {/* Confirmation Button */}
        <div className="confirmation-actions">
          <button 
            onClick={handleConfirm} 
            className="btn btn-primary btn-lg"
            disabled={confirming}
          >
            {confirming ? (
              <>
                <div className="spinner-small"></div>
                Procesando...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Confirmar y Proceder al Pago
              </>
            )}
          </button>
          <Link to="/comprador/mis-compras" className="btn btn-outline btn-lg">
            Cancelar
          </Link>
        </div>

        <div className="info-message">
          <AlertCircle size={18} />
          <p>
            Al confirmar, se generará una orden de pago que será procesada por el banco. 
            El vendedor recibirá el pago una vez que el banco complete la transacción.
          </p>
        </div>
      </div>

      <style>{`
        .confirmation-container {
          max-width: 900px;
          margin: 0 auto;
        }

        .info-card {
          background: white;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .info-card h3 {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          color: #333;
        }

        .highlight-card {
          border: 2px solid #0066cc;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .info-label {
          font-size: 14px;
          color: #666;
        }

        .info-value {
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }

        .weight-comparison-grid {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          margin: 24px 0;
        }

        .weight-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          background: #f5f5f5;
          border-radius: 8px;
          min-width: 180px;
        }

        .weight-box-actual {
          background: #e6f3ff;
          border: 2px solid #0066cc;
        }

        .weight-label {
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
        }

        .weight-value {
          font-size: 32px;
          font-weight: bold;
          color: #333;
        }

        .weight-value.actual {
          color: #0066cc;
        }

        .weight-sublabel {
          font-size: 12px;
          color: #999;
          margin-top: 4px;
        }

        .weight-arrow {
          font-size: 36px;
          color: #0066cc;
          font-weight: bold;
        }

        .weight-difference {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border-radius: 6px;
          margin-top: 16px;
        }

        .weight-difference.positive {
          background: #fff3cd;
          color: #856404;
        }

        .weight-difference.negative {
          background: #f8d7da;
          color: #721c24;
        }

        .ticket-link {
          margin-top: 16px;
          text-align: center;
        }

        .payment-breakdown {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .payment-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          border-radius: 6px;
        }

        .payment-row.commission {
          background: #fff3cd;
          color: #856404;
        }

        .payment-row.subtotal {
          border-top: 1px solid #e0e0e0;
          padding-top: 12px;
          margin-top: 8px;
        }

        .payment-row.iva {
          color: #0066cc;
        }

        .iva-amount {
          color: #0066cc;
          font-weight: 700;
        }

        .payment-row.seller-net {
          background: #d4edda;
          color: #155724;
        }

        .payment-row.total {
          background: #0066cc;
          color: white;
          padding: 16px;
          font-size: 18px;
          margin-top: 8px;
        }

        .payment-amount {
          font-weight: 600;
        }

        .total-amount {
          font-size: 24px;
        }

        .confirmation-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin: 32px 0;
        }

        .btn-lg {
          padding: 14px 32px;
          font-size: 16px;
        }

        .spinner-small {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .info-message {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          background: #e7f3ff;
          border-left: 4px solid #0066cc;
          border-radius: 4px;
          margin-top: 24px;
        }

        .info-message p {
          margin: 0;
          color: #004085;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}
