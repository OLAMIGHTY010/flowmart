import { createContext } from "react";
import type { AppUser, RegisterRequest } from "@/types/api";

export interface AuthContextType {
  user: AppUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{
    success: boolean;
    error: string;
  }>;
  register: (data: RegisterRequest) => Promise<{
    success: boolean;
    error: string;
  }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);
