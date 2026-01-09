import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../../styles/common.css';

const Header = () => {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '#';
    switch(user.user_type) {
      case 'comprador': return '/comprador';
      case 'vendedor': return '/vendedor';
      case 'banco': return '/banco';
      case 'admin': return '/admin';
      default: return '/';
    }
  };

  const getUserLabel = () => {
    if (!user) return '';
    const labels = {
      'comprador': 'Comprador',
      'vendedor': 'Vendedor',
      'banco': 'Banco',
      'admin': 'Administrador'
    };
    return labels[user.user_type] || 'Usuario';
  };

  return (
    <header className="main-header">
      <div className="container">
        <nav className="navbar">
          <div className="nav-brand">
            <Link to="/" className="logo-link">
              <div className="logo-icon">🐄</div>
              <div className="logo-text">
                <h1>AgroMarket</h1>
                <span className="logo-subtitle">Mercado Agroganadero</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="nav-desktop">
            {user ? (
              <div className="user-nav">
                <div className="user-info">
                  <span className="user-type-badge">{getUserLabel()}</span>
                  <span className="user-name">{user.name}</span>
                </div>
                <div className="nav-links">
                  <Link to={getDashboardLink()} className="nav-link">
                    <span className="nav-icon">🏠</span>
                    Dashboard
                  </Link>
                  <Link to="/perfil" className="nav-link">
                    <span className="nav-icon">👤</span>
                    Perfil
                  </Link>
                  <button onClick={handleLogout} className="nav-link logout-btn">
                    <span className="nav-icon">🚪</span>
                    Salir
                  </button>
                </div>
              </div>
            ) : (
              <div className="auth-links">
                <Link to="/login" className="btn btn-outline">
                  Iniciar Sesión
                </Link>
                <Link to="/signup" className="btn btn-primary">
                  Registrarse
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span className="toggle-icon">☰</span>
          </button>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="nav-mobile">
              {user ? (
                <>
                  <div className="mobile-user-info">
                    <div className="user-avatar">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4>{user.name}</h4>
                      <p className="user-email">{user.email}</p>
                    </div>
                  </div>
                  <div className="mobile-links">
                    <Link 
                      to={getDashboardLink()} 
                      className="mobile-link"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="link-icon">🏠</span>
                      Dashboard
                    </Link>
                    <Link 
                      to="/perfil" 
                      className="mobile-link"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="link-icon">👤</span>
                      Mi Perfil
                    </Link>
                    <div className="mobile-divider"></div>
                    <button 
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }} 
                      className="mobile-link logout-link"
                    >
                      <span className="link-icon">🚪</span>
                      Cerrar Sesión
                    </button>
                  </div>
                </>
              ) : (
                <div className="mobile-auth">
                  <Link 
                    to="/login" 
                    className="btn btn-outline btn-block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Iniciar Sesión
                  </Link>
                  <Link 
                    to="/signup" 
                    className="btn btn-primary btn-block"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;