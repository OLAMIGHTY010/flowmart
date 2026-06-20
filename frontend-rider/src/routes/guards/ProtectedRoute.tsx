import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { type GuardOptions } from "@/types/api";
import DashboardSkeleton from "@/components/ui/DashboardSkeleton";

export const createProtectedRoute = (options?: GuardOptions) => {
  return function ProtectedRoute() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
      return <DashboardSkeleton />;
    }

    if (options?.requireAuth !== false && !user) {
      return <Navigate to={options?.redirectTo || "/"} replace />;
    }

    return <Outlet />;
  };
};