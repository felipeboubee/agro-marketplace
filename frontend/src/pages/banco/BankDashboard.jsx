import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, DollarSign, Users, Eye, User, Calendar } from 'lucide-react';
import { api } from '../../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import '../../styles/dashboard.css';

export default function BankDashboard() {
  const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  const [stats, setStats] = useState({
    pendingRequests: 0,
    approvedCertifications: 0,
    totalVolume: 0,
    certifiedClients: 0,
    approvalRate: 0,
    avgResponseTime: 0
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadDashboardData = async () => {
    try {
      const [statsData, certificationsData] = await Promise.all([
        api.getBankStats(),
        api.getBankCertifications()
      ]);
      
      setStats(statsData);
      
      // Obtener las 5 solicitudes pendientes más recientes
      const pending = certificationsData
        .filter(cert => cert.status === 'pendiente_aprobacion')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      
      setRecentRequests(pending);
    } catch (error) {
      console.error('Error loading bank dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <h1>
          <CheckCircle size={32} />
          Panel del Banco Certificador
        </h1>
        <p>Gestión de certificaciones - {user?.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-blue">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>Solicitudes Pendientes</h3>
            <p className="stat-value">{stats.pendingRequests}</p>
          </div>
        </div>

        <div className="stat-card stat-green">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>Certificaciones Aprobadas</h3>
            <p className="stat-value">{stats.approvedCertifications}</p>
          </div>
        </div>

        <div className="stat-card stat-purple">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <h3>Volumen Total</h3>
            <p className="stat-value">${stats.totalVolume.toLocaleString('es-AR')}</p>
          </div>
        </div>

        <div className="stat-card stat-orange">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>Clientes Certificados</h3>
            <p className="stat-value">{stats.certifiedClients}</p>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="metrics-row">
        <div className="metric-card">
          <h3>Tasa de Aprobación</h3>
          <p className="metric-value">{stats.approvalRate}%</p>
        </div>
        <div className="metric-card">
          <h3>Tiempo Promedio de Respuesta</h3>
          <p className="metric-value">{stats.avgResponseTime} días</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="actions-section">
        <h2>Acciones Rápidas</h2>
        <div className="actions-grid">
          <button 
            className="action-card"
            onClick={() => navigate('/banco/solicitudes')}
          >
            <Clock size={32} />
            <h3>Ver Solicitudes Pendientes</h3>
            <p>Revisar y procesar nuevas solicitudes</p>
          </button>

          <button 
            className="action-card"
            onClick={() => navigate('/banco/aprobadas')}
          >
            <CheckCircle size={32} />
            <h3>Solicitudes Pendientes</h3>
            <p>Ver solicitudes que requieren revisión</p>
          </button>
        </div>
      </div>

      {/* Recent Pending Requests */}
      {recentRequests.length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Solicitudes Pendientes Recientes</h2>
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/banco/solicitudes')}
            >
              Ver Todas
            </button>
          </div>
          
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Solicitante</th>
                  <th>Email</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="id-cell">#{request.id}</td>
                    <td>
                      <div className="cell-with-icon">
                        <User size={16} />
                        {request.user_name}
                      </div>
                    </td>
                    <td>{request.email}</td>
                    <td>
                      <div className="cell-with-icon">
                        <Calendar size={16} />
                        {format(new Date(request.created_at), "dd/MM/yyyy", { locale: es })}
                      </div>
                    </td>
                    <td>
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => navigate('/banco/solicitudes')}
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
        </div>
      )}
    </div>
  );
}
