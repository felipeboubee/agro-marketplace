import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from "../../services/api";
import { 
  Package, 
  Plus, 
  Filter, 
  RefreshCw,
  Eye,
  Trash2,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Truck
} from "lucide-react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatPrice, formatWeight } from '../../utils/formatters';
import '../../styles/dashboard.css';

export default function MyLotes() {
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  const fetchMyLotes = async () => {
    try {
      const response = await api.getSellerLotes();
      setLotes(Array.isArray(response) ? response : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching my lotes:', error);
      setLotes([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLotes();
  }, []);

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

  const handleDelete = async (loteId) => {
    if (!window.confirm('¿Estás seguro de eliminar este lote? Esta acción no se puede deshacer.')) return;

    try {
      await api.deleteLote(loteId);
      setLotes(lotes.filter(lote => lote.id !== loteId));
      alert('Lote eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting lote:', error);
      alert('Error al eliminar el lote');
    }
  };

  const getStatusBadge = (lote) => {
    // If there's an active transaction, show transaction status
    if (lote.transaction_status) {
      const badges = {
        'pending_weight': { label: 'Esperando Peso', class: 'badge-warning', icon: Clock },
        'pendiente': { label: 'Esperando Peso', class: 'badge-warning', icon: Clock },
        'weight_confirmed': { label: 'Peso Confirmado', class: 'badge-info', icon: AlertCircle },
        'payment_pending': { label: 'Pago Pendiente', class: 'badge-warning', icon: DollarSign },
        'payment_processing': { label: 'Procesando Pago', class: 'badge-info', icon: Clock },
        'completed': { label: 'Completo', class: 'badge-success', icon: CheckCircle },
        'completo': { label: 'Completo', class: 'badge-success', icon: CheckCircle }
      };
      const badge = badges[lote.transaction_status] || { label: lote.transaction_status, class: 'badge-default' };
      return (
        <span className={`status-badge ${badge.class}`}>
          {badge.label}
        </span>
      );
    }
    
    // Otherwise show lote status
    const badges = {
      'ofertado': { label: 'Disponible', class: 'badge-success' },
      'completo': { label: 'Completo', class: 'badge-success' },
      'cancelado': { label: 'Cancelado', class: 'badge-danger' }
    };
    const badge = badges[lote.status] || { label: lote.status, class: 'badge-default' };
    return <span className={`status-badge ${badge.class}`}>{badge.label}</span>;
  };

  const handleRefresh = () => {
    fetchMyLotes();
  };

  const resetFilters = () => {
    setFilters({
      status: 'all',
      sort_by: 'created_at',
      sort_order: 'desc'
    });
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
    <div className="dashboard-container">
      <div className="page-header">
        <h1>
          <Package size={32} />
          Mis Lotes
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
          <Link to="/vendedor/crear" className="btn btn-primary">
            <Plus size={20} />
            Crear Nuevo Lote
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-container">
        <div className="filters-header">
          <Filter size={20} />
          <h3>Filtros y Ordenamiento</h3>
          <button 
            className="btn btn-text"
            onClick={resetFilters}
          >
            Limpiar filtros
          </button>
        </div>
        
        <div className="filters-grid">
          <div className="filter-group">
            <label>Estado</label>
            <select 
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="select-input"
            >
              <option value="all">Todos los estados</option>
              <option value="ofertado">Ofertado</option>
              <option value="completo">Completo</option>
              <option value="cancelado">Cancelado</option>
            </select>
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
            <span className="stat-title">Total de Lotes</span>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{lotes.length}</h3>
          </div>
        </div>
        
        <div className="stat-card stat-orange">
          <div className="stat-header">
            <Package size={24} />
            <span className="stat-title">Ofertados</span>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">
              {lotes.filter(l => l.status === 'ofertado').length}
            </h3>
          </div>
        </div>

        <div className="stat-card stat-green">
          <div className="stat-header">
            <Package size={24} />
            <span className="stat-title">Completos</span>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">
              {lotes.filter(l => l.status === 'completo').length}
            </h3>
          </div>
        </div>
      </div>

      {/* Tabla de Lotes */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Lotes Publicados ({filteredLotes.length})</h2>
        </div>

        {filteredLotes.length === 0 ? (
          <div className="empty-state">
            <Package size={48} />
            <p>No hay lotes publicados con los filtros seleccionados</p>
            <Link to="/vendedor/crear" className="btn btn-primary">
              <Plus size={20} />
              Crear Primer Lote
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tipo/Raza</th>
                  <th>Ubicación</th>
                  <th>Cantidad</th>
                  <th>Peso Prom.</th>
                  <th>Precio Base</th>
                  <th>Estado</th>
                  <th>Comprador</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredLotes.map((lote) => (
                  <tr key={lote.id}>
                    <td className="id-cell">#{lote.id}</td>
                    <td>
                      <div>
                        <div className="cell-primary">{lote.animal_type}</div>
                        <div className="cell-secondary">{lote.breed}</div>
                      </div>
                    </td>
                    <td>
                      {lote.location}
                    </td>
                    <td className="number-cell">{lote.total_count}</td>
                    <td className="number-cell">{formatWeight(lote.average_weight)}</td>
                    <td className="price-cell">
                      {formatPrice(lote.base_price)}/kg
                    </td>
                    <td>{getStatusBadge(lote)}</td>
                    <td>
                      {lote.buyer_name || '-'}
                    </td>
                    <td>
                      {format(new Date(lote.created_at), "dd/MM/yyyy", { locale: es })}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Link 
                          to={`/vendedor/lote/${lote.id}`}
                          className="btn btn-sm btn-primary"
                          title="Ver detalles"
                        >
                          <Eye size={16} />
                        </Link>
                        <button 
                          onClick={() => handleDelete(lote.id)}
                          className="btn btn-sm btn-danger"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
