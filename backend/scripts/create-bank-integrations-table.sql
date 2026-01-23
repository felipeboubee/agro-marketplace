-- Tabla para gestionar integraciones API de bancos
CREATE TABLE IF NOT EXISTS bank_integrations (
  id SERIAL PRIMARY KEY,
  bank_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  api_key VARCHAR(64) UNIQUE NOT NULL,
  api_secret VARCHAR(128) NOT NULL,
  webhook_url VARCHAR(500),
  webhook_secret VARCHAR(64),
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bank_integrations_bank_id ON bank_integrations(bank_id);
CREATE INDEX idx_bank_integrations_api_key ON bank_integrations(api_key);

-- Tabla para logs de webhooks
CREATE TABLE IF NOT EXISTS webhook_logs (
  id SERIAL PRIMARY KEY,
  bank_integration_id INTEGER NOT NULL REFERENCES bank_integrations(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhook_logs_bank_integration ON webhook_logs(bank_integration_id);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at);

COMMENT ON TABLE bank_integrations IS 'Configuración de integración API para bancos';
COMMENT ON TABLE webhook_logs IS 'Registro de notificaciones webhook enviadas a bancos';
