import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from "../../services/api";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, Package, DollarSign, Calendar, X, AlertCircle } from 'lucide-react';
import '../../styles/dashboard.css';

export default function PurchaseRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/offers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter pending and rejected offers
      const filteredRequests = response.filter(
        offer => offer.status === 'pendiente' || offer.status === 'rechazada'
      );
      setRequests(filteredRequests);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setLoading(false);
    }
  };

  const handleCancelOffer = async (offerId) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta oferta?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await api.delete(`/offers/${offerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove from list
      setRequests(requests.filter(r => r.id !== offerId));
      alert('Oferta cancelada exitosamente');
    } catch (error) {
      console.error('Error canceling offer:', error);
      alert('Error al cancelar la oferta');
    }
  };

  const calculateTotal = (offer) => {
    return parseFloat(offer.offered_price) * parseFloat(offer.total_count) * parseFloat(offer.average_weight);
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pendiente': { label: 'Pendiente', class: 'badge-warning', icon: Clock },
      'rechazada': { label: 'Rechazada', class: 'badge-danger', icon: X }
    };
    const badge = badges[status] || { label: status, class: 'badge-default', icon: AlertCircle };
    const Icon = badge.icon;
    
    return (
      <span className={`status-badge ${badge.class}`}>
        <Icon size={16} />
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando solicitudes...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <h1>
          <Clock size={32} />
          Solicitudes de Compra
        </h1>
        <p className="subtitle">Ofertas enviadas a vendedores</p>
      </div>

      {requests.length === 0 ? (
        <div className="empty-state">
          <Clock size={64} style={{ opacity: 0.3 }} />
          <h3>No tienes solicitudes pendientes</h3>
          <p>Las ofertas que hagas a los vendedores aparecerán aquí</p>
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
                <th>Precio Ofrecido</th>
                <th>Total</th>
                <th>Fecha Oferta</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className={request.status === 'rechazada' ? 'row-muted' : ''}>
                  <td>
                    <div className="lote-info">
                      <strong>{request.animal_type}</strong>
                      <span className="text-muted">{request.breed}</span>
                    </div>
                  </td>
                  <td>
                    <div className="seller-info">
                      <span>{request.seller_name || 'N/A'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="quantity-info">
                      <Package size={16} />
                      <span>{request.total_count} animales</span>
                    </div>
                  </td>
                  <td>
                    <div className="price-info">
                      <DollarSign size={16} />
                      <span>${parseFloat(request.offered_price).toFixed(2)}/kg</span>
                      {request.original_price && (
                        <small className="text-muted">
                          (Original: ${parseFloat(request.original_price).toFixed(2)})
                        </small>
                      )}
                    </div>
                  </td>
                  <td>
                    <strong className="total-price">
                      ${calculateTotal(request).toLocaleString('es-AR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </strong>
                  </td>
                  <td>
                    <div className="date-info">
                      <Calendar size={16} />
                      <span>{format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}</span>
                    </div>
                  </td>
                  <td>
                    {getStatusBadge(request.status)}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link 
                        to={`/comprador/lote/${request.lote_id}`}
                        className="btn btn-sm btn-outline"
                      >
                        Ver Lote
                      </Link>
                      {request.status === 'pendiente' && (
                        <button
                          onClick={() => handleCancelOffer(request.id)}
                          className="btn btn-sm btn-danger"
                          title="Cancelar oferta"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {requests.length > 0 && (
        <div className="summary-card">
          <h3>Resumen</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Ofertas pendientes:</span>
              <span className="summary-value">
                {requests.filter(r => r.status === 'pendiente').length}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Ofertas rechazadas:</span>
              <span className="summary-value">
                {requests.filter(r => r.status === 'rechazada').length}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Monto total en ofertas:</span>
              <span className="summary-value">
                ${requests
                  .filter(r => r.status === 'pendiente')
                  .reduce((sum, r) => sum + calculateTotal(r), 0)
                  .toLocaleString('es-AR', {
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
