import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { type GuardOptions } from "@/types/api";

export const createProtectedRoute = (options?: GuardOptions) => {
  return function ProtectedRoute() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (options?.requireAuth !== false && !user) {
      return <Navigate to={options?.redirectTo || "/"} replace />;
    }

    return <Outlet />;
  };
};