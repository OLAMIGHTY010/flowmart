import { useAuth } from "@/hooks/useAuth";
import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";

import VendorKYCInfo from "@/pages/vendor/KYCInfo";
import RiderKYCInfo from "@/pages/rider/KYCInfo";

import VendorKYCVerification from "@/pages/vendor/KYCVerification";
import RiderKYCVerification from "@/pages/rider/KYCVerification";

import VendorKYCReview from "@/pages/vendor/KYCReview";
import RiderKYCReview from "@/pages/rider/KYCReview";

export function KYCInfoRouter() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Loader2 className="mx-auto mt-20 animate-spin" />;
  if (!user) return <Navigate to="/" replace />;
  if (user.role === "vendor") return <VendorKYCInfo />;
  if (user.role === "dispatch_rider") return <RiderKYCInfo />;
  return <Navigate to="/" replace />;
}

export function KYCVerificationRouter() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Loader2 className="mx-auto mt-20 animate-spin" />;
  if (!user) return <Navigate to="/" replace />;
  if (user.role === "vendor") return <VendorKYCVerification />;
  if (user.role === "dispatch_rider") return <RiderKYCVerification />;
  return <Navigate to="/" replace />;
}

export function KYCReviewRouter() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Loader2 className="mx-auto mt-20 animate-spin" />;
  if (!user) return <Navigate to="/" replace />;
  if (user.role === "vendor") return <VendorKYCReview />;
  if (user.role === "dispatch_rider") return <RiderKYCReview />;
  return <Navigate to="/" replace />;
}
