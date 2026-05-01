import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (email: string, password: string) =>
  apiClient.post('/auth/login', { email, password });

export const register = (email: string, password: string, name: string) =>
  apiClient.post('/auth/register', { email, password, name });

export const getMe = () => apiClient.get('/auth/me');

// Monitors
export const getMonitors = (params?: Record<string, string>) =>
  apiClient.get('/monitors', { params });

export const getMonitor = (id: string) => apiClient.get(`/monitors/${id}`);

export const createMonitor = (data: Record<string, unknown>) =>
  apiClient.post('/monitors', data);

export const updateMonitor = (id: string, data: Record<string, unknown>) =>
  apiClient.put(`/monitors/${id}`, data);

export const deleteMonitor = (id: string) => apiClient.delete(`/monitors/${id}`);

export const getMonitorChecks = (id: string, params?: Record<string, string>) =>
  apiClient.get(`/monitors/${id}/checks`, { params });

export const getMonitorUptimeHistory = (id: string, days = 90) =>
  apiClient.get(`/monitors/${id}/uptime-history`, { params: { days } });

// Incidents
export const getIncidents = (params?: Record<string, string>) =>
  apiClient.get('/incidents', { params });

export const getIncident = (id: string) => apiClient.get(`/incidents/${id}`);

export const createIncident = (data: Record<string, unknown>) =>
  apiClient.post('/incidents', data);

export const updateIncident = (id: string, data: Record<string, unknown>) =>
  apiClient.put(`/incidents/${id}`, data);

export const addIncidentUpdate = (id: string, data: Record<string, unknown>) =>
  apiClient.post(`/incidents/${id}/updates`, data);

export const deleteIncident = (id: string) => apiClient.delete(`/incidents/${id}`);

// Alert Channels
export const getAlertChannels = () => apiClient.get('/alert-channels');

export const createAlertChannel = (data: Record<string, unknown>) =>
  apiClient.post('/alert-channels', data);

export const deleteAlertChannel = (id: string) => apiClient.delete(`/alert-channels/${id}`);

// Analytics
export const getAnalyticsOverview = () => apiClient.get('/analytics/overview');
