import { apiClient } from './api';

export interface CoordinatorOverview {
  deliverySuccessRate: number;
  successRateGrowth: number;
  totalQrDistributed: number;
  qrGrowth: number;
  avgCompletionTime: string;
  completionTimeTrend: string;
  riderEfficiencyScore: number;
  riderEfficiencyGrowth: number;
  deliveredZones: number;
  totalZones: number;
  pendingZones: number;
  activeRiders: number;
  totalRiders: number;
  criticalAlerts: number;
}

export interface CoordinatorDeliveryTrend {
  period: string;
  rate: number;
}

export interface ZonePerformance {
  zone: string;
  allocated: number;
  delivered: number;
}

export interface RiderEfficiency {
  name: string;
  score: number;
}

export interface EventMetric {
  name: string;
  date: string;
  zones: number;
  riders: number;
  qrIds: number;
  ratio: string;
  status: string;
}

export interface ShortageIncident {
  zone: string;
  vendorMismatchRate: string;
  ridersCurrentDay: string;
  teamCountsDist: string;
  vendorDailyRun: string;
  midDay1: string;
  midDay2: string;
  midDay3: string;
}

export const CoordinatorAnalyticsServices = {
  getOverview: async (): Promise<CoordinatorOverview> => {
    const res = await apiClient.get<{ success: boolean, data: CoordinatorOverview }>('/admin/coordinator-analytics/overview');
    return res.data;
  },
  getDeliveryTrends: async (): Promise<CoordinatorDeliveryTrend[]> => {
    const res = await apiClient.get<{ success: boolean, data: CoordinatorDeliveryTrend[] }>('/admin/coordinator-analytics/delivery-trends');
    return res.data;
  },
  getZonePerformance: async (): Promise<ZonePerformance[]> => {
    const res = await apiClient.get<{ success: boolean, data: ZonePerformance[] }>('/admin/coordinator-analytics/zone-performance');
    return res.data;
  },
  getRiderEfficiency: async (): Promise<RiderEfficiency[]> => {
    const res = await apiClient.get<{ success: boolean, data: RiderEfficiency[] }>('/admin/coordinator-analytics/rider-efficiency');
    return res.data;
  },
  getEventMetrics: async (): Promise<EventMetric[]> => {
    const res = await apiClient.get<{ success: boolean, data: EventMetric[] }>('/admin/coordinator-analytics/event-metrics');
    return res.data;
  },
  getShortageIncidents: async (): Promise<ShortageIncident[]> => {
    const res = await apiClient.get<{ success: boolean, data: ShortageIncident[] }>('/admin/coordinator-analytics/shortage-incidents');
    return res.data;
  },
  getWelfareZones: async () => {
    const res = await apiClient.get<{ success: boolean, data: any }>('/admin/coordinator-analytics/welfare-zones');
    return res.data;
  },
  getWelfareInventory: async () => {
    const res = await apiClient.get<{ success: boolean, data: any }>('/admin/coordinator-analytics/welfare-inventory');
    return res.data;
  },
  getLiveZoneGrid: async () => {
    const res = await apiClient.get<{ success: boolean, data: any }>('/admin/coordinator-analytics/live-zone-grid');
    return res.data;
  },
  getLiveActivityFeed: async () => {
    const res = await apiClient.get<{ success: boolean, data: any }>('/admin/coordinator-analytics/live-activity-feed');
    return res.data;
  },
  getShortageAlerts: async () => {
    const res = await apiClient.get<{ success: boolean, data: any }>('/admin/coordinator-analytics/shortage-alerts');
    return res.data;
  }
};
