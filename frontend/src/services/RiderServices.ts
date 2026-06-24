import { apiClient } from "./api";
import type {
  ProfileSetupRequest,
  KYCInfoRequest,
  KYCStatusResponse,
  KYCSubmitPayload,
  ApiResponse,
} from "@/types/api";

/* ═══════════════════════════════════════════════════════
   Rider Dashboard Stats
   ═══════════════════════════════════════════════════════ */
export interface DashboardStatsResponse {
  newOrders: number;
  inProgress: number;
  revenueToday: string;
  availableStock: number;
  weeklyRevenue: { day: string; h: number }[];
  totalRevenue: string;
  avgOrder: string;
  pendingTips?: string;
  deliveriesCount?: number;
  payouts?: { date: string; type: string; amount: string; status: string }[];
}

/* ═══════════════════════════════════════════════════════
   Rider Order types (rider-specific view)
   ═══════════════════════════════════════════════════════ */
export interface RiderOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
}

export interface RiderOrder {
  id: string;
  attendeeId: string;
  vendorId: string;
  riderId?: string;
  deliveryZone: string;
  status: 'pending' | 'confirmed' | 'assigned' | 'picked_up' | 'delivered' | 'cancelled';
  totalAmount: string;
  deliveryPin?: string;
  createdAt: string;
  customerName?: string;
  customerPhone?: string;
  distance?: string;
  estimatedTime?: string;
  packsCount?: number;
  items?: RiderOrderItem[];
}

/* ═══════════════════════════════════════════════════════
   Rider Service
   ═══════════════════════════════════════════════════════ */
export const riderService = {
  updateProfile: async (data: ProfileSetupRequest): Promise<ApiResponse<any>> => {
    // Save to local cache only (no network requests per user requirement until review step)
    sessionStorage.setItem("rider_profile_setup", JSON.stringify(data));
    return { success: true, message: "Profile details saved locally", data };
  },

  submitKYCInfo: async (data: KYCInfoRequest): Promise<ApiResponse<any>> => {
    sessionStorage.setItem("rider_kyc_info", JSON.stringify(data));
    return { success: true, message: "KYC details saved locally", data };
  },

  uploadKYCDocument: async (docType: string, file: File): Promise<ApiResponse<{ fileName: string }>> => {
    return {
      success: true,
      message: "Document cached locally",
      data: { fileName: file.name }
    };
  },

  submitKYCForReview: async (data: KYCSubmitPayload): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>("/rider/kyc/submit", data);
  },

  getKYCStatus: async (): Promise<KYCStatusResponse> => {
    return apiClient.get<KYCStatusResponse>("/rider/kyc/status");
  },

  getDashboardStats: async (): Promise<DashboardStatsResponse> => {
    return apiClient.get<DashboardStatsResponse>("/rider/dashboard/stats");
  },

  getOrders: async (): Promise<RiderOrder[]> => {
    const res = await apiClient.get<{ success: boolean; orders: RiderOrder[] }>("/rider/orders");
    return res.orders || [];
  },

  getOrderById: async (orderId: string): Promise<RiderOrder> => {
    const res = await apiClient.get<{ success: boolean; data: RiderOrder }>(`/rider/orders/${orderId}`);
    return res.data;
  },

  updateOrderStatus: async (orderId: string, status: string): Promise<ApiResponse<any>> => {
    return apiClient.patch<ApiResponse<any>>(`/rider/orders/${orderId}/status`, { status });
  },

  acceptDelivery: async (orderId: string): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>(`/rider/orders/${orderId}/accept`, {});
  },

  declineDelivery: async (orderId: string): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>(`/rider/orders/${orderId}/decline`, {});
  },

  submitShortageReport: async (orderId: string, data: any): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>(`/rider/orders/${orderId}/shortage`, data);
  }
};
