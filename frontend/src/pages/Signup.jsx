import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from "../services/api";
import '../styles/auth.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dni: '',
    cuit_cuil: '',
    city: '',
    province: '',
    country: 'Argentina'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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

    // Validar contraseñas
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      // Construir nombre completo
      const fullName = `${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}`.trim();
      
      // Construir ubicación
      const location = `${formData.city}, ${formData.province}, ${formData.country}`;

      // Crear usuario comprador
      const compradorData = {
        name: fullName,
        email: formData.email,
        password: formData.password,
        user_type: 'comprador',
        phone: formData.phone,
        location: location,
        dni: formData.dni,
        cuit_cuil: formData.cuit_cuil
      };

      const compradorResponse = await api.post('/auth/register', compradorData);

      // Crear usuario vendedor con el mismo email pero diferente tipo
      const vendedorData = {
        ...compradorData,
        user_type: 'vendedor'
      };

      await api.post('/auth/register', vendedorData);
      
      // Auto-login con el usuario comprador por defecto
      localStorage.setItem('token', compradorResponse.token);
      localStorage.setItem('user', JSON.stringify(compradorResponse.user));
      
      // Redirigir al login para que elija qué quiere hacer
      navigate('/login');
    } catch (err) {
      console.error('Error completo:', err);
      console.error('Error message:', err.message);
      
      // Intentar parsear el mensaje de error
      let errorMessage = 'Error al registrar usuario';
      try {
        const errorData = JSON.parse(err.message);
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container-centered">
      <div className="auth-card-expanded">
        <div className="auth-header-centered">
          <Link to="/" className="back-home">
            ← Volver al inicio
          </Link>
          <h2>Crear Cuenta</h2>
          <p>Regístrate como Comprador y Vendedor</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">Nombre *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Juan"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="middleName">Segundo Nombre (Opcional)</label>
              <input
                type="text"
                id="middleName"
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
                placeholder="Carlos"
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Apellido *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Pérez"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email *</label>
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
              <label htmlFor="phone">Teléfono *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+54 11 1234-5678"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dni">DNI *</label>
              <input
                type="text"
                id="dni"
                name="dni"
                value={formData.dni}
                onChange={handleChange}
                placeholder="12345678"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="cuit_cuil">CUIT / CUIL *</label>
              <input
                type="text"
                id="cuit_cuil"
                name="cuit_cuil"
                value={formData.cuit_cuil}
                onChange={handleChange}
                placeholder="20-12345678-9"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Contraseña *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                minLength="6"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar Contraseña *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">Localidad *</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Buenos Aires"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="province">Provincia *</label>
              <input
                type="text"
                id="province"
                name="province"
                value={formData.province}
                onChange={handleChange}
                placeholder="Buenos Aires"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="country">País *</label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="Argentina"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" required />
              <span>
                Acepto los{' '}
                <Link to="/terms" className="inline-link">
                  Términos y Condiciones
                </Link>{' '}
                y la{' '}
                <Link to="/privacy" className="inline-link">
                  Política de Privacidad
                </Link>
              </span>
            </label>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="auth-link">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;