import React, { useState, useEffect } from 'react';
import { FileCheck, Clock, CheckCircle, XCircle, Plus, Edit } from 'lucide-react';
import { api } from '../../services/api';
import CertificationForm from './CertificationForm';
import '../../styles/dashboard.css';

export default function MyCertifications() {
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCertification, setEditingCertification] = useState(null);

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
      'pendiente_aprobacion': { label: 'Pendiente', className: 'status-badge status-pendiente', icon: <Clock size={14} /> },
      'aprobado': { label: 'Aprobada', className: 'status-badge status-aprobado', icon: <CheckCircle size={14} /> },
      'rechazado': { label: 'Rechazada', className: 'status-badge status-rechazado', icon: <XCircle size={14} /> },
      'mas_datos': { label: 'Más Datos', className: 'status-badge status-mas-datos', icon: <FileCheck size={14} /> }
    };
    
    const config = statusConfig[status] || statusConfig['pendiente_aprobacion'];
    return (
      <span className={config.className}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingCertification(null);
    fetchCertifications();
  };

  const handleEditCertification = (cert) => {
    setEditingCertification(cert);
    setShowForm(true);
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
            {editingCertification ? 'Actualizar Certificación Financiera' : 'Nueva Certificación Financiera'}
          </h1>
          <button 
            className="btn btn-secondary"
            onClick={() => {
              setShowForm(false);
              setEditingCertification(null);
            }}
          >
            Volver a Mis Certificaciones
          </button>
        </div>
        {editingCertification && (
          <div className="info-banner">
            <FileCheck size={24} />
            <div>
              <h3>Actualizar Información</h3>
              <p>El banco ha solicitado información adicional. Por favor, revisa y actualiza los datos necesarios.</p>
              {editingCertification.notes && (
                <p style={{ marginTop: '8px', fontWeight: 'bold' }}>Observaciones: {editingCertification.notes}</p>
              )}
            </div>
          </div>
        )}
        <CertificationForm 
          onSuccess={handleFormSuccess} 
          editingCertification={editingCertification}
        />
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

  // Obtener certificaciones aprobadas y otras
  const approvedCertifications = certifications.filter(cert => cert.status === 'aprobado');
  const otherCertifications = certifications.filter(cert => cert.status !== 'aprobado');

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

      {/* Certificaciones Aprobadas - Mostrar como tabla */}
      {approvedCertifications.length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2>
              <CheckCircle size={24} />
              Certificaciones Aprobadas
            </h2>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Banco</th>
                  <th>Estado</th>
                  <th>Fecha Solicitud</th>
                  <th>Fecha Aprobación</th>
                </tr>
              </thead>
              <tbody>
                {approvedCertifications.map((cert) => (
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
                        : '—'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Certificaciones Pendientes, Rechazadas o Más Datos */}
      {otherCertifications.length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Solicitudes en Proceso</h2>
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
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {otherCertifications.map((cert) => (
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
                        : '—'
                      }
                    </td>
                    <td>
                      {cert.notes || '—'}
                    </td>
                    <td>
                      {cert.status === 'mas_datos' && (
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => handleEditCertification(cert)}
                          title="Actualizar información"
                        >
                          <Edit size={16} />
                          Actualizar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="info-card info-banner">
        <div className="banner-content">
          <FileCheck size={24} />
          <div className="banner-text">
            <h3>Sobre las Certificaciones</h3>
            <p>
              Puedes solicitar certificación con múltiples bancos para aumentar tus opciones de financiamiento.
              Cada banco revisará tu solicitud de manera independiente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
