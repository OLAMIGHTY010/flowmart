import { apiClient } from "./api";

export const coreServices = {
  getAlerts: async () => {
    return apiClient.get<any[]>("/core/alerts");
  },

  getFaqs: async () => {
    return apiClient.get<any[]>("/core/faqs");
  },

  getCategories: async (): Promise<string[]> => {
    const res = await apiClient.get<{ success: boolean; categories: string[] }>("/products/categories");
    return res.categories || ["All"];
  },
};
