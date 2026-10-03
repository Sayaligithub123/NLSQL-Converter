import axios from 'axios';

// Use relative /api with Vite proxy, or direct backend URL
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('nlsql_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token expiration / unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Do not clear token if we're attempting to login
      if (!error.config?.url?.includes('/auth/login') && !error.config?.url?.includes('/auth/register')) {
        localStorage.removeItem('nlsql_token');
        localStorage.removeItem('nlsql_user');
      }
    }
    return Promise.reject(error);
  }
);
