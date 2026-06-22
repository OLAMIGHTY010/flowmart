import { useState, useEffect, useMemo, type ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import type { AppUser, UserRole, RegisterRequest } from "@/types/api";
import { authService } from "@/services/AuthServices";
import { apiClient } from "@/services/api";


const mapApiUser = (data: Partial<AppUser>): AppUser => ({
  id: data?.id || "",
  fullName: data?.fullName || "",
  email: data?.email || "",
  role: data?.role as UserRole,
  phone: data?.phone,
  gender: data?.gender,
  dateOfBirth: data?.dateOfBirth,
  avatar: data?.avatar,
  status: data?.status,
  isVerified: data?.isVerified,
  profileCompleted: data?.profileCompleted,
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
      sessionStorage.clear();
      document.cookie = "app_session_active=true; path=/";
    }
  }, []);

  // 🔄 1. Handle page refreshes
  useEffect(() => {
    const checkActiveSession = async () => {
      const token = sessionStorage.getItem("accessToken");
      const savedUser = sessionStorage.getItem("currentUser");

      if (token) {
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch {
            // ignore JSON parse errors
          }
        }

        try {
          const responseData = await apiClient.get<{ user?: Partial<AppUser> } & Partial<AppUser>>("/auth/me");
          const userData = responseData.user || responseData;
          const fetchedUser = mapApiUser(userData as Partial<AppUser>);
          setUser(fetchedUser);
          sessionStorage.setItem("currentUser", JSON.stringify(fetchedUser));
        } catch (error) {
          console.warn("Session check from API failed, using cached session or logging out:", error);
          if (!savedUser) {
            sessionStorage.clear();
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
      sessionStorage.clear();
      document.cookie = "app_session_active=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    };

    window.addEventListener("auth:logout", handleGlobalLogout);
    return () => window.removeEventListener("auth:logout", handleGlobalLogout);
  }, []);

  // 🔓 3. Login logic
  const login = async (email: string, password: string) => {
    try {
      const responseData = await authService.login({ email, password });

      if (responseData && responseData.token) {
        sessionStorage.setItem("accessToken", responseData.token);
        const mappedUser = mapApiUser(responseData.user as Partial<AppUser>);
        setUser(mappedUser);
        sessionStorage.setItem("currentUser", JSON.stringify(mappedUser));

        return { success: true, error: "" };
      }

      return { success: false, error: 'Invalid server response structure' };
    } catch (err: unknown) {
      const errorMsg = (err as Record<string, unknown>)?.response
        ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message || (err as Error).message)
        : 'Login failed';
      return { success: false, error: errorMsg };
    }
  };

  // 📝 4. Register logic
  const register = async (data: RegisterRequest) => {
    try {
      const responseData = await authService.register(data);

      if (responseData && responseData.token) {
        sessionStorage.setItem("accessToken", responseData.token);
        const mappedUser = mapApiUser(responseData.user as Partial<AppUser>);
        setUser(mappedUser);
        sessionStorage.setItem("currentUser", JSON.stringify(mappedUser));

        return { success: true, error: "" };
      }

      if (responseData && responseData.success) {
        return { success: true, error: "" };
      }

      return { success: false, error: 'Invalid registration response' };
    } catch (err: unknown) {
      const errorMsg = (err as Record<string, unknown>)?.response
        ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message || (err as Error).message)
        : 'Registration failed';
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
      sessionStorage.clear();
      document.cookie = "app_session_active=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      setUser(null);
    }
  };

  // 🔄 6. Refresh User Session from Server
  const refreshUser = async () => {
    try {
      const responseData = await authService.getCurrentUser();
      if (responseData && responseData.user) {
        const mappedUser = mapApiUser(responseData.user as Partial<AppUser>);
        setUser(mappedUser);
        sessionStorage.setItem("currentUser", JSON.stringify(mappedUser));
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