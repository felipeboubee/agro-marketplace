import { Routes, Route } from "react-router-dom";
import AdminDashboard from "../pages/admin/AdminDashboard";
import UsersList from "../pages/admin/UsersList";
import AdminStats from "../pages/admin/AdminStats";
import AdminActivity from "../pages/admin/AdminActivity";
import AdminSettings from "../pages/admin/AdminSettings";
import NotFound from "../pages/NotFound";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
      <Route path="/users" element={<UsersList />} />
      <Route path="/stats" element={<AdminStats />} />
      <Route path="/activity" element={<AdminActivity />} />
      <Route path="/settings" element={<AdminSettings />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}