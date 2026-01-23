import React, { useState, useEffect } from 'react';
import { api } from "../../services/api";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileCheck, Filter, RefreshCw, Eye, User, Clock, CheckCircle, XCircle, Calendar, DollarSign, Upload, AlertCircle } from 'lucide-react';
import { formatPrice } from '../../utils/formatters';
import '../../styles/dashboard.css';

export default function Certifications() {
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected, more_data
  const [selectedCertification, setSelectedCertification] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showMoreDataForm, setShowMoreDataForm] = useState(false);
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [notes, setNotes] = useState('');
  const [approvalData, setApprovalData] = useState({
    approved_amount: '',
    interest_rate: '',
    term_months: ''
  });
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    more_data: 0,
    total: 0
  });

  useEffect(() => {
    fetchCertifications();
  }, []);

  const fetchCertifications = async () => {
    try {
      setLoading(true);
      const response = await api.getBankCertifications();
      setCertifications(response);
      calculateStats(response);
    } catch (error) {
      console.error('Error fetching certifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (certList) => {
    const newStats = {
      pending: certList.filter(c => c.status === 'pendiente_aprobacion').length,
      approved: certList.filter(c => c.status === 'aprobado').length,
      rejected: certList.filter(c => c.status === 'rechazado').length,
      more_data: certList.filter(c => c.status === 'mas_datos').length,
      total: certList.length
    };
    setStats(newStats);
  };

  const getFilteredCertifications = () => {
    if (filter === 'all') return certifications;
    if (filter === 'pending') return certifications.filter(c => c.status === 'pendiente_aprobacion');
    if (filter === 'approved') return certifications.filter(c => c.status === 'aprobado');
    if (filter === 'rejected') return certifications.filter(c => c.status === 'rechazado');
    if (filter === 'more_data') return certifications.filter(c => c.status === 'mas_datos');
    return certifications;
  };

  const handleViewDetails = (cert) => {
    setSelectedCertification(cert);
  };

  const closeModal = () => {
    setSelectedCertification(null);
    setShowRejectForm(false);
    setShowMoreDataForm(false);
    setShowApproveForm(false);
    setNotes('');
    setApprovalData({ approved_amount: '', interest_rate: '', term_months: '' });
  };

  const handleApprove = async () => {
    if (!approvalData.approved_amount || !approvalData.interest_rate || !approvalData.term_months) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setActionLoading(true);
      await api.approveCertification(
        selectedCertification.id,
        parseFloat(approvalData.approved_amount),
        parseFloat(approvalData.interest_rate),
        parseInt(approvalData.term_months),
        notes
      );
      alert('Certificación aprobada exitosamente');
      closeModal();
      fetchCertifications();
    } catch (error) {
      console.error('Error approving certification:', error);
      alert('Error al aprobar la certificación');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!notes.trim()) {
      alert('Por favor ingresa un motivo de rechazo');
      return;
    }

    try {
      setActionLoading(true);
      await api.updateCertificationStatus(selectedCertification.id, 'rechazado', notes);
      alert('Certificación rechazada');
      closeModal();
      fetchCertifications();
    } catch (error) {
      console.error('Error rejecting certification:', error);
      alert('Error al rechazar la certificación');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestMoreData = async () => {
    if (!notes.trim()) {
      alert('Por favor indica qué datos adicionales se requieren');
      return;
    }

    try {
      setActionLoading(true);
      await api.updateCertificationStatus(selectedCertification.id, 'mas_datos', notes);
      alert('Se ha solicitado más información al usuario');
      closeModal();
      fetchCertifications();
    } catch (error) {
      console.error('Error requesting more data:', error);
      alert('Error al solicitar más datos');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pendiente_aprobacion':
        return <span className="status-badge badge-warning"><Clock size={14} /> Pendiente</span>;
      case 'aprobado':
        return <span className="status-badge badge-success"><CheckCircle size={14} /> Aprobado</span>;
      case 'rechazado':
        return <span className="status-badge badge-danger"><XCircle size={14} /> Rechazado</span>;
      case 'mas_datos':
        return <span className="status-badge badge-info"><AlertCircle size={14} /> Más Datos</span>;
      default:
        return <span className="status-badge badge-default">{status}</span>;
    }
  };

  const filteredCertifications = getFilteredCertifications();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando certificaciones...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>
            <FileCheck size={32} />
            Certificaciones Financieras
          </h1>
          <p className="page-subtitle">Gestiona las solicitudes de certificación de compradores</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchCertifications} disabled={loading}>
          <RefreshCw size={20} className={loading ? 'spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card stat-blue">
          <div className="stat-header">
            <FileCheck size={24} />
            <span className="stat-title">Total</span>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.total}</h3>
          </div>
        </div>

        <div className="stat-card stat-orange">
          <div className="stat-header">
            <Clock size={24} />
            <span className="stat-title">Pendientes</span>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.pending}</h3>
          </div>
        </div>

        <div className="stat-card stat-green">
          <div className="stat-header">
            <CheckCircle size={24} />
            <span className="stat-title">Aprobadas</span>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.approved}</h3>
          </div>
        </div>

        <div className="stat-card stat-purple">
          <div className="stat-header">
            <AlertCircle size={24} />
            <span className="stat-title">Más Datos</span>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.more_data}</h3>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button 
          className={`tab-button ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todas ({stats.total})
        </button>
        <button 
          className={`tab-button ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pendientes ({stats.pending})
        </button>
        <button 
          className={`tab-button ${filter === 'approved' ? 'active' : ''}`}
          onClick={() => setFilter('approved')}
        >
          Aprobadas ({stats.approved})
        </button>
        <button 
          className={`tab-button ${filter === 'more_data' ? 'active' : ''}`}
          onClick={() => setFilter('more_data')}
        >
          Más Datos ({stats.more_data})
        </button>
        <button 
          className={`tab-button ${filter === 'rejected' ? 'active' : ''}`}
          onClick={() => setFilter('rejected')}
        >
          Rechazadas ({stats.rejected})
        </button>
      </div>

      {/* Table */}
      <div className="dashboard-section">
        {filteredCertifications.length === 0 ? (
          <div className="empty-state">
            <FileCheck size={48} />
            <p>No hay certificaciones en esta categoría</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Estado</th>
                  <th>Fecha Solicitud</th>
                  <th>Monto Aprobado</th>
                  <th>Tasa Interés</th>
                  <th>Plazo (meses)</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCertifications.map((cert) => (
                  <tr key={cert.id}>
                    <td>
                      {cert.user_name}
                    </td>
                    <td>{cert.email}</td>
                    <td>{getStatusBadge(cert.status)}</td>
                    <td>
                      {format(new Date(cert.created_at), 'dd/MM/yyyy', { locale: es })}
                    </td>
                    <td className="text-center">
                      {cert.approved_amount ? formatPrice(cert.approved_amount) : '—'}
                    </td>
                    <td className="text-center">
                      {cert.interest_rate ? `${cert.interest_rate}%` : '—'}
                    </td>
                    <td className="text-center">
                      {cert.term_months || '—'}
                    </td>
                    <td className="actions-cell">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleViewDetails(cert)}
                        title="Ver detalles"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}
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
      </div>

      {/* Modal de Detalles */}
      {selectedCertification && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalles de Certificación</h2>
              <button className="btn-close" onClick={closeModal}>×</button>
            </div>

            <div className="modal-body">
              {/* Info del Usuario */}
              <div className="info-section">
                <h3><User size={20} /> Información del Usuario</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Nombre:</label>
                    <span>{selectedCertification.user_name}</span>
                  </div>
                  <div className="info-item">
                    <label>Email:</label>
                    <span>{selectedCertification.email}</span>
                  </div>
                  <div className="info-item">
                    <label>Estado:</label>
                    {getStatusBadge(selectedCertification.status)}
                  </div>
                  <div className="info-item">
                    <label>Fecha de Solicitud:</label>
                    <span>{format(new Date(selectedCertification.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}</span>
                  </div>
                </div>
              </div>

              {/* Información Personal */}
              {selectedCertification.personal_info && (
                <div className="info-section">
                  <h3>Información Personal</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>DNI:</label>
                      <span>{selectedCertification.personal_info.dni}</span>
                    </div>
                    <div className="info-item">
                      <label>Teléfono:</label>
                      <span>{selectedCertification.personal_info.phone}</span>
                    </div>
                    <div className="info-item">
                      <label>Dirección:</label>
                      <span>{selectedCertification.personal_info.address}</span>
                    </div>
                    <div className="info-item">
                      <label>Ciudad:</label>
                      <span>{selectedCertification.personal_info.city}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Información Laboral */}
              {selectedCertification.employment_info && (
                <div className="info-section">
                  <h3>Información Laboral</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Ocupación:</label>
                      <span>{selectedCertification.employment_info.occupation}</span>
                    </div>
                    <div className="info-item">
                      <label>Empleador:</label>
                      <span>{selectedCertification.employment_info.employer}</span>
                    </div>
                    <div className="info-item">
                      <label>Antigüedad:</label>
                      <span>{selectedCertification.employment_info.years_employed} años</span>
                    </div>
                    <div className="info-item">
                      <label>Ingresos Mensuales:</label>
                      <span>{formatPrice(selectedCertification.employment_info.monthly_income)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Información Financiera */}
              {selectedCertification.financial_info && (
                <div className="info-section">
                  <h3>Información Financiera</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Deudas Actuales:</label>
                      <span>{formatPrice(selectedCertification.financial_info.current_debts || 0)}</span>
                    </div>
                    <div className="info-item">
                      <label>Otros Ingresos:</label>
                      <span>{formatPrice(selectedCertification.financial_info.other_income || 0)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Comprobante de Ingresos */}
              {selectedCertification.income_proof_path && (
                <div className="info-section">
                  <h3><Upload size={20} /> Comprobante de Ingresos</h3>
                  <a 
                    href={`http://localhost:5000${selectedCertification.income_proof_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                  >
                    <Upload size={16} />
                    Ver Documento
                  </a>
                </div>
              )}

              {/* Datos de Aprobación */}
              {selectedCertification.status === 'aprobado' && (
                <div className="info-section">
                  <h3><CheckCircle size={20} /> Datos de Aprobación</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Monto Aprobado:</label>
                      <span className="text-success">{formatPrice(selectedCertification.approved_amount)}</span>
                    </div>
                    <div className="info-item">
                      <label>Tasa de Interés:</label>
                      <span>{selectedCertification.interest_rate}%</span>
                    </div>
                    <div className="info-item">
                      <label>Plazo:</label>
                      <span>{selectedCertification.term_months} meses</span>
                    </div>
                    <div className="info-item">
                      <label>Fecha de Revisión:</label>
                      <span>{format(new Date(selectedCertification.reviewed_at), 'dd/MM/yyyy HH:mm', { locale: es })}</span>
                    </div>
                  </div>
                  {selectedCertification.notes && (
                    <div className="notes-box">
                      <label>Notas:</label>
                      <p>{selectedCertification.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Notas de Rechazo */}
              {(selectedCertification.status === 'rechazado' || selectedCertification.status === 'mas_datos') && selectedCertification.notes && (
                <div className="info-section">
                  <h3>Notas</h3>
                  <div className="notes-box">
                    <p>{selectedCertification.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Acciones */}
            {selectedCertification.status === 'pendiente_aprobacion' && (
              <div className="modal-footer">
                <button 
                  className="btn btn-success"
                  onClick={() => setShowApproveForm(true)}
                  disabled={actionLoading}
                >
                  <CheckCircle size={18} />
                  Aprobar
                </button>
                <button 
                  className="btn btn-warning"
                  onClick={() => setShowMoreDataForm(true)}
                  disabled={actionLoading}
                >
                  <AlertCircle size={18} />
                  Solicitar Más Datos
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => setShowRejectForm(true)}
                  disabled={actionLoading}
                >
                  <XCircle size={18} />
                  Rechazar
                </button>
              </div>
            )}

            {/* Formulario de Aprobación */}
            {showApproveForm && (
              <div className="action-form">
                <h3>Aprobar Certificación</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Monto Aprobado *</label>
                    <input
                      type="number"
                      value={approvalData.approved_amount}
                      onChange={(e) => setApprovalData({...approvalData, approved_amount: e.target.value})}
                      placeholder="Ej: 5000000"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Tasa de Interés (%) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={approvalData.interest_rate}
                      onChange={(e) => setApprovalData({...approvalData, interest_rate: e.target.value})}
                      placeholder="Ej: 12.5"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Plazo (meses) *</label>
                    <input
                      type="number"
                      value={approvalData.term_months}
                      onChange={(e) => setApprovalData({...approvalData, term_months: e.target.value})}
                      placeholder="Ej: 12"
                      className="form-input"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Notas (opcional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Observaciones adicionales..."
                    rows="3"
                    className="form-textarea"
                  />
                </div>
                <div className="form-actions">
                  <button className="btn btn-secondary" onClick={() => setShowApproveForm(false)}>
                    Cancelar
                  </button>
                  <button 
                    className="btn btn-success" 
                    onClick={handleApprove}
                    disabled={actionLoading}
                  >
                    Confirmar Aprobación
                  </button>
                </div>
              </div>
            )}

            {/* Formulario de Solicitar Más Datos */}
            {showMoreDataForm && (
              <div className="action-form">
                <h3>Solicitar Más Datos</h3>
                <div className="form-group">
                  <label>Indica qué información adicional requieres *</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Especifica los datos que necesitas..."
                    rows="4"
                    className="form-textarea"
                  />
                </div>
                <div className="form-actions">
                  <button className="btn btn-secondary" onClick={() => setShowMoreDataForm(false)}>
                    Cancelar
                  </button>
                  <button 
                    className="btn btn-warning" 
                    onClick={handleRequestMoreData}
                    disabled={actionLoading}
                  >
                    Enviar Solicitud
                  </button>
                </div>
              </div>
            )}

            {/* Formulario de Rechazo */}
            {showRejectForm && (
              <div className="action-form">
                <h3>Rechazar Certificación</h3>
                <div className="form-group">
                  <label>Motivo del rechazo *</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Explica el motivo del rechazo..."
                    rows="4"
                    className="form-textarea"
                  />
                </div>
                <div className="form-actions">
                  <button className="btn btn-secondary" onClick={() => setShowRejectForm(false)}>
                    Cancelar
                  </button>
                  <button 
                    className="btn btn-danger" 
                    onClick={handleReject}
                    disabled={actionLoading}
                  >
                    Confirmar Rechazo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
