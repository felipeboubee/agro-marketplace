import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from "../../services/api";
import '../../styles/dashboard.css';

const SellerDashboard = () => {
  const [user, setUser] = useState(null);
  const [marketPrices, setMarketPrices] = useState([]);
  const [offeredLotes, setOfferedLotes] = useState([]);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [stats, setStats] = useState({
    totalLotes: 0,
    activeLotes: 0,
    completedTransactions: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('token');
      try {
        // Obtener datos del usuario
        const userResponse = await api.get('/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(userResponse.data.user);

        // Obtener precios del mercado
        const pricesResponse = await api.get('/market/prices');
        setMarketPrices(pricesResponse.data);

        // Obtener lotes ofrecidos
        const lotesResponse = await api.get('/lotes/seller', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOfferedLotes(lotesResponse.data);

        // Obtener historial de transacciones
        const transactionsResponse = await api.get('/transactions/seller', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTransactionHistory(transactionsResponse.data);

        // Calcular estadísticas
        const totalLotes = lotesResponse.data.length;
        const activeLotes = lotesResponse.data.filter(l => l.status === 'ofertado').length;
        const completedTransactions = transactionsResponse.data.filter(t => t.status === 'completo').length;
        const totalRevenue = transactionsResponse.data
          .filter(t => t.status === 'completo')
          .reduce((sum, t) => sum + parseFloat(t.price), 0);

        setStats({
          totalLotes,
          activeLotes,
          completedTransactions,
          totalRevenue
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Panel del Vendedor</h1>
          <p>Bienvenido, {user?.name}</p>
        </div>
        <div className="header-actions">
          <Link to="/vendedor/crear-lote" className="btn btn-primary">
            <span>+</span> Crear Nuevo Lote
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.totalLotes}</h3>
            <p>Total Lotes</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <h3>{stats.activeLotes}</h3>
            <p>Lotes Activos</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <h3>{stats.completedTransactions}</h3>
            <p>Transacciones Completadas</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>${stats.totalRevenue.toLocaleString()}</h3>
            <p>Ingresos Totales</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Left Column - Market Prices */}
        <div className="dashboard-column">
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Precios del Mercado de Liniers</h3>
              <span className="card-badge">Actualizado hoy</span>
            </div>
            <div className="market-prices">
              <table>
                <thead>
                  <tr>
                    <th>Categoría</th>
                    <th>Min.</th>
                    <th>Max.</th>
                    <th>Variación</th>
                  </tr>
                </thead>
                <tbody>
                  {marketPrices.map((price, index) => (
                    <tr key={index}>
                      <td>{price.category}</td>
                      <td>${price.min}</td>
                      <td>${price.max}</td>
                      <td className={`trend-${price.trend}`}>
                        {price.trend === 'up' ? '↗' : '↘'} {price.change}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card-footer">
              <Link to="/vendedor/precios-detalle" className="btn-link">
                Ver análisis detallado →
              </Link>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Transacciones Recientes</h3>
              <Link to="/vendedor/historial">Ver todo</Link>
            </div>
            <div className="transactions-list">
              {transactionHistory.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="transaction-item">
                  <div className="transaction-info">
                    <div className="transaction-header">
                      <span className="transaction-id">#{transaction.id}</span>
                      <span className={`status-badge status-${transaction.status}`}>
                        {transaction.status}
                      </span>
                    </div>
                    <p className="transaction-details">
                      {transaction.quantity} {transaction.animal_type} • {transaction.location}
                    </p>
                  </div>
                  <div className="transaction-amount">
                    ${transaction.price}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Active Lotes */}
        <div className="dashboard-column">
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Lotes Activos</h3>
              <Link to="/vendedor/mis-lotes">Gestionar</Link>
            </div>
            <div className="lotes-list">
              {offeredLotes
                .filter(lote => lote.status === 'ofertado')
                .slice(0, 5)
                .map((lote) => (
                  <div key={lote.id} className="lote-card">
                    <div className="lote-header">
                      <h4>{lote.animal_type} - {lote.breed}</h4>
                      <span className="lote-location">{lote.location}</span>
                    </div>
                    <div className="lote-details">
                      <div className="lote-stat">
                        <span className="stat-label">Cantidad:</span>
                        <span className="stat-value">{lote.total_count} animales</span>
                      </div>
                      <div className="lote-stat">
                        <span className="stat-label">Peso promedio:</span>
                        <span className="stat-value">{lote.average_weight} kg</span>
                      </div>
                      <div className="lote-stat">
                        <span className="stat-label">Precio base:</span>
                        <span className="stat-value">${lote.base_price}/kg</span>
                      </div>
                    </div>
                    <div className="lote-actions">
                      <Link 
                        to={`/vendedor/lote/${lote.id}`}
                        className="btn btn-outline btn-small"
                      >
                        Ver Detalles
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="dashboard-card quick-actions-card">
            <h3>Acciones Rápidas</h3>
            <div className="actions-grid">
              <Link to="/vendedor/crear-lote" className="action-btn">
                <div className="action-icon">➕</div>
                <span>Publicar Lote</span>
              </Link>
              <Link to="/vendedor/mis-lotes" className="action-btn">
                <div className="action-icon">📋</div>
                <span>Mis Lotes</span>
              </Link>
              <Link to="/vendedor/perfil" className="action-btn">
                <div className="action-icon">👤</div>
                <span>Mi Perfil</span>
              </Link>
              <Link to="/vendedor/estadisticas" className="action-btn">
                <div className="action-icon">📈</div>
                <span>Estadísticas</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;