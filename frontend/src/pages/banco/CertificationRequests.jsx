import React, { useState, useEffect } from 'react';
import { api } from "../../services/api";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileCheck, Filter, RefreshCw, Eye, User, Clock, CheckCircle, XCircle, Calendar, DollarSign, Upload } from 'lucide-react';
import '../../styles/dashboard.css';

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
      console.log('Fetching certifications...');
      const response = await api.getBankCertifications();
      console.log('Certifications received:', response);
      
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
      pending: requestsList.filter(r => r.status === 'pendiente_aprobacion').length,
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
        req.user_name?.toLowerCase().includes(searchLower) ||
        req.email?.toLowerCase().includes(searchLower) ||
        req.bank_name?.toLowerCase().includes(searchLower)
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

  const handleRefresh = () => {
    setLoading(true);
    fetchCertificationRequests();
  };

  const resetFilters = () => {
    setFilters({
      status: 'all',
      search: '',
      sort_by: 'created_at',
      sort_order: 'desc'
    });
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
      await api.updateCertificationStatus(requestId, status, notes);

      // Actualizar lista localmente
      setRequests(requests.map(req => 
        req.id === requestId ? { ...req, status, notes } : req
      ));

      // Cerrar modal si está abierto
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(null);
      }

      alert(`Solicitud actualizada exitosamente`);
      fetchCertificationRequests();
    } catch (error) {
      console.error('Error updating certification status:', error);
      alert('Error al actualizar la solicitud');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pendiente_aprobacion': { label: 'Pendiente', class: 'status-badge', icon: Clock },
      'aprobado': { label: 'Aprobado', class: 'status-badge status-aprobado', icon: CheckCircle },
      'rechazado': { label: 'Rechazado', class: 'status-badge status-rechazado', icon: XCircle },
      'mas_datos': { label: 'Más Datos', class: 'status-badge status-mas-datos', icon: FileCheck }
    };
    const badge = badges[status] || { label: status, class: 'status-badge', icon: Clock };
    const Icon = badge.icon;
    return (
      <span className={badge.class}>
        <Icon size={14} />
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando solicitudes de certificación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <h1>
          <FileCheck size={32} />
          Solicitudes de Certificación
        </h1>
        <div className="header-actions">
          <button 
            className="btn btn-secondary"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw size={20} className={loading ? "spin" : ""} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card stat-blue">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>Pendientes</h3>
            <p className="stat-value">{stats.pending}</p>
          </div>
        </div>

        <div className="stat-card stat-green">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>Aprobadas</h3>
            <p className="stat-value">{stats.approved}</p>
          </div>
        </div>

        <div className="stat-card stat-orange">
          <div className="stat-icon">
            <XCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>Rechazadas</h3>
            <p className="stat-value">{stats.rejected}</p>
          </div>
        </div>

        <div className="stat-card stat-purple">
          <div className="stat-icon">
            <FileCheck size={24} />
          </div>
          <div className="stat-content">
            <h3>Más Datos</h3>
            <p className="stat-value">{stats.more_data}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-container">
        <div className="filters-header">
          <Filter size={20} />
          <h3>Filtros de Búsqueda</h3>
          <button 
            className="btn btn-text"
            onClick={resetFilters}
          >
            Limpiar filtros
          </button>
        </div>

        <div className="filters-grid">
          <div className="filter-group">
            <label>Estado</label>
            <select 
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="select-input"
            >
              <option value="all">Todos</option>
              <option value="pendiente_aprobacion">Pendientes</option>
              <option value="aprobado">Aprobadas</option>
              <option value="rechazado">Rechazadas</option>
              <option value="mas_datos">Más Datos</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Buscar</label>
            <input 
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Nombre, email..."
              className="select-input"
            />
          </div>

          <div className="filter-group">
            <label>Ordenar por</label>
            <select 
              name="sort_by"
              value={filters.sort_by}
              onChange={handleFilterChange}
              className="select-input"
            >
              <option value="created_at">Fecha de solicitud</option>
              <option value="reviewed_at">Fecha de revisión</option>
              <option value="user_name">Nombre</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Orden</label>
            <select 
              name="sort_order"
              value={filters.sort_order}
              onChange={handleFilterChange}
              className="select-input"
            >
              <option value="desc">Descendente</option>
              <option value="asc">Ascendente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Solicitudes */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Solicitudes ({filteredRequests.length})</h2>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="empty-state">
            <FileCheck size={48} />
            <p>No hay solicitudes {filters.status !== 'all' ? `con estado "${filters.status}"` : ''}</p>
            {filters.status !== 'all' && (
              <button onClick={resetFilters} className="btn btn-primary">
                <Filter size={20} />
                Limpiar Filtros
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Solicitante</th>
                  <th>Email</th>
                  <th>Estado</th>
                  <th>Fecha Solicitud</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="id-cell">#{request.id}</td>
                    <td>
                      <div className="cell-with-icon">
                        <User size={16} />
                        {request.user_name}
                      </div>
                    </td>
                    <td>{request.email}</td>
                    <td>{getStatusBadge(request.status)}</td>
                    <td>
                      <div className="cell-with-icon">
                        <Calendar size={16} />
                        {format(new Date(request.created_at), "dd/MM/yyyy", { locale: es })}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          onClick={() => setSelectedRequest(request)}
                          className="btn btn-sm btn-primary"
                          title="Ver detalles"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      {selectedRequest && (
        <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalle de Solicitud #{selectedRequest.id}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {getStatusBadge(selectedRequest.status)}
                <button onClick={() => setSelectedRequest(null)} className="btn btn-icon">×</button>
              </div>
            </div>
            
            <div className="modal-body">
              {/* Datos Personales - Combinado con Información del Solicitante */}
              {selectedRequest.personal_info && (
                <div className="detail-section">
                  <h3>Datos Personales</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <strong>Email:</strong> {selectedRequest.email}
                    </div>
                    <div className="detail-item">
                      <strong>Teléfono:</strong> {selectedRequest.phone || '—'}
                    </div>
                    <div className="detail-item">
                      <strong>Primer Nombre:</strong> {selectedRequest.personal_info.first_name || '—'}
                    </div>
                    <div className="detail-item">
                      <strong>Segundo Nombre:</strong> {selectedRequest.personal_info.second_name || '—'}
                    </div>
                    <div className="detail-item">
                      <strong>Apellido:</strong> {selectedRequest.personal_info.last_name || '—'}
                    </div>
                    <div className="detail-item">
                      <strong>DNI:</strong> {selectedRequest.personal_info.dni || '—'}
                    </div>
                    <div className="detail-item">
                      <strong>Fecha de Nacimiento:</strong> {selectedRequest.personal_info.birth_date ? format(new Date(selectedRequest.personal_info.birth_date), "dd/MM/yyyy", { locale: es }) : '—'}
                    </div>
                    <div className="detail-item">
                      <strong>Nacionalidad:</strong> {selectedRequest.personal_info.nationality || '—'}
                    </div>
                  </div>
                </div>
              )}

              {selectedRequest.employment_info && (
                <div className="detail-section">
                  <h3>Información Laboral</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <strong>Estado Laboral:</strong> {selectedRequest.employment_info.employment_status === 'empleado' ? 'Empleado' : selectedRequest.employment_info.employment_status === 'autonomo' ? 'Autónomo' : selectedRequest.employment_info.employment_status === 'empresario' ? 'Empresario' : 'Desempleado'}
                    </div>
                    <div className="detail-item">
                      <strong>Empleador:</strong> {selectedRequest.employment_info.employer_name || '—'}
                    </div>
                    <div className="detail-item">
                      <strong>Cargo:</strong> {selectedRequest.employment_info.position || '—'}
                    </div>
                    <div className="detail-item">
                      <strong>Ingreso Mensual:</strong> {selectedRequest.employment_info.monthly_income ? `$${parseFloat(selectedRequest.employment_info.monthly_income).toLocaleString('es-AR')}` : '—'}
                    </div>
                    <div className="detail-item">
                      <strong>Años Empleado:</strong> {selectedRequest.employment_info.years_employed || '—'}
                    </div>
                  </div>
                </div>
              )}

              {selectedRequest.financial_info && (
                <div className="detail-section">
                  <h3>Información Financiera</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <strong>Gastos Mensuales:</strong> {selectedRequest.financial_info.monthly_expenses ? `$${parseFloat(selectedRequest.financial_info.monthly_expenses).toLocaleString('es-AR')}` : '—'}
                    </div>
                    <div className="detail-item">
                      <strong>Activos:</strong> {selectedRequest.financial_info.assets ? `$${parseFloat(selectedRequest.financial_info.assets).toLocaleString('es-AR')}` : '—'}
                    </div>
                    <div className="detail-item">
                      <strong>Pasivos:</strong> {selectedRequest.financial_info.liabilities ? `$${parseFloat(selectedRequest.financial_info.liabilities).toLocaleString('es-AR')}` : '—'}
                    </div>
                  </div>
                </div>
              )}

              <div className="detail-section">
                <h3>Información Bancaria y Solicitud</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>Banco Solicitado:</strong> {selectedRequest.bank_name}
                  </div>
                  <div className="detail-item">
                    <strong>Fecha de Solicitud:</strong> {format(new Date(selectedRequest.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                  </div>
                  {selectedRequest.reviewed_at && (
                    <div className="detail-item">
                      <strong>Fecha de Revisión:</strong> {format(new Date(selectedRequest.reviewed_at), "dd/MM/yyyy HH:mm", { locale: es })}
                    </div>
                  )}
                </div>
              </div>

              {selectedRequest.income_proof_path && (
                <div className="detail-section">
                  <h3>Documentación</h3>
                  <a 
                    href={`http://localhost:5000${selectedRequest.income_proof_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                  >
                    <Upload size={18} />
                    Ver Comprobante de Ingresos
                  </a>
                </div>
              )}

              {selectedRequest.status === 'pendiente_aprobacion' && (
                <div className="modal-actions">
                  <button 
                    onClick={() => handleStatusUpdate(selectedRequest.id, 'aprobado')}
                    className="btn btn-success"
                    disabled={actionLoading}
                  >
                    <CheckCircle size={16} />
                    Aprobar
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(selectedRequest.id, 'rechazado')}
                    className="btn btn-danger"
                    disabled={actionLoading}
                  >
                    <XCircle size={16} />
                    Rechazar
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(selectedRequest.id, 'mas_datos')}
                    className="btn btn-secondary"
                    disabled={actionLoading}
                  >
                    <FileCheck size={16} />
                    Solicitar Más Datos
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificationRequests;
