import * as React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useKYCStatus } from "@/hooks/useVendorQueries";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Loader2,
  Copy,
  Mail,
  Bell,
  LayoutDashboard,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function KYCVerification() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  // Poll KYC status from TanStack query (refetch every 3 seconds)
  const { data: kycData } = useKYCStatus({ refetchInterval: 3000 });

  // Mock Admin approval simulation: automatically approve after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentStatus = localStorage.getItem("vendor_kyc_status");
      if (currentStatus) {
        try {
          const parsed = JSON.parse(currentStatus);
          if (parsed.status !== "approved") {
            parsed.status = "approved";
            parsed.steps = [
              { label: "Application Submitted", time: "Today, 10:23 AM", status: "done" },
              { label: "Document Review", time: "Today, 10:25 AM", status: "done" },
              { label: "Admin Verification", time: "Today, 10:30 AM", status: "done" },
              { label: "Account Activated", time: "Just now", status: "done" }
            ];
            localStorage.setItem("vendor_kyc_status", JSON.stringify(parsed));
          }
        } catch {
          // ignore
        }
      } else {
        // Create an approved status if none exists
        localStorage.setItem("vendor_kyc_status", JSON.stringify({
          status: "approved",
          referenceId: "KYC-2024-00391",
          steps: [
            { label: "Application Submitted", time: "Today, 10:23 AM", status: "done" },
            { label: "Document Review", time: "Today, 10:25 AM", status: "done" },
            { label: "Admin Verification", time: "Today, 10:30 AM", status: "done" },
            { label: "Account Activated", time: "Just now", status: "done" }
          ]
        }));
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  const referenceId = kycData?.referenceId || "KYC-2024-00391";
  const status = kycData?.status || "under_review";
  const isApproved = status === "approved";

  // Use dynamic steps from API or fallback
  const steps = kycData?.steps || [
    {
      label: "Application Submitted",
      time: "Today, 10:23 AM",
      status: "done",
    },
    {
      label: "Document Review",
      time: "Today, 10:25 AM",
      status: "done",
    },
    {
      label: "Admin Verification",
      time: "In progress...",
      status: "active",
    },
    {
      label: "Account Activated",
      time: "Pending",
      status: "pending",
    },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(referenceId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm rounded-3xl overflow-hidden min-h-[740px] flex flex-col shadow-none border-none sm:border sm:shadow-sm bg-background">

        {/* TOP GREEN HEADER */}
        <div className="bg-[#155331] text-white pt-10 pb-10 px-6 flex flex-col items-center text-center rounded-b-[2.5rem]">
          {/* Stepper */}
          <div className="flex items-center justify-between w-full max-w-xs mb-8 text-xs font-medium">
            {/* Step 1 */}
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className="w-6 h-6 rounded-full bg-[#22c55e] text-white flex items-center justify-center text-[10px]">✓</div>
              <span className="text-[#22c55e] text-[11px]">Account</span>
            </div>
            <div className="h-[2px] bg-[#22c55e] flex-grow -mt-4 mx-1" />

            {/* Step 2 */}
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className="w-6 h-6 rounded-full bg-[#22c55e] text-white flex items-center justify-center text-[10px]">✓</div>
              <span className="text-[#22c55e] text-[11px]">Profile</span>
            </div>
            <div className="h-[2px] bg-[#22c55e] flex-grow -mt-4 mx-1" />

            {/* Step 3 — Active */}
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${isApproved ? 'bg-[#22c55e] text-white' : 'bg-white text-[#155331]'}`}>
                {isApproved ? "✓" : "3"}
              </div>
              <span className={`${isApproved ? 'text-[#22c55e]' : 'text-white'} text-[11px] font-semibold`}>KYC</span>
            </div>
            <div className={`h-[2px] flex-grow -mt-4 mx-1 ${isApproved ? 'bg-[#22c55e]' : 'bg-muted/30'}`} />

            {/* Step 4 */}
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[11px] ${isApproved ? 'bg-white text-[#155331] font-bold border-white' : 'bg-[#1e293b]/40 border-white/20 text-white/60'}`}>
                4
              </div>
              <span className={`${isApproved ? 'text-white font-semibold' : 'text-white/60'} text-[11px]`}>Store</span>
            </div>
          </div>

          {/* Shield Icon */}
          <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-4 shadow-inner">
            <ShieldCheck className="w-8 h-8 text-[#22c55e]" strokeWidth={2} />
          </div>

          <h1 className="text-xl font-bold mb-2">
            {isApproved ? "Account Activated!" : "Verification Submitted!"}
          </h1>
          <p className="text-sm text-white/70 max-w-[240px] leading-relaxed">
            {isApproved 
              ? "Your account has been fully verified and activated. Welcome aboard!" 
              : "Our admin team is reviewing your documents. This usually takes 1–2 business days."}
          </p>
        </div>

        {/* BODY */}
        <CardContent className="pt-5 pb-6 flex flex-col gap-5 flex-grow">

          {/* Status Badge */}
          <div className="flex justify-center">
            {isApproved ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-green-300 bg-green-50 text-green-600 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-amber-300 bg-amber-50 text-amber-600 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse" />
                Under Review
              </span>
            )}
          </div>

          {/* Timeline Steps */}
          <div className="flex flex-col gap-0 pl-1">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                {/* Icon + vertical line */}
                <div className="flex flex-col items-center">
                  <div className="mt-0.5">
                    {step.status === "done" && (
                      <CheckCircle2 className="w-5 h-5 text-[#22c55e]" fill="#22c55e" color="white" />
                    )}
                    {step.status === "active" && (
                      <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                    )}
                    {step.status === "pending" && (
                      <Clock className="w-5 h-5 text-muted-foreground/50" />
                    )}
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={`w-[2px] h-7 mt-1 rounded-full ${
                        step.status === "done" ? "bg-[#22c55e]" : "bg-muted"
                      }`}
                    />
                  )}
                </div>

                {/* Text */}
                <div className="pb-4">
                  <p
                    className={`text-sm font-semibold leading-tight ${
                      step.status === "active"
                        ? "text-amber-500"
                        : step.status === "done"
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Reference ID */}
          <div className="bg-muted/40 rounded-2xl px-4 py-3 flex items-center justify-between border border-muted">
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">Reference ID</p>
              <p className="text-sm font-bold text-foreground tracking-wide">{referenceId}</p>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs text-[#10a34c] font-semibold hover:opacity-80 transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* Notification Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#f0fdf4] rounded-2xl p-3 flex flex-col items-center text-center gap-1.5 border border-green-100">
              <div className="w-8 h-8 rounded-full bg-[#dcfce7] flex items-center justify-center">
                <Mail className="w-4 h-4 text-[#16a34a]" />
              </div>
              <p className="text-xs font-semibold text-foreground">Email Notification</p>
              <p className="text-[10px] text-muted-foreground leading-snug">We'll email you when approved</p>
            </div>
            <div className="bg-[#f0fdf4] rounded-2xl p-3 flex flex-col items-center text-center gap-1.5 border border-green-100">
              <div className="w-8 h-8 rounded-full bg-[#dcfce7] flex items-center justify-center">
                <Bell className="w-4 h-4 text-[#16a34a]" />
              </div>
              <p className="text-xs font-semibold text-foreground">Push Alert</p>
              <p className="text-[10px] text-muted-foreground leading-snug">In-app notification on approval</p>
            </div>
          </div>

          {/* Go to Dashboard Button (Enabled only when approved) */}
          <Button
            onClick={() => isApproved && navigate('/dashboard')}
            disabled={!isApproved}
            className={`w-full font-bold py-3.5 rounded-full mt-1 transition-all ${
              isApproved 
                ? "bg-primary hover:bg-primary/90 text-primary-foreground border-none shadow-md cursor-pointer active:scale-95" 
                : "bg-muted text-muted-foreground border border-border cursor-not-allowed opacity-60"
            }`}
            variant={isApproved ? "default" : "outline"}
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Button>

          {/* Help Link */}
          <div className="flex justify-center">
            <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition cursor-pointer bg-transparent border-none">
              <HelpCircle className="w-3.5 h-3.5" />
              Need help? Contact support
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}