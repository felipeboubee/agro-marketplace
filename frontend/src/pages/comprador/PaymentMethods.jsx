import React, { useState, useEffect } from 'react';
import { CreditCard, Building, FileText, Plus, Trash2, Check, X, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import '../../styles/forms.css';
import {
  validateCreditCard,
  validateCBU,
  validateCardExpiry,
  formatCardNumber,
  formatCBU,
  detectCardBrand
} from '../../utils/paymentValidations';

const BANKS = [
  'Banco Nación', 'Banco Provincia', 'Banco Galicia', 'Banco Santander',
  'Banco BBVA', 'Banco Macro', 'Banco ICBC', 'Banco Patagonia',
  'Banco Supervielle', 'Banco Credicoop', 'Otro'
];

const ACCOUNT_TYPES = [
  { value: 'cuenta_corriente', label: 'Cuenta Corriente' },
  { value: 'caja_ahorro', label: 'Caja de Ahorro' }
];

const CARD_BRANDS = [
  { value: 'visa', label: 'Visa' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'amex', label: 'American Express' }
];

export default function PaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('bank_transfer'); // 'bank_transfer', 'credit_card', 'check'
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [availableBanks, setAvailableBanks] = useState([]);

  useEffect(() => {
    fetchPaymentMethods();
    fetchAvailableBanks();
  }, []);

  const fetchAvailableBanks = async () => {
    try {
      const response = await api.get('/users/banks');
      setAvailableBanks(response);
    } catch (error) {
      console.error('Error fetching banks:', error);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await api.get('/payment-methods');
      setPaymentMethods(response);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setValidationErrors({});

    // Validar según el tipo de método de pago
    const errors = {};

    if (formType === 'bank_transfer') {
      // Validar CBU
      if (!formData.cbu) {
        errors.cbu = 'CBU es requerido';
      } else if (!validateCBU(formData.cbu)) {
        errors.cbu = 'CBU inválido. Debe tener 22 dígitos y pasar la validación de dígitos verificadores';
      }
    }

    if (formType === 'credit_card') {
      // Validar número de tarjeta con algoritmo de Luhn
      if (!formData.card_number) {
        errors.card_number = 'Número de tarjeta es requerido';
      } else if (!validateCreditCard(formData.card_number)) {
        errors.card_number = 'Número de tarjeta inválido';
      }

      // Validar fecha de vencimiento
      if (!formData.expiry_month || !formData.expiry_year) {
        errors.expiry = 'Fecha de vencimiento requerida';
      } else if (!validateCardExpiry(parseInt(formData.expiry_month), parseInt(formData.expiry_year))) {
        errors.expiry = 'La tarjeta ha vencido o la fecha es inválida';
      }

      // Auto-detectar marca de tarjeta
      if (formData.card_number) {
        const detectedBrand = detectCardBrand(formData.card_number);
        if (detectedBrand !== 'unknown' && detectedBrand !== formData.card_brand) {
          formData.card_brand = detectedBrand;
        }
      }
    }

    // Si hay errores de validación, no enviar
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setSaving(false);
      return;
    }

    try {
      if (formType === 'credit_card') {
        // Asegurar que los campos de vencimiento estén presentes con el nombre correcto
        const { expiry_month, expiry_year, ...rest } = formData;
        const payload = {
          ...rest,
          card_expiry_month: expiry_month,
          card_expiry_year: expiry_year
        };
        await api.post('/payment-methods', {
          payment_type: formType,
          ...payload
        });
      } else {
        await api.post('/payment-methods', {
          payment_type: formType,
          ...formData
        });
      }

      setShowForm(false);
      setFormData({});
      setValidationErrors({});
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error saving payment method:', error);
      alert('Error al guardar método de pago');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.put(`/payment-methods/${id}/set-default`);
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error setting default:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este método de pago?')) return;

    try {
      await api.delete(`/payment-methods/${id}`);
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error deleting payment method:', error);
    }
  };

  const renderForm = () => {
    if (formType === 'bank_transfer') {
      return (
        <>
          <div className="form-group">
            <label>Banco *</label>
            <select
              value={formData.bank_name || ''}
              onChange={(e) => {
                const selectedBank = e.target.value;
                // Find matching bank_id from availableBanks
                const matchingBank = availableBanks.find(b => b.name === selectedBank);
                setFormData({ 
                  ...formData, 
                  bank_name: selectedBank,
                  bank_id: matchingBank ? matchingBank.id : null
                });
              }}
              required
            >
              <option value="">Seleccionar banco</option>
              {BANKS.map(bank => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Titular de la Cuenta *</label>
            <input
              type="text"
              value={formData.account_holder_name || ''}
              onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>CBU *</label>
              <input
                type="text"
                value={formData.cbu || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/\s/g, '');
                  setFormData({ ...formData, cbu: value });
                  // Limpiar error al escribir
                  if (validationErrors.cbu) {
                    setValidationErrors({ ...validationErrors, cbu: null });
                  }
                }}
                onBlur={(e) => {
                  // Validar al perder foco
                  const cbu = e.target.value;
                  if (cbu && !validateCBU(cbu)) {
                    setValidationErrors({ 
                      ...validationErrors, 
                      cbu: 'CBU inválido. Debe tener 22 dígitos y pasar la validación de dígitos verificadores' 
                    });
                  }
                }}
                maxLength="22"
                placeholder="22 dígitos"
                required
                className={validationErrors.cbu ? 'input-error' : ''}
              />
              {validationErrors.cbu && (
                <div className="validation-error">
                  <AlertCircle size={14} />
                  <span>{validationErrors.cbu}</span>
                </div>
              )}
              <small className="input-help">
                {formData.cbu ? `${formData.cbu.length}/22 dígitos` : 'Ingrese su CBU de 22 dígitos'}
              </small>
            </div>

            <div className="form-group">
              <label>Alias CBU</label>
              <input
                type="text"
                value={formData.alias_cbu || ''}
                onChange={(e) => setFormData({ ...formData, alias_cbu: e.target.value })}
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Número de Cuenta *</label>
              <input
                type="text"
                value={formData.account_number || ''}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Tipo de Cuenta *</label>
              <select
                value={formData.account_type || ''}
                onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                required
              >
                <option value="">Seleccionar</option>
                {ACCOUNT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>
        </>
      );
    }

    if (formType === 'credit_card') {
      return (
        <>
          <div className="form-group">
            <label>Banco Emisor *</label>
            <select
              value={formData.bank_id || ''}
              onChange={(e) => setFormData({ ...formData, bank_id: e.target.value })}
              required
            >
              <option value="">Seleccionar banco emisor</option>
              {availableBanks.map(bank => (
                <option key={bank.id} value={bank.id}>
                  {bank.name}
                </option>
              ))}
            </select>
            <small className="input-help">
              Selecciona el banco emisor de tu tarjeta
            </small>
          </div>

          <div className="form-group">
            <label>Titular de la Tarjeta *</label>
            <input
              type="text"
              value={formData.card_holder_name || ''}
              onChange={(e) => setFormData({ ...formData, card_holder_name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Número de Tarjeta * (Completo para validación)</label>
            <input
              type="text"
              value={formData.card_number || ''}
              onChange={(e) => {
                const value = e.target.value.replace(/\s/g, '');
                const detectedBrand = detectCardBrand(value);
                setFormData({ 
                  ...formData, 
                  card_number: value,
                  card_number_last4: value.slice(-4),
                  card_brand: detectedBrand !== 'unknown' ? detectedBrand : formData.card_brand
                });
                // Limpiar error al escribir
                if (validationErrors.card_number) {
                  setValidationErrors({ ...validationErrors, card_number: null });
                }
              }}
              onBlur={(e) => {
                // Validar al perder foco
                const cardNumber = e.target.value;
                if (cardNumber && !validateCreditCard(cardNumber)) {
                  setValidationErrors({ 
                    ...validationErrors, 
                    card_number: 'Número de tarjeta inválido (algoritmo de Luhn)' 
                  });
                }
              }}
              maxLength="19"
              placeholder="Número completo de la tarjeta"
              required
              className={validationErrors.card_number ? 'input-error' : ''}
            />
            {validationErrors.card_number && (
              <div className="validation-error">
                <AlertCircle size={14} />
                <span>{validationErrors.card_number}</span>
              </div>
            )}
            {formData.card_number && validateCreditCard(formData.card_number) && (
              <div className="validation-success">
                <Check size={14} />
                <span>Número de tarjeta válido ({detectCardBrand(formData.card_number).toUpperCase()})</span>
              </div>
            )}
            <small className="input-help">
              El número completo se valida pero solo se guardan los últimos 4 dígitos
            </small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Últimos 4 dígitos * (auto-completado)</label>
              <input
                type="text"
                value={formData.card_number_last4 || ''}
                readOnly
                maxLength="4"
                placeholder="1234"
                required
              />
            </div>

            <div className="form-group">
              <label>Marca * (auto-detectada)</label>
              <select
                value={formData.card_brand || ''}
                onChange={(e) => setFormData({ ...formData, card_brand: e.target.value })}
                required
              >
                <option value="">Seleccionar</option>
                {CARD_BRANDS.map(brand => (
                  <option key={brand.value} value={brand.value}>{brand.label}</option>
                ))}
              </select>
              <small className="input-help">
                {formData.card_number && detectCardBrand(formData.card_number) !== 'unknown' && 
                  `Detectada: ${detectCardBrand(formData.card_number).toUpperCase()}`
                }
              </small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Mes de Vencimiento *</label>
              <input
                type="number"
                value={formData.expiry_month || ''}
                onChange={(e) => {
                  setFormData({ ...formData, expiry_month: e.target.value });
                  if (validationErrors.expiry) {
                    setValidationErrors({ ...validationErrors, expiry: null });
                  }
                }}
                min="1"
                max="12"
                placeholder="MM"
                required
                className={validationErrors.expiry ? 'input-error' : ''}
              />
            </div>

            <div className="form-group">
              <label>Año de Vencimiento *</label>
              <input
                type="number"
                value={formData.expiry_year || ''}
                onChange={(e) => {
                  setFormData({ ...formData, expiry_year: e.target.value });
                  if (validationErrors.expiry) {
                    setValidationErrors({ ...validationErrors, expiry: null });
                  }
                }}
                min="2024"
                placeholder="YYYY"
                required
                className={validationErrors.expiry ? 'input-error' : ''}
              />
            </div>

            <div className="form-group">
              <label>Código de Seguridad (CVV) *</label>
              <input
                type="text"
                value={formData.cvv || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 4) {
                    setFormData({ ...formData, cvv: value });
                  }
                }}
                maxLength="4"
                placeholder="CVV"
                required
              />
              <small className="input-help">
                3 o 4 dígitos en el reverso de tu tarjeta
              </small>
            </div>
          </div>
          {validationErrors.expiry && (
            <div className="validation-error">
              <AlertCircle size={14} />
              <span>{validationErrors.expiry}</span>
            </div>
          )}
          {formData.expiry_month && formData.expiry_year && 
           validateCardExpiry(parseInt(formData.expiry_month), parseInt(formData.expiry_year)) && (
            <div className="validation-success">
              <Check size={14} />
              <span>Fecha de vencimiento válida</span>
            </div>
          )}

          <div className="alert alert-info">
            <strong>Nota de Seguridad:</strong> Solo almacenamos los últimos 4 dígitos de tu tarjeta y el CVV encriptado.
            La información completa se procesará de forma segura en el momento del pago.
          </div>
        </>
      );
    }

    if (formType === 'check') {
      return (
        <>
          <div className="form-group">
            <label>Nombre del Emisor *</label>
            <input
              type="text"
              value={formData.check_issuer_name || ''}
              onChange={(e) => setFormData({ ...formData, check_issuer_name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Banco Emisor *</label>
            <select
              value={formData.check_bank_name || ''}
              onChange={(e) => {
                const selectedBank = e.target.value;
                // Find matching bank_id from availableBanks
                const matchingBank = availableBanks.find(b => b.name === selectedBank);
                setFormData({ 
                  ...formData, 
                  check_bank_name: selectedBank,
                  bank_id: matchingBank ? matchingBank.id : null
                });
              }}
              required
            >
              <option value="">Seleccionar banco</option>
              {BANKS.map(bank => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Número de Cuenta *</label>
            <input
              type="text"
              value={formData.check_account_number || ''}
              onChange={(e) => setFormData({ ...formData, check_account_number: e.target.value })}
              required
            />
          </div>
        </>
      );
    }
  };

  const getMethodIcon = (type) => {
    switch (type) {
      case 'bank_transfer': return <Building size={20} />;
      case 'credit_card': return <CreditCard size={20} />;
      case 'check': return <FileText size={20} />;
      default: return null;
    }
  };

  const getMethodLabel = (type) => {
    switch (type) {
      case 'bank_transfer': return 'Transferencia Bancaria';
      case 'credit_card': return 'Tarjeta de Crédito';
      case 'check': return 'Cheque';
      default: return type;
    }
  };

  const renderMethodDetails = (method) => {
    // Get bank name from availableBanks
    const processingBank = availableBanks.find(bank => bank.id === method.bank_id);
    
    if (method.payment_type === 'bank_transfer') {
      return (
        <div className="method-details">
          <p><strong>{method.bank_name}</strong></p>
          <p>{method.account_holder_name}</p>
          <p>CBU: {method.cbu}</p>
          {method.alias_cbu && <p>Alias: {method.alias_cbu}</p>}
          {processingBank && (
            <p className="processing-bank">
              <small>Procesado por: {processingBank.name}</small>
            </p>
          )}
        </div>
      );
    }

    if (method.payment_type === 'credit_card') {
      return (
        <div className="method-details">
          <p><strong>{method.card_brand?.toUpperCase()}</strong></p>
          <p>{method.card_holder_name}</p>
          <p>**** **** **** {method.card_number_last4}</p>
          <p>Vence: {method.card_expiry_month}/{method.card_expiry_year}</p>
          {processingBank && (
            <p className="processing-bank">
              <small>Procesado por: {processingBank.name}</small>
            </p>
          )}
        </div>
      );
    }

    if (method.payment_type === 'check') {
      return (
        <div className="method-details">
          <p><strong>{method.check_bank_name}</strong></p>
          <p>{method.check_issuer_name}</p>
          <p>Cuenta: {method.check_account_number}</p>
          {processingBank && (
            <p className="processing-bank">
              <small>Procesado por: {processingBank.name}</small>
            </p>
          )}
        </div>
      );
    }
  };

  if (loading) {
    return <div className="loading">Cargando métodos de pago...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Medios de Pago</h1>
        <p>Gestiona tus métodos de pago para realizar compras</p>
      </div>

      {!showForm && (
        <div className="action-buttons">
          <button
            className="btn btn-primary"
            onClick={() => {
              setShowForm(true);
              setFormType('bank_transfer');
              setFormData({});
            }}
          >
            <Plus size={20} />
            Agregar Método de Pago
          </button>
        </div>
      )}

      {showForm && (
        <div className="form-card">
          <div className="card-header">
            <h2>Nuevo Método de Pago</h2>
            <button
              className="btn btn-text"
              onClick={() => {
                setShowForm(false);
                setFormData({});
              }}
            >
              <X size={20} />
            </button>
          </div>

          <div className="payment-type-selector">
            <button
              className={`type-btn ${formType === 'bank_transfer' ? 'active' : ''}`}
              onClick={() => { setFormType('bank_transfer'); setFormData({}); }}
            >
              <Building size={24} />
              <span>Transferencia</span>
            </button>
            <button
              className={`type-btn ${formType === 'credit_card' ? 'active' : ''}`}
              onClick={() => { setFormType('credit_card'); setFormData({}); }}
            >
              <CreditCard size={24} />
              <span>Tarjeta</span>
            </button>
            <button
              className={`type-btn ${formType === 'check' ? 'active' : ''}`}
              onClick={() => { setFormType('check'); setFormData({}); }}
            >
              <FileText size={24} />
              <span>Cheque</span>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {renderForm()}

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setFormData({});
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="payment-methods-list">
        {paymentMethods.length === 0 ? (
          <div className="empty-state">
            <CreditCard size={48} />
            <p>No tienes métodos de pago registrados</p>
            <p className="text-muted">Agrega un método de pago para realizar compras</p>
          </div>
        ) : (
          <div className="methods-grid">
            {paymentMethods.map((method) => (
              <div key={method.id} className={`method-card ${method.is_default ? 'default' : ''}`}>
                <div className="method-header">
                  <div className="method-icon">
                    {getMethodIcon(method.payment_type)}
                  </div>
                  <div className="method-type">
                    {getMethodLabel(method.payment_type)}
                  </div>
                  <div className="method-badges">
                    {method.is_default && (
                      <span className="default-badge">
                        <Check size={14} />
                        Predeterminado
                      </span>
                    )}
                    {method.is_verified ? (
                      <span className="verified-badge">
                        <Check size={14} />
                        Verificado
                      </span>
                    ) : (
                      <span className="pending-badge">
                        Pendiente
                      </span>
                    )}
                  </div>
                </div>

                {renderMethodDetails(method)}

                <div className="method-actions">
                  {!method.is_default && (
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleSetDefault(method.id)}
                      style={{ minHeight: '40px', padding: '10px 18px', fontSize: '15px' }}
                    >
                      Establecer como predeterminado
                    </button>
                  )}
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(method.id)}
                    style={{ minHeight: '40px', padding: '10px 18px', fontSize: '15px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .payment-type-selector {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }

        .type-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .type-btn:hover {
          border-color: #4caf50;
        }

        .type-btn.active {
          border-color: #4caf50;
          background: #f1f8f4;
        }

        .methods-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 20px;
          margin-top: 24px;
        }

        .method-card {
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          padding: 20px;
          background: white;
          min-width: 340px;
          max-width: 420px;
          margin: 0 auto;
        }

        .method-card.default {
          border-color: #4caf50;
          background: #f9fdf9;
        }

        .method-header {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .method-badges {
          display: flex;
          flex-direction: column;
          gap: 4px;
          align-items: flex-end;
          margin-left: auto;
        }

        .method-icon {
          color: #4caf50;
        }

        .method-type {
          font-weight: 600;
          flex: 1;
        }

        .default-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: #4caf50;
          color: white;
          border-radius: 12px;
          font-size: 12px;
        }

        .verified-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: #2196f3;
          color: white;
          border-radius: 12px;
          font-size: 12px;
        }

        .pending-badge {
          padding: 4px 8px;
          background: #ff9800;
          color: white;
          border-radius: 12px;
          font-size: 12px;
        }

        .method-details {
          margin-bottom: 16px;
          color: #666;
        }

        .method-details p {
          margin: 4px 0;
        }

        .processing-bank {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #e0e0e0;
          color: #4caf50;
          font-weight: 500;
        }

        .method-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .alert-info {
          padding: 12px;
          background: #e3f2fd;
          border-left: 4px solid #2196f3;
          border-radius: 4px;
          margin-top: 16px;
        }

        .validation-error {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
          padding: 8px 12px;
          background: #ffebee;
          border-left: 3px solid #f44336;
          border-radius: 4px;
          color: #c62828;
          font-size: 14px;
        }

        .validation-success {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
          padding: 8px 12px;
          background: #e8f5e9;
          border-left: 3px solid #4caf50;
          border-radius: 4px;
          color: #2e7d32;
          font-size: 14px;
        }

        .input-error {
          border-color: #f44336 !important;
          background: #ffebee;
        }

        .input-help {
          display: block;
          margin-top: 4px;
          font-size: 12px;
          color: #666;
        }
      `}</style>
    </div>
  );
}
