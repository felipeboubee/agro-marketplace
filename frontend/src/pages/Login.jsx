import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from "../services/api";
import '../styles/auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [tempCredentials, setTempCredentials] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Intentar login primero como comprador
      const compradorResponse = await api.post('/auth/login', {
        ...formData,
        user_type: 'comprador'
      });

      // Verificar si también existe como vendedor
      try {
        await api.post('/auth/login', {
          ...formData,
          user_type: 'vendedor'
        });
        
        // Si ambos existen, mostrar selector
        setTempCredentials({
          comprador: compradorResponse,
          email: formData.email,
          password: formData.password
        });
        setShowRoleSelector(true);
        setLoading(false);
        return;
      } catch (vendedorErr) {
        // Solo existe como comprador, login directo
        loginWithResponse(compradorResponse);
      }
    } catch (compradorErr) {
      // No existe como comprador, intentar como otros roles
      try {
        const response = await api.post('/auth/login', formData);
        loginWithResponse(response);
      } catch (err) {
        setError(err.message || 'Credenciales inválidas');
        setLoading(false);
      }
    }
  };

  const handleRoleSelection = async (role) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email: tempCredentials.email,
        password: tempCredentials.password,
        user_type: role
      });
      loginWithResponse(response);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
      setLoading(false);
    }
  };

  const loginWithResponse = (response) => {
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));

    const userType = response.user.user_type;

    switch (userType) {
      case 'comprador':
        navigate('/comprador');
        break;
      case 'vendedor':
        navigate('/vendedor');
        break;
      case 'banco':
        navigate('/banco');
        break;
      case 'admin':
        navigate('/admin');
        break;
      default:
        navigate('/');
    }
  };

  if (showRoleSelector) {
    return (
      <div className="auth-container-centered">
        <div className="role-selector-card">
          <div className="auth-header">
            <h2>¿Qué quieres hacer?</h2>
            <p>Selecciona cómo deseas ingresar</p>
          </div>

          <div className="role-selector">
            <button
              className="role-option"
              onClick={() => handleRoleSelection('comprador')}
              disabled={loading}
            >
              <div className="role-icon">🛒</div>
              <h3>Comprar</h3>
              <p>Buscar y adquirir ganado</p>
            </button>

            <button
              className="role-option"
              onClick={() => handleRoleSelection('vendedor')}
              disabled={loading}
            >
              <div className="role-icon">💰</div>
              <h3>Vender</h3>
              <p>Publicar tus lotes</p>
            </button>
          </div>

          <button 
            className="btn btn-secondary btn-block"
            onClick={() => {
              setShowRoleSelector(false);
              setTempCredentials(null);
            }}
            style={{ marginTop: '20px' }}
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="back-home">
            ← Volver al inicio
          </Link>
          <h2>Iniciar Sesión</h2>
          <p>Accede a tu cuenta de AgroMarket</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input type="checkbox" name="remember" />
              <span>Recordarme</span>
            </label>
            <Link to="/forgot-password" className="forgot-password">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            ¿No tienes cuenta?{' '}
            <Link to="/signup" className="auth-link">
              Regístrate aquí
            </Link>
          </p>
          <div className="social-login">
            <p>O inicia sesión con:</p>
            <div className="social-buttons">
              <button type="button" className="btn btn-outline btn-social">
                <img src="/google-icon.png" alt="Google" />
                Google
              </button>
              <button type="button" className="btn btn-outline btn-social">
                <img src="/facebook-icon.png" alt="Facebook" />
                Facebook
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-sidebar">
        <div className="sidebar-content">
          <h3>Bienvenido de nuevo</h3>
          <p>
            Accede a tu panel personalizado según tu perfil:
          </p>
          <ul className="user-types">
            <li>
              <strong>Compradores:</strong> Encuentra los mejores lotes
            </li>
            <li>
              <strong>Vendedores:</strong> Gestiona tus publicaciones
            </li>
            <li>
              <strong>Bancos:</strong> Administra certificaciones
            </li>
            <li>
              <strong>Administradores:</strong> Supervisa la plataforma
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;