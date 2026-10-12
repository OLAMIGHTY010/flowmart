/**
 * ============================================================================
 * ADMIN AUTOMATION CONTROL PLANE SDK
 * ============================================================================
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/automation`,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const adminAutomationServices = {
  async getDashboardMetrics() {
    const res = await apiClient.get('/admin/dashboard');
    return res.data;
  },

  async triggerHeartbeat() {
    const res = await apiClient.post('/admin/heartbeat');
    return res.data;
  },

  async liftQuarantine(entity: string) {
    const res = await apiClient.post('/admin/fraud/lift-quarantine', { entity });
    return res.data;
  },

  async updateDisputeThreshold(thresholdNgn: number) {
    const res = await apiClient.post('/admin/dispute/threshold', { thresholdNgn });
    return res.data;
  },

  async syncFxRates(rates?: Record<string, number>) {
    const res = await apiClient.post('/admin/fx/sync', { rates });
    return res.data;
  },
};
