import { apiClient } from "./api";

export const coreServices = {
  getAlerts: async () => {
    return apiClient.get<any[]>("/core/alerts");
  },

  getFaqs: async () => {
    return apiClient.get<any[]>("/core/faqs");
  },
};
