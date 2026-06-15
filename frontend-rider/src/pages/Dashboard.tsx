import React, { useState } from "react";
import { useNavigate } from "react-router";
import { 
  QrCode, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  ChevronRight, 
  Home, 
  Package, 
  DollarSign, 
  User, 
  Bell 
} from "lucide-react";
import { VendorButton } from "@/components/ui/button";

interface DeliveryItem {
  id: string;
  customerName: string;
  zone: string;
  packagesCount: number;
  status: "Pending" | "In Transit" | "Completed";
}

function StatQuickAction({ icon, title, onClick }: { icon: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-border/60 shadow-2xs p-3 flex-1 hover:bg-muted/10 transition cursor-pointer"
    >
      <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center">
        {icon}
      </div>
      <span className="text-xs font-bold text-foreground tracking-tight">{title}</span>
    </button>
  );
}

function DeliveryCard({ delivery, onClick }: { delivery: DeliveryItem; onClick: () => void }) {
  const getStatusStyles = (status: DeliveryItem["status"]) => {
    switch (status) {
      case "In Transit":
        return "bg-blue-50 border border-blue-200 text-blue-600";
      case "Completed":
        return "bg-emerald-50 border border-emerald-200 text-emerald-600";
      default:
        return "bg-amber-50 border border-amber-200 text-amber-600";
    }
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl border border-border/60 p-4 flex items-center justify-between cursor-pointer hover:border-border transition-all shadow-2xs"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
          <Package size={20} />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-foreground leading-none">{delivery.customerName}</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              {delivery.zone}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium font-body">
            <span>×{delivery.packagesCount} {delivery.packagesCount > 1 ? "packs" : "pack"}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusStyles(delivery.status)}`}>
              {delivery.status}
            </span>
          </div>
        </div>
      </div>
      <ChevronRight size={16} className="text-muted-foreground/60" />
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  // Driver Online State Toggle
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Active Mock Deliveries dataset matching the design cards
  const [deliveries] = useState<DeliveryItem[]>([
    { id: "1", customerName: "Chidi Nwosu", zone: "Zone A – Lekki", packagesCount: 3, status: "Pending" },
    { id: "2", customerName: "Funke Balogun", zone: "Zone B – VI", packagesCount: 1, status: "In Transit" },
    { id: "3", customerName: "Tunde Adeyemi", zone: "Zone C – Ajah", packagesCount: 2, status: "Pending" },
  ]);

  const activeDeliveriesCount = deliveries.filter(d => d.status !== "Completed").length;

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col pb-24">
      
      {/* Top Greeting Navigation Bar Header */}
      <div className="bg-background px-4 pt-5 pb-4 flex items-center justify-between border-b border-border/40 sticky top-0 z-30">
        <div className="flex flex-col">
          <h1 className="text-base font-bold text-foreground flex items-center gap-1 leading-tight">
            Good Morning, Emeka <span role="img" aria-label="wave">👋</span>
          </h1>
          <p className="text-xs text-muted-foreground font-semibold font-body mt-0.5">
            Tuesday, 17 Jun 2025
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Avatar Profile Silhouette badge */}
          <div className="w-9 h-9 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center cursor-pointer">
            EO
          </div>
          {/* Notification Alert Trigger */}
          <button type="button" className="relative p-1 text-foreground/80 hover:text-foreground transition cursor-pointer">
            <Bell size={20} />
            <span className="absolute top-1 right-1.5 w-2 h-2 rounded-full bg-destructive"></span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-5 px-4 pt-4 max-w-lg mx-auto w-full">
        
        {/* Main Status / Balance Hero Banner */}
        <div className="bg-[#006837] text-white rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col gap-5">
          <div className="flex items-center justify-between z-10">
            <button
              type="button"
              onClick={() => setIsOnline(!isOnline)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                isOnline ? "bg-white/20 text-white" : "bg-destructive text-destructive-foreground"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-400" : "bg-white"} animate-pulse`}></span>
              {isOnline ? "Online" : "Offline"}
            </button>
            <span className="text-xs font-semibold text-white/80 font-body">Ready for deliveries</span>
          </div>

          <div className="flex items-end justify-between mt-1 z-10">
            <div className="flex flex-col gap-0.5">
              <span className="text-2xl font-bold font-body tracking-tight">₦4,850</span>
              <span className="text-xs font-semibold text-white/70 font-body">12 deliveries</span>
            </div>
          </div>
          {/* Subtle design underlay layout circle matching standard vector brand rules */}
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full pointer-events-none"></div>
        </div>

        {/* Quick Action Grid Dashboard Section Subsystem */}
        <div className="flex gap-3 justify-between">
          <StatQuickAction icon={<QrCode size={18} className="text-emerald-700" />} title="Scan QR" onClick={() => navigate("/scan-zone")} />
          <StatQuickAction icon={<AlertTriangle size={18} className="text-destructive" />} title="Report" onClick={() => console.log("Report route")} />
          <StatQuickAction icon={<TrendingUp size={18} className="text-blue-600" />} title="Earnings" onClick={() => console.log("Earnings view")} />
          <StatQuickAction icon={<Clock size={18} className="text-purple-600" />} title="History" onClick={() => console.log("History view")} />
        </div>

        {/* Assigned Deliveries Section Header Area */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Assigned Deliveries</h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-body">
              {activeDeliveriesCount} pending
            </span>
          </div>

          {/* Render Active Delivery Cards systematically */}
          <div className="flex flex-col gap-3">
            {deliveries.map((delivery) => (
              <DeliveryCard 
                key={delivery.id} 
                delivery={delivery} 
                onClick={() => console.log(`Opening delivery detail for: ${delivery.id}`)} 
              />
            ))}
          </div>
        </div>

        {/* Highlight Banner: Currently Delivering status indicator box layout */}
        <div className="bg-white rounded-2xl border border-border/60 p-4 shadow-sm flex flex-col gap-3 mt-1">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-700 font-body">
              Currently Delivering
            </span>
            <h3 className="text-base font-bold text-foreground">Adaeze Okonkwo</h3>
            <p className="text-xs text-muted-foreground font-medium font-body">
              14 Admiralty Way, Lekki Phase 1
            </p>
          </div>
          <VendorButton 
            onClick={() => console.log("Navigating to view active details...")}
            className="w-full bg-[#006837] hover:bg-[#00522b] text-white py-3 rounded-xl font-bold text-sm"
          >
            View Details
          </VendorButton>
        </div>

      </div>

      {/* Persistent Static Application Footer Tab Strip */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-border/70 flex justify-around py-2.5 bg-white z-40 shadow-lg">
        <button type="button" className="flex flex-col items-center gap-1 text-[11px] font-bold text-[#006837] flex-1 bg-transparent border-none cursor-pointer">
          <Home size={18} />
          <span>Home</span>
        </button>
        <button type="button" onClick={() => console.log("Deliveries layout")} className="flex flex-col items-center gap-1 text-[11px] font-medium text-muted-foreground/60 flex-1 bg-transparent border-none cursor-pointer hover:text-foreground">
          <Package size={18} />
          <span>Deliveries</span>
        </button>
        <button type="button" onClick={() => console.log("Earnings layout")} className="flex flex-col items-center gap-1 text-[11px] font-medium text-muted-foreground/60 flex-1 bg-transparent border-none cursor-pointer hover:text-foreground">
          <DollarSign size={18} />
          <span>Earnings</span>
        </button>
        <button type="button" onClick={() => console.log("Profile layout")} className="flex flex-col items-center gap-1 text-[11px] font-medium text-muted-foreground/60 flex-1 bg-transparent border-none cursor-pointer hover:text-foreground">
          <User size={18} />
          <span>Profile</span>
        </button>
      </nav>
      
    </div>
  );
}