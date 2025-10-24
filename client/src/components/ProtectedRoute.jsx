import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import SessionManager from '../utils/sessionManager';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const location = useLocation();
  const isAuthenticated = SessionManager.isAuthenticated();
  const currentUser = SessionManager.getCurrentUser();

  // Debug logging
  console.log('ProtectedRoute check:', {
    path: location.pathname,
    isAuthenticated,
    currentUser: currentUser?.role,
    requiredRole
  });

  // If not authenticated, redirect to login with current location
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    console.log('Current location:', location);
    // We need to preserve the search parameters as well
    const searchParams = new URLSearchParams(location.search);
    const from = encodeURIComponent(location.pathname + location.search + location.hash);
    console.log('Redirecting to login with from parameter:', from);
    console.log('Full redirect URL:', `/login?from=${from}`);
    return <Navigate to={`/login?from=${from}`} replace />;
  }

  // Medical acknowledgement gate for first-time users
  try {
    const RAW_KEY = 'medical_ack_v2';
    const DAYS_VALID = 365; // re-ack yearly
    const raw = localStorage.getItem(RAW_KEY);
    let ack = null;
    try { ack = raw ? JSON.parse(raw) : null; } catch {}
    const isMedicalPage = location.pathname.startsWith('/services/medical-check');
    // Gate only for normal users; allow admins/trainers to bypass
    const role = currentUser?.role || 'user';
    const ageDays = ack?.ts ? Math.floor((Date.now() - Number(ack.ts)) / (1000*60*60*24)) : Infinity;
    const needsAck = !ack?.accepted || ageDays > DAYS_VALID;
    if (role === 'user' && needsAck && !isMedicalPage) {
      const next = encodeURIComponent(location.pathname + (location.search || ''));
      console.log('Medical acknowledgement required, redirecting to medical check');
      return <Navigate to={`/services/medical-check?next=${next}`} replace />;
    }
  } catch (error) {
    console.error('Error in medical acknowledgement check:', error);
  }

  // If specific role is required and user doesn't have it
  if (requiredRole && (!currentUser || currentUser.role !== requiredRole)) {
    console.log('Role mismatch, redirecting to appropriate dashboard');
    // Redirect to appropriate dashboard based on user's actual role
    const redirectPath = SessionManager.getRedirectPath(currentUser?.role);
    console.log('Redirecting to:', redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  console.log('Access granted to protected route');
  return children;
};

export default ProtectedRoute;