// Axios instance with auth token and base URL
import axios from 'axios';
import { SessionManager } from './sessionManager';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

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

export default api;