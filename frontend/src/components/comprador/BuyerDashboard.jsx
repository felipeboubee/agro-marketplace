import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from "../../services/api";
import '../../styles/dashboard.css';

const BuyerDashboard = () => {
  const [user, setUser] = useState(null);
  const [marketPrices, setMarketPrices] = useState([]);
  const [recentLotes, setRecentLotes] = useState([]);
  const [savedLotes, setSavedLotes] = useState([]);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [certificationStatus, setCertificationStatus] = useState('no certificado');

  useEffect(() => {
    // Obtener datos del usuario
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await api.get('/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data.user);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    // Obtener precios del mercado
    const fetchMarketPrices = async () => {
      try {
        // En un caso real, aquí consumirías la API de Liniers
        const mockPrices = [
          { category: 'Novillitos', min: 4850, max: 5200, trend: 'up', change: 2.3 },
          { category: 'Vaquillonas', min: 4500, max: 4800, trend: 'down', change: 1.5 },
          { category: 'Vacas', min: 4200, max: 4500, trend: 'up', change: 0.8 },
        ];
        setMarketPrices(mockPrices);
      } catch (error) {
        console.error('Error fetching market prices:', error);
      }
    };

    fetchUserData();
    fetchMarketPrices();
  }, []);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Bienvenido, {user?.name}</h1>
        <p>Panel de Control - Comprador</p>
      </div>

      <div className="dashboard-grid">
        {/* Precios del Mercado */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Precios del Mercado de Liniers</h3>
            <span className="card-updated">Actualizado hoy</span>
          </div>
          <div className="prices-list">
            {marketPrices.map((price, index) => (
              <div key={index} className="price-item">
                <div className="price-category">{price.category}</div>
                <div className="price-range">
                  ${price.min} - ${price.max}
                </div>
                <div className={`price-trend ${price.trend}`}>
                  {price.trend === 'up' ? '↑' : '↓'} {price.change}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Estado de Certificación */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Estado de Certificación</h3>
          </div>
          <div className={`certification-status ${certificationStatus.replace(' ', '-')}`}>
            <div className="status-icon">
              {certificationStatus === 'aprobado' && '✓'}
              {certificationStatus === 'pendiente' && '⏳'}
              {certificationStatus === 'no certificado' && 'ℹ️'}
            </div>
            <div className="status-content">
              <h4>{certificationStatus.toUpperCase()}</h4>
              {certificationStatus === 'no certificado' && (
                <Link to="/comprador/certificacion" className="btn btn-small btn-primary">
                  Solicitar Certificación
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Lotes Guardados */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Lotes Guardados</h3>
            <Link to="/comprador/lotes-guardados">Ver todos</Link>
          </div>
          {savedLotes.length > 0 ? (
            <div className="lotes-list">
              {savedLotes.slice(0, 3).map((lote) => (
                <div key={lote.id} className="lote-item">
                  <div className="lote-info">
                    <h4>{lote.animal_type}</h4>
                    <p>{lote.location} - {lote.total_count} animales</p>
                  </div>
                  <div className="lote-price">${lote.base_price}/kg</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No hay lotes guardados</p>
          )}
        </div>

        {/* Transacciones en Curso */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Transacciones en Curso</h3>
            <Link to="/comprador/historial">Ver historial</Link>
          </div>
          {pendingTransactions.length > 0 ? (
            <div className="transactions-list">
              {pendingTransactions.map((transaction) => (
                <div key={transaction.id} className="transaction-item">
                  <div className="transaction-info">
                    <h4>Lote #{transaction.lote_id}</h4>
                    <p>Status: {transaction.status}</p>
                  </div>
                  <div className="transaction-amount">${transaction.price}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No hay transacciones pendientes</p>
          )}
        </div>

        {/* Acciones Rápidas */}
        <div className="dashboard-card actions-card">
          <h3>Acciones Rápidas</h3>
          <div className="actions-grid">
            <Link to="/comprador/buscar-lotes" className="action-item">
              <div className="action-icon">🔍</div>
              <span>Buscar Lotes</span>
            </Link>
            <Link to="/comprador/certificacion" className="action-item">
              <div className="action-icon">🏦</div>
              <span>Solicitar Crédito</span>
            </Link>
            <Link to="/comprador/perfil" className="action-item">
              <div className="action-icon">👤</div>
              <span>Mi Perfil</span>
            </Link>
            <Link to="/comprador/favoritos" className="action-item">
              <div className="action-icon">⭐</div>
              <span>Favoritos</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;