import { useNavigate } from "react-router-dom";
import OtpInput from "@/components/OtpInput";

export default function VerifyOtpPage() {
  const navigate = useNavigate();

  const verifyOtp = async (otp: string) => {
    try {
      const res = await fetch("/api/v1/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });

      const data = await res.json();

      if (data.success) {
        navigate("/profile-setup");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <OtpInput onComplete={verifyOtp} />
    </div>
  );
}