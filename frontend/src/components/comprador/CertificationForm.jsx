import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from "../../services/api";
import '../../styles/forms.css';

const banks = [
  'Banco Galicia',
  'Banco Nación',
  'Banco Provincia',
  'Banco Santander',
  'Banco BBVA',
  'Banco Patagonia',
  'Banco Macro',
  'Banco Comafi',
  'Banco Credicoop'
];

const CertificationForm = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    bank_name: '',
    personal_info: {
      full_name: '',
      dni: '',
      birth_date: '',
      nationality: 'argentina'
    },
    contact_info: {
      address: '',
      city: '',
      province: '',
      postal_code: ''
    },
    employment_info: {
      employment_status: 'empleado',
      employer_name: '',
      position: '',
      monthly_income: '',
      years_employed: ''
    },
    financial_info: {
      requested_amount: '',
      purpose: 'compra_ganado',
      monthly_expenses: '',
      assets: '',
      liabilities: ''
    }
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (path, value) => {
    const keys = path.split('.');
    setFormData(prev => {
      const newData = { ...prev };
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await api.post('/certifications/apply', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Solicitud enviada exitosamente');
      navigate('/comprador');
    } catch (error) {
      console.error('Error submitting certification:', error);
      alert('Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
    else handleSubmit();
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="form-step">
            <h3>Paso 1: Selecciona tu Banco</h3>
            <div className="bank-selection">
              {banks.map(bank => (
                <div 
                  key={bank}
                  className={`bank-card ${formData.bank_name === bank ? 'selected' : ''}`}
                  onClick={() => handleChange('bank_name', bank)}
                >
                  <div className="bank-logo">
                    {bank.split(' ')[1]?.charAt(0) || bank.charAt(0)}
                  </div>
                  <h4>{bank}</h4>
                  <small>Tiempo promedio de respuesta: 48 horas</small>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="form-step">
            <h3>Paso 2: Información Personal</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Nombre Completo *</label>
                <input
                  type="text"
                  value={formData.personal_info.full_name}
                  onChange={(e) => handleChange('personal_info.full_name', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>DNI *</label>
                <input
                  type="text"
                  value={formData.personal_info.dni}
                  onChange={(e) => handleChange('personal_info.dni', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Fecha de Nacimiento *</label>
                <input
                  type="date"
                  value={formData.personal_info.birth_date}
                  onChange={(e) => handleChange('personal_info.birth_date', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nacionalidad</label>
                <input
                  type="text"
                  value={formData.personal_info.nationality}
                  onChange={(e) => handleChange('personal_info.nationality', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="form-step">
            <h3>Paso 3: Información Laboral y Financiera</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Situación Laboral *</label>
                <select
                  value={formData.employment_info.employment_status}
                  onChange={(e) => handleChange('employment_info.employment_status', e.target.value)}
                >
                  <option value="empleado">Empleado</option>
                  <option value="autonomo">Autónomo</option>
                  <option value="empresario">Empresario</option>
                  <option value="jubilado">Jubilado</option>
                </select>
              </div>
              <div className="form-group">
                <label>Ingreso Mensual (USD) *</label>
                <input
                  type="number"
                  value={formData.employment_info.monthly_income}
                  onChange={(e) => handleChange('employment_info.monthly_income', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Monto Solicitado (USD) *</label>
                <input
                  type="number"
                  value={formData.financial_info.requested_amount}
                  onChange={(e) => handleChange('financial_info.requested_amount', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Finalidad del Crédito</label>
                <select
                  value={formData.financial_info.purpose}
                  onChange={(e) => handleChange('financial_info.purpose', e.target.value)}
                >
                  <option value="compra_ganado">Compra de Ganado</option>
                  <option value="inversion">Inversión</option>
                  <option value="capital_trabajo">Capital de Trabajo</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="form-step">
            <h3>Paso 4: Resumen y Envío</h3>
            <div className="summary-section">
              <div className="summary-item">
                <strong>Banco Seleccionado:</strong>
                <span>{formData.bank_name}</span>
              </div>
              <div className="summary-item">
                <strong>Nombre:</strong>
                <span>{formData.personal_info.full_name}</span>
              </div>
              <div className="summary-item">
                <strong>Monto Solicitado:</strong>
                <span>${formData.financial_info.requested_amount} USD</span>
              </div>
              <div className="summary-item">
                <strong>Finalidad:</strong>
                <span>{formData.financial_info.purpose === 'compra_ganado' ? 'Compra de Ganado' : 'Inversión'}</span>
              </div>
            </div>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input type="checkbox" required />
                <span>
                  Declaro que toda la información proporcionada es verídica y autorizo la consulta de mis datos crediticios.
                </span>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="certification-form">
      <div className="form-header">
        <h1>Solicitud de Certificación Bancaria</h1>
        <p>Completa los siguientes pasos para solicitar tu línea de crédito</p>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar">
        {[1, 2, 3, 4].map(num => (
          <div key={num} className={`progress-step ${step >= num ? 'active' : ''}`}>
            <div className="step-number">{num}</div>
            <div className="step-label">
              {num === 1 && 'Banco'}
              {num === 2 && 'Datos Personales'}
              {num === 3 && 'Información Financiera'}
              {num === 4 && 'Confirmación'}
            </div>
          </div>
        ))}
      </div>

      {/* Current Step */}
      <div className="step-container">
        {renderStep()}
      </div>

      {/* Navigation Buttons */}
      <div className="step-navigation">
        {step > 1 && (
          <button
            type="button"
            onClick={prevStep}
            className="btn btn-outline"
          >
            ← Anterior
          </button>
        )}
        
        <button
          type="button"
          onClick={nextStep}
          className="btn btn-primary"
          disabled={loading || (step === 1 && !formData.bank_name)}
        >
          {loading ? 'Enviando...' : step === 4 ? 'Enviar Solicitud' : 'Siguiente →'}
        </button>
      </div>
    </div>
  );
};

export default CertificationForm;