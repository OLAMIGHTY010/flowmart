import { Navigate, Outlet } from "react-router";
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

  // Profile is now completed alongside KYC, so we no longer block /kyc pages here.
  // The Dashboard component itself protects against incomplete KYC/Profile.

  return <Outlet />;
};
