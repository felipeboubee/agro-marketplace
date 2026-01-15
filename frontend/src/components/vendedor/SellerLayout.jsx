import { Routes, Route } from "react-router-dom";
import SellerSidebar from "./SellerSidebar";
import SellerDashboard from "../../pages/vendedor/SellerDashboard";
import CreateLote from "../../pages/vendedor/CreateLote";
import MyLotes from "../../pages/vendedor/MyLotes";
import LoteDetail from "../../pages/vendedor/LoteDetail";
import SellerSettings from "../../pages/vendedor/SellerSettings";
import PurchaseRequests from "../../pages/vendedor/PurchaseRequests";
import NotFound from "../../pages/NotFound";
import "../../styles/admin.css";

export default function SellerLayout() {
  return (
    <div className="admin-layout">
      <SellerSidebar />
      <main className="admin-main">
        <div className="admin-content">
          <Routes>
            <Route path="/" element={<SellerDashboard />} />
            <Route path="/crear" element={<CreateLote />} />
            <Route path="/mis-lotes" element={<MyLotes />} />
            <Route path="/lote/:id" element={<LoteDetail />} />
            <Route path="/solicitudes" element={<PurchaseRequests />} />
            <Route path="/configuracion" element={<SellerSettings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
