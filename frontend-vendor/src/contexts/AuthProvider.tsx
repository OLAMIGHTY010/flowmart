import { useState, type ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import type { AppUser, UserRole } from "@/types/api";

const mapApiUser = (data: any): AppUser => ({
    id: data.id,
    username: data.full_name || data.username || '',
    email: data.email,
    role: data.role as UserRole,
    phone: data.phone,
});

type AuthProviderProps = {
    children: ReactNode;
};

const AuthProvider = ({ children }: AuthProviderProps) =>{
    const [user, setUser] = useState<AppUser | null>(null);

    // useEffect(() => {
    //     re
    // })

    const logout = async () => {
        try {
            await authService.logout();
        } catch {

        }
        setUser(null)
    }

    const login = async (email: string, password: string) => {
        try {
            const response = await authService.login({ email, password });
            const userData = (response as any).data ? user || (response as any).data;
            if (userData) {
                setUser(mapApiUser(userData));
                return { success: true };
            }
            return { success: false, error: 'Invalid Credentials' };
        } catch (err: any) {
            return { success: false, error: err.error || 'Login failed' };
        }
    };


    return (
        <AuthContext.Provider value={{user, login, logout}}>
            {children}
        </AuthContext.Provider>
    )
}
