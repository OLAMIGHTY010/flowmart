import type { ApiResponse, LoginRequest, LoginResponse } from "@/types/api";
import { apiClient } from "./api";

export const authService = {
  // 1. Defined on authService using a comma (,) at the end instead of a semicolon (;)
  initSession: (): Promise<void> => apiClient.post("/auth/init"),

  login: async (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    await authService.initSession(); // Or use: await this.initSession();
    return apiClient.post<ApiResponse<LoginResponse>>("/login", data);
  },

  logout: () => apiClient.post<ApiResponse<null>>("/logout")
};