// Session Management Utility (robust + backward compatible)

export const SessionManager = {
  // Check if user is authenticated and not expired
  isAuthenticated: () => {
    try {
      const raw = localStorage.getItem('session');
      console.log('SessionManager.isAuthenticated - raw session:', raw);
      
      if (raw) {
        const session = JSON.parse(raw);
        console.log('SessionManager.isAuthenticated - parsed session:', session);
        
        if (!session || !session.token) {
          console.log('SessionManager.isAuthenticated - no session or token');
          return false;
        }
        
        if (session.expiresAt && Date.now() > Number(session.expiresAt)) {
          console.log('SessionManager.isAuthenticated - session expired');
          // Auto-clear expired session
          SessionManager.clearSession();
          return false;
        }
        
        console.log('SessionManager.isAuthenticated - session valid');
        return true;
      }
    } catch (err) {
      console.log('SessionManager.isAuthenticated - error parsing session:', err);
      // If session is corrupted, clear it
      SessionManager.clearSession();
    }

    // Fallback to legacy keys
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');
    console.log('SessionManager.isAuthenticated - legacy check:', { token, userName });
    return !!(token && userName && token !== 'null' && userName !== 'null');
  },

  // Get current user info
  getCurrentUser: () => {
    try {
      const raw = localStorage.getItem('session');
      if (raw) {
        const session = JSON.parse(raw);
        if (session && session.token) {
          if (session.expiresAt && Date.now() > Number(session.expiresAt)) return null;
          return {
            name: session.name || '',
            email: session.email || '',
            role: session.role || 'user',
            token: session.token,
          };
        }
      }
    } catch {}

    if (!SessionManager.isAuthenticated()) return null;
    return {
      name: localStorage.getItem('userName'),
      email: localStorage.getItem('userEmail'),
      role: localStorage.getItem('userRole') || 'user',
      token: localStorage.getItem('token')
    };
  },

  // Set user session (optionally with ttlMinutes)
  setSession: (userData, ttlMinutes = 60 * 24 * 7) => {
    // Migrate/clear cart & wishlist from previous user to user-scoped keys
    try {
      const prevRaw = localStorage.getItem('session');
      const prev = prevRaw ? JSON.parse(prevRaw) : null;
      const prevEmail = prev?.email;
      const newEmail = userData.email || '';
      if (prevEmail && newEmail && prevEmail !== newEmail) {
        const cart = localStorage.getItem('fithub-cart');
        if (cart) {
          localStorage.setItem(`fithub-cart:${prevEmail}`, cart);
          localStorage.removeItem('fithub-cart');
        }
        const wishlist = localStorage.getItem('fithub-wishlist');
        if (wishlist) {
          localStorage.setItem(`fithub-wishlist:${prevEmail}`, wishlist);
          localStorage.removeItem('fithub-wishlist');
        }
      }
    } catch {}

    const expiresAt = Date.now() + (ttlMinutes > 0 ? ttlMinutes * 60 * 1000 : 0);
    const session = {
      token: userData.token || '',
      name: userData.name || '',
      email: userData.email || '',
      role: userData.role || 'user',
      // 0 or undefined means no expiry; store only if positive
      ...(ttlMinutes > 0 ? { expiresAt } : {}),
    };
    localStorage.setItem('session', JSON.stringify(session));

    // Write legacy keys for backward compatibility with older code paths
    localStorage.setItem('token', session.token);
    localStorage.setItem('userName', session.name);
    localStorage.setItem('userEmail', session.email);
    localStorage.setItem('userRole', session.role);
  },

  // Clear session everywhere
  clearSession: () => {
    localStorage.removeItem('session');
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    // Also clear shared cart/wishlist to avoid leakage across guest/new users
    localStorage.removeItem('fithub-cart');
    localStorage.removeItem('fithub-wishlist');
    sessionStorage.clear();
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