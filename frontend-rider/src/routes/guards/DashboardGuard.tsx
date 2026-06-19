import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useKYCStatus } from "@/hooks/useRiderQueries";

export const DashboardGuard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { data: kycStatus, isLoading: kycLoading } = useKYCStatus();


  if (authLoading || kycLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!user.isVerified) {
    return <Navigate to="/otp" replace />;
  }

  if (!user.profileCompleted) {
    return <Navigate to="/profile-setup" replace />;
  }

  const status = kycStatus?.status || 'unsubmitted';

  if (status !== 'approved') {
    if (status === 'unsubmitted' || status === 'rejected') {
      return <Navigate to="/kyc" replace />;
    }
    // pending or under_review
    return <Navigate to="/kyc/verification" replace />;
  }

  return <Outlet />;
};
