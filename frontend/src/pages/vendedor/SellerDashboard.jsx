import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { ShoppingCart, TrendingUp, AlertCircle, Plus, MessageCircle } from "lucide-react";
import { formatPrice } from "../../utils/formatters";
import "../../styles/dashboard.css";

export default function SellerDashboard() {
  const [stats, setStats] = useState(null);
  const [recentLotes, setRecentLotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const [lotes, transactions] = await Promise.all([
        api.getSellerLotes(),
        api.get('/transactions/seller')
      ]);
      
      setRecentLotes(Array.isArray(lotes) ? lotes.slice(0, 5) : []);

      // Calcular estadísticas
      const totalLotes = Array.isArray(lotes) ? lotes.length : 0;
      const activeLotes = Array.isArray(lotes) ? lotes.filter(l => l.status === 'ofertado').length : 0;
      const soldLotes = Array.isArray(lotes) ? lotes.filter(l => l.status === 'completo').length : 0;
      
      // Calcular ingresos totales de transacciones completadas
      const completedTransactions = Array.isArray(transactions) ? transactions.filter(t => t.status === 'completed') : [];
      const totalEarnings = completedTransactions.reduce((sum, t) => {
        return sum + (parseFloat(t.seller_net_amount) || 0);
      }, 0);
      
      setStats({
        totalLotes,
        activeLotes,
        soldLotes,
        totalEarnings
      });
    } catch (error) {
      console.error("Error loading dashboard:", error);
      setRecentLotes([]);
      setStats({ totalLotes: 0, activeLotes: 0, soldLotes: 0, totalEarnings: 0 });
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    {
      title: "Lotes Publicados",
      value: stats?.totalLotes || 0,
      icon: <ShoppingCart className="stat-icon" />,
      color: "blue",
      link: "/vendedor/mis-lotes"
    },
    {
      title: "Lotes Activos",
      value: stats?.activeLotes || 0,
      icon: <TrendingUp className="stat-icon" />,
      color: "green",
      link: "/vendedor/mis-lotes"
    },
    {
      title: "Lotes Vendidos",
      value: stats?.soldLotes || 0,
      icon: <AlertCircle className="stat-icon" />,
      color: "orange",
      link: "/vendedor/mis-lotes"
    },
    {
      title: "Ingresos Totales",
      value: stats?.totalEarnings ? formatPrice(stats.totalEarnings) : formatPrice(0),
      icon: <TrendingUp className="stat-icon" />,
      color: "purple",
      link: "/vendedor/mis-transacciones"
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
      <div className="page-header">
        <h1>Panel de Vendedor</h1>
        <Link to="/vendedor/crear" className="btn btn-primary">
          <Plus size={20} />
          Crear Lote
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {statCards.map((card, index) => (
          <Link 
            key={index} 
            to={card.link}
            className={`stat-card stat-${card.color}`}
          >
            {card.icon}
            <div className="stat-content">
              <h3>{card.title}</h3>
              <p className="stat-value">{card.value}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Lotes */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Mis Lotes Recientes</h2>
          <Link to="/vendedor/mis-lotes" className="btn btn-text">
            Ver todos →
          </Link>
        </div>

        {recentLotes.length === 0 ? (
          <div className="empty-state">
            <ShoppingCart size={48} />
            <p>No has publicado lotes aún</p>
            <Link to="/vendedor/crear" className="btn btn-primary">
              Crear tu primer lote
            </Link>
          </div>
        ) : (
          <div className="lotes-table">
            <table>
              <thead>
                <tr>
                  <th>Tipo de Animal</th>
                  <th>Ubicación</th>
                  <th>Cantidad</th>
                  <th>Precio Base</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {recentLotes.map(lote => (
                  <tr key={lote.id}>
                    <td>{lote.animal_type} - {lote.breed}</td>
                    <td>{lote.location}</td>
                    <td>{lote.total_count}</td>
                    <td>{formatPrice(lote.base_price)}/kg</td>
                    <td>
                      <span className={`status-badge status-${lote.status}`}>
                        {lote.status === 'ofertado' ? 'Activo' : lote.status}
                      </span>
                    </td>
                    <td>
                      <Link to={`/vendedor/lote/${lote.id}`} className="btn btn-small">
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
