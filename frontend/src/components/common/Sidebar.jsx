import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import '../../styles/common.css';

const Sidebar = ({ userType }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // Definir menús según tipo de usuario
  const getMenuItems = () => {
    const commonItems = [
      { path: '/perfil', icon: '👤', label: 'Mi Perfil', exact: false }
    ];

    switch(userType) {
      case 'comprador':
        return [
          { path: '/comprador', icon: '🏠', label: 'Dashboard', exact: true },
          { path: '/comprador/buscar-lotes', icon: '🔍', label: 'Buscar Lotes' },
          { path: '/comprador/favoritos', icon: '⭐', label: 'Favoritos' },
          { path: '/comprador/historial', icon: '📋', label: 'Historial' },
          { path: '/comprador/certificacion', icon: '🏦', label: 'Certificación' },
          ...commonItems
        ];
      
      case 'vendedor':
        return [
          { path: '/vendedor', icon: '🏠', label: 'Dashboard', exact: true },
          { path: '/vendedor/crear-lote', icon: '➕', label: 'Crear Lote' },
          { path: '/vendedor/mis-lotes', icon: '📋', label: 'Mis Lotes' },
          { path: '/vendedor/transacciones', icon: '💰', label: 'Transacciones' },
          { path: '/vendedor/estadisticas', icon: '📊', label: 'Estadísticas' },
          ...commonItems
        ];
      
      case 'banco':
        return [
          { path: '/banco', icon: '🏠', label: 'Dashboard', exact: true },
          { path: '/banco/solicitudes', icon: '📋', label: 'Solicitudes' },
          { path: '/banco/certificados', icon: '✓', label: 'Certificados' },
          { path: '/banco/estadisticas', icon: '📈', label: 'Estadísticas' },
          ...commonItems
        ];
      
      case 'admin':
        return [
          { path: '/admin', icon: '🏠', label: 'Dashboard', exact: true },
          { path: '/admin/usuarios', icon: '👥', label: 'Usuarios' },
          { path: '/admin/transacciones', icon: '💰', label: 'Transacciones' },
          { path: '/admin/lotes', icon: '🐄', label: 'Lotes' },
          { path: '/admin/certificaciones', icon: '🏦', label: 'Certificaciones' },
          { path: '/admin/configuracion', icon: '⚙️', label: 'Configuración' },
          ...commonItems
        ];
      
      default:
        return commonItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && (
          <div className="sidebar-title">
            <h3>Menú</h3>
          </div>
        )}
        <button 
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item, index) => (
            <li key={index}>
              <NavLink
                to={item.path}
                end={item.exact}
                className={({ isActive }) => 
                  `nav-item ${isActive ? 'active' : ''} ${collapsed ? 'collapsed' : ''}`
                }
              >
                <span className="nav-icon">{item.icon}</span>
                {!collapsed && <span className="nav-label">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {!collapsed && (
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              <span>👤</span>
            </div>
            <div className="user-details">
              <h4>Usuario Activo</h4>
              <p className="user-role">{userType}</p>
            </div>
          </div>
          <div className="sidebar-stats">
            <div className="stat-item">
              <span className="stat-label">Sesión:</span>
              <span className="stat-value">Activa</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Último acceso:</span>
              <span className="stat-value">Hoy</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;