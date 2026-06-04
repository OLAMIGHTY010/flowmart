import { createContext } from "react";
import type { AppUser } from "@/types/api";

interface AuthContext {
    user: AppUser | null;
    login: (username: string, password: string) => Promise<{
        success: boolean, error: string
    }>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContext | null>(null)