import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/landing.css';

const Landing = () => {
  return (
    <div className="landing-container">
      {/* Header */}
      <header className="landing-header">
        <div className="container">
          <nav className="navbar">
            <div className="logo">
              <h1>AgroMarket</h1>
              <p>Mercado Agroganadero Digital</p>
            </div>
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline">Iniciar Sesión</Link>
              <Link to="/signup" className="btn btn-primary">Registrarse</Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h2>Conectamos Productores y Compradores de Hacienda</h2>
            <p className="hero-description">
              Plataforma digital especializada en la comercialización de ganado. 
              Transparencia, seguridad y eficiencia en cada transacción.
            </p>
            <div className="hero-buttons">
              <Link to="/signup" className="btn btn-primary btn-large">
                Comenzar Gratis
              </Link>
              <a href="#features" className="btn btn-outline btn-large">
                Conocer Más
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <h2 className="section-title">¿Cómo Funciona?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">👨‍🌾</div>
              <h3>Para Vendedores</h3>
              <ul>
                <li>Publica tus lotes fácilmente</li>
                <li>Accede a precios de mercado en tiempo real</li>
                <li>Gestiona tus transacciones</li>
                <li>Amplía tu red de contactos</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🏢</div>
              <h3>Para Compradores</h3>
              <ul>
                <li>Encuentra el mejor ganado</li>
                <li>Compara precios y calidades</li>
                <li>Solicita certificación bancaria</li>
                <li>Múltiples opciones de pago</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🏦</div>
              <h3>Para Bancos</h3>
              <ul>
                <li>Gestiona solicitudes de certificación</li>
                <li>Monitorea transacciones</li>
                <li>Analiza perfiles financieros</li>
                <li>Expande tu cartera de clientes</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Market Prices Section */}
      <section className="prices-section">
        <div className="container">
          <h2 className="section-title">Precios del Mercado de Liniers</h2>
          <div className="prices-table">
            <table>
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Precio Min.</th>
                  <th>Precio Max.</th>
                  <th>Tendencia</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Novillitos</td>
                  <td>$4.850</td>
                  <td>$5.200</td>
                  <td className="trend-up">↑ 2.3%</td>
                </tr>
                <tr>
                  <td>Vaquillonas</td>
                  <td>$4.500</td>
                  <td>$4.800</td>
                  <td className="trend-down">↓ 1.5%</td>
                </tr>
                <tr>
                  <td>Vacas</td>
                  <td>$4.200</td>
                  <td>$4.500</td>
                  <td className="trend-up">↑ 0.8%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Únete a la Revolución Agroganadera</h2>
          <p>
            Miles de productores ya confían en nuestra plataforma. 
            Simplifica tus operaciones y maximiza tus beneficios.
          </p>
          <Link to="/signup" className="btn btn-primary btn-xlarge">
            Crear Cuenta Gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>AgroMarket</h4>
              <p>Transformando el mercado ganadero argentino.</p>
            </div>
            <div className="footer-section">
              <h4>Contacto</h4>
              <p>info@agromarket.com</p>
              <p>+54 11 1234-5678</p>
            </div>
            <div className="footer-section">
              <h4>Legal</h4>
              <p>Términos y Condiciones</p>
              <p>Política de Privacidad</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2024 AgroMarket. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;