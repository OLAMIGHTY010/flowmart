import { apiClient } from "./api";
import type { 
  ProfileSetupRequest, 
  KYCInfoRequest,
  KYCStatusResponse, 
  DashboardStatsResponse,
  Order,
  ApiResponse,
  KYCSubmitPayload
} from "@/types/api";

export const riderService = {
  updateProfile: async (data: ProfileSetupRequest): Promise<ApiResponse<any>> => {
    const res = await apiClient.put<ApiResponse<any>>("/rider/profile", data);
    
    // Update local storage auth user profile completed flag
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      user.profileCompleted = true;
      localStorage.setItem("currentUser", JSON.stringify(user));
    }
    
    return res;
  },

  submitKYCInfo: async (data: KYCInfoRequest): Promise<ApiResponse<any>> => {
    localStorage.setItem("rider_kyc_info", JSON.stringify(data));
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

  getOrders: async (): Promise<Order[]> => {
    const res = await apiClient.get<{ success: boolean; orders: Order[] }>("/rider/orders");
    return res.orders || [];
  },

  getOrderById: async (orderId: string): Promise<Order> => {
    const res = await apiClient.get<{ success: boolean; data: Order }>(`/rider/orders/${orderId}`);
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
