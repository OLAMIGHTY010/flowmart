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
  dob: data.dateOfBirth || data.dob,
  avatar: data.avatar,
  status: data.status,
  isVerified: data.isVerified !== undefined ? data.isVerified : data.is_verified,
  profileCompleted: data.profileCompleted !== undefined ? data.profileCompleted : data.profile_completed,
});

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); 

  // 🔄 0. Handle browser close (clear localstorage on new browser session)
  useEffect(() => {
    const isSessionActive = document.cookie.includes('app_session_active=true');
    if (!isSessionActive) {
      localStorage.clear();
      document.cookie = "app_session_active=true; path=/";
    }
  }, []);

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
          const responseData = response.data || response;
          const userData = responseData.user || responseData;
          const fetchedUser = mapApiUser(userData);
          setUser(fetchedUser);
          localStorage.setItem("currentUser", JSON.stringify(fetchedUser));
        } catch (error) {
          console.warn("Session check from API failed, using cached session or logging out:", error);
          if (!savedUser) {
            localStorage.clear();
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
      localStorage.clear();
      document.cookie = "app_session_active=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
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
      localStorage.clear();
      document.cookie = "app_session_active=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      setUser(null);
    }
  };

  // 🔄 6. Refresh User Session from Server
  const refreshUser = async () => {
    try {
      const response = await authService.getCurrentUser();
      const responseData = (response as any).data || response;
      if (responseData && responseData.user) {
        const mappedUser = mapApiUser(responseData.user);
        setUser(mappedUser);
        localStorage.setItem("currentUser", JSON.stringify(mappedUser));
      }
    } catch (err) {
      console.error("Failed to refresh user session:", err);
    }
  };

  // ⚡ 7. Performance Optimization
  const contextValue = useMemo(() => ({
    user,
    isLoading,
    login,
    register,
    logout,
    refreshUser
  }), [user, isLoading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};