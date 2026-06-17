import { apiClient } from './api';

export interface RiderStats {
  totalRiders: number;
  activeNow: number;
  completedDeliveries: number;
  avgDeliveriesPerRider: number;
}

export interface RiderItem {
  id: string;
  riderId: string;
  fullName: string;
  phone: string;
  currentLocation: string;
  status: 'active' | 'suspended' | 'pending';
  deliveriesToday: number;
  efficiencyScore: number;
  lastActivity: string;
}

export interface RiderResponse {
  success: boolean;
  data: RiderItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const RiderServices = {
  getStats: async (): Promise<RiderStats> => {
    const res = await apiClient.get<{ success: boolean, stats: RiderStats }>('/admin/riders/stats');
    return res.stats;
  },

  getRiders: async (page: number, limit: number, search: string, status: string): Promise<RiderResponse> => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (search) params.append('search', search);
    if (status && status !== 'All') params.append('status', status.toLowerCase());

    const res = await apiClient.get<RiderResponse>(`/admin/riders?${params.toString()}`);
    return res as unknown as RiderResponse;
  }
};
