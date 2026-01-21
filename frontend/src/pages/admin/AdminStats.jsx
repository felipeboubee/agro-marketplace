import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { 
  BarChart3, 
  LineChart, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  Download,
  Calendar,
  Filter
} from "lucide-react";
import { formatPrice } from '../../utils/formatters';
import "../../styles/dashboard.css";

export default function AdminStats() {
  const [detailedStats, setDetailedStats] = useState(null);
  const [period, setPeriod] = useState("30days");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetailedStats();
  }, [period]);

  async function loadDetailedStats() {
    try {
      const data = await api.getDetailedStats({ period });
      setDetailedStats(data);
    } catch (error) {
      console.error("Error loading detailed stats:", error);
    } finally {
      setLoading(false);
    }
  }

  const periods = [
    { id: "7days", label: "Últimos 7 días" },
    { id: "30days", label: "Últimos 30 días" },
    { id: "90days", label: "Últimos 90 días" },
    { id: "1year", label: "Último año" }
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando estadísticas...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <h1>
          <BarChart3 size={32} />
          Estadísticas Detalladas
        </h1>
        <div className="header-actions">
          <div className="period-selector">
            <Calendar size={20} />
            <select 
              value={period} 
              onChange={(e) => setPeriod(e.target.value)}
              className="select-input"
            >
              {periods.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-secondary">
            <Download size={20} />
            Exportar
          </button>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="stats-overview">
        <div className="overview-card">
          <LineChart size={24} className="text-blue-500" />
          <h3>Crecimiento de Usuarios</h3>
          <p className="overview-value">
            {detailedStats?.userGrowth?.reduce((sum, day) => sum + parseInt(day.new_users), 0) || 0}
          </p>
          <p className="overview-label">nuevos usuarios</p>
        </div>
        
        <div className="overview-card">
          <DollarSign size={24} className="text-green-500" />
          <h3>Ingresos Totales</h3>
          <p className="overview-value">
            ${detailedStats?.revenueTrend?.reduce((sum, day) => sum + parseFloat(day.daily_revenue || 0), 0).toLocaleString() || 0}
          </p>
          <p className="overview-label">en ingresos</p>
        </div>
        
        <div className="overview-card">
          <ShoppingCart size={24} className="text-purple-500" />
          <h3>Pedidos Totales</h3>
          <p className="overview-value">
            {detailedStats?.revenueTrend?.reduce((sum, day) => sum + parseInt(day.orders_count || 0), 0) || 0}
          </p>
          <p className="overview-label">pedidos completados</p>
        </div>
      </div>

      {/* Distribución de tipos de usuario */}
      <div className="dashboard-section">
        <h2>
          <Users size={24} />
          Distribución de Usuarios
        </h2>
        <div className="data-grid">
          {detailedStats?.userTypes?.map((type) => (
            <div key={type.user_type} className="distribution-card">
              <h4>{type.user_type}</h4>
              <div className="distribution-info">
                <span className="distribution-count">{type.count} usuarios</span>
                <span className="distribution-percentage">{type.percentage}%</span>
              </div>
              <div className="distribution-bar">
                <div 
                  className="distribution-fill" 
                  style={{ width: `${type.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Estadísticas de pedidos */}
      <div className="dashboard-section">
        <h2>
          <ShoppingCart size={24} />
          Estadísticas de Pedidos
        </h2>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Estado</th>
                <th>Cantidad</th>
                <th>Valor Promedio</th>
                <th>Ingreso Total</th>
              </tr>
            </thead>
            <tbody>
              {detailedStats?.orderStats?.map((order) => (
                <tr key={order.status}>
                  <td>
                    <span className={`status-badge status-${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>{order.count}</td>
                  <td>{formatPrice(order.avg_value || 0)}</td>
                  <td>{formatPrice(parseInt(order.count) * parseFloat(order.avg_value || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Productos más vendidos */}
      <div className="dashboard-section">
        <h2>
          <TrendingUp size={24} />
          Productos Más Vendidos
        </h2>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad Vendida</th>
                <th>Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {detailedStats?.topProducts?.map((product, index) => (
                <tr key={product.name}>
                  <td>
                    <div className="product-info">
                      <span className="product-rank">#{index + 1}</span>
                      <span>{product.name}</span>
                    </div>
                  </td>
                  <td>{product.total_sold}</td>
                  <td>{formatPrice(product.revenue || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}