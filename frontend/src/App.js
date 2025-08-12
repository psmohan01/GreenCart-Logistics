import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Simulation from './pages/Simulation';
import DriversManagement from './pages/DriversManagement';
import RoutesManagement from './pages/RoutesManagement';
import OrdersManagement from './pages/OrdersManagement';
import SimulationHistory from './pages/SimulationHistory';
import SimulationDetail from './pages/SimulationDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

function App() {
  return (
    
      
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="simulation" element={<Simulation />} />
            <Route path="simulation/history" element={<SimulationHistory />} />
            <Route path="simulation/detail/:id" element={<SimulationDetail />} />
            <Route path="drivers" element={<DriversManagement />} />
            <Route path="routes" element={<RoutesManagement />} />
            <Route path="orders" element={<OrdersManagement />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Fallback Routes */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
  );
}

export default App;