import { apiClient } from "./api";

export const paymentService = {
  async submitOrder(formData: FormData) {
    return await apiClient.post(
      "/orders",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  },
};