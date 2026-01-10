import { Settings, Save } from "lucide-react";

export default function AdminSettings() {
  return (
    <div className="dashboard-container">
      <div className="page-header">
        <h1>
          <Settings size={32} />
          Configuración del Sistema
        </h1>
      </div>
      
      <div className="dashboard-section">
        <h2>Configuración General</h2>
        <p>Página de configuración en desarrollo...</p>
      </div>
    </div>
  );
}