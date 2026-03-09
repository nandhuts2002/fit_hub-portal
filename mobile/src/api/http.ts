import axios from 'axios';
import { API_BASE_URL } from '../config';
import { getAuthToken } from '../auth/authStore';

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

http.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const msg = (err.response?.data as any)?.msg || (err.response?.data as any)?.message;
    return msg || err.message || 'Request failed';
  }
  return 'Request failed';
}

