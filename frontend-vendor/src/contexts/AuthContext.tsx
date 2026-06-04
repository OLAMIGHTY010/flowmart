import { createContext } from "react";

interface AuthContext {
    user: AppUser | null;
    login: (username: string, password: string) => Promise<{
        success: boolean, error: string
    }>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContext | null>(null)