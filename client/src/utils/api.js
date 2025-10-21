// Axios instance with auth token and base URL
import axios from 'axios';
import { SessionManager } from './sessionManager';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://fithub-api.onrender.com';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach token on each request if available
api.interceptors.request.use((config) => {
  const user = SessionManager.getCurrentUser();
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Global response handler: on 401, clear session and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      try {
        SessionManager.clearSession();
      } catch {}
      // Preserve current path to redirect back after login
      const currentPath = window.location.pathname;
      const search = window.location.search || '';
      const hash = window.location.hash || '';
      const from = encodeURIComponent(`${currentPath}${search}${hash}`);
      if (currentPath !== '/login') {
        window.location.replace(`/login?from=${from}`);
      }
    }
    return Promise.reject(error);
  }
);

export default api;