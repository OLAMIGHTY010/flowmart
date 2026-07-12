import { apiClient } from "./api";

export interface KYCStats {
  pendingReview: number;
  approvedThisMonth: number;
  rejected: number;
}

export interface VendorKYC {
  id: string; // user ID
  fullName: string;
  email: string;
  businessName: string;
  status: 'unsubmitted' | 'pending' | 'under_review' | 'approved' | 'rejected';
  cacNo: string | null;
  createdAt: string;
  complianceScore: number;
  logo?: string;
  category?: string;
}

export interface VendorDetails {
  user: any;
  profile: any;
  kyc: any;
  complianceScore: number;
  history: any[];
}

export interface RiderKYC {
  id: string; // user ID
  fullName: string;
  email: string;
  phone: string;
  status: 'unsubmitted' | 'pending' | 'under_review' | 'approved' | 'rejected';
  vehicleType: string | null;
  createdAt: string;
  complianceScore: number;
}

export interface RiderDetails {
  user: any;
  profile: any;
  kyc: any;
  complianceScore: number;
  history: any[];
}

export const adminServices = {
  // --- Vendors ---
  getVendorStats: async (): Promise<{ stats: KYCStats }> => {
    const response = await apiClient.get<{ stats: KYCStats }>("/admin/vendors/stats");
    return response;
  },

  getVendorsList: async (status: string = 'all'): Promise<{ data: VendorKYC[] }> => {
    const response = await apiClient.get<{ data: VendorKYC[] }>(`/admin/vendors?status=${status}`);
    return response;
  },

  getVendorDetails: async (id: string): Promise<{ data: VendorDetails }> => {
    const response = await apiClient.get<{ data: VendorDetails }>(`/admin/vendors/${id}`);
    return response;
  },

  reviewVendor: async (id: string, status: 'approved' | 'rejected', notes?: string) => {
    const response = await apiClient.post(`/admin/vendors/${id}/review`, { status, notes });
    return response;
  },

  // --- Riders ---
  getRiderStats: async (): Promise<{ stats: KYCStats }> => {
    const response = await apiClient.get<{ stats: KYCStats }>("/admin/riders/stats");
    return response;
  },

  getRidersList: async (status: string = 'all'): Promise<{ data: RiderKYC[] }> => {
    const response = await apiClient.get<{ data: RiderKYC[] }>(`/admin/riders?status=${status}`);
    return response;
  },

  getRiderDetails: async (id: string): Promise<{ data: RiderDetails }> => {
    const response = await apiClient.get<{ data: RiderDetails }>(`/admin/riders/${id}`);
    return response;
  },

  reviewRider: async (id: string, status: 'approved' | 'rejected', notes?: string) => {
    const response = await apiClient.post(`/admin/riders/${id}/review`, { status, notes });
    return response;
  }
};
