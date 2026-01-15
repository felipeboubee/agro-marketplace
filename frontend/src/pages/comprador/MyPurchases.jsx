import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from "../../services/api";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ShoppingBag, Package, DollarSign, Calendar, MapPin, CheckCircle } from 'lucide-react';
import '../../styles/dashboard.css';

export default function MyPurchases() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/offers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter only accepted offers
      const acceptedOffers = response.filter(offer => offer.status === 'aceptada');
      setPurchases(acceptedOffers);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      setLoading(false);
    }
  };

  const calculateTotal = (offer) => {
    return parseFloat(offer.offered_price) * parseFloat(offer.total_count) * parseFloat(offer.average_weight);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando compras...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <h1>
          <ShoppingBag size={32} />
          Mis Compras
        </h1>
        <p className="subtitle">Ofertas aceptadas por los vendedores</p>
      </div>

      {purchases.length === 0 ? (
        <div className="empty-state">
          <ShoppingBag size={64} style={{ opacity: 0.3 }} />
          <h3>No tienes compras aún</h3>
          <p>Cuando un vendedor acepte tu oferta, aparecerá aquí</p>
          <Link to="/comprador/lotes" className="btn btn-primary">
            Ver Lotes Disponibles
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Lote</th>
                <th>Vendedor</th>
                <th>Cantidad</th>
                <th>Precio/kg</th>
                <th>Total</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr key={purchase.id}>
                  <td>
                    <div className="lote-info">
                      <strong>{purchase.animal_type}</strong>
                      <span className="text-muted">{purchase.breed}</span>
                    </div>
                  </td>
                  <td>
                    <div className="seller-info">
                      <span>{purchase.seller_name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="quantity-info">
                      <Package size={16} />
                      <span>{purchase.total_count} animales</span>
                    </div>
                  </td>
                  <td>
                    <div className="price-info">
                      <DollarSign size={16} />
                      <span>${parseFloat(purchase.offered_price).toFixed(2)}</span>
                    </div>
                  </td>
                  <td>
                    <strong className="total-price">
                      ${calculateTotal(purchase).toLocaleString('es-AR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </strong>
                  </td>
                  <td>
                    <div className="date-info">
                      <Calendar size={16} />
                      <span>{format(new Date(purchase.created_at), 'dd/MM/yyyy', { locale: es })}</span>
                    </div>
                  </td>
                  <td>
                    <span className="status-badge badge-success">
                      <CheckCircle size={16} />
                      Aceptada
                    </span>
                  </td>
                  <td>
                    <Link 
                      to={`/comprador/lote/${purchase.lote_id}`}
                      className="btn btn-sm btn-outline"
                    >
                      Ver Detalles
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {purchases.length > 0 && (
        <div className="summary-card">
          <h3>Resumen</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Total de compras:</span>
              <span className="summary-value">{purchases.length}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Monto total:</span>
              <span className="summary-value">
                ${purchases.reduce((sum, p) => sum + calculateTotal(p), 0).toLocaleString('es-AR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
