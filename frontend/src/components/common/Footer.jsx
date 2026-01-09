import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/common.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="main-footer">
      <div className="container">
        <div className="footer-content">
          {/* Company Info */}
          <div className="footer-section">
            <div className="footer-logo">
              <div className="logo-icon">🐄</div>
              <h3>AgroMarket</h3>
            </div>
            <p className="footer-description">
              Plataforma líder en comercio agroganadero. Conectamos productores y compradores de forma segura y eficiente.
            </p>
            <div className="social-links">
              <a href="https://facebook.com" className="social-link">
                <span className="social-icon">📘</span>
              </a>
              <a href="https://twitter.com" className="social-link">
                <span className="social-icon">🐦</span>
              </a>
              <a href="https://instagram.com" className="social-link">
                <span className="social-icon">📷</span>
              </a>
              <a href="https://linkedin.com" className="social-link">
                <span className="social-icon">💼</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h4>Enlaces Rápidos</h4>
            <ul className="footer-links">
              <li><Link to="/">Inicio</Link></li>
              <li><Link to="/about">Acerca de</Link></li>
              <li><Link to="/contact">Contacto</Link></li>
              <li><Link to="/help">Ayuda</Link></li>
              <li><Link to="/blog">Blog</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div className="footer-section">
            <h4>Servicios</h4>
            <ul className="footer-links">
              <li><Link to="/comprador">Para Compradores</Link></li>
              <li><Link to="/vendedor">Para Vendedores</Link></li>
              <li><Link to="/banco">Para Bancos</Link></li>
              <li><Link to="/pricing">Precios</Link></li>
              <li><Link to="/api">API</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-section">
            <h4>Contacto</h4>
            <div className="contact-info">
              <div className="contact-item">
                <span className="contact-icon">📍</span>
                <span>Av. Corrientes 1234, CABA, Argentina</span>
              </div>
              <div className="contact-item">
                <span className="contact-icon">📞</span>
                <span>+54 11 1234-5678</span>
              </div>
              <div className="contact-item">
                <span className="contact-icon">✉️</span>
                <span>info@agromarket.com</span>
              </div>
              <div className="contact-item">
                <span className="contact-icon">🕒</span>
                <span>Lun-Vie: 9:00-18:00</span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="legal-links">
            <Link to="/privacy">Política de Privacidad</Link>
            <span className="divider">•</span>
            <Link to="/terms">Términos y Condiciones</Link>
            <span className="divider">•</span>
            <Link to="/cookies">Cookies</Link>
          </div>
          <div className="copyright">
            <p>© {currentYear} AgroMarket. Todos los derechos reservados.</p>
            <p className="version">v1.0.0</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;