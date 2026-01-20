import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from "../../services/api";
import { Scale, Package, DollarSign, AlertCircle, ArrowLeft, Upload } from 'lucide-react';
import '../../styles/dashboard.css';

export default function ActualizarPeso() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [actualWeight, setActualWeight] = useState('');
  const [balanceTicketUrl, setBalanceTicketUrl] = useState('');

  const fetchTransaction = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.status !== 'pending_weight') {
        alert('Esta transacción no está esperando actualización de peso');
        navigate('/vendedor/transacciones');
        return;
      }

      setTransaction(response);
      // Pre-fill with estimated weight as starting point
      setActualWeight(response.estimated_weight);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transaction:', error);
      alert('Error al cargar la transacción');
      navigate('/vendedor/transacciones');
    }
  };

  useEffect(() => {
    fetchTransaction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!actualWeight || actualWeight <= 0) {
      alert('Por favor ingresa un peso válido');
      return;
    }

    if (!balanceTicketUrl) {
      if (!window.confirm('No has ingresado la URL del ticket de balanza. ¿Deseas continuar?')) {
        return;
      }
    }

    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      await api.put(`/transactions/${id}/weight`, {
        actual_weight: parseFloat(actualWeight),
        balance_ticket_url: balanceTicketUrl || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Peso actualizado exitosamente. El comprador será notificado para confirmar.');
      navigate('/vendedor/transacciones');
    } catch (error) {
      console.error('Error updating weight:', error);
      alert(error.response?.data?.error || 'Error al actualizar el peso');
      setUpdating(false);
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

  const estimatedTotal = parseFloat(transaction.estimated_weight) * parseFloat(transaction.agreed_price_per_kg);
  const newTotal = parseFloat(actualWeight || 0) * parseFloat(transaction.agreed_price_per_kg);
  const difference = newTotal - estimatedTotal;
  const differencePercent = (difference / estimatedTotal) * 100;

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <Link to="/vendedor/transacciones" className="btn btn-outline">
          <ArrowLeft size={20} />
          Volver a Transacciones
        </Link>
        <h1>
          <Scale size={32} />
          Actualizar Peso Real
        </h1>
        <p className="subtitle">Ingresa el peso real del lote después de la balanza</p>
      </div>

      <div className="update-weight-container">
        {/* Transaction Info */}
        <div className="info-card">
          <h3>
            <Package size={24} />
            Información de la Transacción
          </h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Comprador:</span>
              <span className="info-value">{transaction.buyer_name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Lote:</span>
              <span className="info-value">{transaction.animal_type} - {transaction.breed}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Precio acordado:</span>
              <span className="info-value">${parseFloat(transaction.agreed_price_per_kg).toFixed(2)}/kg</span>
            </div>
            <div className="info-item">
              <span className="info-label">Peso estimado:</span>
              <span className="info-value">{parseFloat(transaction.estimated_weight).toFixed(2)} kg</span>
            </div>
            <div className="info-item">
              <span className="info-label">Total estimado:</span>
              <span className="info-value">${estimatedTotal.toLocaleString('es-AR')}</span>
            </div>
          </div>
        </div>

        {/* Weight Update Form */}
        <form onSubmit={handleSubmit} className="weight-form-card">
          <h3>
            <Scale size={24} />
            Datos de Balanza
          </h3>

          <div className="form-group">
            <label htmlFor="actualWeight">Peso Real (kg) *</label>
            <div className="input-with-icon">
              <Scale size={20} />
              <input
                id="actualWeight"
                type="number"
                step="0.01"
                min="0"
                value={actualWeight}
                onChange={(e) => setActualWeight(e.target.value)}
                placeholder="Ej: 1250.50"
                required
              />
              <span className="input-suffix">kg</span>
            </div>
            <small className="form-text">Ingresa el peso total del lote según balanza</small>
          </div>

          <div className="form-group">
            <label htmlFor="balanceTicketUrl">URL del Ticket de Balanza (opcional)</label>
            <div className="input-with-icon">
              <Upload size={20} />
              <input
                id="balanceTicketUrl"
                type="text"
                value={balanceTicketUrl}
                onChange={(e) => setBalanceTicketUrl(e.target.value)}
                placeholder="https://ejemplo.com/ticket.pdf"
              />
            </div>
            <small className="form-text">Puedes agregar un link al documento del ticket de balanza</small>
          </div>

          {/* Preview Calculation */}
          {actualWeight && (
            <div className="calculation-preview">
              <h4>Vista Previa del Cálculo</h4>
              <div className="preview-grid">
                <div className="preview-item">
                  <span className="preview-label">Peso real:</span>
                  <span className="preview-value">{parseFloat(actualWeight).toFixed(2)} kg</span>
                </div>
                <div className="preview-item">
                  <span className="preview-label">Precio/kg:</span>
                  <span className="preview-value">${parseFloat(transaction.agreed_price_per_kg).toFixed(2)}</span>
                </div>
                <div className="preview-item highlight">
                  <span className="preview-label">Nuevo total:</span>
                  <span className="preview-value">${newTotal.toLocaleString('es-AR')}</span>
                </div>
              </div>
              
              {difference !== 0 && (
                <div className={`difference-alert ${difference > 0 ? 'positive' : 'negative'}`}>
                  <AlertCircle size={18} />
                  <div>
                    <strong>Diferencia con estimado:</strong>
                    <span> {difference > 0 ? '+' : ''}${Math.abs(difference).toLocaleString('es-AR')} </span>
                    <span>({difference > 0 ? '+' : ''}{differencePercent.toFixed(2)}%)</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary btn-lg"
              disabled={updating}
            >
              {updating ? (
                <>
                  <div className="spinner-small"></div>
                  Actualizando...
                </>
              ) : (
                <>
                  <Scale size={20} />
                  Actualizar Peso
                </>
              )}
            </button>
            <Link to="/vendedor/transacciones" className="btn btn-outline btn-lg">
              Cancelar
            </Link>
          </div>
        </form>

        <div className="info-message">
          <AlertCircle size={18} />
          <p>
            Al actualizar el peso, el comprador será notificado para revisar y confirmar los datos. 
            Una vez confirmado, se generará la orden de pago.
          </p>
        </div>
      </div>

      <style jsx>{`
        .update-weight-container {
          max-width: 800px;
          margin: 0 auto;
        }

        .info-card {
          background: white;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .info-card h3, .weight-form-card h3 {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          color: #333;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

        .weight-form-card {
          background: white;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-with-icon svg {
          position: absolute;
          left: 12px;
          color: #666;
        }

        .input-with-icon input {
          width: 100%;
          padding: 12px 12px 12px 44px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 16px;
        }

        .input-suffix {
          position: absolute;
          right: 12px;
          color: #666;
          font-weight: 600;
        }

        .form-text {
          display: block;
          margin-top: 6px;
          font-size: 14px;
          color: #666;
        }

        .calculation-preview {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin: 24px 0;
        }

        .calculation-preview h4 {
          margin: 0 0 16px 0;
          color: #333;
        }

        .preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .preview-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .preview-item.highlight {
          background: #e6f3ff;
          padding: 12px;
          border-radius: 6px;
          border: 2px solid #0066cc;
        }

        .preview-label {
          font-size: 14px;
          color: #666;
        }

        .preview-value {
          font-size: 18px;
          font-weight: bold;
          color: #333;
        }

        .preview-item.highlight .preview-value {
          color: #0066cc;
        }

        .difference-alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 6px;
          margin-top: 16px;
        }

        .difference-alert.positive {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .difference-alert.negative {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .form-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin-top: 32px;
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
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          border-radius: 4px;
        }

        .info-message p {
          margin: 0;
          color: #856404;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}
