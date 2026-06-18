import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const OnboardingGuard = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // STEP 1: must verify account first
  if (!user.isVerified) {
    return <Navigate to="/otp" replace />;
  }


  return <Outlet />;
};
