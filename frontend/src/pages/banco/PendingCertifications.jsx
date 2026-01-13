import React, { useState, useEffect } from 'react';
import { Clock, FileText, Calendar, Eye, User, CheckCircle, XCircle, Upload, DollarSign } from 'lucide-react';
import { api } from '../../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import '../../styles/dashboard.css';

export default function PendingCertifications() {
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertification, setSelectedCertification] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showMoreDataForm, setShowMoreDataForm] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchPendingCertifications();
  }, []);

  const fetchPendingCertifications = async () => {
    try {
      setLoading(true);
      const response = await api.getBankCertifications();
      // Filtrar solo las pendientes
      const pending = response.filter(cert => cert.status === 'pendiente_aprobacion');
      setCertifications(pending);
    } catch (error) {
      console.error('Error fetching pending certifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (cert) => {
    setSelectedCertification(cert);
  };

  const closeModal = () => {
    setSelectedCertification(null);
    setShowRejectForm(false);
    setShowMoreDataForm(false);
    setNotes('');
  };

  const handleUpdateStatus = async (certificationId, newStatus, notesText = '') => {
    try {
      setActionLoading(true);
      await api.updateCertificationStatus(certificationId, newStatus, notesText);
      
      // Refrescar la lista
      await fetchPendingCertifications();
      
      // Cerrar el modal
      closeModal();
      
      alert('Estado actualizado correctamente');
    } catch (error) {
      console.error('Error updating certification status:', error);
      alert('Error al actualizar el estado: ' + (error.response?.data?.error || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = (certId) => {
    if (window.confirm('¿Está seguro de aprobar esta certificación?')) {
      handleUpdateStatus(certId, 'aprobado');
    }
  };

  const handleReject = (certId) => {
    if (showRejectForm) {
      if (!notes.trim()) {
        alert('Por favor, ingrese el motivo del rechazo');
        return;
      }
      handleUpdateStatus(certId, 'rechazado', notes);
    } else {
      setShowRejectForm(true);
    }
  };

  const handleRequestMoreData = (certId) => {
    if (showMoreDataForm) {
      handleUpdateStatus(certId, 'mas_datos', notes);
    } else {
      setShowMoreDataForm(true);
    }
  };

  const handleCancelForm = () => {
    setShowRejectForm(false);
    setShowMoreDataForm(false);
    setNotes('');
  };

  const handleRevert = (certId) => {
    if (window.confirm('¿Está seguro de revertir esta decisión?')) {
      handleUpdateStatus(certId, 'pendiente_aprobacion');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pendiente_aprobacion': { label: 'Pendiente', className: 'status-pendiente', icon: <Clock size={14} /> },
      'aprobado': { label: 'Aprobada', className: 'status-aprobado', icon: <CheckCircle size={14} /> },
      'rechazado': { label: 'Rechazada', className: 'status-rechazado', icon: <XCircle size={14} /> },
      'mas_datos': { label: 'Más Datos', className: 'status-mas-datos', icon: <Clock size={14} /> }
    };

    const config = statusConfig[status] || statusConfig['pendiente_aprobacion'];
    
    return (
      <span className={`status-badge ${config.className}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return <div className="loading-container">Cargando solicitudes pendientes...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <h1><Clock size={32} />Solicitudes Pendientes</h1>
        <p>Certificaciones financieras pendientes de revisión</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-blue">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>Solicitudes Pendientes</h3>
            <p className="stat-value">{certifications.length}</p>
          </div>
        </div>
      </div>

      {certifications.length === 0 ? (
        <div className="empty-state">
          <Clock size={64} />
          <h3>No hay solicitudes pendientes</h3>
          <p>Todas las solicitudes han sido revisadas</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Solicitante</th>
                <th>Email</th>
                <th>Fecha Solicitud</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {certifications.map((cert) => (
                <tr key={cert.id}>
                  <td className="id-cell">#{cert.id}</td>
                  <td>
                    <div className="cell-with-icon">
                      <User size={16} />
                      {cert.user_name}
                    </div>
                  </td>
                  <td>{cert.email}</td>
                  <td>
                    <div className="cell-with-icon">
                      <Calendar size={16} />
                      {format(new Date(cert.created_at), "dd/MM/yyyy", { locale: es })}
                    </div>
                  </td>
                  <td>
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => handleViewDetails(cert)}
                      title="Ver detalles"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Detalles */}
      {selectedCertification && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalle de Solicitud #{selectedCertification.id}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {getStatusBadge(selectedCertification.status)}
                <button onClick={closeModal} className="btn btn-icon">×</button>
              </div>
            </div>
            
            <div className="modal-body">
              {/* Datos Personales */}
              {selectedCertification.personal_info && (
                <div className="detail-section">
                  <h3>Datos Personales</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <strong>Email:</strong> {selectedCertification.email}
                    </div>
                    <div className="detail-item">
                      <strong>Teléfono:</strong> {selectedCertification.phone || '—'}
                    </div>
                    <div className="detail-item">
                      <strong>Primer Nombre:</strong> {selectedCertification.personal_info.first_name || '—'}
                    </div>
                    <div className="detail-item">
                      <strong>Segundo Nombre:</strong> {selectedCertification.personal_info.second_name || '—'}
                    </div>
                    <div className="detail-item">
                      <strong>Apellido:</strong> {selectedCertification.personal_info.last_name || '—'}
                    </div>
                    <div className="detail-item">
                      <strong>DNI:</strong> {selectedCertification.personal_info.dni || '—'}
                    </div>
                    <div className="detail-item">
                      <strong>Fecha de Nacimiento:</strong> {selectedCertification.personal_info.birth_date ? format(new Date(selectedCertification.personal_info.birth_date), "dd/MM/yyyy", { locale: es }) : '—'}
                    </div>
                    <div className="detail-item">
                      <strong>Nacionalidad:</strong> {selectedCertification.personal_info.nationality || '—'}
                    </div>
                  </div>
                </div>
              )}

              {/* Información Laboral */}
              {selectedCertification.employment_info && (
                <div className="detail-section">
                  <h3>Información Laboral</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <strong>Estado Laboral:</strong> {
                        selectedCertification.employment_info.employment_status === 'empleado' ? 'Empleado' : 
                        selectedCertification.employment_info.employment_status === 'autonomo' ? 'Autónomo' : 
                        selectedCertification.employment_info.employment_status === 'empresario' ? 'Empresario' : 
                        'Desempleado'
                      }
                    </div>
                    <div className="detail-item">
                      <strong>Empleador:</strong> {selectedCertification.employment_info.employer_name || '—'}
                    </div>
                    <div className="detail-item">
                      <strong>Cargo:</strong> {selectedCertification.employment_info.position || '—'}
                    </div>
                    <div className="detail-item">
                      <strong>Ingreso Mensual:</strong> {
                        selectedCertification.employment_info.monthly_income ? 
                        formatCurrency(parseFloat(selectedCertification.employment_info.monthly_income)) : 
                        '—'
                      }
                    </div>
                    <div className="detail-item">
                      <strong>Años Empleado:</strong> {selectedCertification.employment_info.years_employed || '—'}
                    </div>
                  </div>
                </div>
              )}

              {/* Información Financiera */}
              {selectedCertification.financial_info && (
                <div className="detail-section">
                  <h3>Información Financiera</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <strong>Gastos Mensuales:</strong> {
                        selectedCertification.financial_info.monthly_expenses ? 
                        formatCurrency(parseFloat(selectedCertification.financial_info.monthly_expenses)) : 
                        '—'
                      }
                    </div>
                    <div className="detail-item">
                      <strong>Activos:</strong> {
                        selectedCertification.financial_info.assets ? 
                        formatCurrency(parseFloat(selectedCertification.financial_info.assets)) : 
                        '—'
                      }
                    </div>
                    <div className="detail-item">
                      <strong>Pasivos:</strong> {
                        selectedCertification.financial_info.liabilities ? 
                        formatCurrency(parseFloat(selectedCertification.financial_info.liabilities)) : 
                        '—'
                      }
                    </div>
                  </div>
                </div>
              )}

              {/* Información Bancaria */}
              <div className="detail-section">
                <h3>Información Bancaria y Solicitud</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>Banco Solicitado:</strong> {selectedCertification.bank_name}
                  </div>
                  <div className="detail-item">
                    <strong>Fecha de Solicitud:</strong> {format(new Date(selectedCertification.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                  </div>
                  {selectedCertification.reviewed_at && (
                    <div className="detail-item">
                      <strong>Fecha de Revisión:</strong> {format(new Date(selectedCertification.reviewed_at), "dd/MM/yyyy HH:mm", { locale: es })}
                    </div>
                  )}
                </div>
              </div>

              {/* Documentación */}
              {selectedCertification.income_proof_path && (
                <div className="detail-section">
                  <h3>Documentación</h3>
                  <a 
                    href={`http://localhost:5000${selectedCertification.income_proof_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                  >
                    <Upload size={18} />
                    Ver Comprobante de Ingresos
                  </a>
                </div>
              )}

              {/* Acciones según estado */}
              {selectedCertification.status === 'pendiente_aprobacion' && (
                <>
                  {/* Formulario para Rechazar */}
                  {showRejectForm && (
                    <div className="detail-section">
                      <h3>Motivo del Rechazo</h3>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ingrese el motivo del rechazo..."
                        rows="4"
                        className="form-textarea"
                        style={{ width: '100%', marginBottom: '12px' }}
                      />
                    </div>
                  )}

                  {/* Formulario para Solicitar Más Datos */}
                  {showMoreDataForm && (
                    <div className="detail-section">
                      <h3>Datos Adicionales Requeridos</h3>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Especifique qué datos adicionales necesita..."
                        rows="4"
                        className="form-textarea"
                        style={{ width: '100%', marginBottom: '12px' }}
                      />
                    </div>
                  )}

                  <div className="modal-actions">
                    {showRejectForm || showMoreDataForm ? (
                      <>
                        <button 
                          onClick={() => showRejectForm ? handleReject(selectedCertification.id) : handleRequestMoreData(selectedCertification.id)}
                          className={showRejectForm ? "btn btn-danger" : "btn btn-secondary"}
                          disabled={actionLoading}
                        >
                          {showRejectForm ? (
                            <>
                              <XCircle size={16} />
                              Confirmar Rechazo
                            </>
                          ) : (
                            <>
                              <FileText size={16} />
                              Confirmar Solicitud
                            </>
                          )}
                        </button>
                        <button 
                          onClick={handleCancelForm}
                          className="btn btn-outline"
                          disabled={actionLoading}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleApprove(selectedCertification.id)}
                          className="btn btn-success"
                          disabled={actionLoading}
                        >
                          <CheckCircle size={16} />
                          Aprobar
                        </button>
                        <button 
                          onClick={() => handleReject(selectedCertification.id)}
                          className="btn btn-danger"
                          disabled={actionLoading}
                        >
                          <XCircle size={16} />
                          Rechazar
                        </button>
                        <button 
                          onClick={() => handleRequestMoreData(selectedCertification.id)}
                          className="btn btn-secondary"
                          disabled={actionLoading}
                        >
                          <FileText size={16} />
                          Solicitar Más Datos
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}

              {selectedCertification.status === 'aprobado' && (
                <div className="modal-actions">
                  <button 
                    onClick={() => handleRevert(selectedCertification.id)}
                    className="btn btn-warning"
                    disabled={actionLoading}
                  >
                    <Clock size={16} />
                    Revertir Aprobación
                  </button>
                </div>
              )}

              {selectedCertification.status === 'rechazado' && (
                <div className="modal-actions">
                  <button 
                    onClick={() => handleRevert(selectedCertification.id)}
                    className="btn btn-warning"
                    disabled={actionLoading}
                  >
                    <Clock size={16} />
                    Revertir Rechazo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
