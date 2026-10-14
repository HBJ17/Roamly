import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageLoader } from '../ui';

// Sends signed-out visitors to the right sign-in screen and returns them afterwards.
export function RequireRole({ roles, children }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!user) {
    const type = roles.length === 1 && roles[0] !== 'user' ? `&type=${roles[0]}` : '';
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}${type}`} replace />;
  }
  if (!roles.includes(role)) {
    const home = role === 'admin' ? '/admin' : role === 'agency' ? '/agency' : '/account';
    return <Navigate to={home} replace />;
  }
  return children;
}

// Partners and admins have their own consoles; traveller-only pages redirect them there.
export function TravellerOnly({ children }) {
  const { role, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (role === 'agency') return <Navigate to="/agency" replace />;
  if (role === 'admin') return <Navigate to="/admin" replace />;
  return children;
}
