import type { ApiResponse, AuthResponse, GoogleAuthRequest } from "@/types/api";
import { apiClient } from "./api";

export const authService = {
  googleAuth: async (data: GoogleAuthRequest): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>("/auth/google", data);
  },

  logout: async (): Promise<ApiResponse<null>> => {
    return apiClient.post<ApiResponse<null>>("/auth/logout");
  },

  getCurrentUser: async (): Promise<any> => {
    return apiClient.get<any>("/auth/me");
  },
};
