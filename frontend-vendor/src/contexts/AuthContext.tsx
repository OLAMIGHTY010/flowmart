import { createContext } from "react";
import type { AppUser } from "@/types/api";

interface AuthContextType {
    user: AppUser | null;
    login: (username: string, password: string) => Promise<{
        success: boolean, error: string
    }>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null)