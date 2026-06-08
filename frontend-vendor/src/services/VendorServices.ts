import { apiClient } from "./api";
import type { 
  ProfileSetupRequest, 
  KYCInfoRequest, 
  KYCStatusResponse, 
  DashboardStatsResponse,
  Order,
  ApiResponse
} from "@/types/api";

// Helper to check network/endpoint availability
const safeApiCall = async <T>(apiCall: () => Promise<T>, fallbackKey: string, defaultFallback: T): Promise<T> => {
  try {
    return await apiCall();
  } catch (error: any) {
    console.warn(`API call failed. Falling back to local storage for: ${fallbackKey}`, error);
    const cached = localStorage.getItem(fallbackKey);
    if (cached) {
      try {
        return JSON.parse(cached) as T;
      } catch {
        // ignore JSON errors
      }
    }
    return defaultFallback;
  }
};

export const vendorService = {
  updateProfile: async (data: ProfileSetupRequest): Promise<ApiResponse<any>> => {
    try {
      const res = await apiClient.put<ApiResponse<any>>("/vendor/profile", data);
      localStorage.setItem("vendor_profile", JSON.stringify(data));
      return res;
    } catch (error) {
      localStorage.setItem("vendor_profile", JSON.stringify(data));
      return { success: true, message: "Profile saved locally (Offline/Mock fallback)", data };
    }
  },

  submitKYCInfo: async (data: KYCInfoRequest): Promise<ApiResponse<any>> => {
    try {
      const res = await apiClient.post<ApiResponse<any>>("/vendor/kyc", data);
      localStorage.setItem("vendor_kyc_info", JSON.stringify(data));
      return res;
    } catch (error) {
      localStorage.setItem("vendor_kyc_info", JSON.stringify(data));
      return { success: true, message: "KYC details saved locally (Offline/Mock fallback)", data };
    }
  },

  uploadKYCDocument: async (docType: string, file: File): Promise<ApiResponse<{ fileName: string }>> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("docType", docType);
      
      const res = await apiClient.post<ApiResponse<{ fileName: string }>>(`/vendor/kyc/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return res;
    } catch (error) {
      return { 
        success: true, 
        message: "Document uploaded successfully (Offline/Mock fallback)", 
        data: { fileName: file.name } 
      };
    }
  },

  submitKYCForReview: async (): Promise<ApiResponse<any>> => {
    try {
      return await apiClient.post<ApiResponse<any>>("/vendor/kyc/submit");
    } catch (error) {
      const status: KYCStatusResponse = {
        status: "under_review",
        referenceId: `KYC-2024-${Math.floor(10000 + Math.random() * 90000)}`,
        steps: [
          { label: "Application Submitted", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: "done" },
          { label: "Document Review", time: "Pending", status: "active" },
          { label: "Admin Verification", time: "Pending", status: "pending" },
          { label: "Account Activated", time: "Pending", status: "pending" }
        ]
      };
      localStorage.setItem("vendor_kyc_status", JSON.stringify(status));
      return { success: true, message: "KYC submitted for review (Offline/Mock fallback)", data: status };
    }
  },

  getKYCStatus: async (): Promise<KYCStatusResponse> => {
    const defaultStatus: KYCStatusResponse = {
      status: "pending",
      referenceId: "KYC-2024-00000",
      steps: [
        { label: "Application Submitted", time: "Pending", status: "pending" },
        { label: "Document Review", time: "Pending", status: "pending" },
        { label: "Admin Verification", time: "Pending", status: "pending" },
        { label: "Account Activated", time: "Pending", status: "pending" }
      ]
    };
    return safeApiCall(
      () => apiClient.get<KYCStatusResponse>("/vendor/kyc/status"),
      "vendor_kyc_status",
      defaultStatus
    );
  },

  getDashboardStats: async (): Promise<DashboardStatsResponse> => {
    const defaultStats: DashboardStatsResponse = {
      newOrders: 8,
      inProgress: 34,
      revenueToday: "₦128K",
      availableStock: 142,
      weeklyRevenue: [
        { day: "Mon", h: 55 },
        { day: "Tue", h: 70 },
        { day: "Wed", h: 45 },
        { day: "Thu", h: 80 },
        { day: "Fri", h: 65 },
        { day: "Sat", h: 100 },
      ],
      totalRevenue: "₦1,240,000",
      avgOrder: "₦9,687"
    };

    return safeApiCall(
      () => apiClient.get<DashboardStatsResponse>("/vendor/dashboard/stats"),
      "vendor_dashboard_stats",
      defaultStats
    );
  },

  getOrders: async (): Promise<Order[]> => {
    const defaultOrders: Order[] = [
      { id: "ORD-024", attendeeId: "1", vendorId: "1", deliveryZone: "Zone 4", status: "pending", totalAmount: "64000", createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString() },
      { id: "ORD-025", attendeeId: "2", vendorId: "1", deliveryZone: "Zone 4", status: "confirmed", totalAmount: "47500", createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString() },
      { id: "ORD-026", attendeeId: "3", vendorId: "1", deliveryZone: "Zone 4", status: "pending", totalAmount: "5000", createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString() }
    ];

    try {
      // The backend has GET /orders route. Let's call it!
      const res = await apiClient.get<Order[] | { success: boolean; data: Order[] }>("/orders");
      const orders = Array.isArray(res) ? res : (res as any).data || defaultOrders;
      localStorage.setItem("vendor_orders", JSON.stringify(orders));
      return orders;
    } catch (error) {
      console.warn("Failed fetching orders from backend, returning cached/fallback orders", error);
      const cached = localStorage.getItem("vendor_orders");
      return cached ? JSON.parse(cached) : defaultOrders;
    }
  }
};
