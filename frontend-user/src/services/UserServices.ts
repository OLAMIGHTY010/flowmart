import { apiClient } from "./api";

export const userServices = {
  getPrivacySettings: async () => {
    return apiClient.get<any>("/user/privacy-settings");
  },

  updatePrivacySettings: async (settings: any) => {
    return apiClient.put<any>(`/user/privacy-settings`, settings);
  },

  updatePassword: async (newPassword: string) => {
    return apiClient.put<any>(`/user/password`, { password: newPassword });
  },

  toggleTwoFactor: async (isEnabled: boolean) => {
    return apiClient.put<any>(`/user/two-factor`, { enabled: isEnabled });
  },

  getSessions: async () => {
    return apiClient.get<any[]>(`/user/sessions`);
  },

  revokeSession: async (sessionId: string) => {
    return apiClient.delete<any>(`/user/sessions/${sessionId}`);
  },

  deleteAccount: async () => {
    return apiClient.delete<any>(`/user/account`);
  },
};
