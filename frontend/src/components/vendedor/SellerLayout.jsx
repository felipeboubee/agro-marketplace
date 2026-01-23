import { Routes, Route } from "react-router-dom";
import SellerSidebar from "./SellerSidebar";
import SellerDashboard from "../../pages/vendedor/SellerDashboard";
import CreateLote from "../../pages/vendedor/CreateLote";
import MyLotes from "../../pages/vendedor/MyLotes";
import LoteDetail from "../../pages/vendedor/LoteDetail";
import SellerSettings from "../../pages/vendedor/SellerSettings";
import PurchaseRequests from "../../pages/vendedor/PurchaseRequests";
import MyTransactions from "../../pages/vendedor/MyTransactions";
import ActualizarPeso from "../../pages/vendedor/ActualizarPeso";
import BankAccount from "../../pages/vendedor/BankAccount";
import Messages from "../../pages/Messages";
import NotFound from "../../pages/NotFound";
import NotificationBell from "../NotificationBell/NotificationBell";
import "../../styles/admin.css";

export default function SellerLayout() {
  return (
    <div className="admin-layout">
      <SellerSidebar />
      <main className="admin-main">
        <div className="admin-header">
          <h1>Panel de Vendedor</h1>
          <NotificationBell />
        </div>
        <div className="admin-content">
          <Routes>
            <Route path="/" element={<SellerDashboard />} />
            <Route path="/crear" element={<CreateLote />} />
            <Route path="/mis-lotes" element={<MyLotes />} />
            <Route path="/lote/:id" element={<LoteDetail />} />
            <Route path="/solicitudes" element={<PurchaseRequests />} />
            <Route path="/ventas" element={<MyTransactions />} />
            <Route path="/actualizar-peso/:id" element={<ActualizarPeso />} />
            <Route path="/mensajes" element={<Messages />} />
            <Route path="/cuenta-bancaria" element={<BankAccount />} />
            <Route path="/configuracion" element={<SellerSettings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
