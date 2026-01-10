import { Link } from "react-router-dom";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>Página no encontrada</h2>
        <p>La página que buscas no existe o ha sido movida.</p>
        <Link to="/admin" className="btn btn-primary">
          <Home size={20} />
          Volver al Dashboard
        </Link>
      </div>
    </div>
  );
}