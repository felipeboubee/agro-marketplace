import { NavLink, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileCheck,
  CheckCircle,
  LogOut,
  Settings,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

export default function BankSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const navItems = [
    { path: "/banco", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { path: "/banco/solicitudes", icon: <FileCheck size={20} />, label: "Solicitudes" },
    { path: "/banco/aprobadas", icon: <CheckCircle size={20} />, label: "Aprobadas" },
    { path: "/banco/configuracion", icon: <Settings size={20} />, label: "Configuración" },
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
          <h2>Banco</h2>
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
