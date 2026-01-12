import React, { useState, useEffect } from 'react';
import { FileCheck, Clock, CheckCircle, XCircle, Plus } from 'lucide-react';
import { api } from '../../services/api';
import CertificationForm from './CertificationForm';
import '../../styles/dashboard.css';

export default function MyCertifications() {
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchCertifications();
  }, []);

  const fetchCertifications = async () => {
    try {
      setLoading(true);
      const response = await api.getMyCertifications();
      setCertifications(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching certifications:', error);
      setCertifications([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pendiente', className: 'status-badge status-pending', icon: <Clock size={14} /> },
      approved: { label: 'Aprobada', className: 'status-badge status-completed', icon: <CheckCircle size={14} /> },
      rejected: { label: 'Rechazada', className: 'status-badge status-cancelled', icon: <XCircle size={14} /> }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={config.className}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    fetchCertifications();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando certificaciones...</p>
      </div>
    );
  }

  // Si está mostrando el formulario, renderizar solo el formulario
  if (showForm) {
    return (
      <div className="dashboard-container">
        <div className="page-header">
          <h1>
            <FileCheck size={32} />
            Nueva Certificación Financiera
          </h1>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowForm(false)}
          >
            Volver a Mis Certificaciones
          </button>
        </div>
        <CertificationForm onSuccess={handleFormSuccess} />
      </div>
    );
  }

  // Si no tiene certificaciones, mostrar el formulario
  if (certifications.length === 0) {
    return (
      <div className="dashboard-container">
        <div className="page-header">
          <h1>
            <FileCheck size={32} />
            Certificación Financiera
          </h1>
          <p>Solicita tu certificación financiera para acceder a mejores condiciones</p>
        </div>
        <CertificationForm onSuccess={handleFormSuccess} />
      </div>
    );
  }

  // Obtener certificaciones aprobadas y pendientes/rechazadas
  const approvedCertifications = certifications.filter(cert => cert.status === 'approved');
  const pendingOrRejectedCertifications = certifications.filter(cert => cert.status !== 'approved');

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <h1>
          <FileCheck size={32} />
          Mis Certificaciones
        </h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          <Plus size={20} />
          Agregar Nueva Certificación
        </button>
      </div>

      {/* Certificaciones Aprobadas */}
      {approvedCertifications.length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2>
              <CheckCircle size={24} />
              Certificaciones Aprobadas
            </h2>
          </div>
          <div className="stats-grid">
            {approvedCertifications.map((cert) => (
              <div key={cert.id} className="stat-card stat-green">
                <div className="stat-icon">
                  <CheckCircle size={32} />
                </div>
                <div className="stat-content">
                  <h3>{cert.bank_name}</h3>
                  <p className="stat-value">Certificado</p>
                  <p className="cell-secondary">
                    Aprobado el {new Date(cert.reviewed_at).toLocaleDateString('es-AR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certificaciones Pendientes o Rechazadas */}
      {pendingOrRejectedCertifications.length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Estado de Solicitudes</h2>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Banco</th>
                  <th>Estado</th>
                  <th>Fecha Solicitud</th>
                  <th>Fecha Respuesta</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {pendingOrRejectedCertifications.map((cert) => (
                  <tr key={cert.id}>
                    <td className="id-cell">#{cert.id}</td>
                    <td>{cert.bank_name}</td>
                    <td>{getStatusBadge(cert.status)}</td>
                    <td>
                      {new Date(cert.created_at).toLocaleDateString('es-AR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })}
                    </td>
                    <td>
                      {cert.reviewed_at 
                        ? new Date(cert.reviewed_at).toLocaleDateString('es-AR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })
                        : '-'
                      }
                    </td>
                    <td>
                      {cert.rejection_reason || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="info-banner">
        <FileCheck size={24} />
        <div>
          <h3>Sobre las Certificaciones</h3>
          <p>
            Puedes solicitar certificación con múltiples bancos para aumentar tus opciones de financiamiento.
            Cada banco revisará tu solicitud de manera independiente.
          </p>
        </div>
      </div>
    </div>
  );
}
