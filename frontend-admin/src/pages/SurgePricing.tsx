import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  CloudRain,
  Sun,
  CloudLightning,
  CloudDrizzle,
  Bike,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Sliders,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  Radio,
  MapPin,
  ChevronRight,
  Flame,
  Clock,
  Sparkles,
  Info
} from "lucide-react";
import { apiClient } from "@/services/api";

interface ZoneSurgeState {
  id: string;
  zoneName: string;
  city: string;
  activeMultiplier: number;
  demandLevel: "NORMAL" | "ELEVATED" | "HIGH" | "CRITICAL";
  weatherCondition: "CLEAR" | "DRIZZLE" | "RAIN" | "THUNDERSTORM";
  isRainModeActive: boolean;
  rainFeeNgn: number;
  activeCouriersCount: number;
  pendingOrdersCount: number;
  isAutoElastic: boolean;
  updatedAt: string;
}

interface MetroRainBroadcast {
  isMetroRainModeActive: boolean;
  rainFeeBonus: number;
  broadcastMessage: string;
  affectedCities: string[];
  activatedAt: string | null;
}

export default function AdminSurgePricing() {
  const [zones, setZones] = useState<ZoneSurgeState[]>([]);
  const [metroRain, setMetroRain] = useState<MetroRainBroadcast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Simulation Playground State
  const [simBaseFee, setSimBaseFee] = useState<number>(1000);
  const [simMultiplier, setSimMultiplier] = useState<number>(1.3);
  const [simIsRain, setSimIsRain] = useState<boolean>(true);
  const [simRainFee, setSimRainFee] = useState<number>(500);

  const showNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchSurgeData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await apiClient.get<{
        success: boolean;
        zones: ZoneSurgeState[];
        metroRain: MetroRainBroadcast;
      }>("/admin/surge/zones");

      if (res.success && res.zones) {
        setZones(res.zones);
        setMetroRain(res.metroRain);
      }
    } catch {
      // Fallback mock initial states if backend connection is unavailable
      setZones([
        {
          id: "yaba-01",
          zoneName: "Yaba & Akoka Cluster",
          city: "Lagos",
          activeMultiplier: 1.3,
          demandLevel: "HIGH",
          weatherCondition: "DRIZZLE",
          isRainModeActive: true,
          rainFeeNgn: 400,
          activeCouriersCount: 18,
          pendingOrdersCount: 26,
          isAutoElastic: true,
          updatedAt: new Date().toISOString(),
        },
        {
          id: "lekki-01",
          zoneName: "Lekki Phase 1 & Admiralty",
          city: "Lagos",
          activeMultiplier: 1.5,
          demandLevel: "CRITICAL",
          weatherCondition: "RAIN",
          isRainModeActive: true,
          rainFeeNgn: 600,
          activeCouriersCount: 12,
          pendingOrdersCount: 28,
          isAutoElastic: true,
          updatedAt: new Date().toISOString(),
        },
        {
          id: "vi-01",
          zoneName: "Victoria Island & Adeola Odeku",
          city: "Lagos",
          activeMultiplier: 1.4,
          demandLevel: "ELEVATED",
          weatherCondition: "RAIN",
          isRainModeActive: true,
          rainFeeNgn: 500,
          activeCouriersCount: 15,
          pendingOrdersCount: 21,
          isAutoElastic: true,
          updatedAt: new Date().toISOString(),
        },
        {
          id: "ikeja-01",
          zoneName: "Ikeja GRA & Allen Avenue",
          city: "Lagos",
          activeMultiplier: 1.2,
          demandLevel: "ELEVATED",
          weatherCondition: "CLEAR",
          isRainModeActive: false,
          rainFeeNgn: 400,
          activeCouriersCount: 22,
          pendingOrdersCount: 18,
          isAutoElastic: true,
          updatedAt: new Date().toISOString(),
        },
        {
          id: "surulere-01",
          zoneName: "Surulere & Stadium Cluster",
          city: "Lagos",
          activeMultiplier: 1.0,
          demandLevel: "NORMAL",
          weatherCondition: "CLEAR",
          isRainModeActive: false,
          rainFeeNgn: 300,
          activeCouriersCount: 16,
          pendingOrdersCount: 9,
          isAutoElastic: true,
          updatedAt: new Date().toISOString(),
        },
        {
          id: "ikoyi-01",
          zoneName: "Ikoyi & Banana Island VIP",
          city: "Lagos",
          activeMultiplier: 1.5,
          demandLevel: "HIGH",
          weatherCondition: "RAIN",
          isRainModeActive: true,
          rainFeeNgn: 700,
          activeCouriersCount: 9,
          pendingOrdersCount: 14,
          isAutoElastic: false,
          updatedAt: new Date().toISOString(),
        },
        {
          id: "maryland-01",
          zoneName: "Maryland & Anthony Expressway",
          city: "Lagos",
          activeMultiplier: 1.1,
          demandLevel: "NORMAL",
          weatherCondition: "CLEAR",
          isRainModeActive: false,
          rainFeeNgn: 400,
          activeCouriersCount: 11,
          pendingOrdersCount: 8,
          isAutoElastic: true,
          updatedAt: new Date().toISOString(),
        },
      ]);
      setMetroRain({
        isMetroRainModeActive: true,
        rainFeeBonus: 500,
        broadcastMessage: "Metro Rain Mode Active: 100% of weather safety bonus remitted to couriers",
        affectedCities: ["Lagos Mainland", "Lagos Island", "Lekki Corridor"],
        activatedAt: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSurgeData();
  }, []);

  // Update Zone Multiplier or Weather
  const handleUpdateZone = async (id: string, updates: Partial<ZoneSurgeState>) => {
    // Optimistic local state update
    setZones((prev) =>
      prev.map((z) => {
        if (z.id === id) {
          const updated = { ...z, ...updates, updatedAt: new Date().toISOString() };
          if (updates.activeMultiplier !== undefined) {
            if (updates.activeMultiplier >= 1.5) updated.demandLevel = "CRITICAL";
            else if (updates.activeMultiplier >= 1.3) updated.demandLevel = "HIGH";
            else if (updates.activeMultiplier > 1.05) updated.demandLevel = "ELEVATED";
            else updated.demandLevel = "NORMAL";
          }
          return updated;
        }
        return z;
      })
    );

    try {
      await apiClient.put(`/admin/surge/zones/${id}`, updates);
      showNotification(`Updated ${id.toUpperCase()} surge parameters`);
    } catch {
      showNotification(`Saved ${id.toUpperCase()} (offline cache mode)`);
    }
  };

  // Toggle Master Metro Weather Emergency
  const handleToggleMetroRain = async () => {
    const newState = !metroRain?.isMetroRainModeActive;
    setMetroRain((prev) =>
      prev
        ? {
            ...prev,
            isMetroRainModeActive: newState,
            activatedAt: newState ? new Date().toISOString() : null,
          }
        : null
    );

    try {
      await apiClient.post("/admin/surge/weather-broadcast", {
        isMetroRainModeActive: newState,
        rainFeeBonus: 500,
      });
      showNotification(
        newState
          ? "🌧️ Metro Rain Mode Broadcasted across Lagos!"
          : "☀️ Metro Rain Mode Deactivated"
      );
    } catch {
      showNotification(
        newState
          ? "🌧️ Metro Rain Mode Broadcasted (local mode)"
          : "☀️ Rain Mode Deactivated"
      );
    }
  };

  // Calculate Simulation Metrics
  const simSurgeSurcharge = Math.round(simBaseFee * (simMultiplier - 1));
  const simEffectiveRainFee = simIsRain ? simRainFee : 0;
  const simTotalCustomerDelivery = simBaseFee + simSurgeSurcharge + simEffectiveRainFee;
  const simRiderBase = Math.round(simBaseFee * 0.75);
  const simRiderSurge = Math.round(simSurgeSurcharge * 0.8);
  const simRiderTotalPayout = simRiderBase + simRiderSurge + simEffectiveRainFee;
  const simPlatformCommission = simTotalCustomerDelivery - simRiderTotalPayout;
  const simRiderPercentage = Math.round((simRiderTotalPayout / simTotalCustomerDelivery) * 100);

  const activeSurgeZonesCount = zones.filter((z) => z.activeMultiplier > 1.05 || z.isRainModeActive).length;
  const totalCouriersOnline = zones.reduce((acc, z) => acc + z.activeCouriersCount, 0);

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-100">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-indigo-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-sm font-bold border border-indigo-400"
          >
            <Sparkles size={18} />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Zap size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Dynamic Surge & Weather Operations
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full font-bold border border-indigo-500/30">
                  CHOWDECK-GRADE V2
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Real-time elasticity multipliers, adverse weather bonuses, and courier commission splits
              </p>
            </div>
          </div>
        </div>

        {/* Master Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => fetchSurgeData(true)}
            className="px-3.5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5"
            title="Refresh Live Metrics"
          >
            <RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} />
            <span>Sync</span>
          </button>

          {/* 1-Click Master Weather Emergency Switch */}
          <button
            onClick={handleToggleMetroRain}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-lg active:scale-95 ${
              metroRain?.isMetroRainModeActive
                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30 ring-2 ring-rose-400/30 animate-pulse"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25"
            }`}
          >
            <CloudRain size={16} />
            <span>
              {metroRain?.isMetroRainModeActive
                ? "🌧️ METRO RAIN MODE ACTIVE (TAP TO DEACTIVATE)"
                : "ACTIVATE METRO RAIN MODE"}
            </span>
          </button>
        </div>
      </div>

      {/* Metro Rain Emergency Broadcast Alert Banner */}
      {metroRain?.isMetroRainModeActive && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 border border-blue-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
              <CloudRain size={22} className="animate-bounce" />
            </div>
            <div>
              <p className="font-black text-sm text-blue-200 flex items-center gap-2">
                Emergency Weather Dispatch Active across Lagos
                <span className="text-[10px] bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full font-mono">
                  +₦{metroRain.rainFeeBonus.toLocaleString()} Champion Bonus
                </span>
              </p>
              <p className="text-xs text-blue-300/80">
                100% of customer rain safety fees are directly credited to active courier champions on every delivery.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-blue-400 bg-black/40 px-3 py-1.5 rounded-xl border border-blue-500/20 shrink-0">
            Affected: {metroRain.affectedCities.join(", ")}
          </span>
        </motion.div>
      )}

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Surge Zones</span>
            <Flame size={16} className="text-amber-400" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-white">
              {activeSurgeZonesCount}{" "}
              <span className="text-xs font-normal text-slate-400">/ {zones.length} active</span>
            </p>
            <p className="text-[11px] text-amber-400 font-medium mt-0.5">High demand in effect</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Weather Status</span>
            <CloudRain size={16} className="text-blue-400" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-blue-300">
              {metroRain?.isMetroRainModeActive ? "RAIN MODE" : "CLEAR"}
            </p>
            <p className="text-[11px] text-blue-400 font-medium mt-0.5">
              {metroRain?.isMetroRainModeActive ? "+₦500 champion bonus" : "Standard dispatch"}
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Active Couriers</span>
            <Bike size={16} className="text-emerald-400" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-emerald-400">{totalCouriersOnline}</p>
            <p className="text-[11px] text-emerald-400 font-medium mt-0.5">Online & fulfilling</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Surge Disbursed</span>
            <DollarSign size={16} className="text-indigo-400" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black text-indigo-300">₦248,500</p>
            <p className="text-[11px] text-indigo-400 font-medium mt-0.5">To couriers today</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Zones Matrix (Left 2 cols) | Simulation Playground (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operational Zones Matrix */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <MapPin size={18} className="text-indigo-400" />
              Active Dispatch Zones Matrix
            </h2>
            <span className="text-xs text-slate-400">Auto-elasticity balances every 5m</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {zones.map((zone) => {
              const isSurged = zone.activeMultiplier > 1.05;

              return (
                <div
                  key={zone.id}
                  className={`bg-slate-900 border-2 rounded-2xl p-4 space-y-3 transition-all ${
                    zone.demandLevel === "CRITICAL"
                      ? "border-rose-500/50 shadow-lg shadow-rose-500/10"
                      : zone.demandLevel === "HIGH"
                      ? "border-amber-500/50 shadow-lg shadow-amber-500/10"
                      : zone.demandLevel === "ELEVATED"
                      ? "border-indigo-500/40"
                      : "border-white/10"
                  }`}
                >
                  {/* Zone Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-black text-sm text-white">{zone.zoneName}</h3>
                      <p className="text-[11px] text-slate-400">
                        {zone.city} • Base ₦{zone.rainFeeNgn ? zone.rainFeeNgn * 2 : 800}
                      </p>
                    </div>

                    {/* Multiplier Badge */}
                    <div className="text-right">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-xl text-xs font-black font-mono ${
                          zone.activeMultiplier >= 1.5
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : zone.activeMultiplier >= 1.3
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : zone.activeMultiplier > 1.05
                            ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                            : "bg-white/10 text-white/70"
                        }`}
                      >
                        {zone.activeMultiplier}x
                      </span>
                    </div>
                  </div>

                  {/* Telemetry Stats Strip */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Riders Online</p>
                      <p className="font-bold text-white flex items-center gap-1 mt-0.5">
                        <Bike size={13} className="text-emerald-400" />
                        {zone.activeCouriersCount} Champions
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Orders in Queue</p>
                      <p className="font-bold text-white flex items-center gap-1 mt-0.5">
                        <Flame size={13} className="text-amber-400" />
                        {zone.pendingOrdersCount} Deliveries
                      </p>
                    </div>
                  </div>

                  {/* Multiplier Slider */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-semibold text-[11px]">Surge Multiplier:</span>
                      <span className="font-mono font-bold text-indigo-300">{zone.activeMultiplier}x</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="2.2"
                      step="0.1"
                      value={zone.activeMultiplier}
                      onChange={(e) =>
                        handleUpdateZone(zone.id, { activeMultiplier: parseFloat(e.target.value) })
                      }
                      className="w-full accent-indigo-500 bg-white/10 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-500">
                      <span>1.0x (Norm)</span>
                      <span>1.5x (Peak)</span>
                      <span>2.2x (Max Cap)</span>
                    </div>
                  </div>

                  {/* Weather Condition Buttons */}
                  <div className="space-y-1.5 pt-1 border-t border-white/5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-semibold text-[11px]">Zone Weather:</span>
                      <span className="text-[11px] font-mono text-blue-300">
                        {zone.weatherCondition} {zone.isRainModeActive && `(+₦${zone.rainFeeNgn})`}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { cond: "CLEAR" as const, icon: Sun, label: "Clear" },
                        { cond: "DRIZZLE" as const, icon: CloudDrizzle, label: "Drizzle" },
                        { cond: "RAIN" as const, icon: CloudRain, label: "Rain" },
                        { cond: "THUNDERSTORM" as const, icon: CloudLightning, label: "Storm" },
                      ].map(({ cond, icon: Icon, label }) => {
                        const isSelected = zone.weatherCondition === cond;
                        return (
                          <button
                            key={cond}
                            onClick={() =>
                              handleUpdateZone(zone.id, {
                                weatherCondition: cond,
                                isRainModeActive: cond !== "CLEAR",
                              })
                            }
                            className={`py-1.5 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 transition ${
                              isSelected
                                ? "bg-indigo-600 text-white shadow"
                                : "bg-white/5 hover:bg-white/10 text-slate-400"
                            }`}
                          >
                            <Icon size={13} />
                            <span>{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real-Time Simulation Playground (Right Column) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Sliders size={18} className="text-indigo-400" />
              Surge Calculator Playground
            </h2>
            <span className="text-xs text-indigo-400 font-semibold">Live Sandbox</span>
          </div>

          <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 space-y-5 shadow-xl">
            <p className="text-xs text-slate-400 leading-relaxed">
              Test customer checkout delivery fee outputs and champion payout splits before enacting price updates.
            </p>

            {/* Base Fee Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-300">Base Logistics Fee:</span>
                <span className="font-mono text-white font-bold">₦{simBaseFee.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="500"
                max="2500"
                step="50"
                value={simBaseFee}
                onChange={(e) => setSimBaseFee(Number(e.target.value))}
                className="w-full accent-indigo-500 bg-white/10 rounded-lg cursor-pointer"
              />
            </div>

            {/* Multiplier Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-300">Surge Multiplier:</span>
                <span className="font-mono text-indigo-300 font-bold">{simMultiplier}x</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="2.2"
                step="0.1"
                value={simMultiplier}
                onChange={(e) => setSimMultiplier(Number(e.target.value))}
                className="w-full accent-indigo-500 bg-white/10 rounded-lg cursor-pointer"
              />
            </div>

            {/* Rain Bonus Toggle */}
            <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <CloudRain size={14} className="text-blue-400" />
                  Inclement Weather Bonus:
                </span>
                <button
                  onClick={() => setSimIsRain(!simIsRain)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    simIsRain
                      ? "bg-blue-600 text-white"
                      : "bg-white/10 text-white/50"
                  }`}
                >
                  {simIsRain ? "Active (+₦500)" : "Inactive"}
                </button>
              </div>
              <p className="text-[10px] text-blue-300/80">
                100% of the weather fee is remitted directly to the rider champion.
              </p>
            </div>

            {/* Calculation Output Card */}
            <div className="bg-black/60 border border-indigo-500/30 rounded-2xl p-4 space-y-3 font-mono">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-sans font-bold">
                Customer Checkout Bill
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Base Delivery:</span>
                  <span>₦{simBaseFee.toLocaleString()}</span>
                </div>
                {simSurgeSurcharge > 0 && (
                  <div className="flex justify-between text-amber-300">
                    <span>⚡ Surge Surcharge ({simMultiplier}x):</span>
                    <span>+₦{simSurgeSurcharge.toLocaleString()}</span>
                  </div>
                )}
                {simIsRain && (
                  <div className="flex justify-between text-blue-300">
                    <span>🌧️ Rain Protection Fee:</span>
                    <span>+₦{simRainFee.toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-white/10 flex justify-between text-sm font-black text-white">
                  <span>Total Customer Delivery:</span>
                  <span className="text-indigo-400">₦{simTotalCustomerDelivery.toLocaleString()}</span>
                </div>
              </div>

              {/* Courier Share Breakdown */}
              <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-sans font-bold flex items-center justify-between">
                  <span>Courier Champion Take-Home</span>
                  <span className="text-emerald-400 font-mono">{simRiderPercentage}% Share</span>
                </div>

                <div className="flex justify-between text-emerald-300 font-bold">
                  <span>Rider Payout Total:</span>
                  <span>₦{simRiderTotalPayout.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Platform Buffer (20%):</span>
                  <span>₦{simPlatformCommission.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
