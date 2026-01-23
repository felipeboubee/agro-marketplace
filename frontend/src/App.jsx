import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import TestBankAPI from './pages/TestBankAPI';
import ProtectedRoute from './components/common/ProtectedRoute';
import BuyerLayout from './components/comprador/BuyerLayout';
import SellerLayout from './components/vendedor/SellerLayout';
import BankLayout from './components/banco/BankLayout';
import AdminLayout from './components/admin/AdminLayout';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/test-bank-api" element={<TestBankAPI />} />
        
        {/* Protected Routes */}
        <Route path="/comprador/*" element={
          <ProtectedRoute allowedRoles={['comprador']}>
            <BuyerLayout />
          </ProtectedRoute>
        } />
        
        <Route path="/vendedor/*" element={
          <ProtectedRoute allowedRoles={['vendedor']}>
            <SellerLayout />
          </ProtectedRoute>
        } />
        
        <Route path="/banco/*" element={
          <ProtectedRoute allowedRoles={['banco']}>
            <BankLayout />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/*" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        } />
        
        {/* Redirect to landing if no match */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;