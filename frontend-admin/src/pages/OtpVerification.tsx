import { useState } from "react";
import { useNavigate } from "react-router";
import { Mail, ShieldCheck } from "lucide-react";

import OtpInput from "@/components/OTPInput";
import { authService } from "@/services/AuthServices";
import { useAuth } from "@/hooks/useAuth";

export default function OtpVerification() {
  const navigate = useNavigate();
  const { refreshUser, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOtpComplete = async (otp: string) => {
    setLoading(true);
    setError('');

    try {
      const res = await authService.verifyOtp(otp);

      if (res?.success || res?.data?.success) {
        await refreshUser();
        // After OTP, navigate to profile setup or force password change.
        setTimeout(() => {
          if (!user?.profileCompleted) {
             navigate("/profile-setup");
          } else if (user?.forcePasswordChange) {
             navigate("/force-password-change");
          } else {
             navigate("/dashboard");
          }
        }, 1000);
      } else {
        setError(res?.message || res?.data?.message || "Invalid OTP");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
       await authService.resendOtp(user?.email || "");
       alert("OTP resent to your email.");
    } catch (err) {
       alert("Failed to resend OTP");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-[#14532d] p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')]"></div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Verify Your Account</h1>
          <p className="text-sm text-green-100 mt-2 font-medium">Enter the 6-digit code sent to your email.</p>
        </div>

        {/* Content */}
        <div className="p-8 flex flex-col items-center gap-6">
          <div className="h-16 w-16 rounded-2xl bg-green-50 flex items-center justify-center border border-green-100">
            <Mail className="h-8 w-8 text-[#0ca948]" />
          </div>

          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-800">
              Verification Code
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Please check your inbox
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-xs px-4 py-3 rounded-xl font-semibold text-center border border-red-100 w-full">
              {error}
            </div>
          )}

          <OtpInput onComplete={handleOtpComplete} />

          {loading && (
            <button
              disabled
              className="w-full py-3.5 bg-slate-100 text-slate-400 font-bold rounded-lg animate-pulse"
            >
              Verifying OTP...
            </button>
          )}

          <button
            type="button"
            onClick={handleResend}
            className="text-sm font-semibold text-[#0ca948] hover:underline transition-colors mt-2"
          >
            Didn't receive code? Resend
          </button>
        </div>
      </div>
    </div>
  );
}
