import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  Key, 
  Link as LinkIcon, 
  Copy, 
  RefreshCw, 
  Check, 
  AlertCircle,
  Send,
  Activity,
  Eye,
  EyeOff
} from 'lucide-react';
import '../../styles/bank-integration.css';

export default function BankIntegration() {
  const [integration, setIntegration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [showSecrets, setShowSecrets] = useState(false);
  const [copiedField, setCopiedField] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    fetchIntegration();
  }, []);

  const fetchIntegration = async () => {
    try {
      setLoading(true);
      const data = await api.get('/bank-integration/config');
      setIntegration(data);
      setWebhookUrl(data.webhook_url || '');
    } catch (error) {
      console.error('Error fetching integration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateCredentials = async () => {
    if (!window.confirm('¿Estás seguro? Las credenciales anteriores dejarán de funcionar.')) {
      return;
    }

    try {
      const data = await api.post('/bank-integration/regenerate');
      alert(data.message);
      setIntegration({ ...integration, ...data });
      setShowSecrets(true);
    } catch (error) {
      console.error('Error regenerating credentials:', error);
      alert('Error al regenerar credenciales');
    }
  };

  const handleUpdateWebhook = async () => {
    try {
      await api.put('/bank-integration/webhook', { webhook_url: webhookUrl });
      alert('Webhook actualizado exitosamente');
      await fetchIntegration();
    } catch (error) {
      console.error('Error updating webhook:', error);
      alert(error.response?.data?.error || 'Error al actualizar webhook');
    }
  };

  const handleTestWebhook = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const data = await api.post('/bank-integration/webhook/test');
      setTestResult({ success: true, message: data.message });
    } catch (error) {
      console.error('Error testing webhook:', error);
      setTestResult({ 
        success: false, 
        message: error.response?.data?.error || 'Error al probar webhook' 
      });
    } finally {
      setTesting(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      await api.put('/bank-integration/toggle', { is_active: !integration.is_active });
      await fetchIntegration();
    } catch (error) {
      console.error('Error toggling integration:', error);
      alert('Error al cambiar estado');
    }
  };

  const fetchLogs = async () => {
    try {
      const data = await api.get('/bank-integration/webhook/logs?limit=20');
      setLogs(data);
      setShowLogs(true);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  if (loading) {
    return <div className="loading">Cargando configuración...</div>;
  }

  return (
    <div className="bank-integration-container">
      <div className="page-header">
        <h1>
          <Key size={32} />
          Integración API
        </h1>
        <p>Conecta tus sistemas con Agro Marketplace usando nuestra API</p>
      </div>

      {/* Status Card */}
      <div className={`status-card ${integration?.is_active ? 'active' : 'inactive'}`}>
        <div className="status-info">
          <h3>Estado de la Integración</h3>
          <div className="status-badge">
            {integration?.is_active ? (
              <>
                <Check size={20} />
                <span>Activa</span>
              </>
            ) : (
              <>
                <AlertCircle size={20} />
                <span>Inactiva</span>
              </>
            )}
          </div>
          {integration?.last_used_at && (
            <p className="last-used">
              Último uso: {new Date(integration.last_used_at).toLocaleString('es-AR')}
            </p>
          )}
        </div>
        <button 
          className={`btn ${integration?.is_active ? 'btn-danger' : 'btn-success'}`}
          onClick={handleToggleActive}
        >
          {integration?.is_active ? 'Desactivar' : 'Activar'}
        </button>
      </div>

      {/* API Credentials */}
      <div className="config-section">
        <div className="section-header">
          <h2>
            <Key size={24} />
            Credenciales API
          </h2>
          <button 
            className="btn btn-secondary"
            onClick={handleRegenerateCredentials}
          >
            <RefreshCw size={18} />
            Regenerar Credenciales
          </button>
        </div>

        <div className="credentials-grid">
          <div className="credential-item">
            <label>API Key</label>
            <div className="credential-value">
              <code>{integration?.api_key}</code>
              <button 
                className="btn-icon"
                onClick={() => copyToClipboard(integration?.api_key, 'api_key')}
                title="Copiar"
              >
                {copiedField === 'api_key' ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          <div className="credential-item">
            <label>API Secret</label>
            <div className="credential-value">
              {showSecrets && integration?.api_secret ? (
                <code>{integration.api_secret}</code>
              ) : (
                <code>{integration?.api_secret_preview}</code>
              )}
              <button 
                className="btn-icon"
                onClick={() => setShowSecrets(!showSecrets)}
                title={showSecrets ? "Ocultar" : "Mostrar"}
              >
                {showSecrets ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {showSecrets && integration?.api_secret && (
                <button 
                  className="btn-icon"
                  onClick={() => copyToClipboard(integration.api_secret, 'api_secret')}
                  title="Copiar"
                >
                  {copiedField === 'api_secret' ? <Check size={18} /> : <Copy size={18} />}
                </button>
              )}
            </div>
            <small className="help-text">
              ⚠️ Guarda el secret en un lugar seguro. Solo se muestra completo al generarlo.
            </small>
          </div>
        </div>

        <div className="api-docs">
          <h3>Cómo usar la API</h3>
          <p>Incluye tu API Key en el header de cada request:</p>
          <pre><code>X-API-Key: {integration?.api_key}</code></pre>
          
          <h4>Endpoints disponibles:</h4>
          <ul>
            <li><code>GET /api/bank/certifications</code> - Obtener solicitudes de certificación</li>
            <li><code>GET /api/bank/certifications/:id</code> - Detalles de una certificación</li>
            <li><code>GET /api/bank/payment-orders</code> - Obtener órdenes de pago</li>
            <li><code>GET /api/bank/payment-orders/:id</code> - Detalles de una orden de pago</li>
          </ul>

          <h4>Parámetros de consulta:</h4>
          <ul>
            <li><code>status</code> - Filtrar por estado (pendiente_aprobacion, aprobado, rechazado)</li>
            <li><code>limit</code> - Límite de resultados (default: 100)</li>
            <li><code>offset</code> - Offset para paginación (default: 0)</li>
          </ul>
        </div>
      </div>

      {/* Webhook Configuration */}
      <div className="config-section">
        <div className="section-header">
          <h2>
            <LinkIcon size={24} />
            Configuración Webhook
          </h2>
          <button 
            className="btn btn-secondary"
            onClick={fetchLogs}
          >
            <Activity size={18} />
            Ver Logs
          </button>
        </div>

        <div className="webhook-config">
          <p>
            Recibe notificaciones en tiempo real cuando hay nuevas certificaciones u órdenes de pago.
          </p>

          <div className="form-group">
            <label>URL del Webhook (HTTPS)</label>
            <div className="webhook-input-group">
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://tu-sistema.com/webhooks/agro-marketplace"
                className="form-input"
              />
              <button 
                className="btn btn-primary"
                onClick={handleUpdateWebhook}
                disabled={!webhookUrl}
              >
                Guardar
              </button>
            </div>
          </div>

          {integration?.webhook_secret && (
            <div className="credential-item">
              <label>Webhook Secret</label>
              <div className="credential-value">
                <code>{integration.webhook_secret_preview}</code>
                <small className="help-text">
                  Verifica este secret en el header <code>X-Webhook-Secret</code>
                </small>
              </div>
            </div>
          )}

          {webhookUrl && (
            <button 
              className="btn btn-secondary"
              onClick={handleTestWebhook}
              disabled={testing}
            >
              <Send size={18} />
              {testing ? 'Enviando...' : 'Probar Webhook'}
            </button>
          )}

          {testResult && (
            <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
              {testResult.success ? <Check size={20} /> : <AlertCircle size={20} />}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        <div className="webhook-docs">
          <h3>Eventos Webhook</h3>
          <ul>
            <li><strong>certification.created</strong> - Nueva solicitud de certificación</li>
            <li><strong>payment_order.created</strong> - Nueva orden de pago</li>
          </ul>

          <h4>Formato del payload:</h4>
          <pre><code>{`{
  "event": "certification.created",
  "timestamp": "2026-01-21T10:30:00Z",
  "data": {
    "certification_id": 123,
    "user_id": 456,
    "user_name": "Juan Pérez",
    "bank_name": "Banco Nación",
    "status": "pendiente_aprobacion",
    "created_at": "2026-01-21T10:30:00Z"
  }
}`}</code></pre>
        </div>
      </div>

      {/* Webhook Logs Modal */}
      {showLogs && (
        <div className="modal-overlay" onClick={() => setShowLogs(false)}>
          <div className="modal-content logs-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Logs de Webhooks</h3>
              <button className="btn-icon" onClick={() => setShowLogs(false)}>×</button>
            </div>
            <div className="modal-body">
              {logs.length === 0 ? (
                <p className="empty-state">No hay logs de webhooks</p>
              ) : (
                <div className="logs-list">
                  {logs.map(log => (
                    <div key={log.id} className={`log-item ${log.error_message ? 'error' : 'success'}`}>
                      <div className="log-header">
                        <span className="log-event">{log.event_type}</span>
                        <span className="log-status">{log.response_status || 'Error'}</span>
                        <span className="log-time">
                          {new Date(log.created_at).toLocaleString('es-AR')}
                        </span>
                      </div>
                      {log.error_message && (
                        <div className="log-error">{log.error_message}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
