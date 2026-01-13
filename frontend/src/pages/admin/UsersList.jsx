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
  Download,
  UserPlus,
  X
} from "lucide-react";
import "../../styles/dashboard.css";

const availableBanks = [
  'Banco Galicia',
  'Banco Nación',
  'Banco Provincia',
  'Banco Santander',
  'Banco BBVA',
  'Banco Patagonia',
  'Banco Macro',
  'Banco Comafi',
  'Banco Credicoop'
];

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    user_type: "comprador",
    bank_name: ""
  });
  const [existingBanks, setExistingBanks] = useState([]);
  const [showOtherBank, setShowOtherBank] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userActivity, setUserActivity] = useState([]);
  const [editUserData, setEditUserData] = useState({
    name: "",
    email: "",
    user_type: "",
    bank_name: "",
    phone: "",
    location: ""
  });

  useEffect(() => {
    loadUsers();
  }, [filters]);

  useEffect(() => {
    loadExistingBanks();
  }, []);

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

  async function loadExistingBanks() {
    try {
      // Obtener usuarios tipo banco para incluir bancos adicionales que se hayan agregado
      const data = await api.getUsers({ user_type: 'banco', limit: 100 });
      const banksFromDB = [...new Set(data.users.map(u => u.bank_name).filter(Boolean))];
      
      // Combinar bancos predefinidos con los de la base de datos (eliminar duplicados)
      const allBanks = [...new Set([...availableBanks, ...banksFromDB])];
      
      // Ordenar alfabéticamente
      allBanks.sort();
      
      setExistingBanks(allBanks);
    } catch (error) {
      console.error("Error loading banks:", error);
      // En caso de error, al menos usar los bancos predefinidos
      setExistingBanks(availableBanks);
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
      setShowEditModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      alert('Error al actualizar usuario');
    }
  };

  const loadUserActivity = async (userId) => {
    try {
      setUserActivity([]);
      setShowHistoryModal(true);
      
      const response = await api.get(`/admin/users/${userId}/activity`);
      const activities = Array.isArray(response) ? response : (response.activities || []);
      setUserActivity(activities);
    } catch (error) {
      console.error("Error loading user activity:", error);
      alert('Error al cargar historial');
      setShowHistoryModal(false);
    }
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
    setOpenMenuId(null);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditUserData({
      name: user.name || "",
      email: user.email || "",
      user_type: user.user_type || "",
      bank_name: user.bank_name || "",
      phone: user.phone || "",
      location: user.location || ""
    });
    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const handleViewHistory = (user) => {
    setSelectedUser(user);
    loadUserActivity(user.id);
    setOpenMenuId(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    await updateUserInfo(selectedUser.id, editUserData);
  };

  const handleEditChange = (field, value) => {
    setEditUserData(prev => ({ ...prev, [field]: value }));
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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    if (newUser.user_type === 'banco' && !newUser.bank_name) {
      alert('Por favor ingresa el nombre del banco');
      return;
    }

    try {
      const userData = {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        user_type: newUser.user_type,
        bank_name: newUser.user_type === 'banco' ? newUser.bank_name : null
      };

      await api.post('/auth/signup', userData);
      alert('Usuario creado correctamente');
      setShowCreateModal(false);
      setNewUser({
        name: "",
        email: "",
        password: "",
        user_type: "comprador",
        bank_name: ""
      });
      loadUsers();
    } catch (error) {
      console.error("Error creating user:", error);
      alert(error.response?.data?.error || 'Error al crear usuario');
    }
  };

  const handleNewUserChange = (field, value) => {
    setNewUser(prev => ({ ...prev, [field]: value }));
    
    // Si cambia el tipo de usuario, resetear bank_name
    if (field === 'user_type' && value !== 'banco') {
      setNewUser(prev => ({ ...prev, bank_name: '' }));
      setShowOtherBank(false);
    }
    
    // Si se selecciona "otro" en el banco
    if (field === 'bank_name' && value === '__otro__') {
      setShowOtherBank(true);
      setNewUser(prev => ({ ...prev, bank_name: '' }));
    } else if (field === 'bank_name' && value !== '__otro__') {
      setShowOtherBank(false);
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
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <UserPlus size={20} />
            Crear Usuario
          </button>
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
                  <th>Última Actividad</th>
                  <th>Estado</th>
                  <th>Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.user_type}</td>
                    <td>
                      {user.last_activity 
                        ? format(new Date(user.last_activity), "dd/MM/yyyy HH:mm", { locale: es })
                        : "Nunca"
                      }
                    </td>
                    <td>
                      {user.is_active ? "Activo" : "Inactivo"}
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
                              <button onClick={() => handleViewDetails(user)}>
                                Ver Detalles
                              </button>
                              <button onClick={() => handleEditUser(user)}>
                                Editar
                              </button>
                              <button onClick={() => handleViewHistory(user)}>
                                Ver Historial
                              </button>
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

      {/* Modal Crear Usuario */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <UserPlus size={24} />
                Crear Nuevo Usuario
              </h2>
              <button className="btn-close" onClick={() => setShowCreateModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    Nombre Completo <span className="required">*</span>
                  </label>
                  <input 
                    type="text"
                    className="input-field"
                    placeholder="Ej: Juan Pérez"
                    value={newUser.name}
                    onChange={(e) => handleNewUserChange('name', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Email <span className="required">*</span>
                  </label>
                  <input 
                    type="email"
                    className="input-field"
                    placeholder="email@ejemplo.com"
                    value={newUser.email}
                    onChange={(e) => handleNewUserChange('email', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Contraseña <span className="required">*</span>
                  </label>
                  <input 
                    type="password"
                    className="input-field"
                    placeholder="Mínimo 6 caracteres"
                    value={newUser.password}
                    onChange={(e) => handleNewUserChange('password', e.target.value)}
                    minLength={6}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Tipo de Usuario <span className="required">*</span>
                  </label>
                  <select 
                    className="input-field"
                    value={newUser.user_type}
                    onChange={(e) => handleNewUserChange('user_type', e.target.value)}
                    required
                  >
                    <option value="comprador">Comprador</option>
                    <option value="vendedor">Vendedor</option>
                    <option value="banco">Banco</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                {newUser.user_type === 'banco' && (
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>
                      Nombre del Banco <span className="required">*</span>
                    </label>
                    {!showOtherBank ? (
                      <select 
                        className="input-field"
                        value={newUser.bank_name}
                        onChange={(e) => handleNewUserChange('bank_name', e.target.value)}
                        required
                      >
                        <option value="">Seleccionar banco</option>
                        {existingBanks.map(bank => (
                          <option key={bank} value={bank}>{bank}</option>
                        ))}
                        <option value="__otro__">➕ Agregar otro banco</option>
                      </select>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input 
                          type="text"
                          className="input-field"
                          placeholder="Ej: Banco Nación"
                          value={newUser.bank_name}
                          onChange={(e) => handleNewUserChange('bank_name', e.target.value)}
                          required
                          style={{ flex: 1 }}
                        />
                        <button 
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setShowOtherBank(false);
                            setNewUser(prev => ({ ...prev, bank_name: '' }));
                          }}
                          style={{ minWidth: 'auto', padding: '8px 16px' }}
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <UserPlus size={20} />
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver Detalles */}
      {showDetailsModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <Users size={24} />
                Detalles del Usuario
              </h2>
              <button className="btn-close" onClick={() => setShowDetailsModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="user-details-grid">
                <div className="detail-item">
                  <label>ID</label>
                  <p>{selectedUser.id}</p>
                </div>
                <div className="detail-item">
                  <label>Nombre Completo</label>
                  <p>{selectedUser.name}</p>
                </div>
                <div className="detail-item">
                  <label>Email</label>
                  <p>{selectedUser.email}</p>
                </div>
                <div className="detail-item">
                  <label>Tipo de Usuario</label>
                  <p>{selectedUser.user_type}</p>
                </div>
                {selectedUser.bank_name && (
                  <div className="detail-item">
                    <label>Banco</label>
                    <p>{selectedUser.bank_name}</p>
                  </div>
                )}
                {selectedUser.phone && (
                  <div className="detail-item">
                    <label>Teléfono</label>
                    <p>{selectedUser.phone}</p>
                  </div>
                )}
                {selectedUser.location && (
                  <div className="detail-item">
                    <label>Ubicación</label>
                    <p>{selectedUser.location}</p>
                  </div>
                )}
                <div className="detail-item">
                  <label>Estado</label>
                  <p>
                    <span className={`status-badge ${selectedUser.is_active ? 'status-completed' : 'status-cancelled'}`}>
                      {selectedUser.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </p>
                </div>
                <div className="detail-item">
                  <label>Total de Pedidos</label>
                  <p>{selectedUser.order_count || 0}</p>
                </div>
                <div className="detail-item">
                  <label>Fecha de Registro</label>
                  <p>{format(new Date(selectedUser.created_at), "dd/MM/yyyy HH:mm", { locale: es })}</p>
                </div>
                {selectedUser.last_activity && (
                  <div className="detail-item">
                    <label>Última Actividad</label>
                    <p>{format(new Date(selectedUser.last_activity), "dd/MM/yyyy HH:mm", { locale: es })}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetailsModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <Users size={24} />
                Editar Usuario
              </h2>
              <button className="btn-close" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Nombre Completo</label>
                  <input 
                    type="text"
                    className="input-field"
                    value={editUserData.name}
                    onChange={(e) => handleEditChange('name', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input 
                    type="email"
                    className="input-field"
                    value={editUserData.email}
                    onChange={(e) => handleEditChange('email', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Tipo de Usuario</label>
                  <select 
                    className="input-field"
                    value={editUserData.user_type}
                    onChange={(e) => handleEditChange('user_type', e.target.value)}
                    required
                  >
                    <option value="comprador">Comprador</option>
                    <option value="vendedor">Vendedor</option>
                    <option value="banco">Banco</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                {editUserData.user_type === 'banco' && (
                  <div className="form-group">
                    <label>Nombre del Banco</label>
                    <select 
                      className="input-field"
                      value={editUserData.bank_name}
                      onChange={(e) => handleEditChange('bank_name', e.target.value)}
                      required
                    >
                      <option value="">Seleccionar banco</option>
                      {existingBanks.map(bank => (
                        <option key={bank} value={bank}>{bank}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Teléfono</label>
                  <input 
                    type="tel"
                    className="input-field"
                    value={editUserData.phone}
                    onChange={(e) => handleEditChange('phone', e.target.value)}
                    placeholder="Opcional"
                  />
                </div>

                <div className="form-group">
                  <label>Ubicación</label>
                  <input 
                    type="text"
                    className="input-field"
                    value={editUserData.location}
                    onChange={(e) => handleEditChange('location', e.target.value)}
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowEditModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <UserCheck size={20} />
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver Historial */}
      {showHistoryModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <Users size={24} />
                Historial de Actividad - {selectedUser.name}
              </h2>
              <button className="btn-close" onClick={() => setShowHistoryModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {userActivity.length === 0 ? (
                <div className="empty-state">
                  <Users size={48} />
                  <p>No se encontró actividad para este usuario</p>
                </div>
              ) : (
                <div className="activity-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Tipo</th>
                        <th>Descripción</th>
                        <th>Fecha</th>
                        <th>Hora</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userActivity.map((activity, index) => (
                        <tr key={index}>
                          <td>
                            <span className="activity-type-text">
                              {activity.activity_type?.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td>{activity.description || '—'}</td>
                          <td>
                            {format(new Date(activity.created_at), "dd/MM/yyyy", { locale: es })}
                          </td>
                          <td>
                            {format(new Date(activity.created_at), "HH:mm:ss", { locale: es })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowHistoryModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}