import React, { useState, useEffect } from 'react';
import { api } from "../../services/api";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import '../../styles/dashboard.css';

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    user_type: 'all',
    search: '',
    is_active: 'all',
    sort_by: 'created_at',
    sort_order: 'desc'
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [userStats, setUserStats] = useState({
    total: 0,
    compradores: 0,
    vendedores: 0,
    bancos: 0,
    admins: 0,
    active: 0,
    inactive: 0
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, filters]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/users/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUsers(response.data);
      calculateStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const calculateStats = (usersList) => {
    const stats = {
      total: usersList.length,
      compradores: usersList.filter(u => u.user_type === 'comprador').length,
      vendedores: usersList.filter(u => u.user_type === 'vendedor').length,
      bancos: usersList.filter(u => u.user_type === 'banco').length,
      admins: usersList.filter(u => u.user_type === 'admin').length,
      active: usersList.filter(u => u.is_active).length,
      inactive: usersList.filter(u => !u.is_active).length
    };
    setUserStats(stats);
  };

  const filterAndSortUsers = () => {
    let result = [...users];

    // Aplicar filtros
    if (filters.user_type !== 'all') {
      result = result.filter(user => user.user_type === filters.user_type);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(user => 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.location?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.is_active !== 'all') {
      const isActive = filters.is_active === 'active';
      result = result.filter(user => user.is_active === isActive);
    }

    // Aplicar ordenamiento
    result.sort((a, b) => {
      let aValue = a[filters.sort_by];
      let bValue = b[filters.sort_by];

      // Manejar fechas
      if (filters.sort_by === 'created_at' || filters.sort_by === 'last_login') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      }

      if (filters.sort_order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredUsers(result);
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleUserStatusToggle = async (userId, currentStatus) => {
    if (!window.confirm(`¿${currentStatus ? 'Desactivar' : 'Activar'} este usuario?`)) return;

    try {
      const token = localStorage.getItem('token');
      await api.put(
        `/users/${userId}/status`,
        { is_active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Actualizar lista localmente
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_active: !currentStatus } : user
      ));

      alert('Estado del usuario actualizado');
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error al actualizar el estado');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) return;

    try {
      const token = localStorage.getItem('token');
      await api.delete(`/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Eliminar de la lista localmente
      setUsers(users.filter(user => user.id !== userId));
      alert('Usuario eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error al eliminar el usuario');
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Nombre', 'Email', 'Tipo', 'Ubicación', 'Activo', 'Verificado', 'Fecha Registro'];
    const csvData = filteredUsers.map(user => [
      user.id,
      user.name,
      user.email,
      user.user_type,
      user.location || '',
      user.is_active ? 'Sí' : 'No',
      user.email_verified ? 'Sí' : 'No',
      format(new Date(user.created_at), 'dd/MM/yyyy HH:mm', { locale: es })
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `usuarios_agromarket_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const getUserTypeBadge = (type) => {
    const badges = {
      'comprador': { label: 'Comprador', class: 'badge-primary' },
      'vendedor': { label: 'Vendedor', class: 'badge-warning' },
      'banco': { label: 'Banco', class: 'badge-info' },
      'admin': { label: 'Admin', class: 'badge-danger' }
    };
    const badge = badges[type] || { label: type, class: 'badge-default' };
    return <span className={`badge ${badge.class}`}>{badge.label}</span>;
  };

  const getStatusBadge = (isActive) => (
    <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}>
      {isActive ? 'Activo' : 'Inactivo'}
    </span>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div className="users-list-container">
      <div className="page-header">
        <div>
          <h1>Gestión de Usuarios</h1>
          <p>Administra todos los usuarios de la plataforma</p>
        </div>
        <button onClick={exportToCSV} className="btn btn-primary">
          <i className="fas fa-download"></i> Exportar CSV
        </button>
      </div>

      {/* Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card admin-stat">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{userStats.total}</h3>
            <p>Total Usuarios</p>
            <small>{userStats.active} activos</small>
          </div>
        </div>

        <div className="stat-card admin-stat">
          <div className="stat-icon">👨‍🌾</div>
          <div className="stat-content">
            <h3>{userStats.vendedores}</h3>
            <p>Vendedores</p>
            <small>{Math.round((userStats.vendedores / userStats.total) * 100)}% del total</small>
          </div>
        </div>

        <div className="stat-card admin-stat">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <h3>{userStats.compradores}</h3>
            <p>Compradores</p>
            <small>{Math.round((userStats.compradores / userStats.total) * 100)}% del total</small>
          </div>
        </div>

        <div className="stat-card admin-stat">
          <div className="stat-icon">🏦</div>
          <div className="stat-content">
            <h3>{userStats.bancos}</h3>
            <p>Bancos</p>
            <small>{Math.round((userStats.bancos / userStats.total) * 100)}% del total</small>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-card">
        <div className="filters-row">
          <div className="filter-group">
            <label>Tipo de Usuario</label>
            <select
              name="user_type"
              value={filters.user_type}
              onChange={handleFilterChange}
            >
              <option value="all">Todos los tipos</option>
              <option value="comprador">Compradores</option>
              <option value="vendedor">Vendedores</option>
              <option value="banco">Bancos</option>
              <option value="admin">Administradores</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Estado</label>
            <select
              name="is_active"
              value={filters.is_active}
              onChange={handleFilterChange}
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Ordenar por</label>
            <select
              name="sort_by"
              value={filters.sort_by}
              onChange={handleFilterChange}
            >
              <option value="created_at">Fecha de registro</option>
              <option value="name">Nombre</option>
              <option value="email">Email</option>
              <option value="last_login">Último acceso</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Orden</label>
            <select
              name="sort_order"
              value={filters.sort_order}
              onChange={handleFilterChange}
            >
              <option value="desc">Descendente</option>
              <option value="asc">Ascendente</option>
            </select>
          </div>
        </div>

        <div className="filter-group search-group">
          <label>Buscar</label>
          <div className="search-input-wrapper">
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Buscar por nombre, email o ubicación..."
              className="search-input"
            />
            <i className="fas fa-search search-icon"></i>
          </div>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="table-container">
        <div className="table-header">
          <h3>{filteredUsers.length} Usuarios Encontrados</h3>
          <div className="table-actions">
            <button className="btn btn-outline">
              <i className="fas fa-print"></i> Imprimir
            </button>
            <button className="btn btn-outline">
              <i className="fas fa-filter"></i> Filtrar Avanzado
            </button>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Email</th>
              <th>Tipo</th>
              <th>Ubicación</th>
              <th>Estado</th>
              <th>Registro</th>
              <th>Último Acceso</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className={selectedUser?.id === user.id ? 'selected' : ''}>
                <td className="user-id">#{user.id}</td>
                <td>
                  <div className="user-info-cell">
                    <div className="user-avatar">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-details">
                      <strong>{user.name}</strong>
                      <small>ID: {user.uuid?.substring(0, 8)}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <a href={`mailto:${user.email}`} className="email-link">
                    {user.email}
                  </a>
                </td>
                <td>{getUserTypeBadge(user.user_type)}</td>
                <td>{user.location || '-'}</td>
                <td>{getStatusBadge(user.is_active)}</td>
                <td>
                  <div className="date-cell">
                    <div className="date">
                      {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: es })}
                    </div>
                    <div className="time">
                      {format(new Date(user.created_at), 'HH:mm', { locale: es })}
                    </div>
                  </div>
                </td>
                <td>
                  {user.last_login ? (
                    <div className="date-cell">
                      <div className="date">
                        {format(new Date(user.last_login), 'dd/MM/yyyy', { locale: es })}
                      </div>
                      <div className="time">
                        {format(new Date(user.last_login), 'HH:mm', { locale: es })}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted">Nunca</span>
                  )}
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="btn btn-small"
                      title="Ver detalles"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <button
                      onClick={() => handleUserStatusToggle(user.id, user.is_active)}
                      className={`btn btn-small ${user.is_active ? 'btn-warning' : 'btn-success'}`}
                      title={user.is_active ? 'Desactivar' : 'Activar'}
                    >
                      <i className={`fas fa-${user.is_active ? 'ban' : 'check'}`}></i>
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="btn btn-small btn-danger"
                      title="Eliminar"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista de detalles del usuario */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalles del Usuario</h3>
              <button 
                className="modal-close"
                onClick={() => setSelectedUser(null)}
              >
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="user-detail-grid">
                <div className="detail-section">
                  <h4>Información Personal</h4>
                  <div className="detail-row">
                    <span className="detail-label">Nombre:</span>
                    <span className="detail-value">{selectedUser.name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{selectedUser.email}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Teléfono:</span>
                    <span className="detail-value">{selectedUser.phone || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Ubicación:</span>
                    <span className="detail-value">{selectedUser.location || '-'}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Información de la Cuenta</h4>
                  <div className="detail-row">
                    <span className="detail-label">Tipo de Usuario:</span>
                    <span className="detail-value">
                      {getUserTypeBadge(selectedUser.user_type)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Estado:</span>
                    <span className="detail-value">
                      {getStatusBadge(selectedUser.is_active)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email Verificado:</span>
                    <span className="detail-value">
                      {selectedUser.email_verified ? '✅ Sí' : '❌ No'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">ID Único:</span>
                    <span className="detail-value code">{selectedUser.uuid}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Actividad</h4>
                  <div className="detail-row">
                    <span className="detail-label">Fecha de Registro:</span>
                    <span className="detail-value">
                      {format(new Date(selectedUser.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Última Actualización:</span>
                    <span className="detail-value">
                      {format(new Date(selectedUser.updated_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Último Acceso:</span>
                    <span className="detail-value">
                      {selectedUser.last_login 
                        ? format(new Date(selectedUser.last_login), 'dd/MM/yyyy HH:mm', { locale: es })
                        : 'Nunca'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {selectedUser.profile_data && Object.keys(selectedUser.profile_data).length > 0 && (
                <div className="detail-section">
                  <h4>Datos Adicionales del Perfil</h4>
                  <pre className="json-view">
                    {JSON.stringify(selectedUser.profile_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                onClick={() => setSelectedUser(null)}
                className="btn btn-outline"
              >
                Cerrar
              </button>
              <button className="btn btn-primary">
                <i className="fas fa-edit"></i> Editar Usuario
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredUsers.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="fas fa-users"></i>
          </div>
          <h3>No se encontraron usuarios</h3>
          <p>Intenta ajustar tus filtros de búsqueda</p>
        </div>
      )}
    </div>
  );
};

export default UsersList;