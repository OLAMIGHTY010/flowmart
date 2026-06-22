import React, { useState } from "react";
import { useNavigate, Navigate,useLocation } from "react-router-dom";
import OtpInput from "@/components/OTPInput";
import { authService } from "@/services/AuthServices";
import SideBanner from "@/components/SideBanner";
import OnboardingStepIndicator from "@/components/OnboardingStepIndicator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const location = useLocation();
  const { user, refreshUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [justVerified, setJustVerified] = useState(false);

  const stateEmail = (location.state as any)?.email;

  // No session at all — user must register/login first
  if (!user && !stateEmail) {
    return <Navigate to="/" replace />;
  }

  // Already verified — send to login page
  if (user?.isVerified && !justVerified) {
    return <Navigate to="/" replace />;
  }

  const handleOtpComplete = async (otp: string) => {
    const targetEmail = user?.email || stateEmail;
    if (!targetEmail) {
      showToast("Email address not found.", "error");
      return;
    }

    setLoading(true);

    try {
      const res = await authService.verifyOtp({ email: targetEmail, otp });

      if (res?.success) {
        setJustVerified(true);
        showToast(
          res.message || "OTP verified successfully",
          "success"
        );

        if (res.token) {
          localStorage.setItem("accessToken", res.token);
          if (res.user) localStorage.setItem("currentUser", JSON.stringify(res.user));
        }

        // Sync context to update verified status
        await refreshUser();

        setTimeout(() => {
          navigate("/profile-setup");
        }, 1000);
      } else {
        showToast(
          res?.message || "Invalid OTP",
          "error"
        );
      }
    } catch (err: any) {
      showToast(
        err?.message || "OTP verification failed",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    const targetEmail = user?.email || stateEmail;
    if (!targetEmail) {
      showToast("Email address not found. Please register or login again.", "error");
      return;
    }

    setResending(true);
    try {
      const res = await authService.resendOtp(targetEmail);
      if (res?.success) {
        showToast(
          res.message || "A new verification code has been sent to your email.",
          "success"
        );
      } else {
        showToast(
          res?.message || "Failed to resend verification code.",
          "error"
        );
      }
    } catch (err: any) {
      showToast(
        err?.message || "Failed to resend verification code.",
        "error"
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col lg:flex-row">
      <SideBanner />

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md flex flex-col gap-6">

          <div className="text-center lg:text-left">
            <div className="mb-4 lg:mb-6">
              <OnboardingStepIndicator currentStep={2} />
            </div>
            <h2 className="text-2xl font-bold font-headings text-foreground">
              Verify Your Account
            </h2>

            <p className="text-sm text-muted-foreground mt-1">
              Enter the 6-digit code sent to your email or phone
            </p>
          </div>

          <div className="bg-surface p-4 sm:p-6 rounded-2xl border border-border/70 shadow-xs flex flex-col items-center gap-4 sm:gap-6">
            <OtpInput onComplete={handleOtpComplete} />

            {loading && (
              <p className="text-sm text-muted-foreground animate-pulse">
                Verifying OTP...
              </p>
            )}

            <button
              type="button"
              disabled={resending || loading}
              onClick={handleResendOtp}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer disabled:opacity-50"
            >
              {resending ? "Resending..." : "Didn't receive code? Resend"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}