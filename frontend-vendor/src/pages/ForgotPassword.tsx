import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { authService } from "@/services/AuthServices";
import { VendorButton } from "@/components/ui/button";
import { VendorInput } from "@/components/ui/input";
import SideBanner from "@/components/SideBanner";
import logo from "@/assets/flowmart-logo.png";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const response = await authService.forgotPassword(email);
      setLoading(false);

      const responseData = response?.data || response;

      if (responseData?.success) {
        showToast("Reset code sent to your email", "success");
        setStep(2);
      } else {
        // Handle unverified user redirection (Scenario A)
        if (responseData?.code === "EMAIL_UNVERIFIED") {
          showToast(responseData.message || "Email is unverified. Redirecting to verify OTP...", "info");
          
          // Set access credentials in localStorage
          if (responseData.token) {
            localStorage.setItem("accessToken", responseData.token);
          }
          if (responseData.user) {
            localStorage.setItem("currentUser", JSON.stringify(responseData.user));
          }

          // Navigate to OTP page by forcing a reload to refresh AuthProvider context
          setTimeout(() => {
            window.location.href = "/otp";
          }, 1500);
        } else {
          setError(responseData?.message || "Failed to initiate password reset.");
        }
      }
    } catch (err: any) {
      setLoading(false);
      const data = err.response?.data;
      
      // Secondary check for Scenario A redirection
      if (data?.code === "EMAIL_UNVERIFIED") {
        showToast(data.message || "Email is unverified. Redirecting to verify OTP...", "info");
        
        if (data.token) {
          localStorage.setItem("accessToken", data.token);
        }
        if (data.user) {
          localStorage.setItem("currentUser", JSON.stringify(data.user));
        }

        setTimeout(() => {
          window.location.href = "/otp";
        }, 1500);
      } else {
        setError(data?.message || err.message || "An error occurred. Please try again.");
      }
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!otp.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError("Please fill out all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await authService.resetPassword({
        email,
        otp,
        newPassword,
      });
      setLoading(false);

      const responseData = response?.data || response;

      if (responseData?.success) {
        showToast("Password has been reset successfully. Please login.", "success");
        setTimeout(() => {
          navigate("/");
        }, 1500);
      } else {
        setError(responseData?.message || "Failed to reset password. Please verify the code.");
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || err.message || "Failed to reset password.");
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col lg:flex-row">
      <SideBanner />

      <div className="flex-grow flex flex-col p-6 lg:p-12 relative">
        <button
          onClick={() => (step === 2 ? setStep(1) : navigate("/"))}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition absolute top-6 left-6 lg:top-12 lg:left-12 cursor-pointer"
        >
          <ArrowLeft size={16} /> {step === 2 ? "Back to Step 1" : "Back to Login"}
        </button>

        <div className="flex-grow flex items-center justify-center max-w-lg mx-auto w-full">
          <div className="w-full flex flex-col gap-6">
            <div className="text-center lg:text-left mt-8 lg:mt-0">
              <div className="flex items-center gap-2 h-16 lg:h-20 mb-3 justify-center w-fit-content">
                <img src={logo} alt="FlowMart Logo" className="h-40 lg:h-60 object-contain" />
              </div>
              <h2 className="text-3xl font-bold font-headings text-foreground leading-tight">
                {step === 1 ? "Forgot Password" : "Reset Password"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {step === 1
                  ? "Enter your email to request a reset OTP"
                  : "Enter the reset code sent to your email and choose a new password"}
              </p>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-xl font-medium text-center">
                {error}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleRequestReset} className="flex flex-col gap-5">
                <div className="bg-surface p-6 rounded-2xl border border-border/70 shadow-xs flex flex-col gap-4">
                  <VendorInput
                    label="Email Address"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <VendorButton type="submit" disabled={!email.trim() || loading} className="mt-2">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />}
                  {loading ? "Sending..." : "Request Reset Code"}
                </VendorButton>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
                <div className="bg-surface p-6 rounded-2xl border border-border/70 shadow-xs flex flex-col gap-4">
                  <VendorInput
                    label="Verification Code (OTP)"
                    name="otp"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />

                  <div className="relative w-full">
                    <VendorInput
                      label="New Password"
                      name="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-[44px] text-muted-foreground hover:text-foreground transition cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <VendorInput
                    label="Confirm New Password"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <VendorButton
                  type="submit"
                  disabled={!otp.trim() || !newPassword.trim() || !confirmPassword.trim() || loading}
                  className="mt-2"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />}
                  {loading ? "Resetting..." : "Reset Password"}
                </VendorButton>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
