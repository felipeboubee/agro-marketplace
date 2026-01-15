import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api } from '../../services/api';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const [status, setStatus] = useState('loading'); // loading | ok | denied
  const [userRole, setUserRole] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token');
      const userRaw = localStorage.getItem('user');

      if (!token || !userRaw) {
        setStatus('denied');
        return;
      }

      const user = JSON.parse(userRaw);
      setUserRole(user.user_type);

      try {
        // Validación liviana del token
        await api.get('/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setStatus('ok');
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setStatus('denied');
      }
    };

    verifyAuth();
  }, [location.pathname]); // Re-verificar cuando cambia la ruta

  if (status === 'loading') {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Verificando autenticación...</p>
      </div>
    );
  }

  if (status === 'denied') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return (
      <div className="unauthorized-container">
        <div className="unauthorized-card">
          <div className="error-icon">🚫</div>
          <h2>Acceso no autorizado</h2>
          <p>Rol actual: <strong>{userRole}</strong></p>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
            className="btn btn-primary"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
