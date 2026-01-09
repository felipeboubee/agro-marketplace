import React, { useState, useEffect } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { api } from "../../services/api";
import '../../styles/dashboard.css';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalTransactions: 0,
    totalVolume: 0,
    userGrowth: [],
    transactionTrends: [],
    userDistribution: {}
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      const token = localStorage.getItem('token');
      try {
        // Obtener estadísticas generales
        const statsResponse = await api.get('/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(statsResponse);

        // Obtener actividad reciente
        const activityResponse = await api.get('/admin/activity', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRecentActivity(activityResponse);

      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  // Datos para gráfico de usuarios por tipo
  const userTypeData = {
    labels: Object.keys(stats.userDistribution),
    datasets: [
      {
        data: Object.values(stats.userDistribution),
        backgroundColor: [
          '#4CAF50',
          '#2196F3',
          '#FF9800',
          '#9C27B0'
        ]
      }
    ]
  };

  // Datos para gráfico de transacciones
  const transactionData = {
    labels: stats.transactionTrends.map(t => t.date),
    datasets: [
      {
        label: 'Transacciones',
        data: stats.transactionTrends.map(t => t.count),
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)'
      },
      {
        label: 'Volumen ($)',
        data: stats.transactionTrends.map(t => t.volume / 1000), // En miles
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)'
      }
    ]
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando datos del administrador...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Panel de Administración</h1>
        <p>Visión general de la plataforma</p>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card admin-stat">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalUsers.toLocaleString()}</h3>
            <p>Usuarios Totales</p>
            <small>{stats.activeUsers} activos esta semana</small>
          </div>
        </div>

        <div className="stat-card admin-stat">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>${stats.totalVolume.toLocaleString()}</h3>
            <p>Volumen Operado</p>
            <small>Total en transacciones</small>
          </div>
        </div>

        <div className="stat-card admin-stat">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.totalTransactions.toLocaleString()}</h3>
            <p>Transacciones</p>
            <small>Total registradas</small>
          </div>
        </div>

        <div className="stat-card admin-stat">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>87%</h3>
            <p>Tasa de Crecimiento</p>
            <small>Último mes</small>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Gráfico de distribución de usuarios */}
        <div className="chart-card">
          <h3>Distribución de Usuarios</h3>
          <div className="chart-container">
            <Pie 
              data={userTypeData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'right'
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Gráfico de tendencias */}
        <div className="chart-card">
          <h3>Tendencias de Transacciones</h3>
          <div className="chart-container">
            <Line 
              data={transactionData}
              options={{
                responsive: true,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Cantidad / Volumen (miles $)'
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="activity-section">
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Actividad Reciente</h3>
            <Link to="/admin/activity-log" className="btn-link">
              Ver registro completo
            </Link>
          </div>
          <div className="activity-list">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  {activity.type === 'user_signup' && '👤'}
                  {activity.type === 'transaction' && '💰'}
                  {activity.type === 'lote_created' && '🐄'}
                  {activity.type === 'certification' && '🏦'}
                </div>
                <div className="activity-content">
                  <p>{activity.description}</p>
                  <small>
                    {new Date(activity.timestamp).toLocaleString()}
                  </small>
                </div>
                <div className="activity-meta">
                  <span className={`activity-type type-${activity.type}`}>
                    {activity.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h3>Acciones Administrativas</h3>
        <div className="actions-grid">
          <a href="/admin/usuarios" className="action-card">
            <div className="action-icon">👥</div>
            <h4>Gestión de Usuarios</h4>
            <p>Ver y administrar todos los usuarios</p>
          </a>

          <a href="/admin/transacciones" className="action-card">
            <div className="action-icon">💰</div>
            <h4>Transacciones</h4>
            <p>Monitorear todas las operaciones</p>
          </a>

          <a href="/admin/lotes" className="action-card">
            <div className="action-icon">🐄</div>
            <h4>Lotes Activos</h4>
            <p>Revisar publicaciones activas</p>
          </a>

          <a href="/admin/certificaciones" className="action-card">
            <div className="action-icon">🏦</div>
            <h4>Certificaciones</h4>
            <p>Gestionar solicitudes bancarias</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;