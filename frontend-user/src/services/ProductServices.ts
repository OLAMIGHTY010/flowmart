import type { Product } from "@/types/product";
import { apiClient } from "./api";

type ProductsResponse = {
  success: boolean;
  products: Product[];
};

type ProductResponse = {
  success: boolean;
  product: Product;
};

export const productServices = {
  getProducts: async (): Promise<Product[]> => {
    const response = await apiClient.get<any>("/products");
    if (Array.isArray(response)) {
      return response;
    }
    return response?.products ?? response?.data ?? [];
  },

  getProductById: async (id: string): Promise<Product> => {
    const response = await apiClient.get<any>(`/products/${id}`);
    const product = response.product ? response.product : response;
    
    return product;
  },

  getVendorProducts: async (vendorId: string): Promise<Product[]> => {
    try {
      const response = await apiClient.get<any>(
        `/vendors/${vendorId}/products`
      );
      if (Array.isArray(response)) {
        return response;
      }
      return response?.products ?? response?.data ?? [];
    } catch {
      const response = await apiClient.get<any>(
        `/products?vendorId=${vendorId}`
      );
      if (Array.isArray(response)) {
        return response;
      }
      return response?.products ?? response?.data ?? [];
    }
  },

  getProductDetails: async (id: string): Promise<Product> => {
    return productServices.getProductById(id);
  },

  getReviews: async (productId: string): Promise<any[]> => {
    return apiClient.get<any[]>(`/products/${productId}/reviews`);
  },

  postReview: async (reviewData: any): Promise<any> => {
    return apiClient.post<any>(`/products/${reviewData.productId}/reviews`, reviewData);
  },
};