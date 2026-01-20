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
  const [showNegotiateModal, setShowNegotiateModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [counterPrice, setCounterPrice] = useState('');

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

  const handleNegotiate = (offer) => {
    setSelectedOffer(offer);
    setCounterPrice(parseFloat(offer.offered_price) * 1.1); // Suggest 10% more
    setShowNegotiateModal(true);
  };

  const submitCounterOffer = async () => {
    if (!counterPrice || counterPrice <= 0) {
      alert('Por favor ingresa un precio válido');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await api.post(`/offers/${selectedOffer.id}/counter`, 
        { counter_price: parseFloat(counterPrice) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Contraoferta enviada exitosamente');
      setShowNegotiateModal(false);
      setSelectedOffer(null);
      setCounterPrice('');
      fetchRequests();
    } catch (error) {
      console.error('Error creating counter offer:', error);
      alert(error.response?.data?.error || 'Error al crear la contraoferta');
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
                      <th>Plazo</th>
                      <th>Medio de Pago</th>
                      <th>Certificación</th>
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
                            <strong>{offer.buyer_name}</strong>
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
                          <div>
                            <strong className="total-price">
                              ${calculateTotal(offer).toLocaleString('es-AR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </strong>
                            {offer.original_price && (
                              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                                Base: ${(parseFloat(offer.original_price) * parseFloat(offer.total_count) * parseFloat(offer.average_weight)).toLocaleString('es-AR', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="payment-term">
                            {offer.payment_term === 'contado' ? 'Contado' : 
                             offer.payment_term === '30' ? '30 días' :
                             offer.payment_term === '30-60' ? '30-60 días' :
                             offer.payment_term || '-'}
                          </span>
                        </td>
                        <td>
                          <span className="payment-method">
                            {offer.payment_method === 'transferencia' ? 'Transferencia' :
                             offer.payment_method === 'tarjeta' ? 'Tarjeta' :
                             offer.payment_method === 'cheque' ? 'Cheque' :
                             offer.payment_method || '-'}
                          </span>
                        </td>
                        <td>
                          {offer.has_buyer_certification ? (
                            <span className="badge badge-success">Sí</span>
                          ) : (
                            <span className="badge badge-secondary">No</span>
                          )}
                        </td>
                        <td>
                          <span>
                            {format(new Date(offer.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </span>
                        </td>
                        <td>
                          {getStatusBadge(offer.status)}
                        </td>
                        <td>
                          {offer.status === 'pendiente' ? (
                            <div className="action-buttons">
                              <button
                                onClick={() => handleNegotiate(offer)}
                                className="btn btn-sm btn-warning"
                                title="Negociar precio"
                              >
                                <DollarSign size={16} />
                                <span className="btn-text">Negociar</span>
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(offer.id, 'aceptada')}
                                className="btn btn-sm btn-success"
                                title="Aceptar oferta"
                              >
                                <Check size={16} />
                                <span className="btn-text">Aceptar</span>
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(offer.id, 'rechazada')}
                                className="btn btn-sm btn-danger"
                                title="Rechazar oferta"
                              >
                                <X size={16} />
                                <span className="btn-text">Rechazar</span>
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
        <div className="stats-grid" style={{ marginTop: '24px' }}>
          <div className="stat-card stat-info">
            <div className="stat-header">
              <Package size={24} />
              <span className="stat-title">Total de Ofertas</span>
            </div>
            <div className="stat-content">
              <h3 className="stat-value">{requests.length}</h3>
            </div>
          </div>
          
          <div className="stat-card stat-warning">
            <div className="stat-header">
              <Clock size={24} />
              <span className="stat-title">Ofertas Pendientes</span>
            </div>
            <div className="stat-content">
              <h3 className="stat-value">{requests.filter(r => r.status === 'pendiente').length}</h3>
            </div>
          </div>
          
          <div className="stat-card stat-success">
            <div className="stat-header">
              <Check size={24} />
              <span className="stat-title">Ofertas Aceptadas</span>
            </div>
            <div className="stat-content">
              <h3 className="stat-value">{requests.filter(r => r.status === 'aceptada').length}</h3>
            </div>
          </div>

          <div className="stat-card stat-danger">
            <div className="stat-header">
              <X size={24} />
              <span className="stat-title">Ofertas Rechazadas</span>
            </div>
            <div className="stat-content">
              <h3 className="stat-value">{requests.filter(r => r.status === 'rechazada').length}</h3>
            </div>
          </div>
        </div>
      )}

      {showNegotiateModal && selectedOffer && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Negociar Precio</h3>
              <button className="modal-close" onClick={() => setShowNegotiateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="offer-summary">
                <h4>Oferta Original</h4>
                <div className="offer-details">
                  <p><strong>Comprador:</strong> {selectedOffer.buyer_name}</p>
                  <p><strong>Precio ofrecido:</strong> ${parseFloat(selectedOffer.offered_price).toFixed(2)}/kg</p>
                  <p><strong>Total estimado:</strong> ${calculateTotal(selectedOffer).toLocaleString('es-AR')}</p>
                  <p><strong>Plazo:</strong> {selectedOffer.payment_term || '-'}</p>
                  <p><strong>Medio de pago:</strong> {selectedOffer.payment_method || '-'}</p>
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '20px' }}>
                <label htmlFor="counterPrice">Tu Contraoferta (por kg)</label>
                <div className="price-input-wrapper">
                  <span className="price-prefix">$</span>
                  <input
                    id="counterPrice"
                    type="number"
                    value={counterPrice}
                    onChange={(e) => setCounterPrice(e.target.value)}
                    step="0.01"
                    min="0"
                    placeholder="Ingresa tu precio"
                  />
                  <span className="price-suffix">/kg</span>
                </div>
                {counterPrice && (
                  <small className="text-muted" style={{ display: 'block', marginTop: '8px' }}>
                    Nuevo total estimado: ${(parseFloat(counterPrice) * selectedOffer.lote_weight).toLocaleString('es-AR')}
                  </small>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowNegotiateModal(false)} className="btn btn-outline">
                Cancelar
              </button>
              <button onClick={submitCounterOffer} className="btn btn-primary">
                Enviar Contraoferta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

