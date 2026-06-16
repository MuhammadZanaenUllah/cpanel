import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('cpanel_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      const url = err.config?.url || '';
      const hasToken = !!localStorage.getItem('cpanel_token');

      // Only redirect when an authenticated session expires.
      // Let the catch block handle login failures (wrong credentials → 401).
      if (hasToken && !url.includes('/login')) {
        localStorage.removeItem('cpanel_token');
        localStorage.removeItem('cpanel_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

export const getErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error?.message || err.message || 'Something went wrong';
  }
  return 'An unexpected error occurred';
};
