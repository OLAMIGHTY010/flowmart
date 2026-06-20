import { apiClient } from "./api";
import type { Order } from "@/types/order";

interface OrdersResponse {
  success: boolean;
  orders: Order[];
}

interface OrderResponse {
  success: boolean;
  order: Order;
  vendorBankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  } | null;
}

export const orderServices = {
  getOrders: async (): Promise<Order[]> => {
    const res = await apiClient.get<OrdersResponse>("/orders");
    return res.orders || [];
  },

  getOrderById: async (id: string): Promise<OrderResponse> => {
    return apiClient.get<OrderResponse>(`/orders/${id}`);
  },

  placeOrder: async (data: FormData): Promise<{ success: boolean; order: Order; paymentUrl?: string }> => {
    return apiClient.post("/orders", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  confirmReceived: async (id: string): Promise<{ success: boolean; order: Order }> => {
    return apiClient.patch(`/orders/${id}/received`, {});
  },

  getVendorBankDetails: async (vendorId: string) => {
    return apiClient.get<{
      success: boolean;
      bankDetails: { bankName: string; accountNumber: string; accountName: string };
    }>(`/orders/vendor/${vendorId}/bank-details`);
  },
};
