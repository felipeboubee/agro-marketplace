import React, { useState, useEffect } from 'react';
import { Building, Plus, Trash2, Check, X, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import '../../styles/forms.css';
import { validateCBU, formatCBU, validateCBUAlias } from '../../utils/paymentValidations';

const BANKS = [
  'Banco Nación', 'Banco Provincia', 'Banco Galicia', 'Banco Santander',
  'Banco BBVA', 'Banco Macro', 'Banco ICBC', 'Banco Patagonia',
  'Banco Supervielle', 'Banco Credicoop', 'Otro'
];

const ACCOUNT_TYPES = [
  { value: 'cuenta_corriente', label: 'Cuenta Corriente' },
  { value: 'caja_ahorro', label: 'Caja de Ahorro' }
];

export default function BankAccount() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/seller-bank-accounts');
      setAccounts(response);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setValidationErrors({});

    // Validar CBU
    const errors = {};
    
    if (!formData.cbu) {
      errors.cbu = 'CBU es requerido';
    } else if (!validateCBU(formData.cbu)) {
      errors.cbu = 'CBU inválido. Debe tener 22 dígitos y pasar la validación de dígitos verificadores';
    }

    // Validar alias si está presente
    if (formData.alias_cbu && !validateCBUAlias(formData.alias_cbu)) {
      errors.alias_cbu = 'Alias inválido. Debe tener 6-20 caracteres alfanuméricos, puntos o guiones';
    }

    // Si hay errores de validación, no enviar
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setSaving(false);
      return;
    }

    try {
      await api.post('/seller-bank-accounts', formData);
      setShowForm(false);
      setFormData({});
      setValidationErrors({});
      fetchAccounts();
    } catch (error) {
      console.error('Error saving bank account:', error);
      alert('Error al guardar cuenta bancaria');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.put(`/seller-bank-accounts/${id}/set-default`);
      fetchAccounts();
    } catch (error) {
      console.error('Error setting default:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta cuenta bancaria?')) return;

    try {
      await api.delete(`/seller-bank-accounts/${id}`);
      fetchAccounts();
    } catch (error) {
      console.error('Error deleting bank account:', error);
    }
  };

  if (loading) {
    return <div className="loading">Cargando cuentas bancarias...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Cuenta Bancaria</h1>
        <p>Gestiona tus cuentas para recibir pagos</p>
      </div>

      <div className="info-banner">
        <AlertCircle size={20} />
        <div>
          <strong>Importante:</strong> El CBU es necesario para recibir transferencias bancarias.
          Asegúrate de ingresar los datos correctamente para evitar demoras en los pagos.
        </div>
      </div>

      {!showForm && (
        <div className="action-buttons">
          <button
            className="btn btn-primary"
            onClick={() => {
              setShowForm(true);
              setFormData({});
            }}
          >
            <Plus size={20} />
            Agregar Cuenta Bancaria
          </button>
        </div>
      )}

      {showForm && (
        <div className="form-card">
          <div className="card-header">
            <h2>Nueva Cuenta Bancaria</h2>
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

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Banco *</label>
              <select
                value={formData.bank_name || ''}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
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
                placeholder="Nombre completo del titular"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>CBU * <span className="text-muted">(22 dígitos)</span></label>
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
                  placeholder="0000000000000000000000"
                  required
                  className={validationErrors.cbu ? 'input-error' : ''}
                />
                {validationErrors.cbu && (
                  <div className="validation-error">
                    <AlertCircle size={14} />
                    <span>{validationErrors.cbu}</span>
                  </div>
                )}
                {formData.cbu && validateCBU(formData.cbu) && (
                  <div className="validation-success">
                    <Check size={14} />
                    <span>CBU válido</span>
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
                  onChange={(e) => {
                    setFormData({ ...formData, alias_cbu: e.target.value.toLowerCase() });
                    if (validationErrors.alias_cbu) {
                      setValidationErrors({ ...validationErrors, alias_cbu: null });
                    }
                  }}
                  onBlur={(e) => {
                    const alias = e.target.value;
                    if (alias && !validateCBUAlias(alias)) {
                      setValidationErrors({ 
                        ...validationErrors, 
                        alias_cbu: 'Alias inválido. 6-20 caracteres alfanuméricos, puntos o guiones' 
                      });
                    }
                  }}
                  placeholder="mi.alias.cbu"
                  className={validationErrors.alias_cbu ? 'input-error' : ''}
                />
                {validationErrors.alias_cbu && (
                  <div className="validation-error">
                    <AlertCircle size={14} />
                    <span>{validationErrors.alias_cbu}</span>
                  </div>
                )}
                {formData.alias_cbu && validateCBUAlias(formData.alias_cbu) && (
                  <div className="validation-success">
                    <Check size={14} />
                    <span>Alias válido</span>
                  </div>
                )}
                <small className="input-help">Opcional, formato: letras, números, puntos y guiones</small>
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

            <div className="form-row">
              <div className="form-group">
                <label>Número de Sucursal</label>
                <input
                  type="text"
                  value={formData.branch_number || ''}
                  onChange={(e) => setFormData({ ...formData, branch_number: e.target.value })}
                  placeholder="Opcional"
                />
              </div>

              <div className="form-group">
                <label>Código SWIFT</label>
                <input
                  type="text"
                  value={formData.swift_code || ''}
                  onChange={(e) => setFormData({ ...formData, swift_code: e.target.value })}
                  placeholder="Para transferencias internacionales"
                />
              </div>
            </div>

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

      <div className="accounts-list">
        {accounts.length === 0 ? (
          <div className="empty-state">
            <Building size={48} />
            <p>No tienes cuentas bancarias registradas</p>
            <p className="text-muted">Agrega una cuenta para recibir pagos de tus ventas</p>
          </div>
        ) : (
          <div className="accounts-grid">
            {accounts.map((account) => (
              <div key={account.id} className={`account-card ${account.is_default ? 'default' : ''}`}>
                <div className="account-header">
                  <div className="account-icon">
                    <Building size={24} />
                  </div>
                  <div className="account-bank">
                    {account.bank_name}
                  </div>
                  {account.is_default && (
                    <span className="default-badge">
                      <Check size={14} />
                      Predeterminada
                    </span>
                  )}
                  {account.is_verified ? (
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

                <div className="account-details">
                  <div className="detail-row">
                    <span className="detail-label">Titular:</span>
                    <span className="detail-value">{account.account_holder_name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">CBU:</span>
                    <span className="detail-value">{account.cbu}</span>
                  </div>
                  {account.alias_cbu && (
                    <div className="detail-row">
                      <span className="detail-label">Alias:</span>
                      <span className="detail-value">{account.alias_cbu}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">Cuenta:</span>
                    <span className="detail-value">{account.account_number}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Tipo:</span>
                    <span className="detail-value">
                      {account.account_type === 'cuenta_corriente' ? 'Cuenta Corriente' : 'Caja de Ahorro'}
                    </span>
                  </div>
                  {account.branch_number && (
                    <div className="detail-row">
                      <span className="detail-label">Sucursal:</span>
                      <span className="detail-value">{account.branch_number}</span>
                    </div>
                  )}
                </div>

                <div className="account-actions">
                  {!account.is_default && (
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleSetDefault(account.id)}
                    >
                      Establecer como predeterminada
                    </button>
                  )}
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(account.id)}
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
        .info-banner {
          display: flex;
          gap: 12px;
          padding: 16px;
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          border-radius: 4px;
          margin-bottom: 24px;
          color: #856404;
        }

        .accounts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
          margin-top: 24px;
        }

        .account-card {
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          padding: 24px;
          background: white;
        }

        .account-card.default {
          border-color: #4caf50;
          background: #f9fdf9;
        }

        .account-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e0e0e0;
        }

        .account-icon {
          color: #4caf50;
        }

        .account-bank {
          font-weight: 600;
          font-size: 18px;
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

        .account-details {
          margin-bottom: 20px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .detail-label {
          color: #666;
          font-weight: 500;
        }

        .detail-value {
          color: #333;
          font-family: 'Courier New', monospace;
        }

        .account-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .text-danger {
          color: #d32f2f;
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
