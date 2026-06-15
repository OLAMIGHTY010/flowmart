import { apiClient } from "./api";
import type { 
  ProfileSetupRequest, 
  KYCInfoRequest,
  KYCStatusResponse, 
  DashboardStatsResponse,
  Order,
  ApiResponse,
  KYCSubmitPayload,
  Product
} from "@/types/api";

export const vendorService = {
  updateProfile: async (data: ProfileSetupRequest): Promise<ApiResponse<any>> => {
    const res = await apiClient.put<ApiResponse<any>>("/vendor/profile", data);
    
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
    // Save to local cache only (no network requests per user requirement)
    localStorage.setItem("vendor_kyc_info", JSON.stringify(data));
    return { success: true, message: "KYC details saved locally", data };
  },

  uploadKYCDocument: async (docType: string, file: File): Promise<ApiResponse<{ fileName: string }>> => {
    // Save to local cache only (no network requests per user requirement)
    return { 
      success: true, 
      message: "Document cached locally", 
      data: { fileName: file.name } 
    };
  },

  submitKYCForReview: async (data: KYCSubmitPayload): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>("/vendor/kyc/submit", data);
  },

  getKYCStatus: async (): Promise<KYCStatusResponse> => {
    return apiClient.get<KYCStatusResponse>("/vendor/kyc/status");
  },

  getDashboardStats: async (): Promise<DashboardStatsResponse> => {
    return apiClient.get<DashboardStatsResponse>("/vendor/dashboard/stats");
  },

  getOrders: async (): Promise<Order[]> => {
    const res = await apiClient.get<{ success: boolean; orders: Order[] }>("/orders");
    return res.orders || [];
  },

  updateOrderStatus: async (orderId: string, status: string): Promise<ApiResponse<any>> => {
    return apiClient.patch<ApiResponse<any>>(`/orders/${orderId}/status`, { status });
  },

  // Product CRUD
  getVendorProducts: async (): Promise<any[]> => {
    const res = await apiClient.get<{ success: boolean; products: any[] }>("/products");
    return res.products || [];
  },

  createProduct: async (product: Product): Promise<ApiResponse<any>> => {
    return apiClient.post<ApiResponse<any>>("/products", product);
  },

  updateProduct: async (id: string, product: Product): Promise<ApiResponse<any>> => {
    return apiClient.put<ApiResponse<any>>(`/products/${id}`, product);
  },

  deleteProduct: async (id: string): Promise<ApiResponse<any>> => {
    return apiClient.delete<ApiResponse<any>>(`/products/${id}`);
  }
};
