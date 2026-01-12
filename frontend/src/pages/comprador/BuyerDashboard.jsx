import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, TrendingUp, FileCheck, DollarSign, Plus } from 'lucide-react';
import { api } from '../../services/api';
import '../../styles/dashboard.css';

export default function BuyerDashboard() {
  const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  const [stats, setStats] = useState({
    totalPurchases: 0,
    activePurchases: 0,
    completedTransactions: 0,
    totalSpent: 0,
    certificationStatus: 'no_certified'
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadDashboardData = async () => {
    try {
      const data = await api.getBuyerStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading buyer dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">Cargando estadísticas...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h1>
            <ShoppingCart size={32} />
            Panel del Comprador
          </h1>
          <p>Bienvenido, {user?.name}</p>
        </div>
        <Link to="/comprador/lotes" className="btn btn-primary">
          <ShoppingCart size={20} />
          Explorar Lotes
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-blue">
          <div className="stat-icon">
            <ShoppingCart size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Compras</h3>
            <p className="stat-value">{stats.totalPurchases}</p>
          </div>
        </div>

        <div className="stat-card stat-green">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>Compras Activas</h3>
            <p className="stat-value">{stats.activePurchases}</p>
          </div>
        </div>

        <div className="stat-card stat-purple">
          <div className="stat-icon">
            <FileCheck size={24} />
          </div>
          <div className="stat-content">
            <h3>Transacciones Completadas</h3>
            <p className="stat-value">{stats.completedTransactions}</p>
          </div>
        </div>

        <div className="stat-card stat-orange">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Invertido</h3>
            <p className="stat-value">${stats.totalSpent.toLocaleString('es-AR')}</p>
          </div>
        </div>
      </div>

      {/* Certification Status Banner */}
      <div className={`info-card ${stats.certificationStatus === 'certified' ? 'success-banner' : 'warning-banner'}`}>
        <div className="banner-content">
          <FileCheck size={32} />
          <div className="banner-text">
            <h3>Certificación Financiera</h3>
            <p>
              {stats.certificationStatus === 'certified' 
                ? '✓ Tienes certificación financiera activa. Accede a mejores condiciones de compra.'
                : 'No tienes certificación financiera. Solicita una para acceder a financiamiento y mejores condiciones.'}
            </p>
          </div>
          {stats.certificationStatus !== 'certified' && (
            <Link to="/comprador/certificacion" className="btn btn-primary">
              <Plus size={20} />
              Solicitar Certificación
            </Link>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="actions-section">
        <h2>Acciones Rápidas</h2>
        <div className="actions-grid">
          <Link to="/comprador/lotes" className="action-card">
            <ShoppingCart size={32} />
            <h3>Explorar Lotes</h3>
            <p>Ver lotes disponibles para compra</p>
          </Link>

          <Link to="/comprador/certificaciones" className="action-card">
            <FileCheck size={32} />
            <h3>Certificación</h3>
            <p>Ver y gestionar tu certificación</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
