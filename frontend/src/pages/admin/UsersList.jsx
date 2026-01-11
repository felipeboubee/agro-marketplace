import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Users, 
  Search, 
  Filter, 
  UserCheck, 
  UserX,
  MoreVertical,
  Download
} from "lucide-react";
import "../../styles/dashboard.css";

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: "",
    user_type: "",
    is_active: ""
  });
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    loadUsers();
  }, [filters]);

  async function loadUsers() {
    try {
      const data = await api.getUsers(filters);
      setUsers(data.users);
      setPagination(data.pagination);
      setStats(data.stats || {});
    } catch (error) {
      console.error("Error loading users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.updateUser(userId, { is_active: !currentStatus });
      loadUsers(); // Recargar lista
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const updateUserInfo = async (userId, data) => {
    try {
      await api.updateUser(userId, data);
      alert('Usuario actualizado correctamente');
      loadUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      alert('Error al actualizar usuario');
    }
  };

  const loadUserActivity = async (userId) => {
    try {
      const activity = await api.getUserActivity(userId);
      const activities = Array.isArray(activity) ? activity : [activity];
      alert(`${activities.length} registros de actividad encontrados`);
      console.log('User activity:', activities);
    } catch (error) {
      console.error("Error loading user activity:", error);
      alert('Error al cargar historial');
    }
  };

  const deleteUser = async (userId) => {
    try {
      await api.delete(`/users/${userId}`);
      alert('Usuario eliminado correctamente');
      loadUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert('Error al eliminar usuario');
    }
  };

  const userStats = [
    {
      title: "Total Usuarios",
      value: stats.total_users || 0,
      icon: <Users size={24} />,
      color: "blue"
    },
    {
      title: "Activos",
      value: stats.active_users || 0,
      icon: <UserCheck size={24} />,
      color: "green"
    },
    {
      title: "Administradores",
      value: stats.admin_count || 0,
      icon: <Users size={24} />,
      color: "purple"
    },
    {
      title: "Nuevos Hoy",
      value: stats.new_today || 0,
      icon: <UserCheck size={24} />,
      color: "orange"
    }
  ];

  if (loading && filters.page === 1) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <h1>
          <Users size={32} />
          Gestión de Usuarios
        </h1>
        <div className="header-actions">
          <button className="btn btn-secondary">
            <Download size={20} />
            Exportar
          </button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="stats-grid">
        {userStats.map((stat, index) => (
          <div key={index} className={`stat-card stat-${stat.color}`}>
            <div className="stat-header">
              {stat.icon}
              <span className="stat-title">{stat.title}</span>
            </div>
            <div className="stat-content">
              <h3 className="stat-value">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="filters-container">
        <div className="filters-header">
          <Filter size={20} />
          <h3>Filtros</h3>
        </div>
        
        <div className="filters-grid">
          <div className="filter-group">
            <label>
              <Search size={16} />
              Buscar
            </label>
            <input 
              type="text"
              placeholder="Buscar por nombre o email"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="input"
            />
          </div>

          <div className="filter-group">
            <label>Tipo de Usuario</label>
            <select 
              value={filters.user_type}
              onChange={(e) => handleFilterChange('user_type', e.target.value)}
              className="select-input"
            >
              <option value="">Todos los tipos</option>
              <option value="admin">Administrador</option>
              <option value="comprador">Comprador</option>
              <option value="vendedor">Vendedor</option>
              <option value="banco">Banco</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Estado</label>
            <select 
              value={filters.is_active}
              onChange={(e) => handleFilterChange('is_active', e.target.value)}
              className="select-input"
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Usuarios ({pagination.total || 0})</h2>
          <div className="results-info">
            Mostrando {(filters.page - 1) * filters.limit + 1} - 
            {Math.min(filters.page * filters.limit, pagination.total || 0)} de {pagination.total || 0}
          </div>
        </div>

        {users.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <p>No se encontraron usuarios</p>
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Tipo</th>
                  <th>Pedidos</th>
                  <th>Estado</th>
                  <th>Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="text-mono">{user.id}</td>
                    <td>
                      <div className="user-info">
                        <div className="user-name">{user.name}</div>
                        <div className="user-last-activity">
                          Última actividad: {
                            user.last_activity 
                              ? format(new Date(user.last_activity), "dd/MM/yyyy", { locale: es })
                              : "Nunca"
                          }
                        </div>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`user-type user-type-${user.user_type}`}>
                        {user.user_type}
                      </span>
                    </td>
                    <td>{user.order_count || 0}</td>
                    <td>
                      <div className="user-status">
                        <span className={`status-indicator ${user.is_active ? 'active' : 'inactive'}`}></span>
                        <span>{user.is_active ? "Activo" : "Inactivo"}</span>
                      </div>
                    </td>
                    <td>
                      {format(new Date(user.created_at), "dd/MM/yyyy", { locale: es })}
                    </td>
                    <td>
                      <div className="actions">
                        <button 
                          className="btn-icon"
                          onClick={() => toggleUserStatus(user.id, user.is_active)}
                          title={user.is_active ? "Desactivar usuario" : "Activar usuario"}
                        >
                          {user.is_active ? <UserX size={18} /> : <UserCheck size={18} />}
                        </button>
                        <div className="action-menu">
                          <button 
                            className="btn-icon" 
                            onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                            title="Más opciones"
                          >
                            <MoreVertical size={18} />
                          </button>
                          {openMenuId === user.id && (
                            <div className="menu-dropdown">
                              <button onClick={() => {
                                setOpenMenuId(null);
                                window.location.href = `/admin/users/${user.id}`;
                              }}>Ver Detalles</button>
                              <button onClick={() => {
                                setOpenMenuId(null);
                                const newName = prompt('Nuevo nombre:', user.name);
                                if (newName) {
                                  updateUserInfo(user.id, { name: newName });
                                }
                              }}>Editar</button>
                              <button onClick={() => {
                                setOpenMenuId(null);
                                loadUserActivity(user.id);
                              }}>Ver Historial</button>
                              <hr style={{margin: '4px 0'}} />
                              <button style={{color: '#ef4444'}} onClick={() => {
                                if (window.confirm(`¿Eliminar usuario ${user.name}?`)) {
                                  deleteUser(user.id);
                                  setOpenMenuId(null);
                                }
                              }}>Eliminar</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button 
              className="pagination-btn"
              onClick={() => handlePageChange(filters.page - 1)}
              disabled={filters.page === 1}
            >
              Anterior
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
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}