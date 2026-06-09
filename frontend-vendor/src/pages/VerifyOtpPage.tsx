import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import OtpInput from "@/components/OTPInput";
import { authService } from "@/services/AuthServices";
import SideBanner from "@/components/SideBanner";
import { useToast } from "@/hooks/use-toast";

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);

  const handleOtpComplete = async (otp: string) => {
    setLoading(true);

    try {
      const res = await authService.verifyOtp(otp);

      if (res?.success) {
        showToast(
          res.message || "OTP verified successfully",
          "success"
        );

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

          <div className="bg-surface p-6 rounded-2xl border border-border/70 shadow-xs flex flex-col items-center gap-6">
            <OtpInput onComplete={handleOtpComplete} />

            {loading && (
              <p className="text-sm text-muted-foreground animate-pulse">
                Verifying OTP...
              </p>
            )}

            <button
              type="button"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Didn't receive code? Resend
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}