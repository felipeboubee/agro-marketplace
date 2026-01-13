import React, { useState, useEffect } from 'react';
import { Clock, FileText, Calendar, Eye, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import '../../styles/dashboard.css';

export default function PendingCertifications() {
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  const handleViewDetails = (certId) => {
    navigate('/banco/solicitudes');
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
                      onClick={() => navigate('/banco/solicitudes')}
                      title="Ver detalles"
                    >
                      <Eye size={16} />
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
