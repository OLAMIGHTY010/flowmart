import React, { useState, useEffect, useRef } from "react";
import {
  AlertTriangle,
  Wrench,
  ShieldAlert,
  PhoneCall,
  MapPin,
  Clock,
  CheckCircle2,
  Package,
  Radio,
  ShieldCheck,
  Zap,
  Volume2,
  VolumeX,
  CreditCard,
  RefreshCw,
  Truck,
  UserCheck,
  Check,
  Navigation
} from "lucide-react";
import { apiClient } from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { audioChimes } from "@/utils/audioChimes";

interface StrandedOrder {
  orderId: string;
  customerName: string;
  dropoffAddress: string;
  itemSummary: string;
  status: "HELD_BY_STRANDED" | "HANDOFF_PENDING" | "HANDED_OFF";
  assignedRescueRider?: {
    id: string;
    name: string;
    phone: string;
    etaMinutes: number;
    distanceKm: number;
    handoverOtp: string;
  };
}

interface MechanicUnit {
  mechanicId: string;
  name: string;
  phone: string;
  workshop: string;
  vehicleType: string;
  distanceKm: number;
  etaMinutes: number;
  status: "DISPATCHED" | "EN_ROUTE" | "ON_SITE" | "REPAIRED";
  coords: { lat: number; lng: number };
}

interface SOSIncident {
  id: string;
  riderId: string;
  riderName: string;
  riderPhone: string;
  emergencyType: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  coordinates: {
    lat: number;
    lng: number;
    address: string;
  };
  note?: string;
  activeOrders: StrandedOrder[];
  mechanicUnit: MechanicUnit;
  repairAllowance: {
    amountNgn: number;
    status: "ELIGIBLE" | "CLAIMED";
    claimedAt?: string;
    txRef?: string;
  };
  safetyCheckIn: {
    countdownSeconds: number;
    lastConfirmedAt: string;
    dispatchCenterAlerted: boolean;
  };
  status: "TRIGGERED" | "DISPATCHED" | "MECHANIC_EN_ROUTE" | "ON_SITE" | "RESOLVED";
  createdAt: string;
  resolvedAt?: string;
}

const EMERGENCY_HAZARDS = [
  {
    type: "FLAT_TYRE_PUNCTURE",
    title: "Flat Tyre / Puncture",
    icon: "🛞",
    desc: "Nail puncture, tube burst, valve leak or rim bend",
    severity: "MEDIUM" as const,
    repairEstimate: "₦2,500 - ₦4,000"
  },
  {
    type: "ENGINE_BREAKDOWN",
    title: "Engine / Drive Failure",
    icon: "⚙️",
    desc: "Chain cut, engine overheating, spark plug, or clutch snap",
    severity: "HIGH" as const,
    repairEstimate: "₦4,500 - ₦8,000"
  },
  {
    type: "ACCIDENT_MEDICAL",
    title: "Accident / Medical SOS",
    icon: "🚑",
    desc: "Road collision, physical injury, urgent paramedic required",
    severity: "CRITICAL" as const,
    repairEstimate: "Immediate Emergency Unit"
  },
  {
    type: "ROAD_HAZARD_POLICE",
    title: "Checkpoint / Harassment",
    icon: "🛑",
    desc: "Unlawful impound, task force dispute, or road blockade",
    severity: "HIGH" as const,
    repairEstimate: "Fleet Legal Interception"
  },
  {
    type: "BATTERY_ELECTRICAL",
    title: "Electrical / Dead Battery",
    icon: "⚡",
    desc: "Lighting failure, dead battery, ignition short circuit",
    severity: "MEDIUM" as const,
    repairEstimate: "₦3,000 - ₦5,000"
  },
  {
    type: "SEVERE_WEATHER_FLOOD",
    title: "Flash Flood / Impassable",
    icon: "🌊",
    desc: "Severe monsoon flooding, canal overflow, drowned engine",
    severity: "MEDIUM" as const,
    repairEstimate: "Alternative High-Clearance Route"
  }
];

export const RiderEmergencySOS: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [incident, setIncident] = useState<SOSIncident | null>(null);

  // Trigger form state
  const [selectedHazard, setSelectedHazard] = useState<string>("FLAT_TYRE_PUNCTURE");
  const [riderNote, setRiderNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Welfare check timer
  const [checkInTimer, setCheckInTimer] = useState<number>(900);
  const [isCheckingIn, setIsCheckingIn] = useState<boolean>(false);
  const [isClaimingAllowance, setIsClaimingAllowance] = useState<boolean>(false);
  const [isRequestingHandoff, setIsRequestingHandoff] = useState<boolean>(false);
  const [handoffOtpInput, setHandoffOtpInput] = useState<string>("");
  const [isConfirmingHandoff, setIsConfirmingHandoff] = useState<boolean>(false);
  const [isResolving, setIsResolving] = useState<boolean>(false);

  // Web Audio distress siren state
  const [isSirenPlaying, setIsSirenPlaying] = useState<boolean>(false);
  const sirenAudioCtxRef = useRef<AudioContext | null>(null);
  const sirenOscRef = useRef<OscillatorNode | null>(null);

  const fetchActiveSOS = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/rider/sos/active");
      if (res.data?.success && res.data?.data) {
        setIncident(res.data.data);
      } else {
        setIncident(null);
      }
    } catch {
      setIncident(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveSOS();
  }, []);

  // 15-minute welfare check countdown
  useEffect(() => {
    if (!incident || incident.status === "RESOLVED") return;

    const interval = setInterval(() => {
      setCheckInTimer((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [incident]);

  // Audio Distress Siren Synthesizer
  const toggleDistressSiren = () => {
    if (isSirenPlaying) {
      if (sirenOscRef.current) {
        try {
          sirenOscRef.current.stop();
          sirenOscRef.current.disconnect();
        } catch {}
      }
      setIsSirenPlaying(false);
      showToast("Distress siren silenced", "info");
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      sirenAudioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(650, now);
      for (let i = 0; i < 20; i++) {
        osc.frequency.exponentialRampToValueAtTime(950, now + i * 0.8 + 0.4);
        osc.frequency.exponentialRampToValueAtTime(650, now + i * 0.8 + 0.8);
      }

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.15, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      sirenOscRef.current = osc;
      setIsSirenPlaying(true);
      showToast("Distress audio beacon broadcasting locally", "warning");
    } catch (e) {
      console.warn("Audio Context init failed", e);
    }
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (sirenOscRef.current) {
        try {
          sirenOscRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // Trigger Emergency SOS
  const handleTriggerSOS = async () => {
    setIsSubmitting(true);
    try {
      const hazardObj = EMERGENCY_HAZARDS.find((h) => h.type === selectedHazard);
      const res = await apiClient.post("/rider/sos/trigger", {
        emergencyType: selectedHazard,
        severity: hazardObj?.severity || "HIGH",
        coordinates: {
          lat: 6.4281,
          lng: 3.4219,
          address: "Adeola Odeku St / Saka Tinubu Junction, Victoria Island, Lagos"
        },
        note: riderNote || "Stranded on delivery route due to " + (hazardObj?.title || "vehicle breakdown") + "."
      });

      if (res.data?.success) {
        setIncident(res.data.data);
        audioChimes.orderPlaced();
        showToast("SOS Beacon Broadcasted! Dispatch & Mobile Mechanic Notified.", "error");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to trigger SOS beacon", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Request 1-Tap Champion Handoff
  const handleRequestHandoff = async (orderId: string) => {
    setIsRequestingHandoff(true);
    try {
      const res = await apiClient.post("/rider/sos/handoff/request", { orderId });
      if (res.data?.success) {
        setIncident(res.data.data.incident);
        audioChimes.riderAssigned();
        showToast("Rescue Champion Dispatched! 4-Digit Handover OTP Generated.", "success");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to request rescue handoff", "error");
    } finally {
      setIsRequestingHandoff(false);
    }
  };

  // Confirm Package Handover
  const handleConfirmHandoff = async (orderId: string) => {
    setIsConfirmingHandoff(true);
    try {
      const res = await apiClient.post("/rider/sos/handoff/confirm", {
        orderId,
        otp: handoffOtpInput
      });
      if (res.data?.success) {
        setIncident(res.data.data.incident);
        audioChimes.orderDelivered();
        showToast("Package Custody Transferred! Customer delivery SLA preserved.", "success");
        setHandoffOtpInput("");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Invalid OTP code", "error");
    } finally {
      setIsConfirmingHandoff(false);
    }
  };

  // Claim ₦5,000 Emergency Repair Allowance
  const handleClaimAllowance = async () => {
    setIsClaimingAllowance(true);
    try {
      const res = await apiClient.post("/rider/sos/allowance/claim");
      if (res.data?.success) {
        audioChimes.orderDelivered();
        showToast("₦5,000 Emergency Repair Stipend credited to your FlowMart Wallet!", "success");
        if (incident) {
          setIncident({
            ...incident,
            repairAllowance: {
              ...incident.repairAllowance,
              status: "CLAIMED",
              txRef: res.data.data.txRef,
              claimedAt: res.data.data.creditedAt
            }
          });
        }
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to claim repair allowance", "error");
    } finally {
      setIsClaimingAllowance(false);
    }
  };

  // Confirm Safety Check-In
  const handleSafetyCheckIn = async () => {
    setIsCheckingIn(true);
    try {
      const res = await apiClient.post("/rider/sos/safety-checkin");
      if (res.data?.success) {
        setCheckInTimer(900);
        showToast("Safety confirmed. Dispatch Room notified that you are safe.", "success");
      }
    } catch (err: any) {
      showToast("Failed to record safety check-in", "error");
    } finally {
      setIsCheckingIn(false);
    }
  };

  // Resolve Emergency SOS
  const handleResolveIncident = async () => {
    if (!window.confirm("Are you sure your bike is repaired and you are ready to resume deliveries?")) {
      return;
    }

    setIsResolving(true);
    try {
      const res = await apiClient.post("/rider/sos/resolve");
      if (res.data?.success) {
        audioChimes.orderDelivered();
        showToast("Incident resolved! You are back on active courier service.", "success");
        setIncident(null);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to resolve incident", "error");
    } finally {
      setIsResolving(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins + ":" + (secs < 10 ? "0" : "") + secs;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-6">
        <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <h3 className="text-lg font-bold text-white">Scanning Emergency Satellite & Dispatch Beacon...</h3>
        <p className="text-xs text-muted-foreground mt-1">Checking active roadside assistance telemetry</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
      {/* TOP HUD STATUS HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d121f] via-[#131b2e] to-[#0a0e17] border border-white/10 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[11px] font-extrabold tracking-wider uppercase flex items-center gap-1.5 animate-pulse">
                <Radio className="w-3 h-3 text-rose-400" />
                Champion Roadside Safety Beacon
              </span>
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[11px] font-semibold">
                FlowMart Rapid Response 2026
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Emergency SOS & Roadside Assistance
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              24/7 on-demand mechanic dispatch, automatic parcel custody handoff to nearby Champions, and instant ₦5,000 wallet breakdown stipend.
            </p>
          </div>

          {/* Quick Hotline Pill */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              onClick={toggleDistressSiren}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg border ${
                isSirenPlaying
                  ? "bg-rose-600 text-white border-rose-400 animate-bounce"
                  : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
              }`}
            >
              {isSirenPlaying ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-rose-400" />}
              <span>{isSirenPlaying ? "Mute Siren" : "Test Distress Siren"}</span>
            </button>

            <a
              href="tel:080035696278"
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 border border-indigo-400/30"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Fleet Control: 0800-FLOWMART</span>
            </a>
          </div>
        </div>

        {/* Live Coordinate Pill */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold text-emerald-400">GPS Satellite Locked:</span>
            <span className="font-mono text-slate-200">
              6.4281° N, 3.4219° E • Adeola Odeku St, Victoria Island (±2.1m)
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>🛡️ Zero Delivery SLA Penalty</span>
            <span>⏱️ Avg. Mobile Mechanic Arrival: 8 Mins</span>
            <span>💰 ₦5,000 Wallet Advance</span>
          </div>
        </div>
      </div>

      {/* ACTIVE INCIDENT CONSOLE (IF ACTIVE) */}
      {incident ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Active Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-rose-950/60 via-red-900/30 to-[#0e1424] border-2 border-rose-500/50 p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/40 flex-shrink-0 animate-pulse">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white">ACTIVE BEACON: #{incident.id}</h3>
                  <span className="px-2.5 py-0.5 rounded-md bg-rose-500/30 text-rose-300 text-[10px] font-black uppercase tracking-wider">
                    {incident.severity} PRIORITY
                  </span>
                </div>
                <p className="text-xs text-rose-200/90 mt-0.5">
                  Type: <span className="font-bold text-white">{incident.emergencyType.replace(/_/g, " ")}</span> • Dispatched at{" "}
                  {new Date(incident.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
                {incident.note && (
                  <p className="text-xs text-slate-300 italic mt-1 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5">
                    "{incident.note}"
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleResolveIncident}
              disabled={isResolving}
              className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30 border border-emerald-400/30 flex-shrink-0"
            >
              {isResolving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Mark Repaired & Close SOS</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* COLUMN 1 & 2: Mobile Mechanic & Stranded Cargo Handoff */}
            <div className="lg:col-span-2 space-y-6">
              {/* 1. Mobile Mechanic Dispatch Card */}
              <div className="rounded-3xl bg-[#0d121f] border border-white/10 p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">Dispatched Mobile Mechanic</h4>
                      <p className="text-xs text-slate-400">Certified FlowMart Rapid Roadside Partner</p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-extrabold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    EN ROUTE ({incident.mechanicUnit.etaMinutes} mins ETA)
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-extrabold text-white">{incident.mechanicUnit.name}</p>
                      <p className="text-xs text-indigo-300 font-medium">{incident.mechanicUnit.workshop}</p>
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                        {incident.mechanicUnit.vehicleType}
                      </p>
                    </div>

                    <a
                      href={"tel:" + incident.mechanicUnit.phone}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md flex-shrink-0"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call Tech</span>
                    </a>
                  </div>

                  {/* Distance Progress Bar */}
                  <div className="space-y-1.5 pt-2 border-t border-white/5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Mechanic Distance to Your Location</span>
                      <span className="font-bold text-indigo-400">{incident.mechanicUnit.distanceKm} km away</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-2 rounded-full w-[75%]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Stranded Cargo Safeguard & 1-Tap Champion Handoff */}
              <div className="rounded-3xl bg-[#0d121f] border border-white/10 p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">Stranded Active Delivery Packages</h4>
                      <p className="text-xs text-slate-400">Autonomous relay preserves customer delivery SLA</p>
                    </div>
                  </div>

                  <span className="text-xs text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                    {incident.activeOrders.length} Order in Cargo Box
                  </span>
                </div>

                {incident.activeOrders.map((order) => {
                  const isHandoffPending = order.status === "HANDOFF_PENDING";
                  const isHandedOff = order.status === "HANDED_OFF";

                  return (
                    <div
                      key={order.orderId}
                      className={`p-5 rounded-2xl border transition-all ${
                        isHandedOff
                          ? "bg-emerald-950/20 border-emerald-500/30"
                          : isHandoffPending
                          ? "bg-amber-950/20 border-amber-500/40"
                          : "bg-white/5 border-white/10"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-indigo-400">#{order.orderId}</span>
                            <span className="text-sm font-bold text-white">{order.customerName}</span>
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5">{order.itemSummary}</p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3 text-rose-400" />
                            {order.dropoffAddress}
                          </p>
                        </div>

                        <div>
                          {isHandedOff && (
                            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Handed Off (In Safe Transit)
                            </span>
                          )}
                          {isHandoffPending && (
                            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1 animate-pulse">
                              <Clock className="w-3.5 h-3.5" /> Rescue Courier En Route
                            </span>
                          )}
                          {order.status === "HELD_BY_STRANDED" && (
                            <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold">
                              Held at Breakdown Point
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Handoff Details when pending */}
                      {isHandoffPending && order.assignedRescueRider && (
                        <div className="mt-4 pt-4 border-t border-amber-500/20 bg-black/20 p-4 rounded-xl space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                                Assigned Rescue Champion:
                              </p>
                              <p className="text-sm font-extrabold text-white mt-0.5">
                                {order.assignedRescueRider.name}
                              </p>
                              <p className="text-xs text-slate-300">
                                {order.assignedRescueRider.distanceKm} km away • {order.assignedRescueRider.etaMinutes} mins ETA
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="bg-amber-500/20 border-2 border-amber-400 px-4 py-2 rounded-xl text-center">
                                <p className="text-[10px] text-amber-300 font-bold uppercase">Handover OTP</p>
                                <p className="text-lg font-mono font-black text-amber-300 tracking-widest">
                                  {order.assignedRescueRider.handoverOtp}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                            <input
                              type="text"
                              value={handoffOtpInput}
                              onChange={(e) => setHandoffOtpInput(e.target.value)}
                              placeholder="Enter 4-digit OTP to confirm"
                              maxLength={4}
                              className="px-3 py-2 rounded-xl bg-black/50 border border-white/20 text-white font-mono text-center text-sm w-full sm:w-48 focus:outline-none focus:border-amber-400"
                            />
                            <button
                              onClick={() => handleConfirmHandoff(order.orderId)}
                              disabled={isConfirmingHandoff}
                              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              {isConfirmingHandoff ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              <span>Confirm Physical Handover</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Request Handoff Trigger Button */}
                      {order.status === "HELD_BY_STRANDED" && (
                        <div className="mt-3 pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <p className="text-xs text-slate-400">
                            Can't complete delivery within 15 mins? Tap to transfer order custody to nearest Champion.
                          </p>
                          <button
                            onClick={() => handleRequestHandoff(order.orderId)}
                            disabled={isRequestingHandoff}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md flex-shrink-0"
                          >
                            {isRequestingHandoff ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                            <span>Dispatch Rescue Champion</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* COLUMN 3: Safety Welfare Check-In & ₦5,000 Stipend */}
            <div className="space-y-6">
              {/* 3. ₦5,000 Emergency Repair Stipend */}
              <div className="rounded-3xl bg-gradient-to-br from-[#12192c] to-[#0a0e17] border border-indigo-500/30 p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Emergency Repair Stipend</h4>
                    <p className="text-xs text-indigo-300">Instant FlowMart Champion Benefit</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-slate-400">Cover Amount:</span>
                    <span className="text-2xl font-black text-white font-mono">₦5,000</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Direct advance to settle roadside mechanic for tube replacement, puncture patch, or spark plug fixes.
                  </p>

                  {incident.repairAllowance.status === "CLAIMED" ? (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>₦5,000 Credited to Wallet!</span>
                      </div>
                      <p className="text-[10px] text-emerald-200/80 font-mono">Ref: {incident.repairAllowance.txRef}</p>
                    </div>
                  ) : (
                    <button
                      onClick={handleClaimAllowance}
                      disabled={isClaimingAllowance}
                      className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 border border-indigo-400/30"
                    >
                      {isClaimingAllowance ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-yellow-300" />}
                      <span>Claim ₦5,000 Instant Advance</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 4. Automated Safety Welfare Check-In */}
              <div className="rounded-3xl bg-[#0d121f] border border-white/10 p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Safety Welfare Check</h4>
                    <p className="text-xs text-slate-400">Automated Dispatch Room Monitor</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-3">
                  <p className="text-xs text-slate-300">Next mandatory safety confirmation:</p>
                  <div className="text-3xl font-black font-mono text-emerald-400 tracking-wider">
                    {formatTimer(checkInTimer)}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    If this timer expires without confirmation, Operations Control automatically escalates to your emergency contact.
                  </p>

                  <button
                    onClick={handleSafetyCheckIn}
                    disabled={isCheckingIn}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
                  >
                    {isCheckingIn ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                    <span>I Am Safe (Reset Timer)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* IDLE SOS TRIGGER CONSOLE */
        <div className="space-y-6">
          {/* Card: Select Breakdown Hazard */}
          <div className="rounded-3xl bg-[#0d121f] border border-white/10 p-6 shadow-xl space-y-5">
            <div>
              <h3 className="text-lg font-bold text-white">1. Select Roadside Emergency Hazard</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Choose the breakdown category to trigger the appropriate rapid response unit & mechanic toolkit.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {EMERGENCY_HAZARDS.map((hazard) => {
                const isSelected = selectedHazard === hazard.type;
                return (
                  <div
                    key={hazard.type}
                    onClick={() => setSelectedHazard(hazard.type)}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? "bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-600/20 scale-[1.01]"
                        : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.08]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl">{hazard.icon}</span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                            hazard.severity === "CRITICAL"
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                              : hazard.severity === "HIGH"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              : "bg-blue-500/20 text-blue-300 border-blue-500/40"
                          }`}
                        >
                          {hazard.severity}
                        </span>
                      </div>

                      <h4 className="text-sm font-extrabold text-white">{hazard.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{hazard.desc}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Est. Fix:</span>
                      <span className="font-semibold text-slate-200">{hazard.repairEstimate}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card: Active Cargo Protection Preview */}
          <div className="rounded-3xl bg-[#0d121f] border border-white/10 p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">2. Active Parcel Custody Protection</h3>
                <p className="text-xs text-slate-400">
                  Your ongoing deliveries are automatically shielded against customer cancellation or late penalties.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                  ACTIVE ORDER IN CARGO BAG
                </span>
                <p className="text-sm font-bold text-white mt-1">#ORD-8821: Mega Chicken Crispy Feast + Suya Central</p>
                <p className="text-xs text-slate-400">Dropoff: Admiralty Way, Lekki Phase 1 • Customer: Dr. Funke Adeyemi</p>
              </div>

              <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero Late Penalty Guarantee</span>
              </div>
            </div>

            {/* Note Textarea */}
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1.5">
                Additional Details for Mobile Mechanic / Dispatcher (Optional):
              </label>
              <textarea
                value={riderNote}
                onChange={(e) => setRiderNote(e.target.value)}
                placeholder="e.g. Rear tyre punctured near Saka Tinubu junction, waiting on sidewalk by FCMB bank."
                rows={2}
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white/[0.08]"
              />
            </div>
          </div>

          {/* Card: Big Red Broadcast Button */}
          <div className="rounded-3xl bg-gradient-to-br from-rose-950/40 via-red-900/20 to-[#0a0e17] border-2 border-rose-500/40 p-8 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-rose-600/20 border-2 border-rose-500 flex items-center justify-center text-rose-400 mx-auto animate-pulse">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="max-w-md mx-auto">
              <h3 className="text-xl font-black text-white">Broadcast Roadside Emergency SOS</h3>
              <p className="text-xs text-rose-200/80 mt-1">
                Dispatches nearest FlowMart mobile motorcycle mechanic, alerts the Lagos fleet control room, and unlocks ₦5,000 emergency repair stipend.
              </p>
            </div>

            <button
              onClick={handleTriggerSOS}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm tracking-wide transition transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-xl shadow-rose-600/40 border-2 border-rose-400/40 flex items-center justify-center gap-3 mx-auto"
            >
              {isSubmitting ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Radio className="w-5 h-5 animate-ping" />
              )}
              <span>{isSubmitting ? "TRANSMITTING SATELLITE BEACON..." : "TRIGGER IMMEDIATE EMERGENCY SOS"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Footer reassurance */}
      <div className="text-center text-xs text-slate-500 pt-4">
        <p>© 2026 FlowMart Technologies Inc. • Champion Roadside Safety Assurance System • Lagos, Nigeria</p>
      </div>
    </div>
  );
};

export default RiderEmergencySOS;
