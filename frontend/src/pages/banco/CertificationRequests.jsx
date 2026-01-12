import React, { useState, useEffect } from 'react';
import { api } from "../../services/api";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import '../../styles/forms.css';

const CertificationRequests = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  });
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    more_data: 0,
    total: 0
  });

  useEffect(() => {
    fetchCertificationRequests();
  }, []);

  useEffect(() => {
    filterAndSortRequests();
  }, [requests, filters]);

  const fetchCertificationRequests = async () => {
    try {
      const response = await api.getBankCertifications();
      
      setRequests(response);
      calculateStats(response);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching certification requests:', error);
      setLoading(false);
    }
  };

  const calculateStats = (requestsList) => {
    const stats = {
      pending: requestsList.filter(r => r.status === 'pendiente').length,
      approved: requestsList.filter(r => r.status === 'aprobado').length,
      rejected: requestsList.filter(r => r.status === 'rechazado').length,
      more_data: requestsList.filter(r => r.status === 'mas_datos').length,
      total: requestsList.length
    };
    setStats(stats);
  };

  const filterAndSortRequests = () => {
    let result = [...requests];

    // Aplicar filtros
    if (filters.status !== 'all') {
      result = result.filter(req => req.status === filters.status);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(req => 
        req.user_name.toLowerCase().includes(searchLower) ||
        req.email.toLowerCase().includes(searchLower) ||
        req.bank_name.toLowerCase().includes(searchLower)
      );
    }

    // Aplicar ordenamiento
    result.sort((a, b) => {
      let aValue = a[filters.sort_by];
      let bValue = b[filters.sort_by];

      if (filters.sort_by === 'created_at' || filters.sort_by === 'reviewed_at') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      }

      if (filters.sort_order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredRequests(result);
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleStatusUpdate = async (requestId, status, notes = '') => {
    setActionLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const data = { status };
      if (notes) data.notes = notes;

      await api.put(`/certifications/${requestId}/status`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Actualizar lista localmente
      setRequests(requests.map(req => 
        req.id === requestId ? { ...req, status, notes } : req
      ));

      // Cerrar modal si está abierto
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(null);
      }

      alert(`Solicitud ${getStatusLabel(status)} exitosamente`);
    } catch (error) {
      console.error('Error updating certification status:', error);
      alert('Error al actualizar la solicitud');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pendiente': 'pendiente',
      'aprobado': 'aprobada',
      'rechazado': 'rechazada',
      'mas_datos': 'marcada como necesita más datos'
    };
    return labels[status] || status;
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pendiente': { label: 'Pendiente', class: 'badge-warning' },
      'aprobado': { label: 'Aprobado', class: 'badge-success' },
      'rechazado': { label: 'Rechazado', class: 'badge-danger' },
      'mas_datos': { label: 'Más Datos', class: 'badge-info' }
    };
    const badge = badges[status] || { label: status, class: 'badge-default' };
    return <span className={`badge ${badge.class}`}>{badge.label}</span>;
  };

  const formatFinancialData = (data) => {
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        return data;
      }
    }
    
    if (typeof data === 'object') {
      return (
        <div className="financial-data">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="financial-row">
              <span className="financial-key">{formatKey(key)}:</span>
              <span className="financial-value">{formatValue(key, value)}</span>
            </div>
          ))}
        </div>
      );
    }
    
    return data;
  };

  const formatKey = (key) => {
    const keyMap = {
      'monthly_income': 'Ingreso Mensual',
      'requested_amount': 'Monto Solicitado',
      'employment_status': 'Situación Laboral',
      'purpose': 'Finalidad',
      'assets': 'Activos',
      'liabilities': 'Pasivos'
    };
    return keyMap[key] || key.replace(/_/g, ' ');
  };

  const formatValue = (key, value) => {
    if (key.includes('amount') || key.includes('income')) {
      return `$${parseFloat(value).toLocaleString('es-AR')}`;
    }
    return value;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando solicitudes de certificación...</p>
      </div>
    );
  }

  return (
    <div className="certification-requests-container">
      <div className="page-header">
        <div>
          <h1>Solicitudes de Certificación</h1>
          <p>Gestiona las solicitudes de certificación de crédito</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline">
            <i className="fas fa-sync-alt"></i> Actualizar
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.pending}</h3>
            <p>Pendientes</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <h3>{stats.approved}</h3>
            <p>Aprobadas</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✗</div>
          <div className="stat-content">
            <h3>{stats.rejected}</h3>
            <p>Rechazadas</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>{stats.more_data}</h3>
            <p>Más Datos</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-card">
        <div className="filters-row">
          <div className="filter-group">
            <label>Estado</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="all">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="aprobado">Aprobadas</option>
              <option value="rechazado">Rechazadas</option>
              <option value="mas_datos">Más Datos</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Ordenar por</label>
            <select
              name="sort_by"
              value={filters.sort_by}
              onChange={handleFilterChange}
            >
              <option value="created_at">Fecha de solicitud</option>
              <option value="requested_amount">Monto solicitado</option>
              <option value="user_name">Nombre del usuario</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Orden</label>
            <select
              name="sort_order"
              value={filters.sort_order}
              onChange={handleFilterChange}
            >
              <option value="desc">Descendente</option>
              <option value="asc">Ascendente</option>
            </select>
          </div>
        </div>

        <div className="filter-group search-group">
          <label>Buscar</label>
          <div className="search-input-wrapper">
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Buscar por nombre o email..."
              className="search-input"
            />
            <i className="fas fa-search search-icon"></i>
          </div>
        </div>
      </div>

      {/* Lista de solicitudes */}
      <div className="requests-list">
        {filteredRequests.map((request) => (
          <div key={request.id} className="request-card">
            <div className="request-header">
              <div className="request-info">
                <h4>{request.user_name}</h4>
                <p className="request-email">{request.email}</p>
                <div className="request-meta">
                  <span>Solicitud #{request.id}</span>
                  <span>•</span>
                  <span>{format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}</span>
                </div>
              </div>
              <div className="request-status">
                {getStatusBadge(request.status)}
              </div>
            </div>

            <div className="request-content">
              <div className="request-details">
                <div className="detail-row">
                  <span className="detail-label">Banco:</span>
                  <span className="detail-value">{request.bank_name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Monto Solicitado:</span>
                  <span className="detail-value">
                    ${request.financial_data?.requested_amount?.toLocaleString('es-AR') || 'No especificado'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Teléfono:</span>
                  <span className="detail-value">{request.phone || 'No proporcionado'}</span>
                </div>
              </div>

              <div className="request-actions">
                <button
                  onClick={() => setSelectedRequest(request)}
                  className="btn btn-outline btn-small"
                >
                  <i className="fas fa-eye"></i> Ver Detalles
                </button>
                
                {request.status === 'pendiente' && (
                  <div className="action-buttons">
                    <button
                      onClick={() => handleStatusUpdate(request.id, 'aprobado')}
                      className="btn btn-success btn-small"
                      disabled={actionLoading}
                    >
                      <i className="fas fa-check"></i> Aprobar
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(request.id, 'mas_datos')}
                      className="btn btn-warning btn-small"
                      disabled={actionLoading}
                    >
                      <i className="fas fa-info-circle"></i> Más Datos
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(request.id, 'rechazado')}
                      className="btn btn-danger btn-small"
                      disabled={actionLoading}
                    >
                      <i className="fas fa-times"></i> Rechazar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de detalles */}
      {selectedRequest && (
        <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalles de la Solicitud #{selectedRequest.id}</h3>
              <button 
                className="modal-close"
                onClick={() => setSelectedRequest(null)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-sections">
                {/* Información del usuario */}
                <div className="detail-section">
                  <h4>
                    <i className="fas fa-user"></i> Información del Solicitante
                  </h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Nombre:</span>
                      <span className="detail-value">{selectedRequest.user_name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{selectedRequest.email}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Teléfono:</span>
                      <span className="detail-value">{selectedRequest.phone || 'No proporcionado'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Estado:</span>
                      <span className="detail-value">{getStatusBadge(selectedRequest.status)}</span>
                    </div>
                  </div>
                </div>

                {/* Datos financieros */}
                <div className="detail-section">
                  <h4>
                    <i className="fas fa-chart-line"></i> Datos Financieros
                  </h4>
                  <div className="financial-details">
                    {formatFinancialData(selectedRequest.financial_data)}
                  </div>
                </div>

                {/* Historial de la solicitud */}
                <div className="detail-section">
                  <h4>
                    <i className="fas fa-history"></i> Historial
                  </h4>
                  <div className="timeline">
                    <div className="timeline-item">
                      <div className="timeline-date">
                        {format(new Date(selectedRequest.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </div>
                      <div className="timeline-content">
                        <strong>Solicitud enviada</strong>
                        <p>El usuario envió la solicitud de certificación</p>
                      </div>
                    </div>

                    {selectedRequest.reviewed_at && (
                      <div className="timeline-item">
                        <div className="timeline-date">
                          {format(new Date(selectedRequest.reviewed_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </div>
                        <div className="timeline-content">
                          <strong>Solicitud {getStatusLabel(selectedRequest.status)}</strong>
                          <p>Revisado por el banco</p>
                          {selectedRequest.notes && (
                            <div className="timeline-notes">
                              <strong>Notas:</strong> {selectedRequest.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                onClick={() => setSelectedRequest(null)}
                className="btn btn-outline"
              >
                Cerrar
              </button>
              
              {selectedRequest.status === 'pendiente' && (
                <div className="action-buttons">
                  <button
                    onClick={() => {
                      const notes = prompt('¿Agregar notas para la aprobación? (opcional)');
                      handleStatusUpdate(selectedRequest.id, 'aprobado', notes);
                    }}
                    className="btn btn-success"
                    disabled={actionLoading}
                  >
                    <i className="fas fa-check"></i> Aprobar
                  </button>
                  <button
                    onClick={() => {
                      const notes = prompt('¿Qué información adicional necesita?');
                      if (notes) {
                        handleStatusUpdate(selectedRequest.id, 'mas_datos', notes);
                      }
                    }}
                    className="btn btn-warning"
                    disabled={actionLoading}
                  >
                    <i className="fas fa-info-circle"></i> Solicitar Más Datos
                  </button>
                  <button
                    onClick={() => {
                      const notes = prompt('¿Motivo del rechazo?');
                      if (notes) {
                        handleStatusUpdate(selectedRequest.id, 'rechazado', notes);
                      }
                    }}
                    className="btn btn-danger"
                    disabled={actionLoading}
                  >
                    <i className="fas fa-times"></i> Rechazar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {filteredRequests.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="fas fa-file-alt"></i>
          </div>
          <h3>No se encontraron solicitudes</h3>
          <p>No hay solicitudes que coincidan con tus filtros</p>
        </div>
      )}
    </div>
  );
};

export default CertificationRequests;