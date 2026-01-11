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

  useEffect(() => {
    const fetchLoteDetails = async () => {
      try {
        const response = await api.getLote(id);
        setLote(response);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching lote details:', error);
        setLoading(false);
      }
    };

    fetchLoteDetails();
  }, [id]);

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

  const photos = Array.isArray(lote.photos) ? lote.photos : [];
  const API_BASE_URL = 'http://localhost:5000';

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
          <Link to={`/vendedor/editar/${id}`} className="btn btn-outline">
            ✏️ Editar
          </Link>
          <button onClick={handleDelete} className="btn btn-danger">
            🗑️ Eliminar
          </button>
        </div>
      </div>

      <div className="detail-content">
        <div className="media-section">
          {photos.length > 0 ? (
            <>
              <div className="main-image">
                <img src={`${API_BASE_URL}${photos[activeImage]}`} alt={`Lote ${lote.id}`} />
              </div>
              <div className="image-thumbnails">
                {photos.map((photo, index) => (
                  <img
                    key={index}
                    src={`${API_BASE_URL}${photo}`}
                    alt={`Thumbnail ${index + 1}`}
                    className={activeImage === index ? 'active' : ''}
                    onClick={() => setActiveImage(index)}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="no-images">
              <span>📷</span>
              <p>Sin imágenes</p>
            </div>
          )}

          {lote.video_url && (
            <div className="video-section">
              <h3>Video del Lote</h3>
              <video controls src={lote.video_url} />
            </div>
          )}
        </div>

        <div className="info-section">
          <div className="info-card">
            <h2>Información General</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Tipo de Animal:</span>
                <span className="value">{lote.animal_type}</span>
              </div>
              <div className="info-item">
                <span className="label">Raza:</span>
                <span className="value">{lote.breed}</span>
              </div>
              <div className="info-item">
                <span className="label">Cantidad Total:</span>
                <span className="value">{lote.total_count} animales</span>
              </div>
              <div className="info-item">
                <span className="label">Peso Promedio:</span>
                <span className="value">{lote.average_weight} kg</span>
              </div>
              <div className="info-item">
                <span className="label">Peso Total:</span>
                <span className="value">{lote.total_weight} kg</span>
              </div>
              <div className="info-item">
                <span className="label">Precio Base:</span>
                <span className="value">${lote.base_price}/kg</span>
              </div>
              <div className="info-item">
                <span className="label">Ubicación:</span>
                <span className="value">{lote.location}</span>
              </div>
              <div className="info-item">
                <span className="label">Fecha de Publicación:</span>
                <span className="value">
                  {format(new Date(lote.created_at), "d 'de' MMMM 'de' yyyy", { locale: es })}
                </span>
              </div>
            </div>
          </div>

          {lote.description && (
            <div className="info-card">
              <h2>Descripción</h2>
              <p>{lote.description}</p>
            </div>
          )}

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
