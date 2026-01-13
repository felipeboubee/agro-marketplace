import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from "../../services/api";
import { Upload } from 'lucide-react';
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

const countries = [
  'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica', 'Cuba',
  'Ecuador', 'El Salvador', 'España', 'Estados Unidos', 'Francia', 'Guatemala',
  'Honduras', 'Italia', 'México', 'Nicaragua', 'Panamá', 'Paraguay', 'Perú',
  'Portugal', 'República Dominicana', 'Uruguay', 'Venezuela', 'Otros'
];

const CertificationForm = ({ onSuccess, editingCertification }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  // Inicializar dateInput con la fecha formateada si estamos editando
  const [dateInput, setDateInput] = useState(() => {
    if (editingCertification?.personal_info?.birth_date) {
      const date = new Date(editingCertification.personal_info.birth_date);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return '';
  });
  
  const [formData, setFormData] = useState(() => {
    // Si estamos editando, pre-llenar con los datos existentes
    if (editingCertification) {
      // Formatear la fecha para el input
      let formattedDate = '';
      if (editingCertification.personal_info?.birth_date) {
        const date = new Date(editingCertification.personal_info.birth_date);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        formattedDate = `${day}/${month}/${year}`;
      }
      
      return {
        bank_name: editingCertification.bank_name || '',
        personal_info: {
          first_name: editingCertification.personal_info?.first_name || '',
          second_name: editingCertification.personal_info?.second_name || '',
          last_name: editingCertification.personal_info?.last_name || '',
          dni: editingCertification.personal_info?.dni || '',
          birth_date: editingCertification.personal_info?.birth_date || '',
          nationality: editingCertification.personal_info?.nationality || 'Argentina'
        },
        employment_info: {
          employment_status: editingCertification.employment_info?.employment_status || 'empleado',
          employer_name: editingCertification.employment_info?.employer_name || '',
          position: editingCertification.employment_info?.position || '',
          monthly_income: editingCertification.employment_info?.monthly_income || '',
          years_employed: editingCertification.employment_info?.years_employed || ''
        },
        financial_info: {
          monthly_expenses: editingCertification.financial_info?.monthly_expenses || '',
          assets: editingCertification.financial_info?.assets || '',
          liabilities: editingCertification.financial_info?.liabilities || '',
          income_proof: null
        },
        _dateInputFormatted: formattedDate
      };
    }
    
    return {
      bank_name: '',
      personal_info: {
        first_name: '',
        second_name: '',
        last_name: '',
        dni: '',
        birth_date: '',
        nationality: 'Argentina'
      },
      employment_info: {
        employment_status: 'empleado',
        employer_name: '',
        position: '',
        monthly_income: '',
        years_employed: ''
      },
      financial_info: {
        monthly_expenses: '',
        assets: '',
        liabilities: '',
        income_proof: null
      }
    };
  });
  const [loading, setLoading] = useState(false);
  const [incomeProbFileName, setIncomeProbFileName] = useState(() => {
    // Si estamos editando y ya hay un archivo, mostrar el nombre
    if (editingCertification?.income_proof_path) {
      const fileName = editingCertification.income_proof_path.split('/').pop();
      return fileName;
    }
    return '';
  });

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert('Solo se permiten: PDF, imágenes (JPG, PNG) o documentos Word');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo no debe superar los 5MB');
        return;
      }
      handleChange('financial_info.income_proof', file);
      setIncomeProbFileName(file.name);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('bank_name', formData.bank_name);
      formDataToSend.append('personal_info', JSON.stringify(formData.personal_info));
      formDataToSend.append('employment_info', JSON.stringify(formData.employment_info));
      formDataToSend.append('financial_info', JSON.stringify({
        monthly_expenses: formData.financial_info.monthly_expenses,
        assets: formData.financial_info.assets,
        liabilities: formData.financial_info.liabilities
      }));
      
      if (formData.financial_info.income_proof) {
        formDataToSend.append('income_proof', formData.financial_info.income_proof);
      }
      
      if (editingCertification) {
        // Actualizar certificación existente
        await api.updateCertification(editingCertification.id, formDataToSend);
        alert('Información actualizada exitosamente. El banco revisará los nuevos datos.');
      } else {
        // Crear nueva certificación
        await api.applyCertification(formDataToSend);
        alert('Solicitud enviada exitosamente. Tu estado aparecerá como pendiente de aprobación.');
      }
      
      // Si hay una función onSuccess, llamarla en lugar de navegar
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/comprador');
      }
    } catch (error) {
      console.error('Error submitting certification:', error);
      alert(editingCertification ? 'Error al actualizar la información' : 'Error al enviar la solicitud');
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

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
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
                  <div className="bank-logo">{bank.split(' ')[1]?.charAt(0) || bank.charAt(0)}</div>
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
                <label>Nombre *</label>
                <input type="text" value={formData.personal_info.first_name} onChange={(e) => handleChange('personal_info.first_name', e.target.value)} placeholder="Tu primer nombre" required />
              </div>
              <div className="form-group">
                <label>Segundo Nombre (Opcional)</label>
                <input type="text" value={formData.personal_info.second_name} onChange={(e) => handleChange('personal_info.second_name', e.target.value)} placeholder="Tu segundo nombre" />
              </div>
              <div className="form-group">
                <label>Apellido *</label>
                <input type="text" value={formData.personal_info.last_name} onChange={(e) => handleChange('personal_info.last_name', e.target.value)} placeholder="Tu apellido" required />
              </div>
              <div className="form-group">
                <label>DNI *</label>
                <input type="text" value={formData.personal_info.dni} onChange={(e) => handleChange('personal_info.dni', e.target.value)} placeholder="Sin puntos ni guiones" required />
              </div>
              <div className="form-group">
                <label>Fecha de Nacimiento *</label>
                <div style={{ position: 'relative', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    value={dateInput || (formData.personal_info.birth_date ? formatDateForDisplay(formData.personal_info.birth_date) : '')} 
                    onChange={(e) => {
                      let value = e.target.value;
                      // Permitir solo números y barras
                      value = value.replace(/[^\d/]/g, '');
                      
                      // Limitar a 10 caracteres
                      if (value.length > 10) return;
                      
                      // Guardar en estado local para permitir escritura
                      setDateInput(value);
                      
                      // Auto-formatear: agregar barras automáticamente
                      let formatted = value;
                      if (value.length === 2 && !value.includes('/')) {
                        formatted = value + '/';
                        setDateInput(formatted);
                      } else if (value.length === 5 && value.charAt(4) !== '/' && value.split('/').length === 2) {
                        formatted = value + '/';
                        setDateInput(formatted);
                      }
                      
                      // Si tiene formato completo dd/mm/yyyy, convertir a yyyy-mm-dd y guardar
                      if (formatted.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                        const [day, month, year] = formatted.split('/');
                        handleChange('personal_info.birth_date', `${year}-${month}-${day}`);
                        setDateInput(''); // Limpiar estado local, ahora usa formData
                      } else if (value.length === 0) {
                        handleChange('personal_info.birth_date', '');
                      }
                    }}
                    placeholder="dd/mm/aaaa"
                    maxLength="10"
                    required
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      const dateInput = e.currentTarget.nextElementSibling;
                      dateInput.showPicker?.();
                    }}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid var(--light-gray)',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '40px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                      e.currentTarget.style.borderColor = 'var(--primary-color)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = 'var(--light-gray)';
                    }}
                    title="Abrir calendario"
                  >
                    📅
                  </button>
                  <input 
                    type="date" 
                    value={formData.personal_info.birth_date} 
                    onChange={(e) => handleChange('personal_info.birth_date', e.target.value)} 
                    max={getTodayDate()} 
                    required
                    style={{
                      position: 'absolute',
                      opacity: 0,
                      width: 0,
                      height: 0,
                      pointerEvents: 'none'
                    }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Nacionalidad *</label>
                <select value={formData.personal_info.nationality} onChange={(e) => handleChange('personal_info.nationality', e.target.value)} required>
                  <option value="">Seleccionar país</option>
                  {countries.map(country => <option key={country} value={country}>{country}</option>)}
                </select>
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
                <select value={formData.employment_info.employment_status} onChange={(e) => handleChange('employment_info.employment_status', e.target.value)}>
                  <option value="empleado">Empleado</option>
                  <option value="autonomo">Autónomo</option>
                  <option value="empresario">Empresario</option>
                  <option value="jubilado">Jubilado</option>
                </select>
              </div>
              <div className="form-group">
                <label>Empresa/Institución</label>
                <input type="text" value={formData.employment_info.employer_name} onChange={(e) => handleChange('employment_info.employer_name', e.target.value)} placeholder="Nombre de la empresa" />
              </div>
              <div className="form-group">
                <label>Puesto/Cargo</label>
                <input type="text" value={formData.employment_info.position} onChange={(e) => handleChange('employment_info.position', e.target.value)} placeholder="Tu puesto" />
              </div>
              <div className="form-group">
                <label>Años en el Puesto</label>
                <input type="number" value={formData.employment_info.years_employed} onChange={(e) => handleChange('employment_info.years_employed', e.target.value)} min="0" placeholder="0" />
              </div>
              <div className="form-group">
                <label>Ingreso Mensual (ARS) *</label>
                <input type="number" value={formData.employment_info.monthly_income} onChange={(e) => handleChange('employment_info.monthly_income', e.target.value)} placeholder="Ingreso mensual en pesos argentinos" required />
              </div>
              <div className="form-group">
                <label>Gastos Mensuales (ARS)</label>
                <input type="number" value={formData.financial_info.monthly_expenses} onChange={(e) => handleChange('financial_info.monthly_expenses', e.target.value)} placeholder="Gastos mensuales estimados" />
              </div>
              <div className="form-group">
                <label>Activos (ARS)</label>
                <input type="number" value={formData.financial_info.assets} onChange={(e) => handleChange('financial_info.assets', e.target.value)} placeholder="Valor total de activos" />
              </div>
              <div className="form-group">
                <label>Pasivos (ARS)</label>
                <input type="number" value={formData.financial_info.liabilities} onChange={(e) => handleChange('financial_info.liabilities', e.target.value)} placeholder="Deudas totales" />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Prueba de Ingresos {!editingCertification?.income_proof_path && '*'}</label>
                <div className="file-upload-area">
                  <input type="file" id="income-proof" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{ display: 'none' }} />
                  <label htmlFor="income-proof" className="file-upload-label">
                    <Upload size={24} />
                    <p>
                      {incomeProbFileName 
                        ? `Archivo: ${incomeProbFileName}` 
                        : 'Haz clic para subir prueba de ingresos'}
                    </p>
                    <small>
                      {editingCertification?.income_proof_path 
                        ? 'Archivo actual cargado. Puedes subir uno nuevo si lo deseas.' 
                        : 'PDF, imágenes (JPG, PNG) o documentos Word. Máx. 5MB'}
                    </small>
                  </label>
                </div>
                {editingCertification?.income_proof_path && (
                  <div style={{ marginTop: '8px', fontSize: '14px', color: '#28a745' }}>
                    ✓ Ya tienes un archivo cargado. No es necesario subir uno nuevo a menos que quieras reemplazarlo.
                  </div>
                )}
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
                <strong>Nombre Completo:</strong>
                <span>{`${formData.personal_info.first_name} ${formData.personal_info.second_name} ${formData.personal_info.last_name}`.trim()}</span>
              </div>
              <div className="summary-item">
                <strong>DNI:</strong>
                <span>{formData.personal_info.dni}</span>
              </div>
              <div className="summary-item">
                <strong>Fecha de Nacimiento:</strong>
                <span>{formatDateForDisplay(formData.personal_info.birth_date)}</span>
              </div>
              <div className="summary-item">
                <strong>Nacionalidad:</strong>
                <span>{formData.personal_info.nationality}</span>
              </div>
              <div className="summary-item">
                <strong>Ingreso Mensual:</strong>
                <span>${formData.employment_info.monthly_income} ARS</span>
              </div>
              <div className="summary-item">
                <strong>Prueba de Ingresos:</strong>
                <span>
                  {incomeProbFileName || (editingCertification?.income_proof_path ? 'Archivo existente (sin cambios)' : 'No cargado')}
                </span>
              </div>
            </div>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input type="checkbox" required />
                <span>Declaro que toda la información proporcionada es verídica y autorizo la consulta de mis datos crediticios.</span>
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

      <div className="step-container">
        {renderStep()}
      </div>

      <div className="step-navigation">
        {step > 1 && <button type="button" onClick={prevStep} className="btn btn-outline">← Anterior</button>}
        <button 
          type="button" 
          onClick={nextStep} 
          className="btn btn-primary" 
          disabled={
            loading || 
            (step === 1 && !formData.bank_name) || 
            (step === 3 && !formData.financial_info.income_proof && !editingCertification?.income_proof_path)
          }
        >
          {loading ? 'Enviando...' : step === 4 ? 'Enviar Solicitud' : 'Siguiente →'}
        </button>
      </div>
    </div>
  );
};

export default CertificationForm;
