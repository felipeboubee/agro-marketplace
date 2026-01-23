import React, { useState, useEffect } from 'react';
import { api } from "../services/api";
import { formatPrice } from '../utils/formatters';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TestBankAPI() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/payment-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching payment orders:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const simulateWebhook = async (orderId, action) => {
    setApiResponse({ loading: true });
    
    try {
      const token = localStorage.getItem('token');
      let response;
      
      switch(action) {
        case 'process':
          const reference = `BK-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
          response = await api.put(`/payment-orders/${orderId}/process`, 
            { bank_reference: reference },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setApiResponse({
            action: 'process',
            endpoint: `/payment-orders/${orderId}/process`,
            method: 'PUT',
            request: { bank_reference: reference },
            response: response,
            timestamp: new Date().toISOString()
          });
          break;
          
        case 'complete':
          response = await api.put(`/payment-orders/${orderId}/complete`, 
            { bank_api_response: JSON.stringify({ status: 'success', transaction_id: `TX-${Date.now()}` }) },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setApiResponse({
            action: 'complete',
            endpoint: `/payment-orders/${orderId}/complete`,
            method: 'PUT',
            request: { bank_api_response: { status: 'success', transaction_id: `TX-${Date.now()}` } },
            response: response,
            timestamp: new Date().toISOString()
          });
          break;
          
        case 'fail':
          response = await api.put(`/payment-orders/${orderId}/fail`, 
            { reason: 'Fondos insuficientes (Test)' },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setApiResponse({
            action: 'fail',
            endpoint: `/payment-orders/${orderId}/fail`,
            method: 'PUT',
            request: { reason: 'Fondos insuficientes (Test)' },
            response: response,
            timestamp: new Date().toISOString()
          });
          break;
      }
      
      fetchOrders();
    } catch (error) {
      setApiResponse({
        error: true,
        message: error.response?.data?.error || error.message,
        timestamp: new Date().toISOString()
      });
    }
  };

  const viewOrderDetails = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const order = await api.get(`/payment-orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedOrder(order);
      setApiResponse(null);
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Cargando...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <div style={{ background: '#1a1a1a', color: '#fff', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>🏦 Simulador de API Bancaria</h1>
        <p style={{ margin: 0, color: '#999' }}>Esta página simula cómo los bancos recibirían y procesarían órdenes de pago vía API</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Orders List */}
        <div>
          <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Órdenes de Pago</h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
              Total: {orders.length} | Pendientes: {orders.filter(o => o.status === 'pending').length} | 
              Procesando: {orders.filter(o => o.status === 'processing').length}
            </p>
          </div>

          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {orders.map(order => (
              <div 
                key={order.id}
                style={{
                  background: 'white',
                  border: selectedOrder?.id === order.id ? '2px solid #007bff' : '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '10px',
                  cursor: 'pointer'
                }}
                onClick={() => viewOrderDetails(order.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                  <div>
                    <strong style={{ fontSize: '16px' }}>Orden #{order.id}</strong>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      {order.order_type === 'provisional' ? '📋 Provisoria' : '✅ Final'}
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    background: order.status === 'pending' ? '#fff3cd' : 
                               order.status === 'processing' ? '#cfe2ff' : 
                               order.status === 'completed' ? '#d1e7dd' : '#f8d7da',
                    color: order.status === 'pending' ? '#856404' : 
                           order.status === 'processing' ? '#084298' : 
                           order.status === 'completed' ? '#0a3622' : '#721c24'
                  }}>
                    {order.status === 'pending' ? 'Pendiente' : 
                     order.status === 'processing' ? 'Procesando' : 
                     order.status === 'completed' ? 'Completado' : 'Fallido'}
                  </span>
                </div>

                <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  <div><strong>Monto:</strong> {formatPrice(order.amount)}</div>
                  <div><strong>Comprador:</strong> {order.buyer_name}</div>
                  <div><strong>Vendedor:</strong> {order.seller_name}</div>
                  <div><strong>Plazo:</strong> {order.payment_term === 'contado' ? 'Contado' : order.payment_term}</div>
                  <div><strong>Método:</strong> {order.payment_method || 'N/A'}</div>
                  {order.bank_reference && (
                    <div style={{ marginTop: '8px', padding: '8px', background: '#e7f3ff', borderRadius: '4px', fontSize: '12px' }}>
                      <strong>Ref. Bancaria:</strong> {order.bank_reference}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {order.status === 'pending' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); simulateWebhook(order.id, 'process'); }}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      ▶ Procesar
                    </button>
                  )}
                  {order.status === 'processing' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); simulateWebhook(order.id, 'complete'); }}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      ✓ Completar
                    </button>
                  )}
                  {['pending', 'processing'].includes(order.status) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); simulateWebhook(order.id, 'fail'); }}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      ✗ Rechazar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Details Panel */}
        <div>
          {selectedOrder ? (
            <div>
              <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                <h2 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>
                  Payload API - Orden #{selectedOrder.id}
                </h2>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                  Información que recibiría el banco vía webhook/API
                </p>
              </div>

              <div style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '20px', borderRadius: '8px', marginBottom: '10px', maxHeight: '500px', overflowY: 'auto' }}>
                <pre style={{ margin: 0, fontSize: '13px', lineHeight: '1.5', fontFamily: 'monospace' }}>
                  {JSON.stringify({
                    event: 'payment_order.created',
                    timestamp: selectedOrder.created_at,
                    data: {
                      order_id: selectedOrder.id,
                      transaction_id: selectedOrder.transaction_id,
                      order_type: selectedOrder.order_type,
                      status: selectedOrder.status,
                      amount: {
                        total: parseFloat(selectedOrder.amount),
                        currency: 'ARS',
                        platform_commission: parseFloat(selectedOrder.platform_commission || 0),
                        bank_commission: parseFloat(selectedOrder.bank_commission || 0),
                        seller_net_amount: parseFloat(selectedOrder.seller_net_amount || 0)
                      },
                      payment_details: {
                        term: selectedOrder.payment_term,
                        method: selectedOrder.payment_method,
                        payment_method_id: selectedOrder.payment_method_id,
                        due_date: selectedOrder.due_date,
                        negotiation_date: selectedOrder.negotiation_date
                      },
                      buyer: {
                        id: selectedOrder.buyer_id,
                        name: selectedOrder.buyer_name,
                        email: selectedOrder.buyer_email
                      },
                      seller: {
                        id: selectedOrder.seller_id,
                        name: selectedOrder.seller_name,
                        email: selectedOrder.seller_email,
                        bank_account_id: selectedOrder.seller_bank_account_id
                      },
                      dates: {
                        created_at: selectedOrder.created_at,
                        updated_at: selectedOrder.updated_at,
                        completed_at: selectedOrder.completed_at,
                        due_date: selectedOrder.due_date
                      },
                      references: {
                        bank_reference: selectedOrder.bank_reference,
                        transaction_reference: selectedOrder.id
                      }
                    }
                  }, null, 2)}
                </pre>
              </div>

              {apiResponse && (
                <div style={{ background: apiResponse.error ? '#f8d7da' : '#d1e7dd', padding: '15px', borderRadius: '8px', marginTop: '10px' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: apiResponse.error ? '#721c24' : '#0a3622' }}>
                    {apiResponse.loading ? '⏳ Procesando...' : apiResponse.error ? '❌ Error en API' : '✅ Respuesta de API'}
                  </h3>
                  {!apiResponse.loading && (
                    <div style={{ background: 'white', padding: '12px', borderRadius: '4px', fontSize: '13px', fontFamily: 'monospace' }}>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {JSON.stringify(apiResponse, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: '#f5f5f5', padding: '40px', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ color: '#666', fontSize: '14px' }}>
                👈 Selecciona una orden para ver los detalles del payload API
              </p>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '20px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '15px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#856404' }}>
          📋 Endpoints disponibles
        </h3>
        <div style={{ fontSize: '13px', lineHeight: '1.8', fontFamily: 'monospace', color: '#856404' }}>
          <div>• <strong>PUT</strong> /payment-orders/:id/process → Marca como procesando (requiere bank_reference)</div>
          <div>• <strong>PUT</strong> /payment-orders/:id/complete → Marca como completado (requiere bank_api_response)</div>
          <div>• <strong>PUT</strong> /payment-orders/:id/fail → Marca como fallido (requiere reason)</div>
          <div>• <strong>GET</strong> /payment-orders/:id → Obtiene detalles de una orden</div>
          <div>• <strong>GET</strong> /payment-orders → Lista todas las órdenes del banco</div>
        </div>
      </div>
    </div>
  );
}
