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
    const response = await apiClient.get<ProductsResponse | Product[]>("/products");
    if (Array.isArray(response)) {
      return response;
    }
    return response?.products ?? [];
  },

  getProductById: async (id: string): Promise<Product> => {
    const response = await apiClient.get<ProductResponse | Product>(`/products/${id}`);
    const product = "product" in response && response.product ? response.product : (response as Product);
    
    return product;
  },

  getVendorProducts: async (vendorId: string): Promise<Product[]> => {
    try {
      const response = await apiClient.get<ProductsResponse | Product[]>(
        `/vendors/${vendorId}/products`
      );
      if (Array.isArray(response)) {
        return response;
      }
      return response?.products ?? [];
    } catch {
      const response = await apiClient.get<ProductsResponse | Product[]>(
        `/products?vendorId=${vendorId}`
      );
      if (Array.isArray(response)) {
        return response;
      }
      return response?.products ?? [];
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