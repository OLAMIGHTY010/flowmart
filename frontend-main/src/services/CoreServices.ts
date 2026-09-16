import { apiClient } from "./api";

export const coreServices = {
  getAlerts: async () => {
    return apiClient.get<any[]>("/core/alerts");
  },

  getFaqs: async () => {
    return apiClient.get<any[]>("/core/faqs");
  },

  getCategories: async (): Promise<string[]> => {
    try {
      const res = await apiClient.get<{ success: boolean; categories: { name: string }[] }>("/categories");
      const names = res.categories?.map((c) => c.name) || [];
      return ["All", ...names];
    } catch {
      return ["All"];
    }
  },
};
