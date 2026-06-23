import { useState, useEffect, useMemo, type ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import type { AppUser, UserRole } from "@/types/api";
import { authService } from "@/services/AuthServices";

const mapApiUser = (data: any): AppUser => ({
  id: data.id || "",
  fullName: data.fullName || data.full_name || "",
  email: data.email || "",
  role: data.role as UserRole,
  phone: data.phone,
  gender: data.gender,
  avatar: data.avatar,
  status: data.status,
  dateOfBirth: data.dateOfBirth,
  isVerified: data.isVerified,
  profileCompleted: data.profileCompleted,
  forcePasswordChange: data.forcePasswordChange,
});

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const isSessionActive = document.cookie.includes('app_session_active=true');
    if (!isSessionActive) {
      localStorage.clear();
      document.cookie = "app_session_active=true; path=/";
    }
  }, []);

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
          const response = await authService.getCurrentUser();
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

  useEffect(() => {
    const handleGlobalLogout = () => {
      setUser(null);
      localStorage.clear();
      document.cookie = "app_session_active=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    };

    window.addEventListener("auth:logout", handleGlobalLogout);
    return () => window.removeEventListener("auth:logout", handleGlobalLogout);
  }, []);

  // UPDATED: Now receives idToken and passes it down correctly
  const loginWithGoogle = async (idToken: string, role: UserRole) => {
    try {
      const response = await authService.googleAuth({ idToken, role });
      const responseData = (response as any).data || response;

      if (responseData && responseData.token) {
        localStorage.setItem("accessToken", responseData.token);
        const mappedUser = mapApiUser(responseData.user);
        setUser(mappedUser);
        localStorage.setItem("currentUser", JSON.stringify(mappedUser));

        return { success: true, error: "" };
      }

      return { success: false, error: "Invalid server response" };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || "Google login failed";
      return { success: false, error: errorMsg };
    }
  };

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

  const refreshUser = async () => {
    try {
      const response = await authService.getCurrentUser();
      const responseData = response.data || response;
      if (responseData && responseData.user) {
        const fetchedUser = mapApiUser(responseData.user);
        setUser(fetchedUser);
        localStorage.setItem("currentUser", JSON.stringify(fetchedUser));
      }
    } catch (err) {
      console.error("Failed to refresh user session:", err);
    }
  };

  const contextValue = useMemo(() => ({
    user,
    isLoading,
    loginWithGoogle,
    logout,
    refreshUser
  }), [user, isLoading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
