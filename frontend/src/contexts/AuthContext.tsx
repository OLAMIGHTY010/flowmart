import { createContext } from "react";
import type { AppUser, UserRole } from "@/types/api";

export interface AuthContextType {
  user: AppUser | null;
  isLoading: boolean;
  loginWithGoogle: (credential: string, role: UserRole) => Promise<{
    success: boolean;
    error: string;
  }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);
