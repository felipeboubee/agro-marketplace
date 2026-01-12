import React, { useState, useEffect } from 'react';
import { CheckCircle, FileText, Calendar } from 'lucide-react';
import { api } from '../../services/api';
import '../../styles/dashboard.css';

export default function ApprovedCertifications() {
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovedCertifications();
  }, []);

  const fetchApprovedCertifications = async () => {
    try {
      setLoading(true);
      // TODO: Implementar endpoint en el backend
      // const response = await api.getApprovedCertifications();
      // setCertifications(response);
      setCertifications([]);
    } catch (error) {
      console.error('Error fetching approved certifications:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-container">Cargando certificaciones aprobadas...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <h1><CheckCircle size={32} />Certificaciones Aprobadas</h1>
        <p>Historial de certificaciones financieras aprobadas</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-success">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Aprobadas</h3>
            <p className="stat-value">{certifications.length}</p>
          </div>
        </div>
      </div>

      {certifications.length === 0 ? (
        <div className="empty-state">
          <CheckCircle size={64} />
          <h3>No hay certificaciones aprobadas</h3>
          <p>Aquí aparecerán las certificaciones que hayas aprobado</p>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Comprador</th>
                <th>Lote</th>
                <th>Monto</th>
                <th>Fecha Aprobación</th>
                <th>Detalles</th>
              </tr>
            </thead>
            <tbody>
              {certifications.map((cert) => (
                <tr key={cert.id}>
                  <td>#{cert.id}</td>
                  <td>{cert.buyer_name}</td>
                  <td>{cert.lote_name}</td>
                  <td>${cert.amount?.toLocaleString('es-AR')}</td>
                  <td>
                    <div className="cell-with-icon">
                      <Calendar size={16} />
                      {new Date(cert.approved_at).toLocaleDateString('es-AR')}
                    </div>
                  </td>
                  <td>
                    <button className="btn-sm btn-secondary">
                      <FileText size={16} />
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
