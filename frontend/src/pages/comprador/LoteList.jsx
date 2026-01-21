import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from "../../services/api";
import { 
  ShoppingCart, 
  Filter, 
  RefreshCw,
  Eye,
  MapPin,
  DollarSign,
  Calendar,
  Package
} from "lucide-react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatPrice, formatWeight } from '../../utils/formatters';
import '../../styles/dashboard.css';

export default function LoteList() {
  const [lotes, setLotes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [myOffers, setMyOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'favorites'
  const [filters, setFilters] = useState({
    localidad: '',
    provincia: '',
    animal_type: '',
    min_price: '',
    max_price: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  const fetchLotes = async () => {
    try {
      const response = await api.getLotes();
      setLotes(Array.isArray(response) ? response : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching lotes:', error);
      setLotes([]);
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await api.get('/favorites', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavorites(Array.isArray(response) ? response : []);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setFavorites([]);
    }
  };

  const fetchMyOffers = async () => {
    try {
      const response = await api.getMyOffers();
      setMyOffers(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching my offers:', error);
      setMyOffers([]);
    }
  };

  useEffect(() => {
    fetchLotes();
    fetchFavorites();
    fetchMyOffers();
  }, []);

  const filteredLotes = (activeTab === 'all' ? lotes : favorites).filter(lote => {
    // Solo mostrar lotes ofertados
    if (lote.status !== 'ofertado') return false;

    // Filtrar por localidad
    if (filters.localidad && !lote.location.toLowerCase().includes(filters.localidad.toLowerCase())) {
      return false;
    }

    // Filtrar por provincia
    if (filters.provincia && !lote.location.toLowerCase().includes(filters.provincia.toLowerCase())) {
      return false;
    }

    if (filters.animal_type && lote.animal_type !== filters.animal_type) {
      return false;
    }

    if (filters.min_price && lote.base_price < parseFloat(filters.min_price)) {
      return false;
    }

    if (filters.max_price && lote.base_price > parseFloat(filters.max_price)) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    const aValue = a[filters.sort_by];
    const bValue = b[filters.sort_by];
    
    if (filters.sort_order === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleRefresh = () => {
    setLoading(true);
    fetchLotes();
    fetchFavorites();
    fetchMyOffers();
  };

  const resetFilters = () => {
    setFilters({
      localidad: '',
      provincia: '',
      animal_type: '',
      min_price: '',
      max_price: '',
      sort_by: 'created_at',
      sort_order: 'desc'
    });
  };

  const getStatusBadge = (status, loteId) => {
    // Verificar si el comprador tiene una oferta pendiente en este lote
    const hasOffer = myOffers.some(offer => 
      offer.lote_id === loteId && 
      (offer.status === 'pendiente' || offer.status === 'counter_offered')
    );
    
    if (hasOffer) {
      return <span className="status-badge badge-warning">Oferta Pendiente</span>;
    }
    
    const badges = {
      'ofertado': { label: 'Disponible', class: 'badge-success' },
      'completo': { label: 'Vendido', class: 'badge-default' },
      'cancelado': { label: 'No disponible', class: 'badge-danger' }
    };
    const badge = badges[status] || { label: status, class: 'badge-default' };
    return <span className={`status-badge ${badge.class}`}>{badge.label}</span>;
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando lotes disponibles...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <h1>
          <ShoppingCart size={32} />
          Lotes Disponibles
        </h1>
        <div className="header-actions">
          <button 
            className="btn btn-secondary"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw size={20} className={loading ? "spin" : ""} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button 
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          Todos los Lotes ({lotes.filter(l => l.status === 'ofertado').length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          Mis Favoritos ({favorites.filter(l => l.status === 'ofertado').length})
        </button>
      </div>

      {/* Filtros */}
      <div className="filters-container">
        <div className="filters-header">
          <Filter size={20} />
          <h3>Filtros de Búsqueda</h3>
          <button 
            className="btn btn-text"
            onClick={resetFilters}
          >
            Limpiar filtros
          </button>
        </div>
        
        <div className="filters-grid">
          <div className="filter-group">
            <label>Localidad</label>
            <input 
              type="text"
              value={filters.localidad}
              onChange={(e) => setFilters({...filters, localidad: e.target.value})}
              placeholder="Buscar por localidad"
              className="select-input"
            />
          </div>

          <div className="filter-group">
            <label>Provincia</label>
            <input 
              type="text"
              value={filters.provincia}
              onChange={(e) => setFilters({...filters, provincia: e.target.value})}
              placeholder="Buscar por provincia"
              className="select-input"
            />
          </div>

          <div className="filter-group">
            <label>Tipo de Animal</label>
            <select 
              value={filters.animal_type}
              onChange={(e) => setFilters({...filters, animal_type: e.target.value})}
              className="select-input"
            >
              <option value="">Todos los tipos</option>
              <option value="novillitos">Novillitos</option>
              <option value="vaquillonas">Vaquillonas</option>
              <option value="vacas">Vacas</option>
              <option value="toros">Toros</option>
              <option value="terneros">Terneros</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Precio Mínimo (ARS/kg)</label>
            <input 
              type="number"
              value={filters.min_price}
              onChange={(e) => setFilters({...filters, min_price: e.target.value})}
              placeholder="Precio mínimo"
              className="select-input"
            />
          </div>

          <div className="filter-group">
            <label>Precio Máximo (ARS/kg)</label>
            <input 
              type="number"
              value={filters.max_price}
              onChange={(e) => setFilters({...filters, max_price: e.target.value})}
              placeholder="Precio máximo"
              className="select-input"
            />
          </div>

          <div className="filter-group">
            <label>Ordenar por</label>
            <select 
              value={filters.sort_by}
              onChange={(e) => setFilters({...filters, sort_by: e.target.value})}
              className="select-input"
            >
              <option value="created_at">Fecha de publicación</option>
              <option value="base_price">Precio</option>
              <option value="total_count">Cantidad</option>
              <option value="average_weight">Peso promedio</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Orden</label>
            <select 
              value={filters.sort_order}
              onChange={(e) => setFilters({...filters, sort_order: e.target.value})}
              className="select-input"
            >
              <option value="desc">Descendente</option>
              <option value="asc">Ascendente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="stats-grid">
        <div className="stat-card stat-blue">
          <div className="stat-header">
            <Package size={24} />
            <span className="stat-title">Total Disponibles</span>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{filteredLotes.length}</h3>
          </div>
        </div>
        
        <div className="stat-card stat-green">
          <div className="stat-header">
            <Package size={24} />
            <span className="stat-title">Animales Totales</span>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">
              {filteredLotes.reduce((sum, lote) => sum + (lote.total_count || 0), 0)}
            </h3>
          </div>
        </div>

        <div className="stat-card stat-orange">
          <div className="stat-header">
            <DollarSign size={24} />
            <span className="stat-title">Precio Promedio</span>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">
              {filteredLotes.length > 0 
                ? formatPrice(Math.round(filteredLotes.reduce((sum, lote) => sum + (lote.base_price || 0), 0) / filteredLotes.length))
                : formatPrice(0)}/kg
            </h3>
          </div>
        </div>
      </div>

      {/* Tabla de Lotes */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Lotes Disponibles para Compra ({filteredLotes.length})</h2>
        </div>

        {filteredLotes.length === 0 ? (
          <div className="empty-state">
            <ShoppingCart size={48} />
            <p>No hay lotes disponibles con los filtros seleccionados</p>
            <button onClick={resetFilters} className="btn btn-primary">
              <Filter size={20} />
              Limpiar Filtros
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>ID</th>
                  <th>Tipo/Raza</th>
                  <th>Estancia</th>
                  <th>Localidad</th>
                  <th>Provincia</th>
                  <th>Cantidad</th>
                  <th>Peso Prom.</th>
                  <th>Precio Base</th>
                  <th>Uniformidad</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredLotes.map((lote) => (
                  <tr key={lote.id}>
                    <td>
                      {lote.photos && lote.photos.length > 0 ? (
                        <img 
                          src={`http://localhost:5000${lote.photos[0]}`}
                          alt={`Lote ${lote.id}`}
                          onClick={() => handleImageClick(`http://localhost:5000${lote.photos[0]}`)}
                          style={{
                            width: '60px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'transform 0.2s'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        />
                      ) : (
                        <div style={{
                          width: '60px',
                          height: '60px',
                          backgroundColor: '#f0f0f0',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px'
                        }}>
                          🐄
                        </div>
                      )}
                    </td>
                    <td className="id-cell">#{lote.id}</td>
                    <td>
                      <div>
                        <div className="cell-primary">{lote.animal_type}</div>
                        <div className="cell-secondary">{lote.breed}</div>
                      </div>
                    </td>
                    <td>
                      {lote.location.split(',')[0]?.trim() || '-'}
                    </td>
                    <td>
                      <div className="cell-with-icon">
                        <MapPin size={16} />
                        {lote.city || lote.location.split(',')[1]?.trim() || '-'}
                      </div>
                    </td>
                    <td>
                      {lote.province || lote.location.split(',')[2]?.trim() || '-'}
                    </td>
                    <td className="number-cell">{lote.total_count}</td>
                    <td className="number-cell">{formatWeight(lote.average_weight)}</td>
                    <td className="price-cell">
                      <div className="cell-with-icon">
                        <DollarSign size={16} />
                        {formatPrice(lote.base_price)}/kg
                      </div>
                    </td>
                    <td>
                      {lote.uniformity === 'poco_uniforme' && 'Poco uniforme'}
                      {lote.uniformity === 'uniformidad_media' && 'Media'}
                      {lote.uniformity === 'bastante_uniforme' && 'Bastante uniforme'}
                      {lote.uniformity === 'completamente_uniforme' && 'Completo'}
                      {!lote.uniformity && 'N/A'}
                    </td>
                    <td>{getStatusBadge(lote.status, lote.id)}</td>
                    <td>
                      <div className="cell-with-icon">
                        <Calendar size={16} />
                        {format(new Date(lote.created_at), "dd/MM/yyyy", { locale: es })}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Link 
                          to={`/comprador/lote/${lote.id}`}
                          className="btn btn-sm btn-primary"
                          title="Ver detalles"
                        >
                          <Eye size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Zoom de Imagen */}
      {showImageModal && (
        <div 
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
              background: 'rgba(255, 255, 255, 0.9)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              fontSize: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              color: '#333'
            }}
          >
            ×
          </button>
          <img 
            src={selectedImage}
            alt="Imagen ampliada"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
            }}
          />
        </div>
      )}
    </div>
  );
}
