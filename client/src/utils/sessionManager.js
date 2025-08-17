// Session Management Utility

export const SessionManager = {
  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');
    return !!(token && userName && token !== 'null' && userName !== 'null');
  },

  // Get current user info
  getCurrentUser: () => {
    if (!SessionManager.isAuthenticated()) return null;
    
    return {
      name: localStorage.getItem('userName'),
      email: localStorage.getItem('userEmail'),
      role: localStorage.getItem('userRole') || 'user',
      token: localStorage.getItem('token')
    };
  },

  // Set user session
  setSession: (userData) => {
    localStorage.setItem('token', userData.token || '');
    localStorage.setItem('userName', userData.name || '');
    localStorage.setItem('userEmail', userData.email || '');
    localStorage.setItem('userRole', userData.role || 'user');
  },

  // Clear session
  clearSession: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
  },

  // Get redirect path based on user role
  getRedirectPath: (role) => {
    switch (role) {
      case 'admin':
        return '/admin-home';
      case 'trainer':
        return '/trainer-home';
      case 'user':
      default:
        return '/user-home';
    }
  },

  // Check if user has specific role
  hasRole: (requiredRole) => {
    const user = SessionManager.getCurrentUser();
    return user && user.role === requiredRole;
  }
};

export default SessionManager;