import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vyom_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalise error responses
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('vyom_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Fraud
export const fraudApi = {
  analyze: (data) => api.post('/fraud/analyze', data),
  history: (limit = 20) => api.get(`/fraud/history?limit=${limit}`),
};

// Scam
export const scamApi = {
  analyze: (data) => api.post('/scam/analyze', data),
  history: (limit = 20) => api.get(`/scam/history?limit=${limit}`),
};

// Dashboard
export const dashboardApi = {
  stats: () => api.get('/dashboard/stats'),
};

export default api;
