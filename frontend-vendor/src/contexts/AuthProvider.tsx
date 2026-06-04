import { useState, useEffect, useMemo, type ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import type { AppUser, UserRole } from "@/types/api";
import { authService } from "@/services/AuthServices";
import { apiClient } from "@/services/api"; 

const mapApiUser = (data: any): AppUser => ({
  id: data.id,
  username: data.full_name || data.username || '',
  email: data.email,
  role: data.role as UserRole,
  phone: data.phone,
});

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); 

  // 🔄 1. Handle page refreshes
  useEffect(() => {
    const checkActiveSession = async () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const response = await apiClient.get<any>("/auth/me");
          setUser(mapApiUser(response.data || response));
        } catch (error) {
          console.error("Session restoration failed:", error);
          localStorage.removeItem("accessToken");
        }
      }
      setIsLoading(false);
    };

    checkActiveSession();
  }, []);

  // 🛜 2. Synchronize with API Client global logout event
  useEffect(() => {
    const handleGlobalLogout = () => {
      setUser(null);
      localStorage.removeItem("accessToken");
    };

    window.addEventListener("auth:logout", handleGlobalLogout);
    return () => window.removeEventListener("auth:logout", handleGlobalLogout);
  }, []);

  // 🔓 3. Fixed Login logic matching strict AuthContextType
  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      const responseData = (response as any).data || response;
      
      if (responseData && responseData.token) {
        localStorage.setItem("accessToken", responseData.token);
        setUser(mapApiUser(responseData.user));
        
        // ✅ FIX: Added explicit error: "" to satisfy the expected contract
        return { success: true, error: "" }; 
      }
      
      return { success: false, error: 'Invalid server response structure' };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Login failed';
      return { success: false, error: errorMsg };
    }
  };

  // 🔒 4. Clean Logout
  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn("Server side logout failed, clearing local state anyway", err);
    } finally {
      localStorage.removeItem("accessToken");
      setUser(null);
    }
  };

  // ⚡ 5. Performance Optimization
  const contextValue = useMemo(() => ({
    user,
    isLoading,
    login,
    logout
  }), [user, isLoading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};