import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";

import OtpInput from "@/components/OTPInput";
import { authService } from "@/services/AuthServices";
import SideBanner from "@/components/SideBanner";
import { Button } from "@/components/ui/button";

// import { useToast } from "@/hooks/use-toast";

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  // const { showToast } = useToast();

  const [loading, setLoading] = useState(false);

  const handleOtpComplete = async (otp: string) => {
    setLoading(true);

    try {
      const res = await authService.verifyOtp(otp);

      if (res?.success) {
        // showToast(
        //   res.message || "OTP verified successfully",
        //   "success"
        // );

        setTimeout(() => {
          navigate("/profile-setup");
        }, 1000);
      } else {
        // showToast(
        //   res?.message || "Invalid OTP",
        //   "error"
        // );
      }
    } catch (err: any) {
      // showToast(
      //   err?.message || "OTP verification failed",
      //   "error"
      // );
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