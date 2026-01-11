import React, { useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import LoteList from '../comprador/LoteList';
import CertificationForm from '../comprador/CertificationForm';
import ProfileSettings from '../common/ProfileSettings';
import { ShoppingCart, Plus, FileText, List, Settings } from 'lucide-react';
import '../../styles/dashboard.css';

const BuyerDashboard = () => {
  const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  const [stats] = useState({
    totalPurchases: 0,
    activePurchases: 0,
    completedTransactions: 0,
    totalSpent: 0,
    certificationStatus: 'no_certified'
  });
  const navigate = useNavigate();

  const navigateTo = (path) => {
    navigate(path);
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Comprador</h2>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            <li>
              <button 
                className="nav-item active"
                onClick={() => navigateTo('/comprador')}
              >
                <ShoppingCart size={20} />
                <span>Dashboard</span>
              </button>
            </li>
            <li>
              <button 
                className="nav-item"
                onClick={() => navigateTo('/comprador/lotes')}
              >
                <List size={20} />
                <span>Explorar Lotes</span>
              </button>
            </li>
            <li>
              <button 
                className="nav-item"
                onClick={() => navigateTo('/comprador/certificacion')}
              >
                <FileText size={20} />
                <span>Certificación</span>
              </button>
            </li>
            <li>
              <button 
                className="nav-item"
                onClick={() => navigateTo('/comprador/configuracion')}
              >
                <Settings size={20} />
                <span>Configuración</span>
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
              <ShoppingCart size={32} />
              Panel del Comprador
            </h1>
            <p style={{color: '#6b7280', marginTop: '4px'}}>Bienvenido, {user?.name}</p>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card stat-blue">
              <div className="stat-header">
                <ShoppingCart size={24} />
                <span className="stat-title">Compras Totales</span>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.totalPurchases}</h3>
              </div>
            </div>

            <div className="stat-card stat-green">
              <div className="stat-header">
                <FileText size={24} />
                <span className="stat-title">En Proceso</span>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.activePurchases}</h3>
              </div>
            </div>

            <div className="stat-card stat-purple">
              <div className="stat-header">
                <ShoppingCart size={24} />
                <span className="stat-title">Completadas</span>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.completedTransactions}</h3>
              </div>
            </div>

            <div className="stat-card stat-orange">
              <div className="stat-header">
                <Plus size={24} />
                <span className="stat-title">Invertido</span>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">${stats.totalSpent.toLocaleString()}</h3>
              </div>
            </div>
          </div>

          <Routes>
            <Route path="/" element={<BuyerDashboardHome />} />
            <Route path="/lotes" element={<LoteList />} />
            <Route path="/certificacion" element={<CertificationForm />} />
            <Route path="/configuracion" element={<ProfileSettings user={user} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

function BuyerDashboardHome() {
  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>Opciones Rápidas</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        <Link to="/comprador/lotes" className="btn btn-primary" style={{ padding: '20px', textAlign: 'center', borderRadius: '8px' }}>
          <List size={24} style={{ marginRight: '8px' }} />
          Explorar Lotes
        </Link>
        <Link to="/comprador/certificacion" className="btn btn-secondary" style={{ padding: '20px', textAlign: 'center', borderRadius: '8px' }}>
          <FileText size={24} style={{ marginRight: '8px' }} />
          Solicitar Certificación
        </Link>
      </div>
    </div>
  );
}

export default BuyerDashboard;