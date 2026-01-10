import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import CertificationRequests from './CertificationRequests';
import { CheckCircle, Clock, DollarSign, Users } from 'lucide-react';
import '../../styles/dashboard.css';

const BankDashboard = () => {
  const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  const [stats] = useState({
    pendingRequests: 0,
    approvedCertifications: 0,
    totalVolume: 0,
    certifiedClients: 0,
    approvalRate: 0,
    avgResponseTime: 0
  });
  const navigate = useNavigate();

  const navigateTo = (path) => {
    navigate(path);
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Banco</h2>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            <li>
              <button 
                className="nav-item active"
                onClick={() => navigateTo('/banco')}
              >
                <CheckCircle size={20} />
                <span>Dashboard</span>
              </button>
            </li>
            <li>
              <button 
                className="nav-item"
                onClick={() => navigateTo('/banco/solicitudes')}
              >
                <Clock size={20} />
                <span>Solicitudes</span>
              </button>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              navigate('/login');
            }}
            className="logout-btn"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-content">
          <div className="page-header">
            <h1>
              <CheckCircle size={32} />
              Panel del Banco Certificador
            </h1>
            <p style={{color: '#6b7280', marginTop: '4px'}}>Gestión de certificaciones - {user?.name}</p>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card stat-blue">
              <div className="stat-header">
                <Clock size={24} />
                <span className="stat-title">Solicitudes Pendientes</span>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.pendingRequests}</h3>
              </div>
            </div>

            <div className="stat-card stat-green">
              <div className="stat-header">
                <CheckCircle size={24} />
                <span className="stat-title">Certificaciones Aprobadas</span>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.approvedCertifications}</h3>
              </div>
            </div>

            <div className="stat-card stat-purple">
              <div className="stat-header">
                <DollarSign size={24} />
                <span className="stat-title">Volumen Total</span>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">${(stats.totalVolume / 1000000).toFixed(1)}M</h3>
              </div>
            </div>

            <div className="stat-card stat-orange">
              <div className="stat-header">
                <Users size={24} />
                <span className="stat-title">Clientes Certificados</span>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.certifiedClients}</h3>
              </div>
            </div>
          </div>

          <Routes>
            <Route path="/" element={<BankDashboardHome stats={stats} />} />
            <Route path="/solicitudes" element={<CertificationRequests />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

function BankDashboardHome({ stats }) {
  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>Estadísticas Rápidas</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ padding: '20px', backgroundColor: '#f3f4f6', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Tasa de Aprobación</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>{stats.approvalRate}%</div>
        </div>
        <div style={{ padding: '20px', backgroundColor: '#f3f4f6', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
          <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>Tiempo Promedio de Respuesta</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>{stats.avgResponseTime} hs</div>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <h2>Acciones Rápidas</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <button 
            onClick={() => window.location.href = '/banco/solicitudes'}
            className="btn btn-primary"
            style={{ padding: '20px', textAlign: 'center', borderRadius: '8px' }}
          >
            Ver Todas las Solicitudes
          </button>
          <button 
            onClick={() => window.location.href = '/banco'}
            className="btn btn-secondary"
            style={{ padding: '20px', textAlign: 'center', borderRadius: '8px' }}
          >
            Generar Reporte
          </button>
        </div>
      </div>
    </div>
  );
}

export default BankDashboard;