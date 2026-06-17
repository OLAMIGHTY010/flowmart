import { apiClient } from "./api";

export interface DashboardStats {
  activeUsers: number;
  activeEvents: number;
  deliveriesToday: number;
  platformUptime: number;
}

export interface DeliveryMetric {
  name: string;
  deliveries: number;
  returns: number;
}

export interface CriticalAlert {
  id: number;
  type: 'critical' | 'warning' | 'info';
  title: string;
  time: string;
}

export interface RecentActivity {
  id: number;
  type: string;
  description: string;
  time: string;
}

export interface PlatformHealth {
  name: string;
  status: 'Operational' | 'Degraded' | 'Down';
  latency: string;
  uptime: number;
}

export const AdminDashboardServices = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<{success: boolean, activeUsers: number, activeEvents: number, deliveriesToday: number, platformUptime: number}>('/admin/dashboard/stats');
    return {
      activeUsers: response.activeUsers,
      activeEvents: response.activeEvents,
      deliveriesToday: response.deliveriesToday,
      platformUptime: response.platformUptime,
    };
  },

  getChartData: async (): Promise<DeliveryMetric[]> => {
    const response = await apiClient.get<{success: boolean, data: DeliveryMetric[]}>('/admin/dashboard/chart');
    return response.data;
  },

  getAlerts: async (): Promise<CriticalAlert[]> => {
    const response = await apiClient.get<{success: boolean, alerts: CriticalAlert[]}>('/admin/dashboard/alerts');
    return response.alerts;
  },

  getActivity: async (): Promise<RecentActivity[]> => {
    const response = await apiClient.get<{success: boolean, activities: RecentActivity[]}>('/admin/dashboard/activity');
    return response.activities;
  },

  getHealth: async (): Promise<PlatformHealth[]> => {
    const response = await apiClient.get<{success: boolean, data: PlatformHealth[]}>('/admin/dashboard/health');
    return response.data;
  }
};
