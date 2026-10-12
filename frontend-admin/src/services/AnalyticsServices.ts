import { apiClient } from './api';

export interface PlatformOverview {
  totalTransactions: number;
  transactionGrowth: number;
  averageDeliveryTime: number;
  slaAdherence: number;
  activeVendors: number;
  vendorGrowth: number;
  systemUptime: number;
  activeRiders: number;
}

export interface DeliveryTrend {
  date: string;
  volume: number;
  returns: number;
}

export interface VendorPerformance {
  category: string;
  count: number;
  revenue: number;
  color: string;
}

export interface ZonePerformance {
  zone: string;
  completed: number;
  shortage: number;
}

export const AnalyticsServices = {
  getOverview: async (): Promise<PlatformOverview> => {
    const res = await apiClient.get<{ success: boolean, data: PlatformOverview }>('/admin/analytics/overview');
    return res.data;
  },

  getDeliveryTrends: async (): Promise<DeliveryTrend[]> => {
    const res = await apiClient.get<{ success: boolean, data: DeliveryTrend[] }>('/admin/analytics/delivery-trends');
    return res.data;
  },

  getVendorPerformance: async (): Promise<VendorPerformance[]> => {
    const res = await apiClient.get<{ success: boolean, data: VendorPerformance[] }>('/admin/analytics/vendor-performance');
    return res.data;
  },

  getZonePerformance: async (): Promise<ZonePerformance[]> => {
    const res = await apiClient.get<{ success: boolean, data: ZonePerformance[] }>('/admin/analytics/zone-performance');
    return res.data;
  },

  getDemandTrajectory: async (vendorId?: string) => {
    const res = await apiClient.get<{ success: boolean, data: any }>('/analytics/demand-trajectory', {
      params: vendorId ? { vendorId } : {}
    });
    return res.data;
  },

  getParetoMatrix: async (vendorId?: string) => {
    const res = await apiClient.get<{ success: boolean, data: any }>('/analytics/pareto-matrix', {
      params: vendorId ? { vendorId } : {}
    });
    return res.data;
  },

  getCohortRetention: async () => {
    const res = await apiClient.get<{ success: boolean, data: any }>('/analytics/cohort-retention');
    return res.data;
  },

  getLogisticsSla: async () => {
    const res = await apiClient.get<{ success: boolean, data: any }>('/analytics/logistics-sla');
    return res.data;
  },

  getEscrowFunnel: async () => {
    const res = await apiClient.get<{ success: boolean, data: any }>('/analytics/escrow-funnel');
    return res.data;
  },

  askDataCopilot: async (query: string) => {
    const res = await apiClient.post<{ success: boolean, data: any }>('/analytics/ask-data', { query });
    return res.data;
  }
};
