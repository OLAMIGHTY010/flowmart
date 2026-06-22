import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { Mail } from "lucide-react";

import OtpInput from "@/components/OTPInput";
import { authService } from "@/services/AuthServices";
import SideBanner from "@/components/SideBanner";
import { Button } from "@/components/ui/button";

// import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUser } = useAuth();
  const stateEmail = (location.state as any)?.email;

  const [loading, setLoading] = useState(false);

  // If no user and no email in state, redirect to login
  if (!user && !stateEmail) {
    return <Navigate to="/login" replace />;
  }

  // Already verified — send to home
  if (user?.isVerified) {
    return <Navigate to="/" replace />;
  }

  const handleOtpComplete = async (otp: string) => {
    const targetEmail = user?.email || stateEmail;
    if (!targetEmail) return;

    setLoading(true);

    try {
      const res = await authService.verifyOtp({ email: targetEmail, otp });

      if (res?.success) {
        if (res.token) {
          localStorage.setItem("accessToken", res.token);
          if (res.user) localStorage.setItem("currentUser", JSON.stringify(res.user));
        }

        await refreshUser();

        setTimeout(() => {
          navigate("/");
        }, 1000);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col lg:flex-row">
      <SideBanner />

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md flex flex-col gap-6">
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold font-headings text-foreground">
              Verify Your Account
            </h2>

            <p className="text-sm text-muted-foreground mt-1">
              Enter the 6-digit code sent to your email or phone
            </p>
          </div>

          <div className="bg-surface p-8 rounded-3xl border border-border shadow-sm flex flex-col items-center gap-6">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground">
                Verification Code
              </h3>

              <p className="text-sm text-muted-foreground mt-1">
                Enter the code sent to your email or phone number
              </p>
            </div>

            <OtpInput onComplete={handleOtpComplete} />

            {loading && (
              <Button
                variant="outline"
                disabled
                className="w-full animate-pulse"
              >
                Verifying OTP...
              </Button>
            )}

            <button
              type="button"
              className="text-sm font-semibold text-primary hover:underline transition-colors"
            >
              Didn't receive code? Resend
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}