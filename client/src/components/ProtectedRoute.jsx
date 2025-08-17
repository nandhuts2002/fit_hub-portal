import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import SessionManager from '../utils/sessionManager';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const location = useLocation();
  const isAuthenticated = SessionManager.isAuthenticated();
  const currentUser = SessionManager.getCurrentUser();

  // If not authenticated, redirect to login with current location
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If specific role is required and user doesn't have it
  if (requiredRole && (!currentUser || currentUser.role !== requiredRole)) {
    // Redirect to appropriate dashboard based on user's actual role
    const redirectPath = SessionManager.getRedirectPath(currentUser?.role);
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;