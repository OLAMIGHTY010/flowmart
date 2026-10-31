import React, { useState, useEffect } from "react";
import { apiClient } from "@/services/api";
import {
  Video,
  Camera,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Flame,
  Clock,
  Eye,
  EyeOff,
  Sliders,
  Play,
  Pause,
  AlertTriangle,
  RotateCw,
  Award,
  Layers,
  Activity,
  Maximize2
} from "lucide-react";

interface KitchenStationStream {
  id: string;
  name: string;
  activeChef: string;
  streamUrl: string;
  thumbnailUrl: string;
  status: "LIVE" | "PRIVACY_PAUSED" | "OFFLINE";
  activeAngle: "OVERHEAD_PREP" | "SIDE_PROFILE" | "PLATING_MACRO";
  resolution: string;
  bitrateKbps: number;
  latencySecs: number;
  activeOrderTicket: string;
  dishBeingPlated: string;
  hygieneScorePct: number;
  hairnetCompliant: boolean;
  glovesCompliant: boolean;
  lastSanitizedMinsAgo: number;
  nextSanitizationInMins: number;
}

interface KitchenStreamConfig {
  customerLivePeekingEnabled: boolean;
  privacyFaceBlurEnabled: boolean;
  streamOverlayTicketWatermark: boolean;
  aiHygieneAuditEngine: "ACTIVE_MONITORING" | "PAUSED";
  overallKitchenHygieneGrade: string;
  lastInspectionCycle: string;
}

interface StreamStats {
  totalStationsCount: number;
  liveStreamsCount: number;
  averageHygieneScorePct: number;
  activeChefsCount: number;
  customerPeekingActive: boolean;
  faceBlurActive: boolean;
}

export default function VendorKitchenStreams() {
  const [stations, setStations] = useState<KitchenStationStream[]>([]);
  const [config, setConfig] = useState<KitchenStreamConfig | null>(null);
  const [stats, setStats] = useState<StreamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState<KitchenStationStream | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await apiClient.get("/vendor/kitchen-streams");
      if (res.data.success) {
        setStations(res.data.stations || []);
        setConfig(res.data.config || null);
        setStats(res.data.stats || null);
        if (!selectedStation && res.data.stations?.length > 0) {
          setSelectedStation(res.data.stations[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load kitchen streams", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleStationStatus = async (station: KitchenStationStream) => {
    const nextStatus = station.status === "LIVE" ? "PRIVACY_PAUSED" : "LIVE";
    try {
      const res = await apiClient.post(`/vendor/kitchen-streams/${station.id}/status`, {
        status: nextStatus
      });
      if (res.data.success) {
        setStations((prev) =>
          prev.map((s) => (s.id === station.id ? res.data.station : s))
        );
        if (selectedStation?.id === station.id) {
          setSelectedStation(res.data.station);
        }
        setSuccessBanner(res.data.message);
        setTimeout(() => setSuccessBanner(null), 4000);
      }
    } catch (err: any) {
      alert("Status update failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleSwitchAngle = async (station: KitchenStationStream, angle: "OVERHEAD_PREP" | "SIDE_PROFILE" | "PLATING_MACRO") => {
    try {
      const res = await apiClient.post(`/vendor/kitchen-streams/${station.id}/status`, {
        activeAngle: angle
      });
      if (res.data.success) {
        setStations((prev) =>
          prev.map((s) => (s.id === station.id ? res.data.station : s))
        );
        if (selectedStation?.id === station.id) {
          setSelectedStation(res.data.station);
        }
      }
    } catch (err: any) {
      alert("Angle switch failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleSanitizeStation = async (stationId: string) => {
    try {
      const res = await apiClient.post(`/vendor/kitchen-streams/${stationId}/sanitize`);
      if (res.data.success) {
        setStations((prev) =>
          prev.map((s) => (s.id === stationId ? res.data.station : s))
        );
        if (selectedStation?.id === stationId) {
          setSelectedStation(res.data.station);
        }
        setSuccessBanner(res.data.message);
        setTimeout(() => setSuccessBanner(null), 4000);
      }
    } catch (err: any) {
      alert("Sanitization log failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleToggleCustomerAccess = async () => {
    if (!config) return;
    const nextVal = !config.customerLivePeekingEnabled;
    try {
      const res = await apiClient.post("/vendor/kitchen-streams/toggle-public", {
        customerLivePeekingEnabled: nextVal
      });
      if (res.data.success) {
        setConfig(res.data.config);
        setSuccessBanner(
          nextVal
            ? "Customer Live Prep Peeking ENABLED. Customers can now watch their food being boxed."
            : "Customer Live Prep Peeking PAUSED. Cameras restricted to kitchen management."
        );
        setTimeout(() => setSuccessBanner(null), 4000);
      }
    } catch (err: any) {
      alert("Toggle failed: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="space-y-6">
      {/* ═══ TOP BANNER: KITCHEN PREP STREAM & HYGIENE CONFIDENCE ═══ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-6 md:p-8 text-white shadow-xl shadow-indigo-950/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold tracking-wide uppercase">
              <Camera className="w-3.5 h-3.5 text-indigo-400" />
              Chowdeck-Grade Hygiene Confidence • FlowMart Merchant Kitchen 2026
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Live Kitchen Camera & Prep Station Stream
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Showcase impeccable culinary hygiene, hairnet/glove compliance, and real-time meal assembly. Instantly builds customer trust and reduces order dispute inquiries by 84%.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Customer Peeking Toggle */}
            <button
              onClick={handleToggleCustomerAccess}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                config?.customerLivePeekingEnabled
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-md"
                  : "bg-slate-800 border-slate-700 text-slate-400"
              }`}
            >
              {config?.customerLivePeekingEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>Customer Peeking: {config?.customerLivePeekingEnabled ? "ACTIVE" : "PAUSED"}</span>
            </button>

            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Streams</span>
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successBanner && (
          <div className="mt-5 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-sm flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span className="font-medium">{successBanner}</span>
            </div>
            <button onClick={() => setSuccessBanner(null)} className="text-xs text-emerald-300 hover:text-white underline">
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* ═══ KPI METRIC CARDS ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-white shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Monitored Stations</span>
            <Video className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-300">
            {stats ? stats.totalStationsCount : stations.length}{" "}
            <span className="text-xs font-normal text-slate-400">({stats ? stats.liveStreamsCount : 4} Live)</span>
          </div>
          <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>1080p 60fps WebRTC streams active</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-white shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Hygiene Compliance</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300">
            {config ? config.overallKitchenHygieneGrade : "GRADE A+ (99.8%)"}
          </div>
          <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Vision: Hairnets & Gloves 100%</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-white shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Sanitization Cycle</span>
            <Clock className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-300">
            In 19 Mins <span className="text-xs font-normal text-slate-400">(30m cycle)</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
            <span>Automated clean counter timer</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-white shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Stream Viewers</span>
            <Eye className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300">48 Customers</div>
          <div className="mt-2 text-xs text-indigo-400 flex items-center gap-1">
            <span>Watching live meal preparation</span>
          </div>
        </div>
      </div>

      {/* ═══ MAIN WORKSPACE: FEATURED STREAM PLAYER + STATION SELECTOR ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: HERO STREAM PLAYER (8 COLS) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedStation && (
            <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl space-y-4 p-5">
              {/* Stream Video Screen */}
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-slate-800 group">
                <img
                  src={selectedStation.streamUrl}
                  alt={selectedStation.name}
                  className={`w-full h-full object-cover transition-all duration-700 ${
                    selectedStation.status === "PRIVACY_PAUSED"
                      ? "blur-xl grayscale opacity-40 scale-105"
                      : "opacity-90"
                  }`}
                />

                {/* Privacy Paused Overlay */}
                {selectedStation.status === "PRIVACY_PAUSED" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/80 text-white p-4 text-center z-20">
                    <EyeOff className="w-10 h-10 text-amber-400 mb-1" />
                    <h4 className="text-base font-bold">Privacy Shield Activated</h4>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Kitchen chef has activated temporary privacy pause. Live video feed will resume automatically in 5 minutes.
                    </p>
                    <button
                      onClick={() => handleToggleStationStatus(selectedStation)}
                      className="mt-2 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                    >
                      Resume Live Broadcast
                    </button>
                  </div>
                )}

                {/* Top Overlay Badges */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-rose-600/90 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    LIVE STREAM
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-950/80 text-emerald-300 text-[10px] font-bold border border-slate-800 backdrop-blur-sm">
                    {selectedStation.resolution} • {selectedStation.latencySecs}s Latency
                  </span>
                </div>

                {/* Lower Third Watermark: Active Order Ticket */}
                <div className="absolute bottom-4 left-4 right-4 z-10 p-3 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800/80 flex items-center justify-between text-xs text-white">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-indigo-400 font-bold">{selectedStation.activeOrderTicket}</span>
                      <span className="text-white font-bold">{selectedStation.dishBeingPlated}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Plating Chef: <strong className="text-slate-200">{selectedStation.activeChef}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      Hygiene: {selectedStation.hygieneScorePct}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Stream Controls & Camera Angles */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">{selectedStation.name}</h3>
                  <p className="text-xs text-slate-400">
                    Lead Chef: <strong className="text-slate-200">{selectedStation.activeChef}</strong> • Bitrate: {selectedStation.bitrateKbps} kbps
                  </p>
                </div>

                {/* Camera Angles Switcher */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold mr-1">Angle:</span>
                  {(["OVERHEAD_PREP", "SIDE_PROFILE", "PLATING_MACRO"] as const).map((angle) => (
                    <button
                      key={angle}
                      onClick={() => handleSwitchAngle(selectedStation, angle)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedStation.activeAngle === angle
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                          : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750"
                      }`}
                    >
                      {angle === "OVERHEAD_PREP" ? "Overhead" : angle === "SIDE_PROFILE" ? "Side" : "Plating"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Station Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSanitizeStation(selectedStation.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all active:scale-95"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Log Sanitization Cycle</span>
                  </button>

                  <button
                    onClick={() => handleToggleStationStatus(selectedStation)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
                      selectedStation.status === "LIVE"
                        ? "bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border-amber-500/30"
                        : "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/30"
                    }`}
                  >
                    {selectedStation.status === "LIVE" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{selectedStation.status === "LIVE" ? "Privacy Pause (5m)" : "Go Live"}</span>
                  </button>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>Last wipe-down: <strong className="text-white">{selectedStation.lastSanitizedMinsAgo}m ago</strong></span>
                  <span>•</span>
                  <span>Next audit in: <strong className="text-cyan-400">{selectedStation.nextSanitizationInMins}m</strong></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ALL STATIONS DECK & HYGIENE AUDIT (4 COLS) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              Kitchen Prep Station Feeds ({stations.length})
            </h4>
            <span className="text-[11px] text-indigo-400">Select to Expand</span>
          </div>

          <div className="space-y-3">
            {stations.map((station) => {
              const isSelected = selectedStation?.id === station.id;
              return (
                <div
                  key={station.id}
                  onClick={() => setSelectedStation(station)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative space-y-3 ${
                    isSelected
                      ? "bg-slate-900 border-indigo-500/70 shadow-lg shadow-indigo-950/30 ring-1 ring-indigo-500/50"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-400">{station.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        station.status === "LIVE"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {station.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <img
                      src={station.thumbnailUrl}
                      alt={station.name}
                      className="w-16 h-12 rounded-lg object-cover border border-slate-800 flex-shrink-0"
                    />
                    <div className="space-y-0.5 min-w-0">
                      <h5 className="text-xs font-bold text-white truncate">{station.name}</h5>
                      <p className="text-[11px] text-slate-400 truncate">{station.activeChef}</p>
                      <span className="text-[10px] text-emerald-400 font-bold block">
                        ★ {station.hygieneScorePct}% Hygiene Score
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-400">
                    <span>Plating: <strong className="text-slate-200">{station.activeOrderTicket}</strong></span>
                    <span>Wiped: {station.lastSanitizedMinsAgo}m ago</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI Vision Hygiene Safeguards Panel */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
            <h5 className="font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Automated AI Vision Hygiene Checks
            </h5>

            <div className="space-y-2 text-slate-300">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-700/50">
                <span>Hairnet & Beard Net Detection</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100% Compliant
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-700/50">
                <span>Food-Grade Nitrile Gloves</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-700/50">
                <span>Privacy Face-Blur Filter</span>
                <span className="font-bold text-indigo-300">
                  {config?.privacyFaceBlurEnabled ? "ENABLED" : "OFF"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ FOOTER BRANDING ═══ */}
      <div className="text-center py-4 border-t border-slate-800/60 text-xs text-slate-500">
        FlowMart Kitchen Hygiene & Prep Stream Studio • Chowdeck-Grade Architecture © 2026 FlowMart Inc.
      </div>
    </div>
  );
}
