import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { type GuardOptions } from "@/types/api";

export const createProtectedRoute = (options?: GuardOptions) => {
  return function ProtectedRoute() {
    const { user, isLoading } = useAuth();
    const location = useLocation();

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