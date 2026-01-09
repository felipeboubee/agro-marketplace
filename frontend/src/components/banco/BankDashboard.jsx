import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from "../../services/api";
import '../../styles/dashboard.css';

const BankDashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    pendingRequests: 0,
    approvedCertifications: 0,
    totalVolume: 0,
    topBuyers: []
  });
  const [recentRequests, setRecentRequests] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('token');
      try {
        // Obtener datos del banco
        const userResponse = await api.get('/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(userResponse.data.user);

        // Obtener estadísticas
        const statsResponse = await api.get('/certifications/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(statsResponse.data);

        // Obtener solicitudes recientes
        const requestsResponse = await api.get('/certifications/pending', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRecentRequests(requestsResponse.data);
      } catch (error) {
        console.error('Error fetching bank dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  const handleApprove = async (certificationId) => {
    try {
      const token = localStorage.getItem('token');
      await api.put(
        `/certifications/${certificationId}/status`,
        { status: 'aprobado' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Actualizar lista
      setRecentRequests(prev => 
        prev.map(req => 
          req.id === certificationId 
            ? { ...req, status: 'aprobado' }
            : req
        )
      );
    } catch (error) {
      console.error('Error approving certification:', error);
    }
  };

  const handleReject = async (certificationId) => {
    try {
      const token = localStorage.getItem('token');
      await api.put(
        `/certifications/${certificationId}/status`,
        { status: 'rechazado' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Actualizar lista
      setRecentRequests(prev => 
        prev.map(req => 
          req.id === certificationId 
            ? { ...req, status: 'rechazado' }
            : req
        )
      );
    } catch (error) {
      console.error('Error rejecting certification:', error);
    }
  };

  const handleRequestMoreInfo = async (certificationId) => {
    try {
      const token = localStorage.getItem('token');
      await api.put(
        `/certifications/${certificationId}/status`,
        { status: 'mas_datos' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Actualizar lista
      setRecentRequests(prev => 
        prev.map(req => 
          req.id === certificationId 
            ? { ...req, status: 'mas_datos' }
            : req
        )
      );
    } catch (error) {
      console.error('Error requesting more info:', error);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Panel del Banco Certificador</h1>
          <p>{user?.name} - Gestión de Certificaciones</p>
        </div>
        <div className="header-actions">
          <Link to="/banco/solicitudes" className="btn btn-primary">
            Ver Todas las Solicitudes
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.pendingRequests}</h3>
            <p>Solicitudes Pendientes</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <h3>{stats.approvedCertifications}</h3>
            <p>Certificaciones Aprobadas</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>${stats.totalVolume.toLocaleString()}</h3>
            <p>Volumen Total</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.topBuyers.length}</h3>
            <p>Clientes Certificados</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Left Column - Pending Requests */}
        <div className="dashboard-column">
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Solicitudes Pendientes</h3>
              <Link to="/banco/solicitudes">Ver todas</Link>
            </div>
            <div className="requests-list">
              {recentRequests
                .filter(req => req.status === 'pendiente')
                .slice(0, 5)
                .map((request) => (
                  <div key={request.id} className="request-item">
                    <div className="request-info">
                      <div className="request-header">
                        <h4>{request.user_name}</h4>
                        <span className="request-date">
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="request-email">{request.email}</p>
                      <div className="request-details">
                        <span>Solicitud #{request.id}</span>
                        <span>•</span>
                        <span>Volumen: ${request.financial_data?.requested_amount?.toLocaleString() || '0'}</span>
                      </div>
                    </div>
                    <div className="request-actions">
                      <button
                        onClick={() => handleApprove(request.id)}
                        className="btn btn-success btn-small"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => handleRequestMoreInfo(request.id)}
                        className="btn btn-warning btn-small"
                      >
                        Más Datos
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        className="btn btn-danger btn-small"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Right Column - Top Buyers */}
        <div className="dashboard-column">
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Top Compradores Certificados</h3>
              <span className="card-badge">Por volumen</span>
            </div>
            <div className="buyers-list">
              {stats.topBuyers.map((buyer, index) => (
                <div key={buyer.id} className="buyer-item">
                  <div className="buyer-rank">#{index + 1}</div>
                  <div className="buyer-info">
                    <h4>{buyer.name}</h4>
                    <p>{buyer.email}</p>
                  </div>
                  <div className="buyer-volume">
                    <div className="volume-label">Volumen</div>
                    <div className="volume-value">
                      ${buyer.total_volume?.toLocaleString() || '0'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="dashboard-card">
            <h3>Estadísticas Rápidas</h3>
            <div className="quick-stats">
              <div className="stat-row">
                <span className="stat-label">Tasa de Aprobación:</span>
                <span className="stat-value">78%</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Tiempo Promedio Respuesta:</span>
                <span className="stat-value">48 horas</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Solicitudes Este Mes:</span>
                <span className="stat-value">142</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Clientes Activos:</span>
                <span className="stat-value">89</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankDashboard;