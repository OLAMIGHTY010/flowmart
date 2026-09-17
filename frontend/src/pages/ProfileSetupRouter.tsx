import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import VendorProfileSetup from "@/pages/vendor/ProfileSetup";
import RiderProfileSetup from "@/pages/rider/ProfileSetup";
import { Loader2 } from "lucide-react";

export default function ProfileSetupRouter() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.role === "vendor") {
    return <VendorProfileSetup />;
  }

  if (user.role === "dispatch_rider") {
    return <RiderProfileSetup />;
  }

  return <Navigate to="/" replace />;
}
