import React, { useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import CreateLote from '../vendedor/CreateLote';
import MyLotes from '../vendedor/MyLotes';
import { BarChart3, Plus, Package, TrendingUp, DollarSign } from 'lucide-react';
import '../../styles/dashboard.css';

const SellerDashboard = () => {
  const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  const [stats] = useState({
    totalLotes: 0,
    activeLotes: 0,
    completedTransactions: 0,
    totalRevenue: 0
  });
  const navigate = useNavigate();

  const navigateTo = (path) => {
    navigate(path);
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Vendedor</h2>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            <li>
              <button 
                className="nav-item active"
                onClick={() => navigateTo('/vendedor')}
              >
                <BarChart3 size={20} />
                <span>Dashboard</span>
              </button>
            </li>
            <li>
              <button 
                className="nav-item"
                onClick={() => navigateTo('/vendedor/lotes')}
              >
                <Package size={20} />
                <span>Mis Lotes</span>
              </button>
            </li>
            <li>
              <button 
                className="nav-item"
                onClick={() => navigateTo('/vendedor/crear-lote')}
              >
                <Plus size={20} />
                <span>Crear Lote</span>
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
              <BarChart3 size={32} />
              Panel del Vendedor
            </h1>
            <p style={{color: '#6b7280', marginTop: '4px'}}>Bienvenido, {user?.name}</p>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card stat-blue">
              <div className="stat-header">
                <Package size={24} />
                <span className="stat-title">Total Lotes</span>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.totalLotes}</h3>
              </div>
            </div>

            <div className="stat-card stat-green">
              <div className="stat-header">
                <TrendingUp size={24} />
                <span className="stat-title">Lotes Activos</span>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.activeLotes}</h3>
              </div>
            </div>

            <div className="stat-card stat-purple">
              <div className="stat-header">
                <BarChart3 size={24} />
                <span className="stat-title">Transacciones</span>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stats.completedTransactions}</h3>
              </div>
            </div>

            <div className="stat-card stat-orange">
              <div className="stat-header">
                <DollarSign size={24} />
                <span className="stat-title">Ingresos</span>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">${stats.totalRevenue.toLocaleString()}</h3>
              </div>
            </div>
          </div>

          <Routes>
            <Route path="/" element={<SellerDashboardHome />} />
            <Route path="/lotes" element={<MyLotes />} />
            <Route path="/crear-lote" element={<CreateLote />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

function SellerDashboardHome() {
  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>Opciones Rápidas</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        <Link to="/vendedor/crear-lote" className="btn btn-primary" style={{ padding: '20px', textAlign: 'center', borderRadius: '8px' }}>
          <Plus size={24} style={{ marginRight: '8px' }} />
          Crear Nuevo Lote
        </Link>
        <Link to="/vendedor/lotes" className="btn btn-secondary" style={{ padding: '20px', textAlign: 'center', borderRadius: '8px' }}>
          <Package size={24} style={{ marginRight: '8px' }} />
          Ver Mis Lotes
        </Link>
      </div>
    </div>
  );
}


export default SellerDashboard;