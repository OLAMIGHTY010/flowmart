import { useState, useEffect, useMemo, type ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import type { AppUser, UserRole, RegisterRequest } from "@/types/api";
import { authService } from "@/services/AuthServices";
import { apiClient } from "@/services/api"; 

const mapApiUser = (data: any): AppUser => ({
  id: data.id || "",
  fullName: data.fullName || data.full_name || "",
  email: data.email || "",
  role: data.role as UserRole,
  phone: data.phone,
  gender: data.gender,
  avatar: data.avatar,
  status: data.status,
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
      const savedUser = localStorage.getItem("currentUser");
      
      if (token) {
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch {
            // ignore JSON parse errors
          }
        }
        
        try {
          const response = await apiClient.get<any>("/auth/me");
          const fetchedUser = mapApiUser(response.data || response);
          setUser(fetchedUser);
          localStorage.setItem("currentUser", JSON.stringify(fetchedUser));
        } catch (error) {
          console.warn("Session check from API failed, using cached session or logging out:", error);
          if (!savedUser) {
            localStorage.removeItem("accessToken");
          }
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
      localStorage.removeItem("currentUser");
    };

    window.addEventListener("auth:logout", handleGlobalLogout);
    return () => window.removeEventListener("auth:logout", handleGlobalLogout);
  }, []);

  // 🔓 3. Login logic
  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      const responseData = (response as any).data || response;
      
      if (responseData && responseData.token) {
        localStorage.setItem("accessToken", responseData.token);
        const mappedUser = mapApiUser(responseData.user);
        setUser(mappedUser);
        localStorage.setItem("currentUser", JSON.stringify(mappedUser));
        
        return { success: true, error: "" }; 
      }
      
      return { success: false, error: 'Invalid server response structure' };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Login failed';
      return { success: false, error: errorMsg };
    }
  };

  // 📝 4. Register logic
  const register = async (data: RegisterRequest) => {
    try {
      const response = await authService.register(data);
      const responseData = (response as any).data || response;
      
      if (responseData && responseData.token) {
        localStorage.setItem("accessToken", responseData.token);
        const mappedUser = mapApiUser(responseData.user);
        setUser(mappedUser);
        localStorage.setItem("currentUser", JSON.stringify(mappedUser));
        
        return { success: true, error: "" };
      }
      
      return { success: false, error: 'Invalid registration response' };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Registration failed';
      return { success: false, error: errorMsg };
    }
  };

  // 🔒 5. Clean Logout
  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn("Server side logout failed, clearing local state anyway", err);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("currentUser");
      setUser(null);
    }
  };

  // ⚡ 6. Performance Optimization
  const contextValue = useMemo(() => ({
    user,
    isLoading,
    login,
    register,
    logout
  }), [user, isLoading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};