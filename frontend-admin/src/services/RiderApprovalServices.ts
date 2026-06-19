import { apiClient } from './api';

export interface RiderApprovalStats {
  pendingReview: number;
  approvedThisMonth: number;
  rejected: number;
}

export interface RiderListItem {
  id: string;
  fullName: string;
  email: string;
  displayName: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'suspended';
  vehicleType: string | null;
  createdAt: string;
  complianceScore: number;
  category: string;
  logo: string;
}

export interface RiderKycHistory {
  id: string;
  action: string;
  notes: string | null;
  createdAt: string;
}

export interface RiderDetails {
  user: any;
  profile: any;
  kyc: any;
  complianceScore: number;
  history: RiderKycHistory[];
}

export const RiderApprovalServices = {
  getStats: async (): Promise<RiderApprovalStats> => {
    const response = await apiClient.get<{success: boolean, stats: RiderApprovalStats}>('/admin/riders/stats');
    return response.stats;
  },

  getRiders: async (status: string, category: string): Promise<RiderListItem[]> => {
    const params = new URLSearchParams({ status, category });
    const response = await apiClient.get<{success: boolean, data: RiderListItem[]}>(`/admin/riders?${params.toString()}`);
    return response.data;
  },

  getRiderDetails: async (id: string): Promise<RiderDetails> => {
    const response = await apiClient.get<{success: boolean, data: RiderDetails}>(`/admin/riders/${id}`);
    return response.data;
  },

  reviewRider: async (id: string, status: 'approved' | 'rejected', notes: string): Promise<{success: boolean, message: string}> => {
    const response = await apiClient.post<{success: boolean, message: string}>(`/admin/riders/${id}/review`, { status, notes });
    return response;
  }
};
