import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from "../../services/api";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatPrice, formatWeight } from '../../utils/formatters';
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
  const [paymentTerm, setPaymentTerm] = useState('contado');
  const [customTerm, setCustomTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('transferencia');
  const [modalStep, setModalStep] = useState(1);
  const [purchaseData, setPurchaseData] = useState({
    payment_method: 'contado',
    quantity: '',
    notes: ''
  });
  const [user, setUser] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionError, setQuestionError] = useState('');
  const [hasOffer, setHasOffer] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState('');

  useEffect(() => {
    fetchLoteDetails();
    fetchQuestions();
    checkExistingOffer();
    fetchPaymentMethods();
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [id]);

  const fetchPaymentMethods = async () => {
    try {
      const response = await api.get('/payment-methods');
      setPaymentMethods(response);
      // Set default payment method if exists
      const defaultMethod = response.find(m => m.is_default);
      if (defaultMethod) {
        setSelectedPaymentMethodId(defaultMethod.id);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const checkExistingOffer = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await api.get('/offers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Check if there's a pending offer for this lote
      const offerExists = response.some(offer => 
        offer.lote_id === parseInt(id) && offer.status === 'pendiente'
      );
      
      setHasOffer(offerExists);
    } catch (error) {
      console.error('Error checking existing offer:', error);
    }
  };

  const fetchLoteDetails = async () => {
    try {
      const response = await api.getLote(id);
      
      setLote(response);
      
      // Verificar si es favorito
      if (user) {
        try {
          const favResponse = await api.get(`/favorites/check/${id}`);
          setIsFavorite(favResponse?.isFavorite || false);
        } catch (e) {
          console.log('Favorites not available yet');
        }
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
    
    if (lote.has_active_transaction) {
      alert('Este lote ya tiene una transacción en curso y no está disponible');
      return;
    }
    
    setModalStep(1);
    setOfferPrice(lote.base_price * 0.9);
    setPaymentTerm('contado');
    setCustomTerm('');
    setPaymentMethod('transferencia');
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
      // Validar que haya seleccionado un método de pago
      if (!selectedPaymentMethodId) {
        alert('Debes seleccionar un método de pago');
        return;
      }

      // Validar que si no es contado, solo se puede pagar con cheque
      if (paymentTerm !== 'contado' && paymentMethod !== 'cheque') {
        alert('Solo se acepta cheque para plazos diferentes a contado');
        return;
      }
      
      // Validar que contado no puede ser con cheque
      if (paymentTerm === 'contado' && paymentMethod === 'cheque') {
        alert('No se acepta cheque para pago al contado');
        return;
      }

      const finalPaymentTerm = paymentTerm === 'custom' ? customTerm : paymentTerm;
      
      const token = localStorage.getItem('token');
      await api.post(`/offers/${id}`, {
        offered_price: parseFloat(offerPrice),
        original_price: lote.base_price,
        payment_term: finalPaymentTerm,
        payment_method: paymentMethod,
        payment_method_id: selectedPaymentMethodId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setHasOffer(true);
      alert('Oferta enviada exitosamente');
      setShowOfferModal(false);
      setModalStep(1);
      setPaymentTerm('contado');
      setPaymentMethod('transferencia');
      setCustomTerm('');
      setSelectedPaymentMethodId('');
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

  const fetchQuestions = async () => {
    try {
      const response = await api.get(`/questions/lote/${id}`);
      setQuestions(response);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Debes iniciar sesión para hacer una pregunta');
      navigate('/login');
      return;
    }
    
    if (user.user_type !== 'comprador') {
      alert('Solo los compradores pueden hacer preguntas');
      return;
    }
    
    if (!newQuestion.trim()) {
      setQuestionError('La pregunta no puede estar vacía');
      return;
    }
    
    setLoadingQuestions(true);
    setQuestionError('');
    
    try {
      const token = localStorage.getItem('token');
      await api.post(`/questions/lote/${id}`, {
        question_text: newQuestion
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNewQuestion('');
      await fetchQuestions();
      alert('Pregunta enviada exitosamente');
    } catch (error) {
      console.error('Error submitting question:', error);
      setQuestionError(error.response?.data?.error || 'Error al enviar la pregunta');
    } finally {
      setLoadingQuestions(false);
    }
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
            <span className={`status-badge status-${lote.status}`}>
              {lote.status === 'ofertado' ? 'Disponible' : 
               lote.status === 'completo' ? 'Vendido' :
               lote.status === 'cancelado' ? 'Cancelado' :
               lote.status === 'borrador' ? 'Borrador' :
               lote.status}
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
            <button 
              onClick={hasOffer || lote.has_active_transaction ? null : handleMakeOffer} 
              className={`btn ${hasOffer || lote.has_active_transaction ? 'btn-secondary' : 'btn-primary'}`}
              disabled={hasOffer || lote.has_active_transaction}
              style={{ cursor: hasOffer || lote.has_active_transaction ? 'not-allowed' : 'pointer' }}
            >
              <i className={`fas fa-${hasOffer ? 'clock' : lote.has_active_transaction ? 'ban' : 'handshake'}`}></i> 
              {hasOffer ? ' Oferta Pendiente' : lote.has_active_transaction ? ' No Disponible' : ' Hacer Oferta'}
            </button>
          )}
        </div>
      </div>

      {/* Galería de imágenes */}
      {lote.photos && lote.photos.length > 0 && (
        <div className="image-gallery">
          <div className="main-image" onClick={() => {
            setShowImageModal(true);
            setModalImageIndex(activeImage);
          }}>
            <img 
              src={`http://localhost:5000${lote.photos[activeImage]}`}
              alt={`Lote ${lote.id} - ${activeImage + 1}`}
              style={{ cursor: 'pointer', objectFit: 'contain', width: '100%', height: '500px', backgroundColor: '#f5f5f5' }}
            />
            <div style={{ 
              position: 'absolute', 
              bottom: '10px', 
              right: '10px', 
              background: 'rgba(0,0,0,0.6)', 
              color: 'white', 
              padding: '5px 10px', 
              borderRadius: '5px',
              fontSize: '14px'
            }}>
              🔍 Click para ampliar
            </div>
          </div>
          <div className="thumbnail-list">
            {lote.photos.map((photo, index) => (
              <div 
                key={index}
                className={`thumbnail ${index === activeImage ? 'active' : ''}`}
                onClick={() => setActiveImage(index)}
                style={{ cursor: 'pointer' }}
              >
                <img 
                  src={`http://localhost:5000${photo}`} 
                  alt={`Thumbnail ${index + 1}`}
                  style={{ objectFit: 'cover', width: '100%', height: '80px' }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de imagen ampliada */}
      {showImageModal && lote.photos && (
        <div 
          className="image-modal-overlay" 
          onClick={() => setShowImageModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'zoom-out'
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowImageModal(false);
            }}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              fontSize: '24px',
              cursor: 'pointer',
              zIndex: 10000
            }}
          >
            ×
          </button>
          
          {modalImageIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setModalImageIndex(modalImageIndex - 1);
              }}
              style={{
                position: 'absolute',
                left: '20px',
                background: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                fontSize: '24px',
                cursor: 'pointer',
                zIndex: 10000
              }}
            >
              ‹
            </button>
          )}
          
          <img
            src={`http://localhost:5000${lote.photos[modalImageIndex]}`}
            alt={`Lote ${lote.id} - Imagen ${modalImageIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain',
              cursor: 'default'
            }}
          />
          
          {modalImageIndex < lote.photos.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setModalImageIndex(modalImageIndex + 1);
              }}
              style={{
                position: 'absolute',
                right: '20px',
                background: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                fontSize: '24px',
                cursor: 'pointer',
                zIndex: 10000
              }}
            >
              ›
            </button>
          )}
          
          <div style={{
            position: 'absolute',
            bottom: '20px',
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '10px 20px',
            borderRadius: '20px',
            fontSize: '16px'
          }}>
            {modalImageIndex + 1} / {lote.photos.length}
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
                <span className="summary-icon">🐄</span>
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
                <span className="summary-icon">⚖️</span>
                <div className="summary-content">
                  <span className="summary-label">Peso Total</span>
                  <span className="summary-value">
                    {formatWeight(lote.total_count * lote.average_weight)}
                  </span>
                  <span className="summary-subtext">
                    {formatWeight(lote.average_weight)} promedio
                  </span>
                </div>
              </div>

              <div className="summary-item">
                <span className="summary-icon">💰</span>
                <div className="summary-content">
                  <span className="summary-label">Valor Estimado</span>
                  <span className="summary-value">
                    {formatPrice(calculateTotalValue())}
                  </span>
                  <span className="summary-subtext">
                    {formatPrice(lote.base_price)} por kg
                  </span>
                </div>
              </div>

              <div className="summary-item">
                <span className="summary-icon">🌾</span>
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
          </div>

          {/* Acciones rápidas */}
          <div className="detail-card actions-card">
            <h3>
              <i className="fas fa-bolt"></i> Acciones Rápidas
            </h3>
            <div className="quick-actions">
              {user?.user_type === 'comprador' && lote.status === 'ofertado' && (
                <button 
                  onClick={hasOffer || lote.has_active_transaction ? null : handleMakeOffer} 
                  className={`btn ${hasOffer || lote.has_active_transaction ? 'btn-secondary' : 'btn-primary'} btn-block`}
                  disabled={hasOffer || lote.has_active_transaction}
                  style={{ cursor: hasOffer || lote.has_active_transaction ? 'not-allowed' : 'pointer', opacity: hasOffer || lote.has_active_transaction ? 0.7 : 1 }}
                >
                  <i className={`fas fa-${hasOffer ? 'clock' : lote.has_active_transaction ? 'ban' : 'handshake'}`}></i> 
                  {hasOffer ? ' Oferta Pendiente' : lote.has_active_transaction ? ' No Disponible' : ' Hacer Oferta'}
                </button>
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

      {/* Sección de Consultas */}
      <div className="detail-card full-width">
        <h3>
          <i className="fas fa-comments"></i> Consultas ({questions.length})
        </h3>
        
        {/* Formulario para hacer preguntas */}
        {user?.user_type === 'comprador' && lote.status === 'ofertado' && (
          <div className="question-form">
            <h4>Hacer una consulta</h4>
            <p className="form-hint">
              Haz preguntas sobre el lote. <strong>No está permitido compartir información de contacto</strong> (email, teléfono, WhatsApp).
            </p>
            <form onSubmit={handleSubmitQuestion}>
              <div className="form-group">
                <textarea
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Escribe tu pregunta aquí..."
                  rows="4"
                  maxLength="1000"
                  disabled={loadingQuestions}
                />
                <small className="char-count">
                  {newQuestion.length}/1000 caracteres
                </small>
              </div>
              {questionError && (
                <div className="error-message" style={{ color: '#d32f2f', marginBottom: '10px', fontSize: '14px' }}>
                  {questionError}
                </div>
              )}
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loadingQuestions || !newQuestion.trim()}
              >
                {loadingQuestions ? 'Enviando...' : 'Enviar Pregunta'}
              </button>
            </form>
          </div>
        )}

        {/* Lista de preguntas y respuestas */}
        <div className="questions-list">
          {questions.length === 0 ? (
            <div className="empty-questions">
              <i className="fas fa-question-circle" style={{ fontSize: '48px', color: '#ccc', marginBottom: '10px' }}></i>
              <p>Aún no hay consultas sobre este lote</p>
              <p className="hint-text">Sé el primero en hacer una pregunta</p>
            </div>
          ) : (
            questions.map((question) => (
              <div key={question.id} className="question-item">
                <div className="question-header">
                  <div className="question-author">
                    <i className="fas fa-user-circle"></i>
                    <span className="author-name">{question.buyer_name}</span>
                  </div>
                  <span className="question-date">
                    {format(new Date(question.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </span>
                </div>
                <div className="question-text">
                  <strong>Pregunta:</strong> {question.question_text}
                </div>
                
                {/* Respuestas */}
                {question.answers && question.answers.length > 0 && (
                  <div className="answers-list">
                    {question.answers.map((answer) => (
                      <div key={answer.id} className="answer-item">
                        <div className="answer-header">
                          <div className="answer-author">
                            <i className="fas fa-store"></i>
                            <span className="author-name">{answer.seller_name} <span className="vendor-badge">Vendedor</span></span>
                          </div>
                          <span className="answer-date">
                            {format(new Date(answer.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </span>
                        </div>
                        <div className="answer-text">
                          <strong>Respuesta:</strong> {answer.answer_text}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {question.answers.length === 0 && (
                  <div className="no-answer">
                    <i className="fas fa-clock"></i> Esperando respuesta del vendedor
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Video (si existe) */}
      {lote.video_url && (
        <div className="detail-card full-width">
          <h3>
            <i className="fas fa-video"></i> Video del Lote
          </h3>
          <div className="video-container">
            {lote.video_url.includes('youtube.com') || lote.video_url.includes('youtu.be') ? (
              <iframe
                src={lote.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                title="Video del lote"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <video controls>
                <source src={`http://localhost:5000${lote.video_url}`} type="video/mp4" />
                Tu navegador no soporta el elemento de video.
              </video>
            )}
          </div>
        </div>
      )}

      {/* Modal de oferta */}
      {showOfferModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Hacer Oferta {modalStep === 2 && '- Medio de Pago'}</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowOfferModal(false);
                  setModalStep(1);
                }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              {modalStep === 1 && (
                <>
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
                      Rango sugerido: {formatPrice(lote.base_price * 0.8)} - {formatPrice(lote.base_price * 1.2)}
                    </small>
                  </div>

                  <div className="form-group">
                    <label>Plazo de Pago</label>
                    <select
                      value={paymentTerm}
                      onChange={(e) => setPaymentTerm(e.target.value)}
                      className="form-control"
                    >
                      <option value="contado">Contado</option>
                      <option value="30">30 días</option>
                      <option value="30-60">30-60 días</option>
                      <option value="custom">Otro (especificar)</option>
                    </select>
                  </div>

                  {paymentTerm === 'custom' && (
                    <div className="form-group">
                      <label>Especificar Plazo</label>
                      <input
                        type="text"
                        value={customTerm}
                        onChange={(e) => setCustomTerm(e.target.value)}
                        className="form-control"
                        placeholder="Ej: 45 días, 60-90 días"
                      />
                    </div>
                  )}

                  <div className="offer-calculations">
                    <div className="calculation-row">
                      <span>Valor total de tu oferta:</span>
                      <span className="calculation-value">
                        {formatPrice(offerPrice * lote.total_count * lote.average_weight)}
                      </span>
                    </div>
                    <div className="calculation-row">
                      <span>Diferencia con precio base:</span>
                      <span className={`calculation-value ${offerPrice < lote.base_price ? 'negative' : 'positive'}`}>
                        {offerPrice < lote.base_price ? '-' : '+'}
                        {formatPrice(Math.abs((offerPrice - lote.base_price) * lote.total_count * lote.average_weight))}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {modalStep === 2 && (
                <>
                  <div className="offer-summary">
                    <h4>Resumen de tu Oferta</h4>
                    <p><strong>Precio:</strong> {formatPrice(offerPrice)}/kg</p>
                    <p><strong>Plazo:</strong> {paymentTerm === 'custom' ? customTerm : paymentTerm === 'contado' ? 'Contado' : paymentTerm + ' días'}</p>
                    <p><strong>Total:</strong> {formatPrice(offerPrice * lote.total_count * lote.average_weight)}</p>
                  </div>

                  <div className="form-group">
                    <label>Medio de Pago</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="form-control"
                    >
                      {paymentTerm === 'contado' ? (
                        <>
                          <option value="transferencia">Transferencia Bancaria</option>
                          <option value="tarjeta">Tarjeta de Crédito</option>
                          <option value="cheque">Cheque</option>
                        </>
                      ) : (
                        <option value="cheque">Cheque</option>
                      )}
                    </select>
                    {paymentTerm !== 'contado' && (
                      <small className="text-muted">
                        Para plazos diferentes a contado solo se acepta cheque
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Seleccionar Método de Pago Registrado *</label>
                    {paymentMethods.length > 0 ? (
                      <select
                        value={selectedPaymentMethodId}
                        onChange={(e) => setSelectedPaymentMethodId(e.target.value)}
                        className="form-control"
                        required
                      >
                        <option value="">Selecciona un método</option>
                        {paymentMethods
                          .filter(pm => {
                            // Filter by payment type
                            if (paymentMethod === 'transferencia') return pm.payment_type === 'bank_transfer';
                            if (paymentMethod === 'tarjeta') return pm.payment_type === 'credit_card';
                            if (paymentMethod === 'cheque') return pm.payment_type === 'check';
                            return false;
                          })
                          .map(pm => {
                            let label = '';
                            if (pm.payment_type === 'bank_transfer') {
                              label = `${pm.bank_name} - ${pm.cbu?.slice(-4) || 'N/A'}`;
                            } else if (pm.payment_type === 'credit_card') {
                              label = `${pm.card_brand?.toUpperCase()} **** ${pm.card_number_last4}`;
                            } else if (pm.payment_type === 'check') {
                              label = `${pm.check_bank_name} - ${pm.check_issuer_name}`;
                            }
                            return (
                              <option key={pm.id} value={pm.id}>
                                {label} {pm.is_default ? '(Predeterminado)' : ''}
                              </option>
                            );
                          })}
                      </select>
                    ) : (
                      <div className="alert alert-warning">
                        No tienes métodos de pago registrados. 
                        <a href="/comprador/medios-pago" target="_blank"> Agregar método de pago</a>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              {modalStep === 2 && (
                <button 
                  onClick={() => setModalStep(1)}
                  className="btn btn-outline"
                >
                  <i className="fas fa-arrow-left"></i> Volver
                </button>
              )}
              <button 
                onClick={() => {
                  setShowOfferModal(false);
                  setModalStep(1);
                }}
                className="btn btn-outline"
              >
                Cancelar
              </button>
              {modalStep === 1 && (
                <button 
                  onClick={() => setModalStep(2)}
                  className="btn btn-primary"
                  disabled={!offerPrice || (paymentTerm === 'custom' && !customTerm)}
                >
                  Continuar <i className="fas fa-arrow-right"></i>
                </button>
              )}
              {modalStep === 2 && (
                <button 
                  onClick={submitOffer}
                  className="btn btn-primary"
                >
                  <i className="fas fa-paper-plane"></i> Enviar Oferta
                </button>
              )}
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
                  <span>{formatWeight(purchaseData.quantity * lote.average_weight)}</span>
                </div>
                <div className="summary-item">
                  <span>Precio unitario:</span>
                  <span>{formatPrice(lote.base_price)}/kg</span>
                </div>
                <div className="summary-item total">
                  <span>Total a pagar:</span>
                  <span>
                    {formatPrice(purchaseData.quantity * lote.average_weight * lote.base_price)}
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