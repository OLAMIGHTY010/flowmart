import { apiClient } from "./api";

export const userServices = {
  getProfile: async () => {
    const res = await apiClient.get<any>("/auth/me");
    return res.user || res;
  },

  updateProfile: async (data: {
    fullName?: string;
    phone?: string;
    avatar?: string;
  }) => {
    return apiClient.put<any>("/user/profile", data);
  },

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
