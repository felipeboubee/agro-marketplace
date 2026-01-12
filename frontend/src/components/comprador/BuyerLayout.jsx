import { Routes, Route } from "react-router-dom";
import BuyerSidebar from "./BuyerSidebar";
import BuyerDashboard from "../../pages/comprador/BuyerDashboard";
import LoteList from "../../pages/comprador/LoteList";
import LoteDetail from "../../pages/comprador/LoteDetail";
import MyCertifications from "../../pages/comprador/MyCertifications";
import CertificationForm from "../../pages/comprador/CertificationForm";
import BuyerSettings from "../../pages/comprador/BuyerSettings";
import NotFound from "../../pages/NotFound";
import "../../styles/admin.css";

export default function BuyerLayout() {
  return (
    <div className="admin-layout">
      <BuyerSidebar />
      <main className="admin-main">
        <div className="admin-content">
          <Routes>
            <Route path="/" element={<BuyerDashboard />} />
            <Route path="/lotes" element={<LoteList />} />
            <Route path="/lote/:id" element={<LoteDetail />} />
            <Route path="/certificaciones" element={<MyCertifications />} />
            <Route path="/certificacion" element={<CertificationForm />} />
            <Route path="/configuracion" element={<BuyerSettings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
