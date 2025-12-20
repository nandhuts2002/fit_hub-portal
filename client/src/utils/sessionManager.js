class SessionManager {
  static STORAGE_KEY = 'fitness_app_session';

  /**
   * Set user session data
   * @param {Object} userData - User data to store
   */
  static setSession(userData) {
    try {
      console.log('SessionManager.setSession called with:', userData);
      const sessionData = {
        ...userData,
        timestamp: Date.now()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionData));
      console.log('Session successfully set');
    } catch (error) {
      console.error('Failed to set session:', error);
    }
  }

  /**
   * Get raw session data
   * @returns {Object|null} Session data or null if not found/invalid
   */
  static getSession() {
    try {
      const sessionStr = localStorage.getItem(this.STORAGE_KEY);
      console.log('SessionManager.getSession - raw session:', sessionStr);

      if (!sessionStr) return null;

      const session = JSON.parse(sessionStr);

      // Check if session is expired (24 hours)
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      if (now - session.timestamp > oneDay) {
        console.log('Session expired, clearing...');
        this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }

  /**
   * Get current user data
   * @returns {Object|null} User data or null if not authenticated
   */
  static getCurrentUser() {
    const session = this.getSession();
    console.log('SessionManager.getCurrentUser - session:', session);
    return session;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if authenticated, false otherwise
   */
  static isAuthenticated() {
    try {
      const session = this.getSession();
      console.log('SessionManager.isAuthenticated - session:', session);

      // Legacy check for older session format
      if (!session) {
        const legacyToken = localStorage.getItem('token');
        const legacyUserName = localStorage.getItem('userName');
        console.log('SessionManager.isAuthenticated - legacy check:', { legacyToken: !!legacyToken, legacyUserName: !!legacyUserName });

        if (legacyToken && legacyUserName) {
          // Migrate legacy session
          this.setSession({
            token: legacyToken,
            name: legacyUserName,
            email: localStorage.getItem('userEmail') || '',
            role: localStorage.getItem('userRole') || 'user'
          });
          localStorage.removeItem('token');
          localStorage.removeItem('userName');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userRole');
          return true;
        }
        console.log('SessionManager.isAuthenticated - no valid session found');
        return false;
      }

      // Validate session has required fields
      const isValid = !!(session.token && session.name && session.email);
      console.log('SessionManager.isAuthenticated - validation result:', isValid, {
        hasToken: !!session.token,
        hasName: !!session.name,
        hasEmail: !!session.email,
        token: session.token ? 'present' : 'missing',
        name: session.name ? 'present' : 'missing',
        email: session.email ? 'present' : 'missing'
      });
      return isValid;
    } catch (error) {
      console.error('Authentication check failed:', error);
      return false;
    }
  }

  /**
   * Clear user session
   */
  static clearSession() {
    try {
      console.log('SessionManager.clearSession called');
      localStorage.removeItem(this.STORAGE_KEY);

      // Also clear legacy items if they exist
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  /**
   * Get redirect path based on user role
   * @param {string} role - User role
   * @returns {string} Redirect path
   */
  static getRedirectPath(role) {
    console.log('SessionManager.getRedirectPath called with role:', role);
    switch (role) {
      case 'admin':
        return '/admin-home';
      case 'trainer':
        return '/trainer-home';
      case 'user':
      default:
        return '/user-home';
    }
  }

  /**
   * Set avatar URL
   */
  static setAvatar(avatarUrl) {
    const session = this.getSession();
    if (session) {
      session.avatar = avatarUrl;
      this.setSession(session);
      console.log('Avatar updated:', avatarUrl);
    }
  }

  /**
   * Set current user data (update existing session)
   */
  static setCurrentUser(userData) {
    const session = this.getSession();
    if (session) {
      Object.assign(session, userData);
      this.setSession(session);
      console.log('User data updated');
    }
  }
}

export default SessionManager;