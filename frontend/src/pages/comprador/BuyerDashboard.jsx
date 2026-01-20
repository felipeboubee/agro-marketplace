import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, TrendingUp, FileCheck, DollarSign, Plus, Clock, XCircle, CheckCircle, Eye, Package } from 'lucide-react';
import { api } from '../../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import '../../styles/dashboard.css';

export default function BuyerDashboard() {
  const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  const [stats, setStats] = useState({
    totalPurchases: 0,
    activePurchases: 0,
    completedTransactions: 0,
    totalSpent: 0,
    certificationStatus: 'no_certified',
    certificationDetails: null
  });
  const [recentOffers, setRecentOffers] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const [statsData, offersData, transactionsData] = await Promise.all([
        api.getBuyerStats(),
        api.getMyOffers(),
        api.get('/transactions/buyer')
      ]);
      
      console.log('BuyerDashboard - Stats received:', statsData);
      console.log('BuyerDashboard - Certification status:', statsData.certificationStatus);
      console.log('BuyerDashboard - Certification details:', statsData.certificationDetails);
      setStats(statsData);
      
      // Get last 5 offers
      setRecentOffers((offersData || []).slice(0, 5));
      
      // Get last 5 transactions
      setRecentTransactions((transactionsData || []).slice(0, 5));
    } catch (error) {
      console.error('Error loading buyer dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">Cargando estadísticas...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h1>
            <ShoppingCart size={32} />
            Panel del Comprador
          </h1>
          <p>Bienvenido, {user?.name}</p>
        </div>
        <Link to="/comprador/lotes" className="btn btn-primary">
          <ShoppingCart size={20} />
          Explorar Lotes
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-blue">
          <div className="stat-icon">
            <ShoppingCart size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Compras</h3>
            <p className="stat-value">{stats.totalPurchases}</p>
          </div>
        </div>

        <div className="stat-card stat-green">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>Compras Activas</h3>
            <p className="stat-value">{stats.activePurchases}</p>
          </div>
        </div>

        <div className="stat-card stat-purple">
          <div className="stat-icon">
            <FileCheck size={24} />
          </div>
          <div className="stat-content">
            <h3>Transacciones Completadas</h3>
            <p className="stat-value">{stats.completedTransactions}</p>
          </div>
        </div>

        <div className="stat-card stat-orange">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Comprado</h3>
            <p className="stat-value">${stats.totalSpent.toLocaleString('es-AR')}</p>
          </div>
        </div>
      </div>

      {/* Certification Status Banner */}
      <div className={`info-card ${
        stats.certificationStatus === 'certified' ? 'success-banner' : 
        stats.certificationStatus === 'pending' ? 'info-banner' :
        stats.certificationStatus === 'rejected' ? 'warning-banner' :
        'warning-banner'
      }`}>
        <div className="banner-content">
          {stats.certificationStatus === 'certified' && <CheckCircle size={32} />}
          {stats.certificationStatus === 'pending' && <Clock size={32} />}
          {stats.certificationStatus === 'rejected' && <XCircle size={32} />}
          {stats.certificationStatus === 'no_certified' && <FileCheck size={32} />}
          
          <div className="banner-text">
            <h3>Certificación Financiera</h3>
            {stats.certificationStatus === 'certified' && (
              <p>
                Tienes {stats.certificationDetails?.count > 1 ? `${stats.certificationDetails.count} certificaciones activas` : 'certificación activa'} con {stats.certificationDetails?.bank}. 
                Accede a mejores condiciones de compra.
              </p>
            )}
            {stats.certificationStatus === 'pending' && (
              <p>
                Tienes {stats.certificationDetails?.count > 1 ? `${stats.certificationDetails.count} solicitudes pendientes` : 'una solicitud pendiente'} de revisión con {stats.certificationDetails?.bank}.
                Te notificaremos cuando sea revisada.
              </p>
            )}
            {stats.certificationStatus === 'rejected' && (
              <p>
                Tu última solicitud con {stats.certificationDetails?.bank} fue rechazada. 
                Puedes solicitar certificación con otro banco.
              </p>
            )}
            {stats.certificationStatus === 'no_certified' && (
              <p>
                No tienes certificación financiera. Solicita una para acceder a financiamiento y mejores condiciones.
              </p>
            )}
          </div>
          
          <Link to="/comprador/certificaciones" className="btn btn-primary">
            {stats.certificationStatus === 'certified' ? (
              <>
                <FileCheck size={20} />
                Ver Certificaciones
              </>
            ) : (
              <>
                <Plus size={20} />
                {stats.certificationStatus === 'pending' ? 'Ver Estado' : 'Solicitar Certificación'}
              </>
            )}
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="actions-section">
        <h2>Acciones Rápidas</h2>
        <div className="actions-grid">
          <Link to="/comprador/lotes" className="action-card">
            <ShoppingCart size={32} />
            <h3>Explorar Lotes</h3>
            <p>Ver lotes disponibles para compra</p>
          </Link>

          <Link to="/comprador/certificaciones" className="action-card">
            <FileCheck size={32} />
            <h3>Certificación</h3>
            <p>Ver y gestionar tu certificación</p>
          </Link>
        </div>
      </div>

      {/* Recent Offers */}
      {recentOffers.length > 0 && (
        <div className="recent-section">
          <div className="section-header">
            <h2>
              <Clock size={24} />
              Últimas Solicitudes de Compra
            </h2>
            <Link to="/comprador/solicitudes" className="btn btn-outline btn-sm">
              Ver todas
            </Link>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Lote</th>
                  <th className="text-center">Cantidad</th>
                  <th className="text-center">Precio</th>
                  <th className="text-center">Total</th>
                  <th className="text-center">Fecha</th>
                  <th className="text-center">Estado</th>
                  <th className="text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {recentOffers.map((offer) => (
                  <tr key={offer.id}>
                    <td>
                      <div className="lote-info">
                        <strong>{offer.animal_type}</strong>
                        <span className="text-muted">{offer.breed}</span>
                      </div>
                    </td>
                    <td className="text-center number-cell">{offer.total_count}</td>
                    <td className="text-center price-cell">
                      ${parseFloat(offer.offered_price).toFixed(2)}/kg
                    </td>
                    <td className="text-center">
                      <strong>
                        ${(parseFloat(offer.offered_price) * parseFloat(offer.total_count) * parseFloat(offer.average_weight)).toLocaleString('es-AR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </strong>
                    </td>
                    <td className="text-center">
                      {format(new Date(offer.created_at), 'dd/MM/yyyy', { locale: es })}
                    </td>
                    <td className="text-center">
                      {offer.is_counter_offer ? (
                        <span className="status-badge badge-info">Contraoferta</span>
                      ) : offer.status === 'pendiente' ? (
                        <span className="status-badge badge-warning">Pendiente</span>
                      ) : offer.status === 'rechazada' ? (
                        <span className="status-badge badge-danger">Rechazada</span>
                      ) : (
                        <span className="status-badge badge-default">{offer.status}</span>
                      )}
                    </td>
                    <td className="text-center">
                      <Link 
                        to={`/comprador/lote/${offer.lote_id}`}
                        className="btn btn-sm btn-primary"
                        title="Ver lote"
                      >
                        <Eye size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <div className="recent-section">
          <div className="section-header">
            <h2>
              <Package size={24} />
              Últimas Compras
            </h2>
            <Link to="/comprador/compras" className="btn btn-outline btn-sm">
              Ver todas
            </Link>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Lote</th>
                  <th className="text-center">Cantidad</th>
                  <th className="text-center">Precio Acordado</th>
                  <th className="text-center">Total</th>
                  <th className="text-center">Fecha</th>
                  <th className="text-center">Estado</th>
                  <th className="text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>
                      <div className="lote-info">
                        <strong>{transaction.animal_type}</strong>
                        <span className="text-muted">{transaction.breed}</span>
                      </div>
                    </td>
                    <td className="text-center number-cell">{transaction.total_count}</td>
                    <td className="text-center price-cell">
                      ${parseFloat(transaction.agreed_price_per_kg).toFixed(2)}/kg
                    </td>
                    <td className="text-center">
                      <strong>
                        ${(parseFloat(transaction.estimated_total) || 0).toLocaleString('es-AR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </strong>
                    </td>
                    <td className="text-center">
                      {format(new Date(transaction.created_at), 'dd/MM/yyyy', { locale: es })}
                    </td>
                    <td className="text-center">
                      {transaction.status === 'pending_weight' ? (
                        <span className="status-badge badge-warning">Pendiente Peso</span>
                      ) : transaction.status === 'weight_confirmed' ? (
                        <span className="status-badge badge-info">Peso Confirmado</span>
                      ) : transaction.status === 'payment_pending' ? (
                        <span className="status-badge badge-warning">Pago Pendiente</span>
                      ) : transaction.status === 'payment_processing' ? (
                        <span className="status-badge badge-info">Procesando Pago</span>
                      ) : transaction.status === 'completed' ? (
                        <span className="status-badge badge-success">Completada</span>
                      ) : (
                        <span className="status-badge badge-default">{transaction.status}</span>
                      )}
                    </td>
                    <td className="text-center">
                      {transaction.status === 'weight_confirmed' && !transaction.buyer_confirmed_weight ? (
                        <Link 
                          to={`/comprador/confirmar-peso/${transaction.id}`}
                          className="btn btn-sm btn-success"
                          title="Confirmar peso"
                        >
                          <CheckCircle size={16} />
                        </Link>
                      ) : (
                        <Link 
                          to="/comprador/compras"
                          className="btn btn-sm btn-primary"
                          title="Ver detalle"
                        >
                          <Eye size={16} />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
