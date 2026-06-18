import { apiClient } from './api';

export interface VendorApprovalStats {
  pendingReview: number;
  approvedThisMonth: number;
  rejected: number;
}

export interface VendorListItem {
  id: string;
  fullName: string;
  email: string;
  businessName: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'suspended';
  cacNo: string | null;
  createdAt: string;
  complianceScore: number;
  category: string;
  logo: string;
}

export interface VendorKycHistory {
  id: string;
  action: string;
  notes: string | null;
  createdAt: string;
}

export interface VendorDetails {
  user: any;
  profile: any;
  kyc: any;
  complianceScore: number;
  history: VendorKycHistory[];
}

export const VendorApprovalServices = {
  getStats: async (): Promise<VendorApprovalStats> => {
    const response = await apiClient.get<{success: boolean, stats: VendorApprovalStats}>('/admin/vendors/stats');
    return response.stats;
  },

  getVendors: async (status: string, category: string): Promise<VendorListItem[]> => {
    const params = new URLSearchParams({ status, category });
    const response = await apiClient.get<{success: boolean, data: VendorListItem[]}>(`/admin/vendors?${params.toString()}`);
    return response.data;
  },

  getVendorDetails: async (id: string): Promise<VendorDetails> => {
    const response = await apiClient.get<{success: boolean, data: VendorDetails}>(`/admin/vendors/${id}`);
    return response.data;
  },

  reviewVendor: async (id: string, status: 'approved' | 'rejected', notes: string): Promise<{success: boolean, message: string}> => {
    const response = await apiClient.post<{success: boolean, message: string}>(`/admin/vendors/${id}/review`, { status, notes });
    return response;
  }
};
