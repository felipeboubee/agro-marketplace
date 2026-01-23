import { useState, useEffect, useCallback, useRef } from "react";
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
  AlertCircle,
  FileCheck,
  CheckCircle,
  XCircle,
  Clock,
  Package
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import "../../styles/dashboard.css";

export default function AdminActivity() {
  const [activities, setActivities] = useState([]);
  const [currentFilters, setCurrentFilters] = useState({
    page: 1,
    limit: 20,
    activity_type: "",
    user_id: "",
    start_date: "",
    end_date: ""
  });
  const [userIdInput, setUserIdInput] = useState(""); // Local state para el input
  const [activityTypes, setActivityTypes] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const debounceTimerRef = useRef(null);

  // Función para cargar actividades - sin dependencias de filters
  const fetchActivities = useCallback(async (filterParams) => {
    try {
      setLoading(true);
      console.log("Fetching activities with filters:", filterParams);
      const data = await api.getDetailedActivity(filterParams);
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
  }, []);

  // Cargar actividades iniciales
  useEffect(() => {
    fetchActivities(currentFilters);
  }, [currentFilters, fetchActivities]);

  const handleFilterChange = (key, value) => {
    // Para cambios inmediatos (selects y dates)
    if (key === 'activity_type' || key === 'start_date' || key === 'end_date' || key === 'page') {
      const newFilters = { ...currentFilters, [key]: value };
      if (key !== 'page') {
        newFilters.page = 1;
      }
      setCurrentFilters(newFilters);
    } else if (key === 'user_id') {
      // Actualizar el input local inmediatamente
      setUserIdInput(value);
      
      // Clear any existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // Set new debounce timer (500ms)
      debounceTimerRef.current = setTimeout(() => {
        const newFilters = { ...currentFilters, user_id: value, page: 1 };
        setCurrentFilters(newFilters);
      }, 500);
    }
  };

  const handlePageChange = (newPage) => {
    handleFilterChange('page', newPage);
  };

  const handleRefresh = () => {
    fetchActivities(currentFilters);
  };

  const resetFilters = () => {
    const newFilters = {
      page: 1,
      limit: 20,
      activity_type: "",
      user_id: "",
      start_date: "",
      end_date: ""
    };
    setCurrentFilters(newFilters);
    setUserIdInput("");
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedActivities = () => {
    const sorted = [...activities].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Manejo especial para display_id (extraer número)
      if (sortConfig.key === 'display_id') {
        aValue = parseInt(aValue?.replace(/[A-Z]+/g, '') || 0);
        bValue = parseInt(bValue?.replace(/[A-Z]+/g, '') || 0);
      }

      // Manejo especial para fechas
      if (sortConfig.key === 'created_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      // Manejo de valores null/undefined
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sorted;
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return '⇅';
    }
    return sortConfig.direction === 'asc' ? '↑' : '↓';
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
      case 'certification_request':
        return <FileCheck size={18} className="activity-icon-svg" />;
      case 'certification_aprobado':
        return <CheckCircle size={18} className="activity-icon-svg" />;
      case 'certification_rechazado':
        return <XCircle size={18} className="activity-icon-svg" />;
      case 'certification_mas_datos':
        return <Clock size={18} className="activity-icon-svg" />;
      case 'lote_publicado':
        return <Package size={18} className="activity-icon-svg" />;
      case 'transaction_created':
      case 'transaction_weight_confirmed':
      case 'transaction_completed':
        return <ShoppingCart size={18} className="activity-icon-svg" />;
      case 'offer_created':
      case 'offer_accepted':
      case 'offer_rejected':
        return <FileCheck size={18} className="activity-icon-svg" />;
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
      case 'certification_request':
        return 'Solicitud de Certificación';
      case 'certification_aprobado':
        return 'Certificación Aprobada';
      case 'certification_rechazado':
        return 'Certificación Rechazada';
      case 'certification_mas_datos':
        return 'Más Datos Solicitados';
      case 'lote_publicado':
        return 'Lote Publicado';
      case 'transaction_created':
        return 'Transacción Creada';
      case 'transaction_weight_confirmed':
        return 'Peso Confirmado';
      case 'transaction_completed':
        return 'Transacción Completada';
      case 'offer_created':
        return 'Oferta Creada';
      case 'offer_accepted':
        return 'Oferta Aceptada';
      case 'offer_rejected':
        return 'Oferta Rechazada';
      default:
        return type || 'Actividad';
    }
  };

  if (loading && currentFilters.page === 1) {
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
          onClick={handleRefresh}
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
              value={currentFilters.activity_type}
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
              value={userIdInput}
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
              value={currentFilters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              className="input-field"
            />
          </div>

          <div className="filter-group">
            <label>
              <Calendar size={16} />
              Fecha Fin
            </label>
            <input 
              type="date"
              value={currentFilters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              className="input-field"
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
                Mostrando {(currentFilters.page - 1) * currentFilters.limit + 1} - 
                {Math.min(currentFilters.page * currentFilters.limit, pagination.total || 0)} de {pagination.total || 0}
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
                    <th onClick={() => handleSort('display_id')} style={{ cursor: 'pointer' }}>
                      ID {getSortIcon('display_id')}
                    </th>
                    <th onClick={() => handleSort('activity_type')} style={{ cursor: 'pointer' }}>
                      Tipo {getSortIcon('activity_type')}
                    </th>
                    <th onClick={() => handleSort('user_name')} style={{ cursor: 'pointer' }}>
                      Usuario {getSortIcon('user_name')}
                    </th>
                    <th onClick={() => handleSort('user_email')} style={{ cursor: 'pointer' }}>
                      Email {getSortIcon('user_email')}
                    </th>
                    <th>Descripción</th>
                    <th onClick={() => handleSort('created_at')} style={{ cursor: 'pointer' }}>
                      Fecha {getSortIcon('created_at')}
                    </th>
                    <th>Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedActivities().map((activity, index) => (
                    <tr key={`${activity.activity_type}-${activity.display_id || activity.id}-${index}`} className={`activity-row activity-${activity.activity_type}`}>
                      <td className="text-mono">
                        <span className="id-badge">{activity.display_id || activity.id}</span>
                      </td>
                      <td>
                        <span className="activity-type-text">
                          {getActivityLabel(activity.activity_type)}
                        </span>
                      </td>
                      <td>
                        <span className="user-name">{activity.user_name || '—'}</span>
                      </td>
                      <td>
                        <span className="user-email">{activity.user_email || '—'}</span>
                      </td>
                      <td className="activity-description">
                        {activity.description || "Usuario registrado en el sistema"}
                      </td>
                      <td>
                        <span className="timestamp-date">
                          {format(new Date(activity.created_at), "dd/MM/yyyy", { locale: es })}
                        </span>
                      </td>
                      <td>
                        <span className="timestamp-time">
                          {format(new Date(activity.created_at), "HH:mm:ss", { locale: es })}
                        </span>
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
                  onClick={() => handlePageChange(currentFilters.page - 1)}
                  disabled={currentFilters.page === 1}
                >
                  ← Anterior
                </button>
                
                <div className="pagination-pages">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentFilters.page <= 3) {
                      pageNum = i + 1;
                    } else if (currentFilters.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = currentFilters.page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        className={`pagination-page ${currentFilters.page === pageNum ? 'active' : ''}`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button 
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentFilters.page + 1)}
                  disabled={currentFilters.page === pagination.totalPages}
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