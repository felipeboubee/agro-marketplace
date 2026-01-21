import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from "../../services/api";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, Package, DollarSign, Calendar, X, AlertCircle, Eye, Check, Trash2 } from 'lucide-react';
import { formatPrice } from '../../utils/formatters';
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
      
      // Filter pending, rejected, and counter-offered offers
      // Also fetch counter offers where buyer is the recipient
      const filteredRequests = response.filter(
        offer => ['pendiente', 'rechazada', 'counter_offered'].includes(offer.status) || offer.is_counter_offer
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

  const handleRespondToCounter = async (offerId, accept) => {
    const action = accept ? 'aceptar' : 'rechazar';
    if (!window.confirm(`¿Estás seguro de que deseas ${action} esta contraoferta?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await api.post(`/offers/${offerId}/respond`, 
        { accept },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert(accept ? 'Contraoferta aceptada. Se ha creado la transacción.' : 'Contraoferta rechazada');
      fetchRequests(); // Refresh list
    } catch (error) {
      console.error('Error responding to counter offer:', error);
      alert(error.response?.data?.error || 'Error al responder a la contraoferta');
    }
  };

  const calculateTotal = (offer) => {
    return parseFloat(offer.offered_price) * parseFloat(offer.total_count) * parseFloat(offer.average_weight);
  };

  const getStatusBadge = (status, isCounterOffer) => {
    if (isCounterOffer) {
      return (
        <span className="status-badge badge-info">
          <AlertCircle size={16} />
          Contraoferta Recibida
        </span>
      );
    }
    
    const badges = {
      'pendiente': { label: 'Pendiente', class: 'badge-warning', icon: Clock },
      'rechazada': { label: 'Rechazada', class: 'badge-danger', icon: X },
      'counter_offered': { label: 'Contraoferta Enviada', class: 'badge-info', icon: AlertCircle }
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
                <th className="text-center">Cantidad</th>
                <th className="text-center">Precio Ofrecido</th>
                <th className="text-center">Total</th>
                <th className="text-center">Fecha</th>
                <th className="text-center">Estado</th>
                <th className="text-center">Acciones</th>
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
                  <td>{request.seller_name || 'N/A'}</td>
                  <td className="text-center number-cell">{request.total_count}</td>
                  <td className="text-center">
                    {request.is_counter_offer ? (
                      <div>
                        <div className="counter-offer-badge" style={{ marginBottom: '6px' }}>
                          <AlertCircle size={14} style={{ color: '#0066cc' }} />
                          <span style={{ color: '#0066cc', fontSize: '13px', fontWeight: '600' }}>Contraoferta</span>
                        </div>
                        <div style={{ textDecoration: 'line-through', color: '#999', fontSize: '13px' }}>
                          {formatPrice(request.counter_offer_price || 0)}/kg
                        </div>
                        <div className="price-cell" style={{ color: '#0066cc', fontWeight: 'bold', marginTop: '4px' }}>
                          {formatPrice(request.offered_price)}/kg
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="price-cell" style={{ color: '#2196f3', fontWeight: 'bold' }}>{formatPrice(request.offered_price)}/kg</div>
                        {request.original_price && (
                          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                            Base: {formatPrice(request.original_price)}/kg
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="text-center">
                    <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#333' }}>
                      {formatPrice(calculateTotal(request))}
                    </div>
                    {request.is_counter_offer && request.counter_offer_price && (
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                        Original: {formatPrice(parseFloat(request.counter_offer_price) * parseFloat(request.total_count) * parseFloat(request.average_weight))}
                      </div>
                    )}
                    {!request.is_counter_offer && request.original_price && (
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                        Base: {formatPrice(parseFloat(request.original_price) * parseFloat(request.total_count) * parseFloat(request.average_weight))}
                      </div>
                    )}
                  </td>
                  <td className="text-center">
                    {format(new Date(request.created_at), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td>
                    {getStatusBadge(request.status, request.is_counter_offer)}
                  </td>
                  <td className="text-center">
                    <div className="action-buttons">
                      <Link 
                        to={`/comprador/lote/${request.lote_id}`}
                        className="btn btn-sm btn-primary"
                        title="Ver lote"
                      >
                        <Eye size={16} />
                      </Link>
                      {request.is_counter_offer && request.status === 'pendiente' ? (
                        <>
                          <button
                            onClick={() => handleRespondToCounter(request.id, true)}
                            className="btn btn-sm btn-success"
                            title="Aceptar contraoferta"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => handleRespondToCounter(request.id, false)}
                            className="btn btn-sm btn-danger"
                            title="Rechazar contraoferta"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : request.status === 'pendiente' && !request.is_counter_offer ? (
                        <button
                          onClick={() => handleCancelOffer(request.id)}
                          className="btn btn-sm btn-danger"
                          title="Cancelar oferta"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {requests.length > 0 && (
        <div className="stats-grid" style={{ marginTop: '24px' }}>
          <div className="stat-card stat-warning">
            <div className="stat-header">
              <Clock size={24} />
              <span className="stat-title">Ofertas Pendientes</span>
            </div>
            <div className="stat-content">
              <h3 className="stat-value">{requests.filter(r => r.status === 'pendiente').length}</h3>
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
          
          <div className="stat-card stat-green">
            <div className="stat-header">
              <DollarSign size={24} />
              <span className="stat-title">Monto Total en Ofertas</span>
            </div>
            <div className="stat-content">
              <h3 className="stat-value">
                {formatPrice(requests
                  .filter(r => r.status === 'pendiente')
                  .reduce((sum, r) => sum + calculateTotal(r), 0))}
              </h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
