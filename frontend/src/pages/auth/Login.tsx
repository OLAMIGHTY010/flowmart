import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/contexts/ToastContext";
import { GoogleLogin } from "@react-oauth/google";
import { Leaf, ArrowLeft, CheckCircle2 } from "lucide-react";
import type { UserRole } from "@/types/api";

import { authService } from "@/services/AuthServices";

const Login = () => {
  const { loginWithGoogle, refreshUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const selectedRole = (localStorage.getItem("selectedRole") as UserRole) || "user";

  const handleGoogleSuccess = async (credentialResponse: any) => {
    // Check if we actually got the token back from Google
    if (!credentialResponse.credential) {
      showToast("Google login failed — no credential received", "error");
      return;
    }

    setIsLoading(true);
    
    // UPDATED: Calling the updated provider function
    const result = await loginWithGoogle(credentialResponse.credential, selectedRole);

    if (result.success && result.user) {
      if (result.user.isVerified === false) {
        setShowOtp(true);
        setUnverifiedEmail(result.user.email);
        showToast("Please check your email for the verification code.", "success");
        setIsLoading(false);
        return;
      }

      showToast("Welcome to FlowMart!", "success");
      routeUser(result.user);
    } else {
      showToast(result.error || "Login failed. Please try again.", "error");
    }
    setIsLoading(false);
  };

  const routeUser = (u: any) => {
    switch (u.role) {
      case "vendor":
        if (!u.profileCompleted) navigate("/profile-setup");
        else navigate("/vendor/dashboard");
        break;
      case "dispatch_rider":
        if (!u.profileCompleted) navigate("/rider/profile-setup");
        else navigate("/rider/dashboard");
        break;
      default:
        navigate("/products");
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue || otpValue.length < 6) {
      showToast("Please enter a valid 6-digit OTP", "error");
      return;
    }
    setIsVerifying(true);
    try {
      const response = await authService.verifyOtp({ email: unverifiedEmail, otp: otpValue });
      const data = (response as any).data || response;
      if (data.success && data.user) {
        localStorage.setItem("accessToken", data.token);
        localStorage.setItem("currentUser", JSON.stringify(data.user));
        await refreshUser();
        showToast("Email verified successfully!", "success");
        routeUser(data.user);
      } else {
        showToast(data.message || "Invalid OTP", "error");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || "Verification failed", "error");
    }
    setIsVerifying(false);
  };

  const handleResendOtp = async () => {
    try {
      await authService.resendOtp({ email: unverifiedEmail });
      showToast("OTP resent! Please check your email.", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to resend OTP", "error");
    }
  };

  return (
    <div className="login-container">
      {/* ═══ LEFT PANEL: Brand / Visuals (Hidden on mobile) ═══ */}
      <div className="login-visual-panel">
        <div className="overlay" />
        
        <div className="content">
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 60 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--color-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Leaf size={24} style={{ color: "var(--color-text-inverse)" }} />
            </div>
            <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-inverse)" }}>
              Flow<span style={{ color: "var(--color-primary-lighter)" }}>Mart</span>
            </span>
          </Link>

          <h1 style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 700,
            color: "var(--color-text-inverse)",
            lineHeight: 1.1,
            marginBottom: 24,
            maxWidth: 480,
          }}>
            Your trusted gateway to <span style={{ color: "var(--color-primary-lighter)" }}>seamless</span> commerce.
          </h1>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              "Verified local and international vendors",
              "Lightning-fast secure delivery network",
              "100% money-back guarantee on all orders"
            ].map((text, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <CheckCircle2 size={20} style={{ color: "var(--color-primary-lighter)" }} />
                <span style={{ fontSize: "1rem", color: "rgba(255, 255, 255, 0.9)" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ RIGHT PANEL: Form Area ═══ */}
      <div className="login-form-panel">
        <div className="form-wrapper">
          <Link
            to="/get-started"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: "0.875rem",
              color: "var(--color-text-muted)",
              marginBottom: 40,
              transition: "color var(--transition-fast)",
            }}
            className="back-link"
          >
            <ArrowLeft size={16} />
            Back to roles
          </Link>

          {/* Mobile Logo (Only visible on small screens) */}
          <div className="mobile-logo" style={{ display: "none", alignItems: "center", gap: 8, marginBottom: 32 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--color-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Leaf size={20} style={{ color: "var(--color-text-inverse)" }} />
            </div>
            <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
              FlowMart
            </span>
          </div>

          <div>
            <h2 style={{
              fontSize: "2rem",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              marginBottom: 8,
              letterSpacing: "-0.02em",
            }}>
              {showOtp ? "Verify Email" : "Welcome back"}
            </h2>
            <p style={{
              fontSize: "1rem",
              color: "var(--color-text-muted)",
              marginBottom: 40,
            }}>
              {showOtp ? "Enter the 6-digit code sent to your email." : "Sign in to your FlowMart account to continue"}
            </p>

            {showOtp ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
                <input 
                  type="text" 
                  value={otpValue} 
                  onChange={(e) => setOtpValue(e.target.value)} 
                  placeholder="Enter 6-digit OTP" 
                  maxLength={6}
                  style={{
                    padding: "16px",
                    borderRadius: "8px",
                    border: "1px solid var(--color-border)",
                    fontSize: "1.25rem",
                    textAlign: "center",
                    letterSpacing: "4px",
                    width: "100%",
                    outline: "none",
                  }}
                />
                <button 
                  onClick={handleVerifyOtp}
                  disabled={isVerifying}
                  style={{
                    padding: "16px",
                    borderRadius: "8px",
                    backgroundColor: "var(--color-primary)",
                    color: "white",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    fontSize: "1rem",
                  }}
                >
                  {isVerifying ? "Verifying..." : "Verify OTP"}
                </button>
                <button 
                  onClick={handleResendOtp}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-primary)",
                    cursor: "pointer",
                    fontWeight: 600,
                    textDecoration: "underline",
                  }}
                >
                  Resend Code
                </button>
              </div>
            ) : (
              <>
                {/* Google OAuth Button */}
                <div style={{ marginBottom: 32 }}>
                  {isLoading ? (
                    <div className="btn-google" style={{ justifyContent: "center", opacity: 0.7, cursor: "not-allowed", height: 44 }}>
                      <div style={{
                        width: 20,
                        height: 20,
                        border: "2px solid var(--color-border)",
                        borderTopColor: "var(--color-primary)",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }} />
                      Signing in...
                    </div>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => showToast("Google login failed. Please ensure cookies/pop-ups are enabled.", "error")}
                        text="continue_with"
                        shape="rectangular"
                        size="large"
                        width="400"
                        logo_alignment="center"
                      />
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  marginBottom: 32,
                }}>
                  <div style={{ flex: 1, height: 1, backgroundColor: "var(--color-border)" }} />
                  <span style={{ fontSize: "0.813rem", color: "var(--color-text-light)", textTransform: "uppercase", letterSpacing: 1 }}>
                    Secure Login
                  </span>
                  <div style={{ flex: 1, height: 1, backgroundColor: "var(--color-border)" }} />
                </div>

                {/* Info box */}
                <div style={{
                  padding: "20px",
                  backgroundColor: "var(--color-primary-surface)",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--color-primary-muted)",
                }}>
                  <p style={{
                    fontSize: "0.875rem",
                    color: "var(--color-primary-hover)",
                    lineHeight: 1.5,
                  }}>
                    <strong>Passwordless Security.</strong> FlowMart uses Google OAuth to authenticate you securely. We never store or see your passwords.
                  </p>
                </div>
              </>
            )}
          </div>

          <p style={{
            marginTop: "auto",
            paddingTop: 48,
            fontSize: "0.875rem",
            color: "var(--color-text-muted)",
          }}>
            Don't have an account?{" "}
            <Link to="/get-started" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
              Sign up here
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        .login-container {
          display: grid;
          min-height: 100vh;
          grid-template-columns: 1fr;
        }

        .login-visual-panel {
          display: none;
          position: relative;
          background: url('https://images.unsplash.com/photo-1604719312566-8912e9227c6a?q=80&w=1200&auto=format&fit=crop') center/cover no-repeat;
        }

        .login-visual-panel .overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(5, 46, 22, 0.9) 0%, rgba(21, 128, 61, 0.8) 100%);
        }

        .login-visual-panel .content {
          position: relative;
          z-index: 2;
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 60px;
        }

        .login-form-panel {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: var(--color-bg-primary);
          min-height: 100vh;
        }

        .form-wrapper {
          width: 100%;
          max-width: 480px;
          padding: 40px 24px;
          display: flex;
          flex-direction: column;
        }

        .back-link:hover {
          color: var(--color-text-primary) !important;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (min-width: 1024px) {
          .login-container {
            grid-template-columns: 1.1fr 1fr;
          }
          
          .login-visual-panel {
            display: block;
          }
          
          .form-wrapper {
            justify-content: center;
            min-height: auto;
            padding: 60px;
          }
        }
        
        @media (max-width: 1023px) {
          .mobile-logo {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
