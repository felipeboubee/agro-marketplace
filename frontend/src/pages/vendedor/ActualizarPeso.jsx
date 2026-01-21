import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from "../../services/api";
import { Scale, Package, DollarSign, AlertCircle, ArrowLeft, Upload } from 'lucide-react';
import { formatPrice, formatWeight, formatPercentage } from '../../utils/formatters';
import '../../styles/dashboard.css';

export default function ActualizarPeso() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [actualWeight, setActualWeight] = useState('');
  const [balanceTicketFile, setBalanceTicketFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        alert('Por favor selecciona un archivo PDF o imagen (JPG, PNG)');
        e.target.value = '';
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo no debe superar los 5MB');
        e.target.value = '';
        return;
      }
      
      setBalanceTicketFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!actualWeight || actualWeight <= 0) {
      alert('Por favor ingresa un peso válido');
      return;
    }

    if (!balanceTicketFile) {
      alert('Por favor sube el ticket de balanza (PDF o imagen)');
      return;
    }

    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      
      // Upload file first
      const formData = new FormData();
      formData.append('file', balanceTicketFile);
      
      const uploadResponse = await api.post('/upload/balance-ticket', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const balanceTicketUrl = uploadResponse.fileUrl || uploadResponse.url;
      
      // Update transaction with weight and file URL
      await api.put(`/transactions/${id}/weight`, {
        actual_weight: parseFloat(actualWeight),
        balance_ticket_url: balanceTicketUrl
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Peso actualizado exitosamente. El comprador será notificado para confirmar.');
      navigate('/vendedor/ventas');
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
              <span className="info-value">{formatPrice(transaction.agreed_price_per_kg)}/kg</span>
            </div>
            <div className="info-item">
              <span className="info-label">Peso estimado:</span>
              <span className="info-value">{formatWeight(transaction.estimated_weight)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Total estimado:</span>
              <span className="info-value">{formatPrice(estimatedTotal)}</span>
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
            <label htmlFor="balanceTicketFile">Ticket de Balanza *</label>
            <div className="file-input-wrapper">
              <Upload size={20} className="file-input-icon" />
              <input
                id="balanceTicketFile"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                required
                className="file-input"
              />
              <label htmlFor="balanceTicketFile" className="file-input-label">
                {balanceTicketFile ? balanceTicketFile.name : 'Seleccionar archivo (PDF o imagen)'}
              </label>
            </div>
            <small className="form-text">Sube el ticket de balanza en formato PDF o imagen (máx. 5MB)</small>
            {filePreview && (
              <div className="file-preview">
                <img src={filePreview} alt="Preview" />
              </div>
            )}
          </div>

          {/* Preview Calculation */}
          {actualWeight && (
            <div className="calculation-preview">
              <h4>Vista Previa del Cálculo</h4>
              <div className="preview-grid">
                <div className="preview-item">
                  <span className="preview-label">Peso real:</span>
                  <span className="preview-value">{formatWeight(actualWeight)}</span>
                </div>
                <div className="preview-item">
                  <span className="preview-label">Precio/kg:</span>
                  <span className="preview-value">{formatPrice(transaction.agreed_price_per_kg)}</span>
                </div>
                <div className="preview-item highlight">
                  <span className="preview-label">Nuevo total:</span>
                  <span className="preview-value">{formatPrice(newTotal)}</span>
                </div>
              </div>
              
              {difference !== 0 && (
                <div className={`difference-alert ${difference > 0 ? 'positive' : 'negative'}`}>
                  <AlertCircle size={18} />
                  <div>
                    <strong>Diferencia con estimado:</strong>
                    <span> {difference > 0 ? '+' : ''}{formatPrice(Math.abs(difference))} </span>
                    <span>({difference > 0 ? '+' : ''}{formatPercentage(Math.abs(differencePercent))})</span>
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

      <style>{`
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

        .input-with-icon input[type="number"]::-webkit-inner-spin-button,
        .input-with-icon input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .input-with-icon input[type="number"] {
          -moz-appearance: textfield;
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

        .file-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .file-input-icon {
          position: absolute;
          left: 16px;
          color: #666;
          pointer-events: none;
          z-index: 1;
        }

        .file-input {
          position: absolute;
          width: 0.1px;
          height: 0.1px;
          opacity: 0;
          overflow: hidden;
          z-index: -1;
        }

        .file-input-label {
          display: block;
          width: 100%;
          padding: 14px 20px 14px 48px;
          background: white;
          border: 2px dashed #ddd;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 15px;
          color: #666;
          min-height: 52px;
          line-height: 1.5;
        }

        .file-input-label:hover {
          border-color: #0066cc;
          background: #f8f9fa;
        }

        .file-input:focus + .file-input-label {
          border-color: #0066cc;
          box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
        }

        .file-preview {
          margin-top: 12px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .file-preview img {
          max-width: 100%;
          max-height: 300px;
          border-radius: 4px;
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
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 16px;
        }

        .preview-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          background: #e8f5e9;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #c8e6c9;
          width: 207px;
          min-height: 52px;
          justify-content: center;
          align-items: center;
          text-align: center;
        }

        .preview-item.highlight {
          display: flex;
          flex-direction: column;
          gap: 4px;
          background: #e8f5e9;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #c8e6c9;
          width: 207px;
          min-height: 52px;
          justify-content: center;
          align-items: center;
          text-align: center;
        }

        .preview-label {
          font-size: 14px;
          color: #666;
        }

        .preview-value {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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
