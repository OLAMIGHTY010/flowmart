import React, { useState } from "react";
import { useNavigate } from "react-router";
import { 
  ArrowLeft, 
  MoreVertical, 
  Clock, 
  Phone, 
  MapPin, 
  Package, 
  CheckCircle2, 
  Circle,
  Navigation,
  Navigation2,
  Home,
  DollarSign,
  User
} from "lucide-react";
import { VendorButton } from "@/components/ui/button";

export default function DeliveryDetails() {
  const navigate = useNavigate();
  const [isConfirming, setIsConfirming] = useState<boolean>(false);

  const handleConfirmDelivery = () => {
    setIsConfirming(true);
    // Simulate updating API status to Delivered
    setTimeout(() => {
      setIsConfirming(false);
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col justify-center items-center py-8">
      {/* Mobile Device Frame Mock */}
      <div className="w-full max-w-[412px] h-[900px] bg-background border border-border/80 shadow-xs flex flex-col justify-between overflow-y-auto no-scrollbar relative">
        
        <div>
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 pt-6 pb-3 bg-white sticky top-0 z-10 border-b border-border/30">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-foreground hover:opacity-80 transition cursor-pointer bg-transparent border-none"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-base text-foreground">Delivery Details</h1>
            <button type="button" className="text-foreground/70 hover:text-foreground cursor-pointer bg-transparent border-none">
              <MoreVertical size={20} />
            </button>
          </div>

          {/* Top Level Status Context Badges */}
          <div className="flex items-center gap-2.5 px-4 pt-4">
            <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-800 text-white font-body">
              <Navigation2 size={12} className="fill-current rotate-90" />
              In Transit
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-muted text-muted-foreground font-body">
              <Clock size={12} />
              Arrived 10:42 AM
            </span>
          </div>

          {/* Screen Content Wrapper */}
          <div className="p-4 flex flex-col gap-4">
            
            {/* Recipient Information Card */}
            <div className="bg-white border border-border/60 rounded-2xl p-4 flex flex-col gap-3.5 shadow-2xs">
              <span className="text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase font-body">
                Recipient Information
              </span>
              
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <User size={22} />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-sm font-bold text-foreground">Adaeze Okonkwo</h2>
                  <span className="text-xs text-muted-foreground font-medium font-body">Recipient</span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 pt-1 border-t border-border/30">
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-medium font-body">
                  <Phone size={14} className="text-muted-foreground/70" />
                  <a href="tel:+2348052345678" className="hover:underline text-foreground/90 font-semibold">+234 805 234 5678</a>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-muted-foreground font-medium font-body">
                  <MapPin size={14} className="text-muted-foreground/70 shrink-0 mt-0.5" />
                  <span className="leading-tight">Zone C — Ikeja, Lagos</span>
                </div>
              </div>
            </div>

            {/* Delivery Contents Card */}
            <div className="bg-white border border-border/60 rounded-2xl p-4 flex flex-col gap-3 shadow-2xs">
              <span className="text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase font-body">
                Delivery Contents
              </span>
              
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-0.5">
                  <span className="text-base font-bold text-emerald-800 font-body tracking-tight">
                    FLW-20250621-0051
                  </span>
                  <h3 className="text-sm font-bold text-foreground">Welfare Pack — Standard</h3>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-body">
                  +4 Packs
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium font-body mt-0.5">
                <Clock size={13} className="text-muted-foreground/60" />
                <span>Handle with care — contains perishables</span>
              </div>
            </div>

            {/* Status Timeline Card */}
            <div className="bg-white border border-border/60 rounded-2xl p-4 flex flex-col gap-3.5 shadow-2xs">
              <span className="text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase font-body">
                Status Timeline
              </span>

              <div className="flex flex-col relative pl-6 mt-1">
                {/* Timeline vertical connector bars */}
                <div className="absolute left-2 top-2 bottom-2 w-[1.5px] bg-emerald-700"></div>
                
                {/* Step 1: Completed */}
                <div className="flex flex-col gap-0.5 pb-5 relative">
                  <CheckCircle2 size={16} className="absolute -left-6 top-0.5 text-emerald-700 bg-white fill-current" />
                  <h4 className="text-xs font-bold text-foreground">Order Assigned</h4>
                  <span className="text-[11px] text-muted-foreground font-medium font-body">09:30 AM</span>
                </div>

                {/* Step 2: Completed */}
                <div className="flex flex-col gap-0.5 pb-5 relative">
                  <CheckCircle2 size={16} className="absolute -left-6 top-0.5 text-emerald-700 bg-white fill-current" />
                  <h4 className="text-xs font-bold text-foreground">Picked Up</h4>
                  <span className="text-[11px] text-muted-foreground font-medium font-body">10:15 AM</span>
                </div>

                {/* Step 3: Current Active */}
                <div className="flex flex-col gap-0.5 pb-5 relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-700 border-2 border-white ring-1 ring-emerald-700"></div>
                  <h4 className="text-xs font-bold text-emerald-700">In Transit</h4>
                  <span className="text-[11px] text-muted-foreground font-medium font-body">10:42 AM</span>
                </div>

                {/* Step 4: Pending */}
                <div className="flex flex-col gap-0.5 relative">
                  <Circle size={14} className="absolute -left-[23px] top-0.5 text-muted-foreground/40 bg-white fill-white" />
                  <h4 className="text-xs font-bold text-muted-foreground/60">Delivered</h4>
                  <span className="text-[11px] text-muted-foreground/40 font-medium font-body">Pending</span>
                </div>
              </div>
            </div>

            {/* Custom Interactive Map Card Section */}
            <div className="border border-emerald-500/30 rounded-2xl p-3 bg-emerald-50/20 shadow-2xs flex flex-col gap-3">
              {/* Visual Map Underlay Representation Block */}
              <div className="h-28 w-full bg-emerald-50 rounded-xl relative overflow-hidden border border-emerald-100 flex items-center justify-center">
                
                {/* Absolute Mock Map Route Graphic Elements */}
                <div className="absolute top-1/2 left-10 right-10 h-[2px] bg-emerald-300/60 dashed-line"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute left-14 top-10 animate-ping opacity-60"></div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 absolute left-14 top-10"></div>
                <div className="w-2 h-2 rounded-full bg-emerald-400 absolute right-20 bottom-8"></div>
                
                {/* Pin Context Information Overlay Indicator */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1.5 rounded-lg shadow-xs border border-border/40 flex flex-col items-center max-w-[180px] text-center">
                  <span className="text-[9px] font-bold text-foreground truncate w-full">Adaeze Okonkwo —</span>
                  <span className="text-[8px] text-muted-foreground font-medium font-body truncate w-full">Zone C, Ikeja</span>
                </div>

                {/* Map Central Pin Icon Marker */}
                <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center shadow-md shadow-emerald-900/20 z-10">
                  <MapPin size={16} className="fill-current" />
                </div>
              </div>

              {/* Action Trigger Navigation Button */}
              <VendorButton
                onClick={() => console.log("Launching external maps view connection...")}
                className="w-full bg-[#006837] hover:bg-[#00522b] text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs"
              >
                <Navigation size={13} className="fill-current" />
                Navigate to Vendor →
              </VendorButton>
            </div>

            {/* Distance Metrics Strip */}
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-border/50 rounded-xl p-3 bg-white flex items-center justify-center gap-2">
                <MapPin size={14} className="text-emerald-700" />
                <span className="text-xs font-bold text-foreground font-body">3.2 km</span>
              </div>
              <div className="border border-border/50 rounded-xl p-3 bg-white flex items-center justify-center gap-2">
                <Clock size={14} className="text-emerald-700" />
                <span className="text-xs font-bold text-foreground font-body">~12 min</span>
              </div>
            </div>

            {/* Bottom Form Actions Panel Area */}
            <div className="flex flex-col gap-2.5 pt-1 pb-4">
              <button
                type="button"
                onClick={() => console.log("Opening delivery issue workflow portal")}
                className="w-full bg-white text-destructive border border-destructive/30 hover:bg-destructive/5 py-3.5 rounded-xl text-xs font-bold transition cursor-pointer font-body"
              >
                Report Issue
              </button>
              
              <VendorButton
                onClick={handleConfirmDelivery}
                disabled={isConfirming}
                className="w-full bg-[#006837] hover:bg-[#00522b] text-white py-3.5 rounded-xl text-sm font-bold shadow-xs tracking-wide"
              >
                {isConfirming ? "Processing submission..." : "Confirm Delivery"}
              </VendorButton>
            </div>

          </div>
        </div>

        {/* Global Floating Footer Screen Layout Bar */}
        <nav className="border-t border-border/70 flex justify-around py-2.5 bg-white z-10 mt-auto">
          <button type="button" onClick={() => navigate("/dashboard")} className="flex flex-col items-center gap-1 text-[11px] font-medium text-muted-foreground/60 flex-1 bg-transparent border-none cursor-pointer hover:text-foreground">
            <Home size={18} />
            <span>Home</span>
          </button>
          <button type="button" className="flex flex-col items-center gap-1 text-[11px] font-bold text-[#006837] flex-1 bg-transparent border-none cursor-pointer">
            <Package size={18} />
            <span>Deliveries</span>
          </button>
          <button type="button" className="flex flex-col items-center gap-1 text-[11px] font-medium text-muted-foreground/60 flex-1 bg-transparent border-none cursor-not-allowed">
            <DollarSign size={18} />
            <span>Earnings</span>
          </button>
          <button type="button" className="flex flex-col items-center gap-1 text-[11px] font-medium text-muted-foreground/60 flex-1 bg-transparent border-none cursor-not-allowed">
            <User size={18} />
            <span>Profile</span>
          </button>
        </nav>

      </div>
    </div>
  );
}