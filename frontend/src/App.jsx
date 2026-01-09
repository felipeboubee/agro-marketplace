import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProtectedRoute from './components/common/ProtectedRoute';
import BuyerDashboard from './components/comprador/BuyerDashboard';
import SellerDashboard from './components/vendedor/SellerDashboard';
import BankDashboard from './components/banco/BankDashboard';
import AdminDashboard from './components/admin/AdminDashboard';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected Routes */}
        <Route path="/comprador/*" element={
          <ProtectedRoute allowedRoles={['comprador']}>
            <BuyerDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/vendedor/*" element={
          <ProtectedRoute allowedRoles={['vendedor']}>
            <SellerDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/banco/*" element={
          <ProtectedRoute allowedRoles={['banco']}>
            <BankDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/*" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        {/* Redirect to landing if no match */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;