import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from "../../services/api";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import '../../styles/forms.css';

export default function LoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lote, setLote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [newPhotos, setNewPhotos] = useState([]);
  const [photoURLs, setPhotoURLs] = useState([]);
  const [photosToKeep, setPhotosToKeep] = useState([]); // URLs de fotos existentes que se mantienen
  const [newVideoURL, setNewVideoURL] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answerText, setAnswerText] = useState({});
  const [loadingAnswer, setLoadingAnswer] = useState({});
  const [answerError, setAnswerError] = useState({});

  const uniformityOptions = [
    { value: 'poco_uniforme', label: 'Poco uniforme' },
    { value: 'uniformidad_media', label: 'Uniformidad media' },
    { value: 'bastante_uniforme', label: 'Bastante uniforme' },
    { value: 'completamente_uniforme', label: 'Completamente uniforme' }
  ];

  const getUniformityLabel = (value) => {
    const option = uniformityOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  useEffect(() => {
    const fetchLoteDetails = async () => {
      try {
        const response = await api.getLote(id);
        setLote(response);
        const existingPhotos = response.photos || [];
        setPhotoURLs(existingPhotos);
        setPhotosToKeep(existingPhotos); // Inicialmente, se mantienen todas
        setEditForm({
          animal_type: response.animal_type || '',
          breed: response.breed || '',
          total_count: response.total_count || '',
          average_weight: response.average_weight || '',
          base_price: response.base_price || '',
          location: response.location || '',
          city: response.city || '',
          province: response.province || '',
          description: response.description || '',
          video_url: response.video_url || '',
          uniformity: response.uniformity || 'uniformidad_media'
        });
        setNewVideoURL(response.video_url || '');
        setLoading(false);
      } catch (error) {
        console.error('Error fetching lote details:', error);
        setLoading(false);
      }
    };

    const fetchQuestions = async () => {
      try {
        const response = await api.get(`/questions/lote/${id}`);
        setQuestions(response);
      } catch (error) {
        console.error('Error fetching questions:', error);
      }
    };

    fetchLoteDetails();
    fetchQuestions();
  }, [id]);

  const handleSubmitAnswer = async (questionId) => {
    const answer = answerText[questionId];
    
    if (!answer || !answer.trim()) {
      setAnswerError({ ...answerError, [questionId]: 'La respuesta no puede estar vacía' });
      return;
    }
    
    setLoadingAnswer({ ...loadingAnswer, [questionId]: true });
    setAnswerError({ ...answerError, [questionId]: '' });
    
    try {
      const token = localStorage.getItem('token');
      await api.post(`/questions/${questionId}/answer`, {
        answer_text: answer
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Clear answer text and reload questions
      setAnswerText({ ...answerText, [questionId]: '' });
      
      // Refetch questions to show the new answer
      const response = await api.get(`/questions/lote/${id}`);
      setQuestions(response);
      
      alert('Respuesta enviada exitosamente');
    } catch (error) {
      console.error('Error submitting answer:', error);
      setAnswerError({ 
        ...answerError, 
        [questionId]: error.response?.data?.error || 'Error al enviar la respuesta' 
      });
    } finally {
      setLoadingAnswer({ ...loadingAnswer, [questionId]: false });
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Restaurar valores originales
    const existingPhotos = lote.photos || [];
    setPhotoURLs(existingPhotos);
    setPhotosToKeep(existingPhotos);
    setNewPhotos([]);
    setEditForm({
      animal_type: lote.animal_type || '',
      breed: lote.breed || '',
      total_count: lote.total_count || '',
      average_weight: lote.average_weight || '',
      base_price: lote.base_price || '',
      location: lote.location || '',
      city: lote.city || '',
      province: lote.province || '',
      description: lote.description || '',
      video_url: lote.video_url || '',
      uniformity: lote.uniformity || 'uniformidad_media'
    });
    setNewVideoURL(lote.video_url || '');
  };

  const handleSaveEdit = async () => {
    try {
      // Si hay cambios en las fotos, usar FormData
      if (newPhotos.length > 0 || photosToKeep.length !== (lote.photos || []).length) {
        const formData = new FormData();
        
        // Agregar todos los campos editables
        Object.keys(editForm).forEach(key => {
          if (editForm[key] !== null && editForm[key] !== undefined) {
            formData.append(key, editForm[key]);
          }
        });
        
        // Agregar video URL
        formData.append('video_url', newVideoURL);
        
        // Agregar nuevas fotos
        newPhotos.forEach(photo => {
          formData.append('photos', photo);
        });
        
        // Agregar fotos existentes que se mantienen (como string JSON)
        formData.append('existing_photos', JSON.stringify(photosToKeep));
        
        // Enviar con FormData
        const response = await fetch(`http://localhost:5000/api/lotes/${id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });
        
        if (!response.ok) throw new Error('Error al actualizar');
        
        const updatedLote = await response.json();
        setLote(updatedLote.lote || updatedLote);
      } else {
        // Si no hay cambios en fotos, usar el método normal
        const updateData = { ...editForm, video_url: newVideoURL };
        const updatedLote = await api.updateLote(id, updateData);
        setLote({ ...lote, ...updatedLote });
      }
      
      setIsEditing(false);
      alert('Lote actualizado exitosamente');
      
      // Refrescar los datos sin recargar la página
      const refreshedLote = await api.getLote(id);
      setLote(refreshedLote);
      setPhotoURLs(refreshedLote.photos || []);
      setPhotosToKeep(refreshedLote.photos || []);
      setNewPhotos([]);
      setEditForm({
        animal_type: refreshedLote.animal_type || '',
        breed: refreshedLote.breed || '',
        total_count: refreshedLote.total_count || '',
        average_weight: refreshedLote.average_weight || '',
        base_price: refreshedLote.base_price || '',
        location: refreshedLote.location || '',
        city: refreshedLote.city || '',
        province: refreshedLote.province || '',
        description: refreshedLote.description || '',
        video_url: refreshedLote.video_url || '',
        uniformity: refreshedLote.uniformity || 'uniformidad_media'
      });
    } catch (error) {
      console.error('Error updating lote:', error);
      alert('Error al actualizar el lote: ' + error.message);
    }
  };

  const handleEditFormChange = (field, value) => {
    setEditForm({ ...editForm, [field]: value });
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    setNewPhotos([...newPhotos, ...files]);
    
    // Crear URLs de preview
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoURLs(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (index) => {
    const photoToRemove = photoURLs[index];
    
    // Remover de la vista
    setPhotoURLs(photoURLs.filter((_, i) => i !== index));
    
    // Si es una foto existente del servidor (no es un data: URL de preview)
    if (!photoToRemove.startsWith('data:')) {
      // Remover de las fotos que se mantendrán
      setPhotosToKeep(photosToKeep.filter(p => p !== photoToRemove));
    } else {
      // Si es una foto nueva (data: URL), remover del array de nuevas fotos
      // Contar cuántas fotos de preview hay antes de este índice
      const dataUrlsBefore = photoURLs.slice(0, index).filter(p => p.startsWith('data:')).length;
      setNewPhotos(newPhotos.filter((_, i) => i !== dataUrlsBefore));
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!window.confirm(`¿Cambiar estado a "${newStatus}"?`)) return;

    try {
      await api.updateLote(id, { status: newStatus });
      setLote({ ...lote, status: newStatus });
      alert('Estado actualizado exitosamente');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al actualizar el estado');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de eliminar este lote? Esta acción no se puede deshacer.')) return;

    try {
      await api.deleteLote(id);
      alert('Lote eliminado exitosamente');
      navigate('/vendedor/mis-lotes');
    } catch (error) {
      console.error('Error deleting lote:', error);
      alert('Error al eliminar el lote');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'ofertado': { label: 'Ofertado', class: 'badge-warning' },
      'completo': { label: 'Completo', class: 'badge-success' },
      'cancelado': { label: 'Cancelado', class: 'badge-danger' }
    };
    const badge = badges[status] || { label: status, class: 'badge-default' };
    return <span className={`status-badge ${badge.class}`}>{badge.label}</span>;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando detalles del lote...</p>
      </div>
    );
  }

  if (!lote) {
    return (
      <div className="error-container">
        <h2>Lote no encontrado</h2>
        <Link to="/vendedor/mis-lotes" className="btn btn-primary">
          Volver a Mis Lotes
        </Link>
      </div>
    );
  }

  const API_BASE_URL = 'http://localhost:5000';
  
  // Cálculos
  const totalWeight = (lote.total_count || 0) * (lote.average_weight || 0);
  const totalValue = totalWeight * (lote.base_price || 0);

  return (
    <div className="lote-detail-container">
      <div className="detail-header">
        <button onClick={() => navigate('/vendedor/mis-lotes')} className="btn btn-outline">
          ← Volver
        </button>
        <div className="header-info">
          <h1>Lote #{lote.id}</h1>
          {getStatusBadge(lote.status)}
        </div>
        <div className="header-actions">
          {!isEditing ? (
            <>
              <button onClick={handleEdit} className="btn btn-outline">
                ✏️ Editar
              </button>
              <button onClick={handleDelete} className="btn btn-danger">
                🗑️ Eliminar
              </button>
            </>
          ) : (
            <>
              <button onClick={handleCancelEdit} className="btn btn-outline">
                ✖️ Cancelar
              </button>
              <button onClick={handleSaveEdit} className="btn btn-primary">
                ✔️ Guardar
              </button>
            </>
          )}
        </div>
      </div>

      <div className="detail-content">
        <div className="media-section">
          {isEditing && (
            <div className="photo-upload-section">
              <h3>Gestionar Fotos</h3>
              <input 
                type="file" 
                accept="image/*" 
                multiple 
                onChange={handlePhotoUpload}
                className="file-input"
                id="photo-upload"
              />
              <label htmlFor="photo-upload" className="btn btn-secondary">
                📷 Agregar Fotos
              </label>
              <p className="help-text">Puedes agregar múltiples fotos. Las actuales se mantendrán.</p>
            </div>
          )}

          {photoURLs.length > 0 ? (
            <>
              <div className="main-image">
                <img 
                  src={photoURLs[activeImage].startsWith('data:') 
                    ? photoURLs[activeImage] 
                    : `${API_BASE_URL}${photoURLs[activeImage]}`
                  } 
                  alt={`Lote ${lote.id}`} 
                />
              </div>
              <div className="image-thumbnails">
                {photoURLs.map((photo, index) => (
                  <div key={index} className="thumbnail-wrapper">
                    <img
                      src={photo.startsWith('data:') ? photo : `${API_BASE_URL}${photo}`}
                      alt={`Thumbnail ${index + 1}`}
                      className={activeImage === index ? 'active' : ''}
                      onClick={() => setActiveImage(index)}
                    />
                    {isEditing && (
                      <button 
                        className="remove-photo-btn"
                        onClick={() => handleRemovePhoto(index)}
                        title="Eliminar foto"
                      >
                        ✖
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="no-images">
              <span>📷</span>
              <p>Sin imágenes</p>
              {isEditing && (
                <label htmlFor="photo-upload" className="btn btn-primary">
                  Agregar Primera Foto
                </label>
              )}
            </div>
          )}

          <div className="video-section">
            <h3>Video del Lote</h3>
            {isEditing ? (
              <div className="video-edit">
                <label>URL del Video:</label>
                <input 
                  type="url" 
                  value={newVideoURL}
                  onChange={(e) => setNewVideoURL(e.target.value)}
                  placeholder="https://youtube.com/... o URL directa"
                  className="edit-input"
                />
                {newVideoURL && (
                  <video controls src={newVideoURL} className="video-preview" />
                )}
              </div>
            ) : lote.video_url ? (
              <video controls src={lote.video_url} />
            ) : (
              <div className="no-images">
                <span>🎥</span>
                <p>Sin video</p>
              </div>
            )}
          </div>
        </div>

        <div className="info-section">
          <div className="info-card">
            <h2>Información General</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Tipo de Animal:</span>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editForm.animal_type}
                    onChange={(e) => handleEditFormChange('animal_type', e.target.value)}
                    className="edit-input"
                  />
                ) : (
                  <span className="value">{lote.animal_type}</span>
                )}
              </div>
              <div className="info-item">
                <span className="label">Raza:</span>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editForm.breed}
                    onChange={(e) => handleEditFormChange('breed', e.target.value)}
                    className="edit-input"
                  />
                ) : (
                  <span className="value">{lote.breed}</span>
                )}
              </div>
              <div className="info-item">
                <span className="label">Uniformidad:</span>
                {isEditing ? (
                  <select
                    value={editForm.uniformity}
                    onChange={(e) => handleEditFormChange('uniformity', e.target.value)}
                    className="edit-input"
                  >
                    {uniformityOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="value">{getUniformityLabel(lote.uniformity)}</span>
                )}
              </div>
              <div className="info-item">
                <span className="label">Cantidad Total:</span>
                {isEditing ? (
                  <input 
                    type="number" 
                    value={editForm.total_count}
                    onChange={(e) => handleEditFormChange('total_count', e.target.value)}
                    className="edit-input"
                  />
                ) : (
                  <span className="value">{lote.total_count} animales</span>
                )}
              </div>
              <div className="info-item">
                <span className="label">Peso Promedio:</span>
                {isEditing ? (
                  <input 
                    type="number" 
                    value={editForm.average_weight}
                    onChange={(e) => handleEditFormChange('average_weight', e.target.value)}
                    className="edit-input"
                  />
                ) : (
                  <span className="value">{lote.average_weight} kg</span>
                )}
              </div>
              <div className="info-item">
                <span className="label">Peso Total:</span>
                <span className="value">{totalWeight.toFixed(2)} kg</span>
              </div>
              <div className="info-item">
                <span className="label">Precio Base:</span>
                {isEditing ? (
                  <input 
                    type="number" 
                    value={editForm.base_price}
                    onChange={(e) => handleEditFormChange('base_price', e.target.value)}
                    className="edit-input"
                  />
                ) : (
                  <span className="value">${lote.base_price}/kg</span>
                )}
              </div>
              <div className="info-item">
                <span className="label">Valor Total del Lote:</span>
                <span className="value">${totalValue.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="info-item">
                <span className="label">Ubicación:</span>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editForm.location}
                    onChange={(e) => handleEditFormChange('location', e.target.value)}
                    placeholder="Estancia o Localidad"
                    className="edit-input"
                  />
                ) : (
                  <span className="value">{lote.location}</span>
                )}
              </div>
              {(lote.province || isEditing) && (
                <div className="info-item">
                  <span className="label">Provincia:</span>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={editForm.province}
                      onChange={(e) => handleEditFormChange('province', e.target.value)}
                      placeholder="Provincia"
                      className="edit-input"
                    />
                  ) : (
                    <span className="value">{lote.province}</span>
                  )}
                </div>
              )}
              <div className="info-item">
                <span className="label">Fecha de Publicación:</span>
                <span className="value">
                  {format(new Date(lote.created_at), "d 'de' MMMM 'de' yyyy", { locale: es })}
                </span>
              </div>
            </div>
          </div>

          {(lote.description || isEditing) && (
            <div className="info-card">
              <h2>Descripción</h2>
              {isEditing ? (
                <textarea 
                  value={editForm.description}
                  onChange={(e) => handleEditFormChange('description', e.target.value)}
                  className="edit-textarea"
                  rows="5"
                />
              ) : (
                <p>{lote.description}</p>
              )}
            </div>
          )}

          {/* Sección de Consultas */}
          <div className="info-card">
            <h2>Consultas de Compradores ({questions.length})</h2>
            
            <div className="questions-list">
              {questions.length === 0 ? (
                <div className="empty-questions">
                  <i className="fas fa-question-circle" style={{ fontSize: '48px', color: '#ccc', marginBottom: '10px' }}></i>
                  <p>Aún no hay consultas sobre este lote</p>
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
                    
                    {/* Respuestas existentes */}
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
                    
                    {/* Formulario para responder */}
                    {question.answers.length === 0 && (
                      <div className="answer-form">
                        <h4>Responder</h4>
                        <p className="form-hint">
                          <strong>No está permitido compartir información de contacto</strong> (email, teléfono, WhatsApp).
                        </p>
                        <textarea
                          value={answerText[question.id] || ''}
                          onChange={(e) => setAnswerText({ ...answerText, [question.id]: e.target.value })}
                          placeholder="Escribe tu respuesta aquí..."
                          rows="3"
                          maxLength="1000"
                          disabled={loadingAnswer[question.id]}
                        />
                        <small className="char-count">
                          {(answerText[question.id] || '').length}/1000 caracteres
                        </small>
                        {answerError[question.id] && (
                          <div className="error-message" style={{ color: '#d32f2f', marginTop: '5px', fontSize: '14px' }}>
                            {answerError[question.id]}
                          </div>
                        )}
                        <button 
                          onClick={() => handleSubmitAnswer(question.id)}
                          className="btn btn-primary"
                          disabled={loadingAnswer[question.id] || !(answerText[question.id] || '').trim()}
                          style={{ marginTop: '10px' }}
                        >
                          {loadingAnswer[question.id] ? 'Enviando...' : 'Enviar Respuesta'}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="info-card">
            <h2>Cambiar Estado</h2>
            <select 
              value={lote.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="status-select-large"
            >
              <option value="ofertado">Ofertado</option>
              <option value="completo">Completo</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
