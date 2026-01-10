import { useState, useEffect, useCallback } from "react";
import { api } from "../../services/api";
import { 
  Activity, 
  Filter, 
  Search, 
  Calendar,
  User,
  UserPlus,
  Download,
  RefreshCw,
  LogIn,
  ShoppingCart,
  CreditCard,
  Edit,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import "../../styles/dashboard.css";

export default function AdminActivity() {
  const [activities, setActivities] = useState([]);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    activity_type: "",
    user_id: "",
    start_date: "",
    end_date: ""
  });
  const [activityTypes, setActivityTypes] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);

  const loadActivities = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching activities with filters:", filters);
      const data = await api.getDetailedActivity(filters);
      console.log("Activities data received:", data);
      setActivities(data.activities);
      setPagination(data.pagination);
      setActivityTypes(data.filters?.activityTypes || []);
    } catch (error) {
      console.error("Error loading activities:", error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const resetFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      activity_type: "",
      user_id: "",
      start_date: "",
      end_date: ""
    });
  };

  const getActivityIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'user_registration':
        return <UserPlus size={18} className="activity-icon-svg" />;
      case 'login':
        return <LogIn size={18} className="activity-icon-svg" />;
      case 'order':
        return <ShoppingCart size={18} className="activity-icon-svg" />;
      case 'payment':
        return <CreditCard size={18} className="activity-icon-svg" />;
      case 'profile_update':
        return <Edit size={18} className="activity-icon-svg" />;
      case 'error':
        return <AlertCircle size={18} className="activity-icon-svg" />;
      default:
        return <Activity size={18} className="activity-icon-svg" />;
    }
  };

  const getActivityLabel = (type) => {
    switch(type?.toLowerCase()) {
      case 'user_registration':
        return 'Registro de Usuario';
      case 'login':
        return 'Inicio de Sesión';
      case 'order':
        return 'Pedido';
      case 'payment':
        return 'Pago';
      case 'profile_update':
        return 'Actualización de Perfil';
      default:
        return type || 'Actividad';
    }
  };

  if (loading && filters.page === 1) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando actividad...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <h1>
          <Activity size={32} />
          Registro de Actividad
        </h1>
        <button 
          className="btn btn-secondary"
          onClick={() => loadActivities()}
          disabled={loading}
        >
          <RefreshCw size={20} className={loading ? "spin" : ""} />
          Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="filters-container">
        <div className="filters-header">
          <Filter size={20} />
          <h3>Filtros</h3>
          <button 
            className="btn btn-text"
            onClick={resetFilters}
          >
            Limpiar filtros
          </button>
        </div>
        
        <div className="filters-grid">
          <div className="filter-group">
            <label>
              <Activity size={16} />
              Tipo de Actividad
            </label>
            <select 
              value={filters.activity_type}
              onChange={(e) => handleFilterChange('activity_type', e.target.value)}
              className="select-input"
            >
              <option value="">Todos los tipos</option>
              {activityTypes && activityTypes.length > 0 ? (
                activityTypes.map(type => (
                  <option key={type} value={type}>
                    {getActivityLabel(type)}
                  </option>
                ))
              ) : (
                <option disabled>Cargando tipos...</option>
              )}
            </select>
          </div>

          <div className="filter-group">
            <label>
              <User size={16} />
              ID de Usuario
            </label>
            <input 
              type="text"
              placeholder="Buscar por ID de usuario"
              value={filters.user_id}
              onChange={(e) => handleFilterChange('user_id', e.target.value)}
              className="input"
            />
          </div>

          <div className="filter-group">
            <label>
              <Calendar size={16} />
              Fecha Inicio
            </label>
            <input 
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              className="input"
            />
          </div>

          <div className="filter-group">
            <label>
              <Calendar size={16} />
              Fecha Fin
            </label>
            <input 
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="stats-grid">
        <div className="stat-card stat-blue">
          <div className="stat-header">
            <Activity size={24} />
            <span className="stat-title">Total de Actividades</span>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{pagination.total || 0}</h3>
          </div>
        </div>
        
        <div className="stat-card stat-green">
          <div className="stat-header">
            <UserPlus size={24} />
            <span className="stat-title">Nuevos Usuarios</span>
          </div>
          <div className="stat-content">
            <h3 className="stat-value">
              {activities.filter(a => a.activity_type === 'user_registration').length}
            </h3>
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Actividades ({pagination.total || 0})</h2>
          <div className="results-info">
            {activities.length > 0 && (
              <>
                Mostrando {(filters.page - 1) * filters.limit + 1} - 
                {Math.min(filters.page * filters.limit, pagination.total || 0)} de {pagination.total || 0}
              </>
            )}
          </div>
        </div>

        {activities.length === 0 ? (
          <div className="empty-state">
            <Activity size={48} />
            <p>No se encontraron actividades con los filtros seleccionados</p>
          </div>
        ) : (
          <>
            <div className="activity-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tipo</th>
                    <th>Usuario</th>
                    <th>Descripción</th>
                    <th>Dirección IP</th>
                    <th>Fecha y Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity) => (
                    <tr key={activity.id} className={`activity-row activity-${activity.activity_type}`}>
                      <td className="text-mono">
                        <span className="id-badge">{activity.id}</span>
                      </td>
                      <td>
                        <div className="activity-type-badge">
                          <span className="activity-icon">
                            {getActivityIcon(activity.activity_type)}
                          </span>
                          <span className="activity-type-text">
                            {getActivityLabel(activity.activity_type)}
                          </span>
                        </div>
                      </td>
                      <td>
                        {activity.user_name ? (
                          <div className="user-info">
                            <div className="user-name">{activity.user_name}</div>
                            <div className="user-email">{activity.user_email}</div>
                          </div>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="activity-description">
                        {activity.description || "Usuario registrado en el sistema"}
                      </td>
                      <td>
                        <code className="ip-address">{activity.ip_address || "N/A"}</code>
                      </td>
                      <td>
                        <div className="timestamp">
                          <div className="timestamp-date">
                            {format(new Date(activity.created_at), "dd/MM/yyyy", { locale: es })}
                          </div>
                          <div className="timestamp-time">
                            {format(new Date(activity.created_at), "HH:mm:ss", { locale: es })}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="pagination-btn"
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page === 1}
                >
                  ← Anterior
                </button>
                
                <div className="pagination-pages">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (filters.page <= 3) {
                      pageNum = i + 1;
                    } else if (filters.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = filters.page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        className={`pagination-page ${filters.page === pageNum ? 'active' : ''}`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button 
                  className="pagination-btn"
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page === pagination.totalPages}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}