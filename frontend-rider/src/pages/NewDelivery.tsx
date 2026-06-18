import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Package, 
  AlertTriangle, 
  Home, 
  DollarSign, 
  User, 
  ShieldAlert 
} from "lucide-react";
import { VendorButton } from "@/components/ui/button";
import { useOrder } from "@/hooks/useRiderQueries";
import { useAcceptDelivery, useDeclineDelivery } from "@/hooks/useRiderMutations";

export default function DeliveryRequest() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id") || "";
  const { data: order, isLoading } = useOrder(id);
  
  const acceptMutation = useAcceptDelivery();
  const declineMutation = useDeclineDelivery();

  // State control to toggle the active warning sheet overlay
  const [showDeclineSheet, setShowDeclineSheet] = useState<boolean>(false);

  const handleAcceptDelivery = async () => {
    if (!id) return;
    try {
      await acceptMutation.mutateAsync(id);
      navigate("/dashboard"); 
    } catch (error) {
      console.error("Accept error:", error);
    }
  };

  const handleConfirmDecline = async () => {
    if (!id) return;
    try {
      await declineMutation.mutateAsync(id);
      setShowDeclineSheet(false);
      navigate(-1);
    } catch (error) {
      console.error("Decline error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col justify-center items-center py-8 relative">
      {/* Target Application Frame Viewport */}
      <div className="w-full max-w-[412px] h-[900px] bg-background border border-border/80 shadow-xs flex flex-col justify-between overflow-y-auto no-scrollbar relative">
        
        {/* Main Request Container Body */}
        <div className="p-4 flex flex-col gap-4">
          
          {/* Top Status Context Meta Line */}
          <div className="flex justify-between items-center pt-2">
            <span className="text-xs font-semibold text-muted-foreground/90 font-body">
              New Delivery Request
            </span>
            <button 
              type="button"
              onClick={() => navigate(-1)}
              className="text-xs font-bold text-[#006837] hover:underline cursor-pointer bg-transparent border-none"
            >
              Skip
            </button>
          </div>

          {/* Subheader Status Badges Row */}
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-body">
              New Assignment
            </span>
            <span className="text-xs font-bold bg-[#006837] text-white px-2.5 py-0.5 rounded-full tracking-wider font-body">
              00:45
            </span>
          </div>

          {/* Main Focused Delivery Presentation Box */}
          <div className="border border-border/70 rounded-2xl bg-white p-4 flex flex-col gap-4 shadow-2xs">
            
            {/* Header Identity Row */}
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase font-body">
                  Order ID
                </span>
                <span className="text-base font-bold text-foreground tracking-tight">
                  {order?.id || id || "Loading..."}
                </span>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/30 font-body">
                Priority
              </span>
            </div>

            {/* Client Context Information Frame */}
            <div className="bg-muted/30 rounded-xl p-3.5 border border-border/20 flex flex-col gap-1">
              <h3 className="text-sm font-bold text-foreground">{order?.customerName || "Customer"}</h3>
              <p className="text-xs text-muted-foreground font-medium font-body">{order?.customerPhone || "Phone Unavailable"}</p>
              <p className="text-xs text-muted-foreground font-medium font-body mt-0.5">
                {order?.deliveryZone || "Zone Unavailable"}
              </p>
            </div>

            {/* Parcel Meta Breakdown Strip */}
            <div className="border border-border/50 rounded-xl p-3.5 bg-white flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <h4 className="text-xs font-bold text-foreground">Welfare Pack — Premium</h4>
                <p className="text-[11px] text-muted-foreground font-medium font-body leading-tight">
                  Handle with care — contains perishables
                </p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-body">
                +{order?.packsCount || 0} Packs
              </span>
            </div>

            {/* Trip Performance Sizing Information Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/30 rounded-xl p-3 border border-border/20 flex flex-col">
                <span className="text-[10px] font-semibold text-muted-foreground font-body">Distance</span>
                <span className="text-sm font-bold text-foreground font-body mt-0.5">{order?.distance || "0 km"}</span>
              </div>
              <div className="bg-muted/30 rounded-xl p-3 border border-border/20 flex flex-col">
                <span className="text-[10px] font-semibold text-muted-foreground font-body">Est. Time</span>
                <span className="text-sm font-bold text-foreground font-body mt-0.5">~{order?.estimatedTime || "0 min"}</span>
              </div>
            </div>

            {/* Income Allocation Tracker Flag */}
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl py-3 px-4 text-center">
              <p className="text-xs font-bold text-emerald-800 font-body tracking-wide">
                💰 Earn ₦{order?.totalAmount || "0"} for this delivery →
              </p>
            </div>

            {/* Interactive Functional Controls Systems Row */}
            <div className="flex flex-col gap-2.5 mt-1">
              <VendorButton
                onClick={handleAcceptDelivery}
                disabled={acceptMutation.isPending || isLoading}
                className="w-full bg-[#006837] hover:bg-[#00522b] text-white py-3.5 rounded-xl text-sm font-bold tracking-wide"
              >
                {acceptMutation.isPending ? "Accepting offer..." : "Accept Delivery"}
              </VendorButton>
              
              <button
                type="button"
                onClick={() => setShowDeclineSheet(true)}
                className="w-full bg-white text-destructive border border-destructive/40 hover:bg-destructive/5 py-3.5 rounded-xl text-sm font-bold transition cursor-pointer font-body"
              >
                Decline
              </button>
            </div>

          </div>
        </div>



        {/* Warning Sheets presentation Drawer Sheet Overlay */}
        {showDeclineSheet && (
          <div className="absolute inset-0 bg-black/40 z-50 flex flex-col justify-end transition-opacity duration-300">
            {/* Click outside backdrop dismissal layer utility */}
            <div className="flex-1" onClick={() => setShowDeclineSheet(false)}></div>
            
            {/* White Sheet Box Drawer Panel Body Container */}
            <div className="bg-white rounded-t-3xl p-5 border-t border-border flex flex-col gap-4 animate-in slide-in-from-bottom duration-200">
              
              {/* Sheet Drag Accent Indicator Bar */}
              <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-1"></div>

              {/* Icon Alert Context Marker Box */}
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                <ShieldAlert size={26} />
              </div>

              {/* Strategic Information Block Info */}
              <div className="text-center flex flex-col gap-1 px-2">
                <h2 className="text-base font-bold text-foreground">Decline This Delivery?</h2>
                <p className="text-xs text-muted-foreground/90 font-medium font-body leading-relaxed">
                  Declining this delivery will remove it from your queue, reduce your acceptance rate, and may affect your priority ranking for future assignments.
                </p>
              </div>

              {/* Explicit Impact Breakdown Callouts */}
              <div className="flex flex-col gap-2.5 bg-muted/30 border border-border/40 p-3.5 rounded-xl">
                <div className="flex items-start gap-2 text-destructive">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <p className="text-[11px] font-semibold font-body text-destructive/90 leading-tight">
                    Your acceptance rate will drop
                  </p>
                </div>
                <div className="flex items-start gap-2 text-destructive">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <p className="text-[11px] font-semibold font-body text-destructive/90 leading-tight">
                    This order will be reassigned to another rider.
                  </p>
                </div>
              </div>

              {/* Action Sheet Terminal Triggers Button Group Row */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeclineSheet(false)}
                  className="w-full bg-muted/60 text-foreground font-bold py-3.5 rounded-xl text-sm border border-border/40 hover:bg-muted/90 transition cursor-pointer font-body"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDecline}
                  className="w-full bg-destructive text-white font-bold py-3.5 rounded-xl text-sm shadow-xs hover:bg-destructive/90 transition cursor-pointer font-body"
                >
                  Yes, Decline
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}