import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from "../../services/api";
import '../../styles/forms.css';

const LoteList = () => {
  const [lotes, setLotes] = useState([]);
  const [filteredLotes, setFilteredLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    location: '',
    animal_type: '',
    min_price: '',
    max_price: '',
    min_weight: '',
    max_weight: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    fetchLotes();
  }, []);

  useEffect(() => {
    filterAndSortLotes();
  }, [lotes, filters]);

  const fetchLotes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/lotes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLotes(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching lotes:', error);
      setLoading(false);
    }
  };

  const filterAndSortLotes = () => {
    let result = [...lotes];

    // Aplicar filtros
    if (filters.location) {
      result = result.filter(lote => 
        lote.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.animal_type) {
      result = result.filter(lote => 
        lote.animal_type === filters.animal_type
      );
    }

    if (filters.min_price) {
      result = result.filter(lote => 
        lote.base_price >= parseFloat(filters.min_price)
      );
    }

    if (filters.max_price) {
      result = result.filter(lote => 
        lote.base_price <= parseFloat(filters.max_price)
      );
    }

    if (filters.min_weight) {
      result = result.filter(lote => 
        lote.average_weight >= parseFloat(filters.min_weight)
      );
    }

    if (filters.max_weight) {
      result = result.filter(lote => 
        lote.average_weight <= parseFloat(filters.max_weight)
      );
    }

    // Aplicar ordenamiento
    result.sort((a, b) => {
      const aValue = a[filters.sort_by];
      const bValue = b[filters.sort_by];
      
      if (filters.sort_order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredLotes(result);
    setCurrentPage(1); // Resetear a primera página
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleSortChange = (sort_by) => {
    setFilters(prev => ({
      ...prev,
      sort_by,
      sort_order: prev.sort_by === sort_by && prev.sort_order === 'desc' ? 'asc' : 'desc'
    }));
  };

  const clearFilters = () => {
    setFilters({
      location: '',
      animal_type: '',
      min_price: '',
      max_price: '',
      min_weight: '',
      max_weight: '',
      sort_by: 'created_at',
      sort_order: 'desc'
    });
  };

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLotes = filteredLotes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLotes.length / itemsPerPage);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando lotes...</p>
      </div>
    );
  }

  return (
    <div className="lote-list-container">
      <div className="page-header">
        <h1>Lotes Disponibles</h1>
        <p>Encuentra el mejor ganado para tu negocio</p>
      </div>

      {/* Filtros */}
      <div className="filters-card">
        <h3>Filtros de Búsqueda</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Ubicación</label>
            <input
              type="text"
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
              placeholder="Buscar por ubicación"
            />
          </div>

          <div className="filter-group">
            <label>Tipo de Animal</label>
            <select
              name="animal_type"
              value={filters.animal_type}
              onChange={handleFilterChange}
            >
              <option value="">Todos</option>
              <option value="novillitos">Novillitos</option>
              <option value="vaquillonas">Vaquillonas</option>
              <option value="vacas">Vacas</option>
              <option value="toros">Toros</option>
              <option value="terneros">Terneros</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Precio Mínimo</label>
            <input
              type="number"
              name="min_price"
              value={filters.min_price}
              onChange={handleFilterChange}
              placeholder="$ Mínimo"
            />
          </div>

          <div className="filter-group">
            <label>Precio Máximo</label>
            <input
              type="number"
              name="max_price"
              value={filters.max_price}
              onChange={handleFilterChange}
              placeholder="$ Máximo"
            />
          </div>

          <div className="filter-group">
            <label>Peso Mínimo (kg)</label>
            <input
              type="number"
              name="min_weight"
              value={filters.min_weight}
              onChange={handleFilterChange}
              placeholder="Peso mínimo"
            />
          </div>

          <div className="filter-group">
            <label>Peso Máximo (kg)</label>
            <input
              type="number"
              name="max_weight"
              value={filters.max_weight}
              onChange={handleFilterChange}
              placeholder="Peso máximo"
            />
          </div>
        </div>

        <div className="filter-actions">
          <button onClick={clearFilters} className="btn btn-outline">
            Limpiar Filtros
          </button>
          <button onClick={filterAndSortLotes} className="btn btn-primary">
            Aplicar Filtros
          </button>
        </div>
      </div>

      {/* Resultados */}
      <div className="results-header">
        <div className="results-info">
          <h3>{filteredLotes.length} Lotes Encontrados</h3>
          <p>Mostrando {currentLotes.length} de {filteredLotes.length}</p>
        </div>
        
        <div className="sort-options">
          <span>Ordenar por:</span>
          <button 
            onClick={() => handleSortChange('base_price')}
            className={`sort-btn ${filters.sort_by === 'base_price' ? 'active' : ''}`}
          >
            Precio {filters.sort_by === 'base_price' && (filters.sort_order === 'asc' ? '↑' : '↓')}
          </button>
          <button 
            onClick={() => handleSortChange('average_weight')}
            className={`sort-btn ${filters.sort_by === 'average_weight' ? 'active' : ''}`}
          >
            Peso {filters.sort_by === 'average_weight' && (filters.sort_order === 'asc' ? '↑' : '↓')}
          </button>
          <button 
            onClick={() => handleSortChange('created_at')}
            className={`sort-btn ${filters.sort_by === 'created_at' ? 'active' : ''}`}
          >
            Fecha {filters.sort_by === 'created_at' && (filters.sort_order === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {/* Lista de Lotes */}
      <div className="lotes-grid">
        {currentLotes.map((lote) => (
          <div key={lote.id} className="lote-card">
            <div className="lote-image">
              {lote.photos && lote.photos.length > 0 ? (
                <img src={lote.photos[0]} alt={lote.animal_type} />
              ) : (
                <div className="no-image">🖼️</div>
              )}
              {lote.status === 'ofertado' && (
                <span className="lote-badge disponible">Disponible</span>
              )}
            </div>
            
            <div className="lote-content">
              <div className="lote-header">
                <h4>{lote.animal_type} - {lote.breed}</h4>
                <span className="lote-location">{lote.location}</span>
              </div>
              
              <div className="lote-actions">
                <Link 
                  to={`/comprador/lote/${lote.id}`}
                  className="btn btn-primary btn-block"
                >
                  Ver Detalles
                </Link>
                <button className="btn btn-outline btn-block">
                  ⭐ Guardar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="page-btn"
          >
            ← Anterior
          </button>
          
          <div className="page-numbers">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`page-number ${currentPage === pageNum ? 'active' : ''}`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="page-btn"
          >
            Siguiente →
          </button>
        </div>
      )}

      {filteredLotes.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No se encontraron lotes</h3>
          <p>Intenta ajustar tus filtros de búsqueda</p>
        </div>
      )}
    </div>
  );
};

export default LoteList;