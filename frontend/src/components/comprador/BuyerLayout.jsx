import { Routes, Route } from "react-router-dom";
import BuyerSidebar from "./BuyerSidebar";
import BuyerDashboard from "../../pages/comprador/BuyerDashboard";
import LoteList from "../../pages/comprador/LoteList";
import LoteDetail from "../../pages/comprador/LoteDetail";
import MyCertifications from "../../pages/comprador/MyCertifications";
import CertificationForm from "../../pages/comprador/CertificationForm";
import BuyerSettings from "../../pages/comprador/BuyerSettings";
import MyPurchases from "../../pages/comprador/MyPurchases";
import PurchaseRequests from "../../pages/comprador/PurchaseRequests";
import ConfirmarPeso from "../../pages/comprador/ConfirmarPeso";
import PaymentMethods from "../../pages/comprador/PaymentMethods";
import Messages from "../../pages/Messages";
import NotFound from "../../pages/NotFound";
import NotificationBell from "../NotificationBell/NotificationBell";
import "../../styles/admin.css";

export default function BuyerLayout() {
  return (
    <div className="admin-layout">
      <BuyerSidebar />
      <main className="admin-main">
        <div className="admin-header">
          <h1>Panel de Comprador</h1>
          <NotificationBell />
        </div>
        <div className="admin-content">
          <Routes>
            <Route path="/" element={<BuyerDashboard />} />
            <Route path="/lotes" element={<LoteList />} />
            <Route path="/lote/:id" element={<LoteDetail />} />
            <Route path="/mis-compras" element={<MyPurchases />} />
            <Route path="/solicitudes" element={<PurchaseRequests />} />
            <Route path="/confirmar-peso/:id" element={<ConfirmarPeso />} />
            <Route path="/mensajes" element={<Messages />} />
            <Route path="/certificaciones" element={<MyCertifications />} />
            <Route path="/certificacion" element={<CertificationForm />} />
            <Route path="/medios-pago" element={<PaymentMethods />} />
            <Route path="/configuracion" element={<BuyerSettings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
