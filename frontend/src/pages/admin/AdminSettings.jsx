import { useState } from "react";
import { Settings, Save, Bell, Lock, Mail, Eye } from "lucide-react";
import "../../styles/dashboard.css";

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    systemAlerts: true,
    weeklyReports: false,
    maintenanceMode: false,
    twoFactorAuth: true,
    apiKey: "sk_live_51234567890abcdef",
    maxUsers: 1000,
    sessionTimeout: 30,
    apiRateLimit: 1000,
    minPasswordLength: 8,
    requireSpecialChars: true
  });

  const [saved, setSaved] = useState(false);

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setSaved(false);
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('adminSettings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleApiKeyVisibility = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: key === 'apiKey' && typeof prev[key] === 'string'
        ? prev[key].slice(0, 7) + '***' + prev[key].slice(-4)
        : prev[key]
    }));
  };

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <h1>
          <Settings size={32} />
          Configuración del Sistema
        </h1>
        <p style={{color: '#6b7280', marginTop: '8px'}}>Gestiona las preferencias y configuraciones del sistema</p>
      </div>

      {saved && (
        <div style={{
          backgroundColor: '#d1fae5',
          color: '#047857',
          padding: '12px 16px',
          borderRadius: '6px',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          ✓ Configuración guardada exitosamente
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        {/* Notificaciones */}
        <div className="settings-card" style={{backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '20px'}}>
          <div style={{display: 'flex', alignItems: 'center', marginBottom: '16px'}}>
            <Bell size={24} style={{color: '#3b82f6', marginRight: '12px'}} />
            <h3 style={{margin: 0}}>Notificaciones</h3>
          </div>
          
          <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
            <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
              <input 
                type="checkbox" 
                checked={settings.emailNotifications}
                onChange={() => handleToggle('emailNotifications')}
                style={{width: '18px', height: '18px', marginRight: '10px', cursor: 'pointer'}}
              />
              <span>Notificaciones por Email</span>
            </label>
            <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
              <input 
                type="checkbox" 
                checked={settings.systemAlerts}
                onChange={() => handleToggle('systemAlerts')}
                style={{width: '18px', height: '18px', marginRight: '10px', cursor: 'pointer'}}
              />
              <span>Alertas del Sistema</span>
            </label>
            <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
              <input 
                type="checkbox" 
                checked={settings.weeklyReports}
                onChange={() => handleToggle('weeklyReports')}
                style={{width: '18px', height: '18px', marginRight: '10px', cursor: 'pointer'}}
              />
              <span>Reportes Semanales</span>
            </label>
          </div>
        </div>

        {/* Seguridad */}
        <div className="settings-card" style={{backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '20px'}}>
          <div style={{display: 'flex', alignItems: 'center', marginBottom: '16px'}}>
            <Lock size={24} style={{color: '#ef4444', marginRight: '12px'}} />
            <h3 style={{margin: 0}}>Seguridad</h3>
          </div>
          
          <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
            <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
              <input 
                type="checkbox" 
                checked={settings.twoFactorAuth}
                onChange={() => handleToggle('twoFactorAuth')}
                style={{width: '18px', height: '18px', marginRight: '10px', cursor: 'pointer'}}
              />
              <span>Autenticación de Dos Factores</span>
            </label>
            <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
              <input 
                type="checkbox" 
                checked={settings.maintenanceMode}
                onChange={() => handleToggle('maintenanceMode')}
                style={{width: '18px', height: '18px', marginRight: '10px', cursor: 'pointer'}}
              />
              <span>Modo Mantenimiento</span>
            </label>
            <div style={{borderTop: '1px solid #d1d5db', paddingTop: '12px', marginTop: '12px'}}>
              <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', color: '#6b7280'}}>
                Timeout de Sesión (minutos)
              </label>
              <input 
                type="number" 
                value={settings.sessionTimeout}
                onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))}
                style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', boxSizing: 'border-box'}}
              />
            </div>
          </div>
        </div>

        {/* API */}
        <div className="settings-card" style={{backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '20px'}}>
          <div style={{display: 'flex', alignItems: 'center', marginBottom: '16px'}}>
            <Mail size={24} style={{color: '#8b5cf6', marginRight: '12px'}} />
            <h3 style={{margin: 0}}>Configuración API</h3>
          </div>
          
          <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
            <div>
              <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', color: '#6b7280'}}>
                API Key
              </label>
              <div style={{display: 'flex', gap: '8px'}}>
                <input 
                  type="password" 
                  value={settings.apiKey}
                  readOnly
                  style={{flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', boxSizing: 'border-box'}}
                />
                <button 
                  onClick={() => navigator.clipboard.writeText(settings.apiKey)}
                  style={{padding: '8px 12px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer'}}
                >
                  Copiar
                </button>
              </div>
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', color: '#6b7280'}}>
                Rate Limit (solicitudes/hora)
              </label>
              <input 
                type="number" 
                value={settings.apiRateLimit}
                onChange={(e) => handleChange('apiRateLimit', parseInt(e.target.value))}
                style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', boxSizing: 'border-box'}}
              />
            </div>
          </div>
        </div>

        {/* Políticas de Contraseña */}
        <div className="settings-card" style={{backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '20px'}}>
          <div style={{display: 'flex', alignItems: 'center', marginBottom: '16px'}}>
            <Lock size={24} style={{color: '#f59e0b', marginRight: '12px'}} />
            <h3 style={{margin: 0}}>Políticas de Contraseña</h3>
          </div>
          
          <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
            <div>
              <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', color: '#6b7280'}}>
                Longitud Mínima
              </label>
              <input 
                type="number" 
                value={settings.minPasswordLength}
                onChange={(e) => handleChange('minPasswordLength', parseInt(e.target.value))}
                style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', boxSizing: 'border-box'}}
              />
            </div>
            <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
              <input 
                type="checkbox" 
                checked={settings.requireSpecialChars}
                onChange={() => handleToggle('requireSpecialChars')}
                style={{width: '18px', height: '18px', marginRight: '10px', cursor: 'pointer'}}
              />
              <span>Requerir caracteres especiales</span>
            </label>
          </div>
        </div>

        {/* Límites del Sistema */}
        <div className="settings-card" style={{backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '20px'}}>
          <div style={{display: 'flex', alignItems: 'center', marginBottom: '16px'}}>
            <Settings size={24} style={{color: '#10b981', marginRight: '12px'}} />
            <h3 style={{margin: 0}}>Límites del Sistema</h3>
          </div>
          
          <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
            <div>
              <label style={{display: 'block', marginBottom: '8px', fontSize: '14px', color: '#6b7280'}}>
                Máximo de Usuarios
              </label>
              <input 
                type="number" 
                value={settings.maxUsers}
                onChange={(e) => handleChange('maxUsers', parseInt(e.target.value))}
                style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', boxSizing: 'border-box'}}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Botón Guardar */}
      <div style={{marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '12px'}}>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-secondary"
          style={{padding: '12px 24px'}}
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          className="btn btn-primary"
          style={{padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px'}}
        >
          <Save size={18} />
          Guardar Configuración
        </button>
      </div>
    </div>
  );
}