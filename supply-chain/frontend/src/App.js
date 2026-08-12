import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import Suppliers from './components/Suppliers/Suppliers';
import Inventory from './components/Inventory/Inventory';
import Orders from './components/Orders/Orders';
import Shipments from './components/Shipments/Shipments';
import Reports from './components/Reports/Reports';
import Forecasting from './components/Forecasting/Forecasting';
import Traceability from './components/Traceability/Traceability';
import Risk from './components/Risk/Risk';
import Automation from './components/Automation/Automation';
import IoT from './components/IoT/IoT';
import Admin from './components/Admin/Admin';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', fontSize:14, color:'#64748b' }}>Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="orders"    element={<Orders />} />
        <Route path="shipments" element={<Shipments />} />
        <Route path="reports"   element={<Reports />} />
        <Route path="forecasting" element={<Forecasting />} />
        <Route path="traceability" element={<Traceability />} />
        <Route path="risk" element={<Risk />} />
        <Route path="automation" element={<Automation />} />
        <Route path="iot" element={<IoT />} />
        <Route path="admin"     element={<Admin />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000, style: { fontSize: 13 } }} />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
