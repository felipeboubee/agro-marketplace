import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from "../../services/api";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import '../../styles/forms.css';

const LoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lote, setLote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [offerPrice, setOfferPrice] = useState('');
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseData, setPurchaseData] = useState({
    payment_method: 'contado',
    quantity: '',
    notes: ''
  });
  const [user, setUser] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetchLoteDetails();
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [id]);

  const fetchLoteDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/lotes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLote(response.data);
      
      // Verificar si es favorito
      if (user) {
        const favResponse = await api.get(`/favorites/check/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFavorite(favResponse.data.isFavorite);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching lote details:', error);
      setError('Error al cargar los detalles del lote');
      setLoading(false);
    }
  };

  const handleFavoriteToggle = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (isFavorite) {
        await api.delete(`/favorites/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await api.post(`/favorites/${id}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleMakeOffer = () => {
    if (!user) {
      alert('Debes iniciar sesión para hacer una oferta');
      navigate('/login');
      return;
    }
    
    if (user.user_type !== 'comprador') {
      alert('Solo los compradores pueden hacer ofertas');
      return;
    }
    
    setOfferPrice(lote.base_price);
    setShowOfferModal(true);
  };

  const handlePurchase = () => {
    if (!user) {
      alert('Debes iniciar sesión para comprar');
      navigate('/login');
      return;
    }
    
    if (user.user_type !== 'comprador') {
      alert('Solo los compradores pueden comprar');
      return;
    }
    
    setPurchaseData({
      ...purchaseData,
      quantity: lote.total_count
    });
    setShowPurchaseModal(true);
  };

  const submitOffer = async () => {
    try {
      const token = localStorage.getItem('token');
      await api.post(`/offers/${id}`, {
        offered_price: parseFloat(offerPrice),
        original_price: lote.base_price
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Oferta enviada exitosamente');
      setShowOfferModal(false);
    } catch (error) {
      console.error('Error submitting offer:', error);
      alert('Error al enviar la oferta');
    }
  };

  const submitPurchase = async () => {
    try {
      const token = localStorage.getItem('token');
      await api.post(`/transactions`, {
        lote_id: id,
        seller_id: lote.seller_id,
        price: lote.base_price,
        quantity: purchaseData.quantity,
        animal_type: lote.animal_type,
        payment_method: purchaseData.payment_method,
        location: lote.location,
        average_weight: lote.average_weight,
        breed: lote.breed,
        notes: purchaseData.notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Solicitud de compra enviada exitosamente');
      setShowPurchaseModal(false);
      navigate('/comprador/historial');
    } catch (error) {
      console.error('Error submitting purchase:', error);
      alert('Error al enviar la solicitud de compra');
    }
  };

  const calculateTotalValue = () => {
    if (!lote) return 0;
    return lote.total_count * lote.average_weight * lote.base_price;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando detalles del lote...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">❌</div>
        <h3>{error}</h3>
        <button onClick={() => navigate(-1)} className="btn btn-primary">
          Volver
        </button>
      </div>
    );
  }

  if (!lote) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔍</div>
        <h3>Lote no encontrado</h3>
        <p>El lote que buscas no existe o ha sido eliminado</p>
        <button onClick={() => navigate(-1)} className="btn btn-primary">
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="lote-detail-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <button onClick={() => navigate(-1)} className="breadcrumb-back">
          ← Volver
        </button>
        <span>/</span>
        <span>Lote #{lote.id}</span>
      </div>

      {/* Header del lote */}
      <div className="lote-header-detail">
        <div className="header-content">
          <h1>{lote.animal_type} - {lote.breed}</h1>
          <div className="header-subtitle">
            <span className="location">
              <i className="fas fa-map-marker-alt"></i> {lote.location}
            </span>
            <span className="status-badge status-{lote.status}">
              {lote.status === 'ofertado' ? 'Disponible' : lote.status}
            </span>
          </div>
        </div>
        <div className="header-actions">
          <button 
            onClick={handleFavoriteToggle}
            className={`btn ${isFavorite ? 'btn-warning' : 'btn-outline'}`}
          >
            <i className={`fas fa-${isFavorite ? 'star' : 'star'}`}></i>
            {isFavorite ? ' Quitado de Favoritos' : ' Agregar a Favoritos'}
          </button>
          {user?.user_type === 'comprador' && lote.status === 'ofertado' && (
            <button onClick={handleMakeOffer} className="btn btn-primary">
              <i className="fas fa-handshake"></i> Hacer Oferta
            </button>
          )}
        </div>
      </div>

      {/* Galería de imágenes */}
      {lote.photos && lote.photos.length > 0 && (
        <div className="image-gallery">
          <div className="main-image">
            <img 
              src={lote.photos[activeImage]} 
              alt={`Lote ${lote.id} - ${activeImage + 1}`}
            />
          </div>
          <div className="thumbnail-list">
            {lote.photos.map((photo, index) => (
              <div 
                key={index}
                className={`thumbnail ${index === activeImage ? 'active' : ''}`}
                onClick={() => setActiveImage(index)}
              >
                <img src={photo} alt={`Thumbnail ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="lote-content-detail">
        {/* Columna izquierda - Información principal */}
        <div className="detail-column">
          {/* Resumen del lote */}
          <div className="detail-card">
            <h3>
              <i className="fas fa-info-circle"></i> Resumen del Lote
            </h3>
            <div className="summary-grid">
              <div className="summary-item">
                <div className="summary-icon">🐄</div>
                <div className="summary-content">
                  <span className="summary-label">Cantidad Total</span>
                  <span className="summary-value">
                    {lote.total_count} animales
                  </span>
                  {lote.male_count > 0 && lote.female_count > 0 && (
                    <span className="summary-subtext">
                      ({lote.male_count} machos, {lote.female_count} hembras)
                    </span>
                  )}
                </div>
              </div>

              <div className="summary-item">
                <div className="summary-icon">⚖️</div>
                <div className="summary-content">
                  <span className="summary-label">Peso Total</span>
                  <span className="summary-value">
                    {(lote.total_count * lote.average_weight).toLocaleString('es-AR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} kg
                  </span>
                  <span className="summary-subtext">
                    {lote.average_weight} kg promedio
                  </span>
                </div>
              </div>

              <div className="summary-item">
                <div className="summary-icon">💰</div>
                <div className="summary-content">
                  <span className="summary-label">Valor Estimado</span>
                  <span className="summary-value">
                    ${calculateTotalValue().toLocaleString('es-AR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                  <span className="summary-subtext">
                    ${lote.base_price} por kg
                  </span>
                </div>
              </div>

              <div className="summary-item">
                <div className="summary-icon">🌱</div>
                <div className="summary-content">
                  <span className="summary-label">Tipo de Engorde</span>
                  <span className="summary-value">{lote.feeding_type}</span>
                  <span className="summary-subtext">Alimentación</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detalles técnicos */}
          <div className="detail-card">
            <h3>
              <i className="fas fa-clipboard-list"></i> Detalles Técnicos
            </h3>
            <div className="detail-table">
              <div className="detail-row">
                <span className="detail-label">Raza:</span>
                <span className="detail-value">{lote.breed}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Categoría:</span>
                <span className="detail-value">{lote.animal_type}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Peso Promedio:</span>
                <span className="detail-value">
                  {lote.average_weight} kg
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Precio Base:</span>
                <span className="detail-value">
                  ${lote.base_price} / kg
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Moneda:</span>
                <span className="detail-value">{lote.currency || 'ARS'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Certificado Sanitario:</span>
                <span className="detail-value">
                  {lote.health_certificate ? '✅ Sí' : '❌ No'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Registro de Vacunación:</span>
                <span className="detail-value">
                  {lote.vaccination_records ? '✅ Sí' : '❌ No'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Columna derecha - Información del vendedor y acciones */}
        <div className="detail-column">
          {/* Información del vendedor */}
          <div className="detail-card">
            <h3>
              <i className="fas fa-user-tie"></i> Información del Vendedor
            </h3>
            <div className="seller-info">
              <div className="seller-avatar">
                <i className="fas fa-user"></i>
              </div>
              <div className="seller-details">
                <h4>{lote.seller_name || 'Vendedor'}</h4>
                <p className="seller-email">
                  <i className="fas fa-envelope"></i> {lote.seller_email}
                </p>
                <p className="seller-phone">
                  <i className="fas fa-phone"></i> {lote.seller_phone || 'No disponible'}
                </p>
                <div className="seller-rating">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star-half-alt"></i>
                  <span className="rating-text">4.5/5</span>
                </div>
              </div>
            </div>
            <button className="btn btn-outline btn-block">
              <i className="fas fa-comment"></i> Contactar al Vendedor
            </button>
          </div>

          {/* Acciones rápidas */}
          <div className="detail-card actions-card">
            <h3>
              <i className="fas fa-bolt"></i> Acciones Rápidas
            </h3>
            <div className="quick-actions">
              {user?.user_type === 'comprador' && lote.status === 'ofertado' && (
                <>
                  <button onClick={handlePurchase} className="btn btn-primary btn-block">
                    <i className="fas fa-shopping-cart"></i> Comprar Ahora
                  </button>
                  <button onClick={handleMakeOffer} className="btn btn-outline btn-block">
                    <i className="fas fa-handshake"></i> Hacer Oferta
                  </button>
                </>
              )}
              
              {user?.user_type === 'vendedor' && user?.id === lote.seller_id && (
                <>
                  <button 
                    onClick={() => navigate(`/vendedor/editar-lote/${id}`)}
                    className="btn btn-primary btn-block"
                  >
                    <i className="fas fa-edit"></i> Editar Lote
                  </button>
                  <button className="btn btn-outline btn-block">
                    <i className="fas fa-chart-line"></i> Ver Estadísticas
                  </button>
                </>
              )}

              <button className="btn btn-outline btn-block">
                <i className="fas fa-share-alt"></i> Compartir
              </button>
              <button className="btn btn-outline btn-block">
                <i className="fas fa-print"></i> Imprimir
              </button>
            </div>
          </div>

          {/* Información de publicación */}
          <div className="detail-card">
            <h3>
              <i className="fas fa-calendar-alt"></i> Información de Publicación
            </h3>
            <div className="publication-info">
              <div className="info-row">
                <span className="info-label">Publicado:</span>
                <span className="info-value">
                  {format(new Date(lote.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Actualizado:</span>
                <span className="info-value">
                  {format(new Date(lote.updated_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                </span>
              </div>
              {lote.expires_at && (
                <div className="info-row">
                  <span className="info-label">Válido hasta:</span>
                  <span className="info-value">
                    {format(new Date(lote.expires_at), 'dd/MM/yyyy', { locale: es })}
                  </span>
                </div>
              )}
              <div className="info-row">
                <span className="info-label">Vistas:</span>
                <span className="info-value">{lote.views_count || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Descripción */}
      {lote.description && (
        <div className="detail-card full-width">
          <h3>
            <i className="fas fa-align-left"></i> Descripción
          </h3>
          <div className="description-content">
            {lote.description.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      )}

      {/* Video (si existe) */}
      {lote.video_url && (
        <div className="detail-card full-width">
          <h3>
            <i className="fas fa-video"></i> Video del Lote
          </h3>
          <div className="video-container">
            <iframe
              src={lote.video_url.replace('watch?v=', 'embed/')}
              title="Video del lote"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}

      {/* Modal de oferta */}
      {showOfferModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Hacer Oferta</h3>
              <button 
                className="modal-close"
                onClick={() => setShowOfferModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="offer-summary">
                <h4>Resumen del Lote</h4>
                <p>{lote.animal_type} - {lote.breed}</p>
                <p>{lote.total_count} animales • {lote.average_weight} kg promedio</p>
                <p className="price-info">
                  Precio base: <strong>${lote.base_price}/kg</strong>
                </p>
              </div>

              <div className="form-group">
                <label>Tu Oferta (por kg)</label>
                <div className="price-input-wrapper">
                  <span className="price-prefix">$</span>
                  <input
                    type="number"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    min={lote.base_price * 0.5}
                    max={lote.base_price * 1.5}
                    step="0.01"
                  />
                  <span className="price-suffix">/kg</span>
                </div>
                <small>
                  Rango sugerido: ${(lote.base_price * 0.8).toFixed(2)} - ${(lote.base_price * 1.2).toFixed(2)}
                </small>
              </div>

              <div className="offer-calculations">
                <div className="calculation-row">
                  <span>Valor total de tu oferta:</span>
                  <span className="calculation-value">
                    ${(offerPrice * lote.total_count * lote.average_weight).toLocaleString('es-AR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>
                <div className="calculation-row">
                  <span>Diferencia con precio base:</span>
                  <span className={`calculation-value ${offerPrice < lote.base_price ? 'negative' : 'positive'}`}>
                    {offerPrice < lote.base_price ? '-' : '+'}$
                    {Math.abs((offerPrice - lote.base_price) * lote.total_count * lote.average_weight).toLocaleString('es-AR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setShowOfferModal(false)}
                className="btn btn-outline"
              >
                Cancelar
              </button>
              <button 
                onClick={submitOffer}
                className="btn btn-primary"
              >
                <i className="fas fa-paper-plane"></i> Enviar Oferta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de compra */}
      {showPurchaseModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Confirmar Compra</h3>
              <button 
                className="modal-close"
                onClick={() => setShowPurchaseModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="purchase-summary">
                <h4>Resumen de Compra</h4>
                <div className="summary-item">
                  <span>Producto:</span>
                  <span>{lote.animal_type} - {lote.breed}</span>
                </div>
                <div className="summary-item">
                  <span>Cantidad:</span>
                  <span>{purchaseData.quantity} animales</span>
                </div>
                <div className="summary-item">
                  <span>Peso total:</span>
                  <span>{(purchaseData.quantity * lote.average_weight).toFixed(2)} kg</span>
                </div>
                <div className="summary-item">
                  <span>Precio unitario:</span>
                  <span>${lote.base_price}/kg</span>
                </div>
                <div className="summary-item total">
                  <span>Total a pagar:</span>
                  <span>
                    ${(purchaseData.quantity * lote.average_weight * lote.base_price).toLocaleString('es-AR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label>Método de Pago</label>
                <select
                  value={purchaseData.payment_method}
                  onChange={(e) => setPurchaseData({
                    ...purchaseData,
                    payment_method: e.target.value
                  })}
                >
                  <option value="contado">Contado</option>
                  {user?.certified && (
                    <option value="credito">Crédito Bancario</option>
                  )}
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="cheque">Cheque</option>
                </select>
                {purchaseData.payment_method === 'credito' && (
                  <small>Requieres estar certificado por un banco</small>
                )}
              </div>

              <div className="form-group">
                <label>Cantidad a Comprar</label>
                <input
                  type="number"
                  value={purchaseData.quantity}
                  onChange={(e) => setPurchaseData({
                    ...purchaseData,
                    quantity: e.target.value
                  })}
                  min="1"
                  max={lote.total_count}
                />
                <small>Máximo disponible: {lote.total_count} animales</small>
              </div>

              <div className="form-group">
                <label>Notas para el vendedor (opcional)</label>
                <textarea
                  value={purchaseData.notes}
                  onChange={(e) => setPurchaseData({
                    ...purchaseData,
                    notes: e.target.value
                  })}
                  rows="3"
                  placeholder="Agrega cualquier instrucción especial o consulta..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setShowPurchaseModal(false)}
                className="btn btn-outline"
              >
                Cancelar
              </button>
              <button 
                onClick={submitPurchase}
                className="btn btn-primary"
                disabled={!purchaseData.quantity}
              >
                <i className="fas fa-check"></i> Confirmar Compra
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoteDetail;