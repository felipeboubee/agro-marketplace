import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from "../../services/api";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, Package, DollarSign, Calendar, Check, X, User } from 'lucide-react';
import '../../styles/dashboard.css';

export default function PurchaseRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupedRequests, setGroupedRequests] = useState({});

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/offers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Group by lote_id and sort
      const grouped = response.reduce((acc, offer) => {
        const loteId = offer.lote_id;
        if (!acc[loteId]) {
          acc[loteId] = {
            lote: {
              id: loteId,
              animal_type: offer.animal_type,
              breed: offer.breed,
              total_count: offer.total_count,
              average_weight: offer.average_weight
            },
            offers: []
          };
        }
        acc[loteId].offers.push(offer);
        return acc;
      }, {});

      // Sort offers within each lote by date (newest first) and then by total amount (highest first)
      Object.keys(grouped).forEach(loteId => {
        grouped[loteId].offers.sort((a, b) => {
          const dateCompare = new Date(b.created_at) - new Date(a.created_at);
          if (dateCompare !== 0) return dateCompare;
          
          const totalA = a.offered_price * a.total_count * a.average_weight;
          const totalB = b.offered_price * b.total_count * b.average_weight;
          return totalB - totalA;
        });
      });

      setGroupedRequests(grouped);
      setRequests(response);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (offerId, newStatus) => {
    const confirmMessage = newStatus === 'aceptada' 
      ? '¿Estás seguro de que deseas aceptar esta oferta?'
      : '¿Estás seguro de que deseas rechazar esta oferta?';
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await api.put(`/offers/${offerId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert(`Oferta ${newStatus} exitosamente`);
      fetchRequests(); // Reload data
    } catch (error) {
      console.error('Error updating offer status:', error);
      alert('Error al actualizar el estado de la oferta');
    }
  };

  const calculateTotal = (offer) => {
    return parseFloat(offer.offered_price) * parseFloat(offer.total_count) * parseFloat(offer.average_weight);
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pendiente': { label: 'Pendiente', class: 'badge-warning', icon: Clock },
      'aceptada': { label: 'Aceptada', class: 'badge-success', icon: Check },
      'rechazada': { label: 'Rechazada', class: 'badge-danger', icon: X }
    };
    const badge = badges[status] || { label: status, class: 'badge-default', icon: Clock };
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
        <p className="subtitle">Ofertas recibidas en tus lotes</p>
      </div>

      {Object.keys(groupedRequests).length === 0 ? (
        <div className="empty-state">
          <Clock size={64} style={{ opacity: 0.3 }} />
          <h3>No tienes solicitudes de compra</h3>
          <p>Cuando los compradores hagan ofertas en tus lotes, aparecerán aquí</p>
          <Link to="/vendedor/lotes" className="btn btn-primary">
            Ver Mis Lotes
          </Link>
        </div>
      ) : (
        <div className="requests-by-lote">
          {Object.entries(groupedRequests).map(([loteId, data]) => (
            <div key={loteId} className="lote-group-card">
              <div className="lote-group-header">
                <div className="lote-info-header">
                  <h3>
                    <Package size={24} />
                    {data.lote.animal_type} - {data.lote.breed}
                  </h3>
                  <p className="lote-details">
                    {data.lote.total_count} animales • {data.lote.average_weight} kg promedio
                  </p>
                </div>
                <div className="offers-count">
                  <span className="badge badge-info">
                    {data.offers.length} {data.offers.length === 1 ? 'oferta' : 'ofertas'}
                  </span>
                  <Link 
                    to={`/vendedor/lote/${loteId}`}
                    className="btn btn-sm btn-outline"
                  >
                    Ver Lote
                  </Link>
                </div>
              </div>

              <div className="offers-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Comprador</th>
                      <th>Precio Ofrecido</th>
                      <th>Total</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.offers.map((offer) => (
                      <tr key={offer.id} className={offer.status !== 'pendiente' ? 'row-muted' : ''}>
                        <td>
                          <div className="buyer-info">
                            <User size={16} />
                            <div>
                              <strong>{offer.buyer_name}</strong>
                              {offer.buyer_email && (
                                <small className="text-muted">{offer.buyer_email}</small>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="price-comparison">
                            <strong className="offered-price">
                              ${parseFloat(offer.offered_price).toFixed(2)}/kg
                            </strong>
                            {offer.original_price && (
                              <small className="text-muted">
                                vs ${parseFloat(offer.original_price).toFixed(2)}/kg
                              </small>
                            )}
                          </div>
                        </td>
                        <td>
                          <strong className="total-price">
                            ${calculateTotal(offer).toLocaleString('es-AR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </strong>
                        </td>
                        <td>
                          <div className="date-info">
                            <Calendar size={16} />
                            <span>
                              {format(new Date(offer.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                            </span>
                          </div>
                        </td>
                        <td>
                          {getStatusBadge(offer.status)}
                        </td>
                        <td>
                          {offer.status === 'pendiente' ? (
                            <div className="action-buttons">
                              <button
                                onClick={() => handleUpdateStatus(offer.id, 'aceptada')}
                                className="btn btn-sm btn-success"
                                title="Aceptar oferta"
                              >
                                <Check size={16} />
                                Aceptar
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(offer.id, 'rechazada')}
                                className="btn btn-sm btn-danger"
                                title="Rechazar oferta"
                              >
                                <X size={16} />
                                Rechazar
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {requests.length > 0 && (
        <div className="summary-card">
          <h3>Resumen General</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Total de ofertas:</span>
              <span className="summary-value">{requests.length}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Pendientes:</span>
              <span className="summary-value">
                {requests.filter(r => r.status === 'pendiente').length}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Aceptadas:</span>
              <span className="summary-value">
                {requests.filter(r => r.status === 'aceptada').length}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Rechazadas:</span>
              <span className="summary-value">
                {requests.filter(r => r.status === 'rechazada').length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
