import { useNavigate } from "react-router";
import { CheckCircle2, Mail, User, Bell, BellRing } from "lucide-react";
import { useState } from "react";
import { VendorButton } from "@/components/ui/button";

export default function EmailVerified() {
  const navigate = useNavigate();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const handleEnableNotifications = () => {
    setNotificationsEnabled(true);
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50/60 flex flex-col items-center justify-between px-5 py-10">
      <div className="w-full max-w-sm flex flex-col items-center gap-6 flex-grow justify-center">

        {/* Check icon */}
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 border-4 border-emerald-200 shadow-sm">
          <CheckCircle2 className="text-emerald-600 w-10 h-10" strokeWidth={2} />
        </div>

        {/* Heading */}
        <div className="text-center flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-gray-900 font-headings">Email Verified!</h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
            Your email address has been successfully verified. You can now continue to your
            account and start using FlowMart Rider Portal.
          </p>
        </div>

        {/* Info cards */}
        <div className="w-full flex flex-col gap-3 mt-2">

          {/* Card 1 - Verification complete */}
          <div className="flex items-start gap-3 bg-white rounded-2xl px-4 py-4 border border-border/60 shadow-xs">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-50 shrink-0 mt-0.5">
              <Mail className="text-emerald-600 w-4 h-4" />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold text-foreground">Verification complete</p>
              <p className="text-xs text-muted-foreground">Secure access enabled</p>
            </div>
          </div>

          {/* Card 2 - Account is ready */}
          <div className="flex items-start gap-3 bg-white rounded-2xl px-4 py-4 border border-border/60 shadow-xs">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-50 shrink-0 mt-0.5">
              <User className="text-emerald-600 w-4 h-4" />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold text-foreground">Your account is ready</p>
              <p className="text-xs text-muted-foreground">
                You can now sign in, manage deliveries, and track earnings from your dashboard.
              </p>
            </div>
          </div>

          {/* Card 3 - Stay in the loop */}
          <div className="flex items-start gap-3 bg-white rounded-2xl px-4 py-4 border border-border/60 shadow-xs">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-50 shrink-0 mt-0.5">
              <Bell className="text-emerald-600 w-4 h-4" />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold text-foreground">Stay in the loop</p>
              <p className="text-xs text-muted-foreground">
                Enable notifications to receive order updates, delivery alerts, and account messages.
              </p>
            </div>
          </div>

          {/* Card 4 - Push notifications */}
          <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-4 border border-border/60 shadow-xs">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-50 shrink-0">
              <BellRing className="text-emerald-600 w-4 h-4" />
            </div>
            <div className="flex flex-col gap-0.5 flex-grow">
              <p className="text-sm font-semibold text-foreground">Push notifications</p>
              <p className="text-xs text-muted-foreground">Recommended for riders</p>
            </div>
            {notificationsEnabled ? (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                Enabled
              </span>
            ) : (
              <button
                onClick={handleEnableNotifications}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition px-3 py-1.5 rounded-full cursor-pointer shrink-0"
              >
                <BellRing size={12} />
                Enable
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="w-full max-w-sm mt-8">
        <VendorButton
          onClick={() => navigate("/dashboard")}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
        >
          <span>→</span> Continue to Home
        </VendorButton>
      </div>
    </div>
  );
}