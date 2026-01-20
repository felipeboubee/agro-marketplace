import { Routes, Route } from "react-router-dom";
import BankSidebar from "./BankSidebar";
import BankDashboard from "../../pages/banco/BankDashboard";
import CertificationRequests from "../../pages/banco/CertificationRequests";
import PendingCertifications from "../../pages/banco/PendingCertifications";
import PaymentOrders from "../../pages/banco/PaymentOrders";
import BankSettings from "../../pages/banco/BankSettings";
import NotFound from "../../pages/NotFound";
import "../../styles/admin.css";

export default function BankLayout() {
  return (
    <div className="admin-layout">
      <BankSidebar />
      <main className="admin-main">
        <div className="admin-content">
          <Routes>
            <Route path="/" element={<BankDashboard />} />
            <Route path="/solicitudes" element={<CertificationRequests />} />
            <Route path="/aprobadas" element={<PendingCertifications />} />
            <Route path="/ordenes-pago" element={<PaymentOrders />} />
            <Route path="/configuracion" element={<BankSettings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
