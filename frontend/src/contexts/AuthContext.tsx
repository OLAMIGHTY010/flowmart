import { createContext } from "react";
import type { AppUser, UserRole } from "@/types/api";

export interface AuthContextType {
  user: AppUser | null;
  isLoading: boolean;
  // UPDATED: Changed parameter name for clarity
  loginWithGoogle: (idToken: string, role: UserRole) => Promise<{
    success: boolean;
    error: string;
    user?: AppUser;
  }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);
