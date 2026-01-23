import { NavLink, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  ShoppingCart,
  FileCheck,
  LogOut,
  Settings,
  Menu,
  X,
  RefreshCw,
  ShoppingBag,
  Clock,
  CreditCard,
  MessageCircle
} from "lucide-react";
import { useState } from "react";
import { api } from "../../services/api";

export default function BuyerSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleSwitchToSeller = async () => {
    setSwitching(true);
    try {
      const response = await api.post('/auth/switch-account', {
        user_type: 'vendedor'
      });
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      navigate('/vendedor');
    } catch (error) {
      console.error('Error al cambiar de cuenta:', error);
      // Si falla, redirigir al login
      handleLogout();
    } finally {
      setSwitching(false);
    }
  };

  const navItems = [
    { path: "/comprador", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { path: "/comprador/lotes", icon: <ShoppingCart size={20} />, label: "Ver Lotes" },
    { path: "/comprador/mis-compras", icon: <ShoppingBag size={20} />, label: "Mis Compras" },
    { path: "/comprador/solicitudes", icon: <Clock size={20} />, label: "Solicitudes de Compra" },
    { path: "/comprador/mensajes", icon: <MessageCircle size={20} />, label: "Mensajes" },
    { path: "/comprador/certificaciones", icon: <FileCheck size={20} />, label: "Certificación Financiera" },    { path: "/comprador/medios-pago", icon: <CreditCard size={20} />, label: "Medios de Pago" },    { path: "/comprador/configuracion", icon: <Settings size={20} />, label: "Configuración" },
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
          <h2>Comprador</h2>
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
            onClick={handleSwitchToSeller} 
            className="switch-account-btn"
            disabled={switching}
          >
            <RefreshCw size={20} />
            <span>{switching ? 'Cambiando...' : 'Cambiar a Vendedor'}</span>
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
