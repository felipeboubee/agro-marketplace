import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from "../../services/api";
import '../../styles/forms.css';

const MyLotes = () => {
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    sort_by: 'created_at',
    sort_order: 'desc'
  });
  const [stats, setStats] = useState({
    total: 0,
    ofertado: 0,
    completo: 0,
    cancelado: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyLotes();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [lotes]);

  const fetchMyLotes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/lotes/seller', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLotes(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching my lotes:', error);
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const stats = {
      total: lotes.length,
      ofertado: lotes.filter(l => l.status === 'ofertado').length,
      completo: lotes.filter(l => l.status === 'completo').length,
      cancelado: lotes.filter(l => l.status === 'cancelado').length
    };
    setStats(stats);
  };

  const filteredLotes = lotes.filter(lote => {
    if (filters.status === 'all') return true;
    return lote.status === filters.status;
  }).sort((a, b) => {
    const aValue = a[filters.sort_by];
    const bValue = b[filters.sort_by];
    
    if (filters.sort_order === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleStatusChange = async (loteId, newStatus) => {
    if (!window.confirm(`¿Cambiar estado a "${newStatus}"?`)) return;

    try {
      const token = localStorage.getItem('token');
      await api.put(`/lotes/${loteId}`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Actualizar lista localmente
      setLotes(lotes.map(lote => 
        lote.id === loteId ? { ...lote, status: newStatus } : lote
      ));
      
      alert('Estado actualizado exitosamente');
    } catch (error) {
      console.error('Error updating lote status:', error);
      alert('Error al actualizar el estado');
    }
  };

  const handleDelete = async (loteId) => {
    if (!window.confirm('¿Estás seguro de eliminar este lote? Esta acción no se puede deshacer.')) return;

    try {
      const token = localStorage.getItem('token');
      await api.delete(`/lotes/${loteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Eliminar de la lista localmente
      setLotes(lotes.filter(lote => lote.id !== loteId));
      
      alert('Lote eliminado exitosamente');
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
        <p>Cargando tus lotes...</p>
      </div>
    );
  }

  return (
    <div className="my-lotes-container">
      <div className="page-header">
        <div className="header-content">
          <h1>Mis Lotes</h1>
          <p>Gestiona todas tus publicaciones</p>
        </div>
        <div className="header-actions">
          <Link to="/vendedor/crear-lote" className="btn btn-primary">
            <span>+</span> Crear Nuevo Lote
          </Link>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Lotes</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <h3>{stats.ofertado}</h3>
            <p>Activos</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <h3>{stats.completo}</h3>
            <p>Completados</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✗</div>
          <div className="stat-content">
            <h3>{stats.cancelado}</h3>
            <p>Cancelados</p>
          </div>
        </div>
      </div>

      {/* Filtros y Controles */}
      <div className="controls-bar">
        <div className="filters">
          <select 
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="filter-select"
          >
            <option value="all">Todos los estados</option>
            <option value="ofertado">Ofertado</option>
            <option value="completo">Completo</option>
            <option value="cancelado">Cancelado</option>
          </select>

          <select 
            value={filters.sort_by}
            onChange={(e) => setFilters({...filters, sort_by: e.target.value})}
            className="filter-select"
          >
            <option value="created_at">Ordenar por fecha</option>
            <option value="base_price">Ordenar por precio</option>
            <option value="total_count">Ordenar por cantidad</option>
          </select>

          <button 
            onClick={() => setFilters({...filters, sort_order: filters.sort_order === 'desc' ? 'asc' : 'desc'})}
            className="btn btn-outline"
          >
            {filters.sort_order === 'desc' ? 'Descendente ↑' : 'Ascendente ↓'}
          </button>
        </div>

        <div className="export-options">
          <button className="btn btn-outline">
            📥 Exportar CSV
          </button>
          <button className="btn btn-outline">
            🖨️ Imprimir Lista
          </button>
        </div>
      </div>

      {/* Tabla de Lotes */}
      <div className="lotes-table-container">
        <table className="lotes-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tipo</th>
              <th>Ubicación</th>
              <th>Cantidad</th>
              <th>Peso (kg)</th>
              <th>Precio Base</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredLotes.map((lote) => (
              <tr key={lote.id}>
                <td className="lote-id">#{lote.id}</td>
                <td>
                  <div className="lote-type">
                    <span className="type-icon">🐄</span>
                    {lote.animal_type}
                  </div>
                </td>
                <td>{lote.location}</td>
                <td>{lote.total_count}</td>
                <td>{lote.average_weight}</td>
                <td>${lote.base_price}/kg</td>
                <td>{getStatusBadge(lote.status)}</td>
                <td>
                  {new Date(lote.created_at).toLocaleDateString()}
                </td>
                <td>
                  <div className="action-buttons">
                    <Link 
                      to={`/vendedor/lote/${lote.id}`}
                      className="btn btn-small"
                      title="Ver detalles"
                    >
                      👁️
                    </Link>
                    <Link 
                      to={`/vendedor/editar-lote/${lote.id}`}
                      className="btn btn-small btn-outline"
                      title="Editar"
                    >
                      ✏️
                    </Link>
                    <select 
                      value={lote.status}
                      onChange={(e) => handleStatusChange(lote.id, e.target.value)}
                      className="status-select"
                    >
                      <option value="ofertado">Ofertado</option>
                      <option value="completo">Completo</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                    <button 
                      onClick={() => handleDelete(lote.id)}
                      className="btn btn-small btn-danger"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista de Tarjetas (Responsive) */}
      <div className="lotes-cards">
        {filteredLotes.map((lote) => (
          <div key={lote.id} className="lote-card-mobile">
            <div className="card-header">
              <div className="card-title">
                <h4>{lote.animal_type} - {lote.breed}</h4>
                {getStatusBadge(lote.status)}
              </div>
              <span className="card-id">#{lote.id}</span>
            </div>
            
            <div className="card-content">
              <div className="card-row">
                <span className="row-label">Ubicación:</span>
                <span className="row-value">{lote.location}</span>
              </div>
              <div className="card-row">
                <span className="row-label">Cantidad:</span>
                <span className="row-value">{lote.total_count} animales</span>
              </div>
              <div className="card-row">
                <span className="row-label">Peso promedio:</span>
                <span className="row-value">{lote.average_weight} kg</span>
              </div>
              <div className="card-row">
                <span className="row-label">Precio base:</span>
                <span className="row-value">${lote.base_price}/kg</span>
              </div>
              <div className="card-row">
                <span className="row-label">Fecha:</span>
                <span className="row-value">
                  {new Date(lote.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <div className="card-actions">
              <Link 
                to={`/vendedor/lote/${lote.id}`}
                className="btn btn-small"
              >
                Ver
              </Link>
              <Link 
                to={`/vendedor/editar-lote/${lote.id}`}
                className="btn btn-small btn-outline"
              >
                Editar
              </Link>
              <select 
                value={lote.status}
                onChange={(e) => handleStatusChange(lote.id, e.target.value)}
                className="status-select"
              >
                <option value="ofertado">Ofertado</option>
                <option value="completo">Completo</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {filteredLotes.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No tienes lotes publicados</h3>
          <p>Crea tu primer lote para comenzar a vender</p>
          <Link to="/vendedor/crear-lote" className="btn btn-primary">
            Crear Primer Lote
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyLotes;