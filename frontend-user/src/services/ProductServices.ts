import type { ApiResponse, Product } from "@/types/api";
import { apiClient } from "./api";

export const productServices = {
  getProducts: async (): Promise<ApiResponse<Product[]>> => {
    return apiClient.get<ApiResponse<Product[]>>("/products");
  },

  getProductDetails: async (id: string): Promise<ApiResponse<Product>> => {
    return apiClient.get<ApiResponse<Product>>(`/products/${id}`);
  },
};