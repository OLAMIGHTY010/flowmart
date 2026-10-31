import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Bike,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  X,
  Phone,
  MessageCircle,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  Volume2,
  ExternalLink,
  Navigation,
  Radio,
  CheckCircle2,
  Flame,
  KeyRound,
  BatteryCharging
} from "lucide-react";
import { apiClient } from "@/services/api";
import { audioChimes } from "@/utils/audioChimes";
import { useToast } from "@/contexts/ToastContext";

interface CourierInfo {
  name: string;
  phone: string;
  vehicle: string;
  rating: number;
  completedTrips: number;
  photoUrl: string;
  tier: string;
}

interface TelemetryData {
  distanceMeters: number;
  etaMinutes: number;
  currentSpeedKmh: number;
  isAtGate: boolean;
  gateArrivalChimeTriggered: boolean;
  batteryLevelPct: number;
  lastGpsPingAt: string;
}

interface Milestone {
  key: string;
  label: string;
  completed: boolean;
  time: string;
}

interface ActiveOrderData {
  orderId: string;
  orderNumber: string;
  restaurantName: string;
  restaurantImage: string;
  itemsSummary: string;
  itemsCount: number;
  totalAmountNgn: number;
  status: "CONFIRMED" | "KITCHEN_COOKING" | "ON_THE_WAY" | "ARRIVED_AT_GATE" | "DELIVERED";
  statusText: string;
  handoverOtp: string;
  courier: CourierInfo;
  telemetry: TelemetryData;
  dropoffAddress: string;
  milestones: Milestone[];
  updatedAt: string;
}

export default function DynamicIslandWidget() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const [order, setOrder] = useState<ActiveOrderData | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [copiedOtp, setCopiedOtp] = useState<boolean>(false);

  // Track if gate chime has fired once per arrival
  const gateChimeFiredRef = useRef<boolean>(false);

  // Don't show if user is already on the dedicated full-screen order tracking page
  const isTrackingPage = location.pathname.includes("/track") || location.pathname.includes("/orders/");

  useEffect(() => {
    fetchActiveTelemetry();
    const interval = setInterval(fetchActiveTelemetry, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveTelemetry = async () => {
    try {
      const res: any = await apiClient.get("/orders/active-telemetry");
      if (res.success && res.hasActiveOrder && res.data) {
        setOrder(res.data);

        // Check for gate arrival chime
        if (res.data.telemetry?.isAtGate && !gateChimeFiredRef.current) {
          gateChimeFiredRef.current = true;
          audioChimes.riderArrived();
          showToast("🔔 Courier Champion has arrived at your gate!", "info");
        } else if (!res.data.telemetry?.isAtGate) {
          gateChimeFiredRef.current = false;
        }
      }
    } catch (err) {
      console.warn("Telemetry polling omitted or offline fallback");
    }
  };

  const handleCopyOtp = () => {
    if (!order?.handoverOtp) return;
    navigator.clipboard.writeText(order.handoverOtp);
    setCopiedOtp(true);
    showToast("Handover OTP copied to clipboard!", "success");
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  const handleTestChime = () => {
    audioChimes.riderArrived();
    showToast("🔔 Tested arrival chime sound!", "info");
  };

  // If no active order, or dismissed, or currently on full tracking view, don't show
  if (!order || isDismissed || isTrackingPage) {
    return null;
  }

  const { distanceMeters, etaMinutes, currentSpeedKmh, isAtGate } = order.telemetry;

  return (
    <aside
      aria-label="Active delivery status"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[95%] sm:w-auto max-w-lg transition-all duration-300"
    >
      <div
        className={`relative overflow-hidden bg-slate-950/95 backdrop-blur-2xl border text-white shadow-2xl transition-all duration-300 ${
          isAtGate
            ? "border-emerald-500/60 shadow-emerald-500/20"
            : "border-indigo-500/40 shadow-indigo-500/20"
        } ${
          isExpanded ? "rounded-3xl p-5 sm:p-6 w-full sm:w-[480px]" : "rounded-full px-4 py-2.5 w-auto"
        }`}
        style={{
          boxShadow: isAtGate
            ? "0 10px 40px -10px rgba(16, 185, 129, 0.35)"
            : "0 10px 40px -10px rgba(79, 70, 229, 0.35)"
        }}
      >
        {/* Subtle Ambient Pulse Light */}
        <div
          className={`absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-20 rounded-full blur-2xl pointer-events-none transition-colors ${
            isAtGate ? "bg-emerald-500/30" : "bg-indigo-500/30"
          }`}
        />

        {/* ═══ STATE A: COLLAPSED COMPACT PILL ═══ */}
        {!isExpanded && (
          <div
            onClick={() => setIsExpanded(true)}
            className="flex items-center justify-between gap-3 sm:gap-5 cursor-pointer select-none group"
          >
            {/* Left: Dynamic Status & Live Radar Blip */}
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <span
                  className={`absolute -inset-1 rounded-full animate-ping opacity-60 ${
                    isAtGate ? "bg-emerald-400" : "bg-indigo-400"
                  }`}
                />
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs relative z-10 ${
                    isAtGate
                      ? "bg-emerald-600 text-white"
                      : "bg-gradient-to-tr from-indigo-600 to-violet-500 text-white"
                  }`}
                >
                  {isAtGate ? <CheckCircle2 size={15} /> : <Bike size={15} />}
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-white group-hover:text-indigo-300 transition-colors">
                    {order.restaurantName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {order.orderNumber}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-slate-300">
                  {isAtGate ? "Arrived at Gate" : `${order.courier.name} • ${currentSpeedKmh} km/h`}
                </span>
              </div>
            </div>

            {/* Middle & Right: Real-time Countdown & Expand Toggle */}
            <div className="flex items-center gap-3">
              <div
                className={`px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1 border ${
                  isAtGate
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse"
                    : "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                }`}
              >
                <Clock size={12} />
                <span>{isAtGate ? "0m • AT GATE" : `${etaMinutes}m • ${distanceMeters}m`}</span>
              </div>

              <button
                type="button"
                className="p-1 rounded-full text-slate-400 group-hover:text-white transition-colors"
                title="Expand Island Details"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ═══ STATE B: EXPANDED DYNAMIC ISLAND DETAILS ═══ */}
        {isExpanded && (
          <div className="space-y-4">
            {/* Top Bar: Title, OTP, Minimize */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <img
                  src={order.restaurantImage}
                  alt={order.restaurantName}
                  className="w-10 h-10 rounded-2xl object-cover border border-slate-700"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-white">{order.restaurantName}</h4>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                      {order.orderNumber}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-400 font-medium mt-0.5">
                    {order.statusText}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
                  title="Collapse Island"
                >
                  <ChevronUp size={18} />
                </button>
                <button
                  onClick={() => setIsDismissed(true)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                  title="Dismiss Island for now"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Milestones Progress Steps */}
            <div className="py-1">
              <div className="flex items-center justify-between text-[11px] mb-2 font-medium">
                <span className="text-slate-400">Order Progress</span>
                <span
                  className={`font-bold ${
                    isAtGate ? "text-emerald-400" : "text-indigo-400"
                  }`}
                >
                  {isAtGate ? "🔔 Arrived at Gate" : `In Transit • ETA ${etaMinutes} mins`}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {order.milestones.map((m, idx) => (
                  <div key={idx} className="space-y-1">
                    <div
                      className={`h-1.5 rounded-full transition-colors ${
                        m.completed ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-slate-800"
                      }`}
                    />
                    <span
                      className={`text-[9px] block truncate text-center ${
                        m.completed ? "text-slate-200 font-semibold" : "text-slate-500"
                      }`}
                    >
                      {m.label.split(" ")[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Courier Champion Card & Live Radar Meter */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={order.courier.photoUrl}
                      alt={order.courier.name}
                      className="w-11 h-11 rounded-2xl object-cover border border-slate-700"
                    />
                    <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-bold">
                      ★
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h5 className="font-bold text-xs text-white">{order.courier.name}</h5>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                        {order.courier.rating}★
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{order.courier.vehicle}</p>
                  </div>
                </div>

                {/* Direct Courier Actions */}
                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${order.courier.phone}`}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white transition-colors"
                    title="Call Courier Champion"
                  >
                    <Phone size={14} />
                  </a>
                  <button
                    onClick={() => {
                      showToast(`Opening chat with ${order.courier.name}...`, "info");
                      navigate(`/orders/${order.orderId}/track`);
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white transition-colors"
                    title="Message Courier"
                  >
                    <MessageCircle size={14} />
                  </button>
                </div>
              </div>

              {/* Live Proximity Metric Strip */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Distance</span>
                  <span
                    className={`font-black ${
                      isAtGate ? "text-emerald-400 animate-pulse" : "text-white"
                    }`}
                  >
                    {isAtGate ? "AT YOUR GATE" : `${distanceMeters}m away`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Current Speed</span>
                  <span className="font-bold text-white">{currentSpeedKmh} km/h</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Battery</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <BatteryCharging size={12} />
                    {order.telemetry.batteryLevelPct}%
                  </span>
                </div>
              </div>
            </div>

            {/* Handover OTP Highlight Card */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-500/30">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
                  <KeyRound size={16} />
                </div>
                <div>
                  <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">
                    Handover Delivery OTP
                  </span>
                  <span className="text-base font-mono font-black text-white tracking-widest">
                    {order.handoverOtp}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyOtp}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="Copy 4-digit OTP"
                >
                  {copiedOtp ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copiedOtp ? "Copied" : "Copy"}</span>
                </button>

                <button
                  onClick={handleTestChime}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                  title="Test Arrival Chime"
                >
                  <Volume2 size={14} />
                </button>
              </div>
            </div>

            {/* Footer Navigation: Live GPS Map */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-slate-400 text-[11px] truncate max-w-[200px]">
                📍 {order.dropoffAddress}
              </span>

              <button
                onClick={() => {
                  setIsExpanded(false);
                  navigate(`/orders/${order.orderId}/track`);
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all"
              >
                <span>Full GPS Map</span>
                <ExternalLink size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
