import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, DollarSign, Users } from 'lucide-react';
import { api } from '../../services/api';
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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadDashboardData = async () => {
    try {
      const data = await api.getBankStats();
      setStats(data);
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
            <h3>Certificaciones Aprobadas</h3>
            <p>Ver historial de certificaciones</p>
          </button>
        </div>
      </div>
    </div>
  );
}
