import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { type GuardOptions } from "@/types/api";
import DashboardSkeleton from "@/components/ui/DashboardSkeleton";

export const createProtectedRoute = (options?: GuardOptions) => {
  return function ProtectedRoute() {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
      return <DashboardSkeleton />;
    }

    if (options?.requireAuth !== false && !user) {
      return <Navigate to={options?.redirectTo || "/"} replace />;
    }

    if (user?.forcePasswordChange && location.pathname !== '/force-password-change') {
      return <Navigate to="/force-password-change" replace />;
    }

    if (!user?.forcePasswordChange && location.pathname === '/force-password-change') {
      if (user?.role === 'camp_logistics_coordinator' || user?.role === 'zone_coordinator') {
        return <Navigate to="/coordinator-analytics" replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
  };
};