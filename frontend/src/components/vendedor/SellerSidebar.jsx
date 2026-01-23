import { NavLink, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Plus,
  List,
  LogOut,
  Settings,
  Menu,
  X,
  RefreshCw,
  Clock,
  TrendingUp,
  Building2,
  MessageCircle
} from "lucide-react";
import { useState } from "react";
import { api } from "../../services/api";

export default function SellerSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleSwitchToBuyer = async () => {
    setSwitching(true);
    try {
      const response = await api.post('/auth/switch-account', {
        user_type: 'comprador'
      });
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      navigate('/comprador');
    } catch (error) {
      console.error('Error al cambiar de cuenta:', error);
      // Si falla, redirigir al login
      handleLogout();
    } finally {
      setSwitching(false);
    }
  };

  const navItems = [
    { path: "/vendedor", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { path: "/vendedor/crear", icon: <Plus size={20} />, label: "Crear Lote" },
    { path: "/vendedor/mis-lotes", icon: <List size={20} />, label: "Mis Lotes" },
    { path: "/vendedor/solicitudes", icon: <Clock size={20} />, label: "Solicitudes de Compra" },
    { path: "/vendedor/ventas", icon: <TrendingUp size={20} />, label: "Mis Ventas" },
    { path: "/vendedor/mensajes", icon: <MessageCircle size={20} />, label: "Mensajes" },
    { path: "/vendedor/cuenta-bancaria", icon: <Building2 size={20} />, label: "Cuenta Bancaria" },
    { path: "/vendedor/configuracion", icon: <Settings size={20} />, label: "Configuración" },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button 
        className="mobile-menu-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Vendedor</h2>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink 
                  to={item.path} 
                  className={({ isActive }) => 
                    `nav-item ${isActive ? 'active' : ''}`
                  }
                  onClick={() => setIsOpen(false)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button 
            onClick={handleSwitchToBuyer} 
            className="switch-account-btn"
            disabled={switching}
          >
            <RefreshCw size={20} />
            <span>{switching ? 'Cambiando...' : 'Cambiar a Comprador'}</span>
          </button>
          
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
