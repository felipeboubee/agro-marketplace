import { Routes, Route } from "react-router-dom";
import BankSidebar from "./BankSidebar";
import BankDashboard from "../../pages/banco/BankDashboard";
import Certifications from "../../pages/banco/Certifications";
import PaymentOrders from "../../pages/banco/PaymentOrders";
import VerificationRequests from "../../pages/banco/VerificationRequests";
import BankIntegration from "../../pages/banco/BankIntegration";
import BankSettings from "../../pages/banco/BankSettings";
import NotFound from "../../pages/NotFound";
import NotificationBell from "../NotificationBell/NotificationBell";
import "../../styles/admin.css";

export default function BankLayout() {
  return (
    <div className="admin-layout">
      <BankSidebar />
      <main className="admin-main">
        <div className="admin-header">
          <h1>Panel Bancario</h1>
          <NotificationBell />
        </div>
        <div className="admin-content">
          <Routes>
            <Route path="/" element={<BankDashboard />} />
            <Route path="/certificaciones" element={<Certifications />} />
            <Route path="/ordenes-pago" element={<PaymentOrders />} />
            <Route path="/verificaciones" element={<VerificationRequests />} />
            <Route path="/integracion" element={<BankIntegration />} />
            <Route path="/configuracion" element={<BankSettings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
