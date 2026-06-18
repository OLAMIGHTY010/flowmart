import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, 
  AlertTriangle, 
  MapPin, 
  Package, 
  CheckCircle2, 
  Home, 
  DollarSign, 
  User,
  ShieldAlert
} from "lucide-react";
import { VendorButton } from "@/components/ui/button";
import { useOrder } from "@/hooks/useRiderQueries";
import { useSubmitShortageReport } from "@/hooks/useRiderMutations";

export default function ShortageReport() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: order } = useOrder(id || "");
  const submitMutation = useSubmitShortageReport();
  
  // Interactive state handling for the bottom confirmation sheet drawer
  const [showSubmitSheet, setShowSubmitSheet] = useState<boolean>(false);

  const handleConfirmSubmit = async () => {
    if (!id) return;
    try {
      await submitMutation.mutateAsync({ id, data: { status: 'shortage_reported' } });
      setShowSubmitSheet(false);
      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to submit shortage report", error);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col justify-center items-center py-8">
      {/* Mobile Shell Device View Frame */}
      <div className="w-full max-w-[412px] h-[900px] bg-background border border-border/80 shadow-xs flex flex-col justify-between overflow-y-auto no-scrollbar relative">
        
        <div>
          {/* Top Sticky Header Section */}
          <div className="flex items-center justify-between px-4 pt-6 pb-3 bg-white sticky top-0 z-10 border-b border-border/30">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="text-foreground hover:opacity-80 transition cursor-pointer bg-transparent border-none"
                aria-label="Navigate back"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="font-bold text-base text-foreground tracking-tight">Shortage Report</h1>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-muted text-muted-foreground/90 font-body">
              Step 3 of 3
            </span>
          </div>

          {/* Core Layout Workspace View */}
          <div className="p-4 flex flex-col gap-4">
            
            {/* Meta Context Header Data Identification Grid */}
            <div className="bg-white border border-border/60 rounded-2xl p-4 flex flex-col gap-3 shadow-2xs">
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-emerald-800 font-body tracking-tight">
                  {order?.id || id || "Loading..."}
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-body">
                  +1 Pack Missing
                </span>
              </div>

              {/* Recipient & Route Details Breakdown Line */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-muted/30 rounded-xl p-3 border border-border/20 flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase font-body tracking-wider">Recipient</span>
                  <span className="text-xs font-bold text-foreground">{order?.customerName || "Customer"}</span>
                  <span className="text-[10px] text-muted-foreground font-body font-medium">{order?.customerPhone || "Phone Unavailable"}</span>
                </div>
                <div className="bg-muted/30 rounded-xl p-3 border border-border/20 flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase font-body tracking-wider">Route</span>
                  <span className="text-xs font-bold text-foreground">{order?.deliveryZone?.split(" ")[0] || "Zone"}</span>
                  <span className="text-[10px] text-muted-foreground font-body font-medium truncate">{order?.deliveryZone || "Unavailable"}</span>
                </div>
              </div>

              {/* Legal / Operational Warning Banner segment */}
              <div className="mt-1 bg-amber-50/60 border border-amber-200/70 rounded-xl p-3 flex gap-2.5">
                <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <h4 className="text-xs font-bold text-amber-900">Report requires review before submission</h4>
                  <p className="text-[10px] text-amber-800/80 font-medium font-body leading-tight">
                    Confirm the shortage details carefully. This report will be reviewed by the FlowMart team and cannot be edited after submission.
                  </p>
                </div>
              </div>
            </div>

            {/* Delivery Pack Manifest & Map Preview Row Block */}
            <div className="bg-white border border-border/60 rounded-2xl p-4 flex flex-col gap-3 shadow-2xs">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase font-body tracking-wider">Delivery Contents</span>
                  <h3 className="text-sm font-bold text-foreground mt-0.5">Welfare Pack</h3>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-muted text-muted-foreground font-body">
                  Expected {order?.packsCount || 0} Packs
                </span>
              </div>

              {/* Interactive Virtual Delivery Region Mini-Map Card */}
              <div className="h-32 w-full bg-emerald-50/40 border border-emerald-100 rounded-xl relative overflow-hidden flex items-end">
                
                {/* Simulated Geofencing Vector Paths Grid */}
                <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#006837_1px,transparent_1px)] [background-size:16px_16px]"></div>
                <div className="absolute top-1/4 left-1/3 w-20 h-10 border border-emerald-300 rounded-full bg-emerald-100/30 rotate-12"></div>
                
                {/* Horizontal Action Bottom Drawer Sheet Overlay over Map rendering */}
                <div className="w-full bg-white/95 backdrop-blur-xs p-3 border-t border-border/40 flex items-center justify-between z-10">
                  <div className="flex flex-col gap-0.5 max-w-[60%]">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide font-body">Quick Navigation</span>
                    <p className="text-xs font-bold text-foreground leading-tight">Begin routing to vendor immediately</p>
                  </div>
                  <VendorButton 
                    onClick={() => console.log("Routing connection initiated...")}
                    className="bg-[#006837] hover:bg-[#00522b] text-white text-[11px] font-bold py-2 px-3.5 rounded-lg shadow-xs"
                  >
                    Navigate to Vendor
                  </VendorButton>
                </div>
              </div>
            </div>

            {/* Shortage Evidence Manifest Data Line */}
            <div className="bg-white border border-border/60 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase font-body tracking-wider">Shortage Summary</span>
                <h4 className="text-sm font-bold text-foreground">1 pack missing from delivery</h4>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-rose-50 text-rose-600 border border-rose-100 font-body">
                Evidence Required
              </span>
            </div>

          </div>
        </div>

        {/* Dynamic Static Footer Actions System Cluster */}
        <div className="p-4 bg-white border-t border-border/40 mt-auto flex flex-col gap-3">
          <VendorButton
            onClick={() => setShowSubmitSheet(true)}
            className="w-full bg-[#006837] hover:bg-[#00522b] text-white py-3.5 rounded-xl text-sm font-bold shadow-xs tracking-wide"
          >
            Submit Report
          </VendorButton>
        </div>



        {/* Absolute Submission Flow Warning Drawer Modal */}
        {showSubmitSheet && (
          <div className="absolute inset-0 bg-black/40 z-50 flex flex-col justify-end transition-opacity duration-300">
            {/* Overlay click-out layer target handling screen dismissal */}
            <div className="flex-1" onClick={() => setShowSubmitSheet(false)}></div>
            
            {/* Main Interactive Bottom Drawer Box */}
            <div className="bg-white rounded-t-3xl p-5 border-t border-border flex flex-col gap-4 animate-in slide-in-from-bottom duration-200">
              
              {/* Layout Alignment indicator pin */}
              <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-1"></div>

              {/* Status Context Central Icon */}
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
                <ShieldAlert size={24} className="text-[#006837]" />
              </div>

              {/* Dynamic Header Titles Area */}
              <div className="text-center flex flex-col gap-1 px-2">
                <h2 className="text-base font-bold text-foreground">Submit Shortage Report?</h2>
                <p className="text-xs text-muted-foreground/90 font-medium font-body leading-relaxed">
                  You are about to submit a shortage report for order {order?.id || id}. This action will be reviewed by the FlowMart team.
                </p>
              </div>

              {/* Warning List Conditions callout boxes */}
              <div className="flex flex-col gap-2 bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-xl">
                <div className="flex items-start gap-2 text-emerald-800">
                  <CheckCircle2 size={13} className="shrink-0 mt-0.5 text-[#006837]" />
                  <p className="text-[11px] font-semibold font-body leading-tight">
                    False reports may lead to account suspension
                  </p>
                </div>
                <div className="flex items-start gap-2 text-emerald-800">
                  <CheckCircle2 size={13} className="shrink-0 mt-0.5 text-[#006837]" />
                  <p className="text-[11px] font-semibold font-body leading-tight">
                    This report cannot be undone once submitted
                  </p>
                </div>
              </div>

              {/* Informative Subtext marker */}
              <p className="text-[10px] text-center text-muted-foreground/80 font-medium font-body">
                Make sure all details are accurate before submitting.
              </p>

              {/* Terminal Sheet Control Triggers Button Group Grid */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSubmitSheet(false)}
                  className="w-full bg-muted/60 text-foreground font-bold py-3.5 rounded-xl text-sm border border-border/40 hover:bg-muted/90 transition cursor-pointer font-body"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  disabled={submitMutation.isPending}
                  className="w-full bg-[#006837] text-white font-bold py-3.5 rounded-xl text-sm shadow-xs hover:bg-[#00522b] transition cursor-pointer font-body"
                >
                  {submitMutation.isPending ? "Submitting..." : "Yes, Submit"}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}