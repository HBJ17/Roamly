import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import PackagesPage from './pages/PackagesPage';
import PackageDetailPage from './pages/PackageDetailPage';
import HotelsPage from './pages/HotelsPage';
import TransportsPage from './pages/TransportsPage';
import ItineraryBuilderPage from './pages/ItineraryBuilderPage';
import ComparePage from './pages/ComparePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AgencyPortalPage from './pages/AgencyPortalPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import { useAuth } from './context/AuthContext';

// Protected Route Guard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default function App() {
  return (
    <>
      <div className="halftone-bg"></div>
      <Navbar />
      <main style={{ minHeight: 'calc(100vh - 280px)' }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/packages" element={<PackagesPage />} />
          <Route path="/packages/:id" element={<PackageDetailPage />} />
          <Route path="/hotels" element={<HotelsPage />} />
          <Route path="/transports" element={<TransportsPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* User / Explorer Desk */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['user', 'agency', 'admin']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/itinerary"
            element={
              <ProtectedRoute allowedRoles={['user', 'agency', 'admin']}>
                <ItineraryBuilderPage />
              </ProtectedRoute>
            }
          />

          {/* Partner Agency Desk */}
          <Route
            path="/agency/*"
            element={
              <ProtectedRoute allowedRoles={['agency', 'admin']}>
                <AgencyPortalPage />
              </ProtectedRoute>
            }
          />

          {/* Central Admin Console */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* 404 Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
