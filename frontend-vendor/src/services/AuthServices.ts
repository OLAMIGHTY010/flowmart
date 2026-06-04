import type { LoginRequest } from "@/types/api";
import { apiClient } from "./api";

export const authService = {
    initSession: () => apiClient.initSession(),

    login: async(data: LoginRequest) => {
        await apiClient
        return apiClient.get.post<ApiResponse<LoginResponse>>("/login", data)
    }
}