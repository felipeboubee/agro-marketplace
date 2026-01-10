import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Activity,
  UserPlus,
  TrendingUp,
  Clock,
  Package
} from "lucide-react";
import "../../styles/dashboard.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const [statsData, activityData] = await Promise.all([
        api.getDashboardStats(),
        api.getDashboardActivity()
      ]);
      
      setStats(statsData.summary);
      setRecentActivity(activityData || []);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    {
      title: "Usuarios Totales",
      value: stats?.totalUsers || 0,
      icon: <Users className="stat-icon" />,
      color: "blue",
      link: "/admin/users",
      change: stats?.newUsersToday || 0,
      changeText: "nuevos hoy"
    },
    {
      title: "Pedidos Totales",
      value: stats?.totalOrders || 0,
      icon: <ShoppingCart className="stat-icon" />,
      color: "green",
      link: "/admin/stats",
      subValue: `${stats?.pendingOrders || 0} pendientes`
    },
    {
      title: "Ingresos Totales",
      value: `$${(stats?.revenue || 0).toLocaleString()}`,
      icon: <DollarSign className="stat-icon" />,
      color: "purple",
      link: "/admin/stats",
      subValue: `Promedio: $${(stats?.avgOrderValue || 0).toFixed(2)}`
    },
    {
      title: "Actividad Hoy",
      value: stats?.dailyActivity || 0,
      icon: <Activity className="stat-icon" />,
      color: "orange",
      link: "/admin/activity"
    }
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Panel de Administración</h1>
        <div className="last-updated">
          <Clock size={16} />
          <span>Actualizado hace unos momentos</span>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="stats-grid">
        {statCards.map((card, index) => (
          <div key={index} className={`stat-card stat-${card.color}`}>
            <div className="stat-header">
              {card.icon}
              <span className="stat-title">{card.title}</span>
            </div>
            <div className="stat-content">
              <h3 className="stat-value">{card.value}</h3>
              {card.subValue && <p className="stat-subvalue">{card.subValue}</p>}
              {card.change > 0 && (
                <div className="stat-change positive">
                  <UserPlus size={14} />
                  <span>+{card.change} {card.changeText}</span>
                </div>
              )}
            </div>
            <Link to={card.link} className="stat-link">
              Ver detalles <TrendingUp size={16} />
            </Link>
          </div>
        ))}
      </div>

      {/* Resumen de actividad reciente */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Actividad Reciente</h2>
          <Link to="/admin/activity" className="view-all-link">
            Ver toda la actividad →
          </Link>
        </div>
        
        <div className="activity-list">
          {recentActivity.length === 0 ? (
            <div className="empty-state">
              <Activity size={48} />
              <p>No hay actividad reciente</p>
            </div>
          ) : (
            <div className="activity-grid">
              {recentActivity.slice(0, 6).map((activity) => (
                <div key={activity.id} className="activity-card">
                  <div className="activity-icon">
                    <Package size={20} />
                  </div>
                  <div className="activity-details">
                    <h4>{activity.activity_type}</h4>
                    <p>{activity.description || "Actividad del usuario"}</p>
                    <div className="activity-meta">
                      <span className="activity-user">
                        {activity.user_name || "Usuario"}
                      </span>
                      <span className="activity-time">
                        {new Date(activity.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Enlaces rápidos */}
      <div className="dashboard-section">
        <h2>Acceso Rápido</h2>
        <div className="quick-links">
          <Link to="/admin/users" className="quick-link">
            <Users size={24} />
            <span>Gestión de Usuarios</span>
          </Link>
          <Link to="/admin/stats" className="quick-link">
            <TrendingUp size={24} />
            <span>Estadísticas Detalladas</span>
          </Link>
          <Link to="/admin/activity" className="quick-link">
            <Activity size={24} />
            <span>Registro de Actividad</span>
          </Link>
        </div>
      </div>
    </div>
  );
}