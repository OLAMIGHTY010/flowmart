import type { ApiResponse, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from "@/types/api";
import { apiClient } from "./api";

export const authService = {
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    return apiClient.post<RegisterResponse>("/auth/register", data);
  },

  login: async (data: LoginRequest): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>("/auth/login", data);
  },

  logout: (): Promise<ApiResponse<null>> => {
    return apiClient.post<ApiResponse<null>>("/auth/logout");
  },

  getCurrentUser: async (): Promise<any> => {
    return apiClient.get<any>("/auth/me");
  },

  verifyOtp: async (otp: string): Promise<any> => {
    return apiClient.post<ApiResponse<any>>("/auth/verify-otp", { otp });
  },

  resendOtp: async (email: string): Promise<any> => {
    return apiClient.post<ApiResponse<any>>("/auth/resend-otp", { email });
  },

  forgotPassword: async (email: string): Promise<any> => {
    return apiClient.post<any>("/auth/forgot-password", { email });
  },

  resetPassword: async (data: any): Promise<any> => {
    return apiClient.post<any>("/auth/reset-password", data);
  },

  forceChangePassword: async (newPassword: string): Promise<any> => {
    return apiClient.post<ApiResponse<any>>("/auth/force-change-password", { newPassword });
  }
};