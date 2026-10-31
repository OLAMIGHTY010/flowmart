import React, { useState, useEffect } from "react";
import { apiClient } from "@/services/api";
import {
  AlertTriangle,
  RotateCcw,
  Zap,
  Clock,
  ShieldCheck,
  Bike,
  Phone,
  Navigation,
  CheckCircle2,
  Sliders,
  Sparkles,
  MapPin,
  ChevronRight,
  TrendingUp,
  Battery,
  Flame,
  Radio,
  FileText,
  DollarSign,
  ArrowRight,
  AlertOctagon,
  RefreshCw,
  Search,
  Award
} from "lucide-react";

interface CandidateRider {
  id: string;
  name: string;
  championTier: "Apex Elite" | "Gold Champion" | "Silver Champion";
  rating: number;
  vehicle: string;
  distanceKm: number;
  etaMins: number;
  matchScorePct: number;
  phone: string;
  status: "AVAILABLE" | "EN_ROUTE_NEARBY";
}

interface DispatchIncident {
  id: string;
  type: "MECHANICAL_BREAKDOWN" | "TRAFFIC_DEADLOCK" | "SIGNAL_LOST" | "MERCHANT_DELAY";
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  status: "PENDING_REASSIGNMENT" | "REASSIGNED" | "RESOLVED";
  order: {
    id: string;
    itemsSummary: string;
    totalAmountNgn: number;
    customerName: string;
    customerPhone: string;
    merchantName: string;
    targetSlaMins: number;
    elapsedMins: number;
    slaStatus: "AT_RISK" | "BREACHED" | "ON_TRACK";
  };
  strandedRider: {
    id: string;
    name: string;
    phone: string;
    vehicle: string;
    rating: number;
    batteryPct: number;
    speedKmH: number;
    standstillMins: number;
    locationName: string;
    reportedReason: string;
  };
  candidates: CandidateRider[];
  reassignedTo?: {
    riderId: string;
    riderName: string;
    reassignedAt: string;
    pickupHandoffCoord: string;
    transferCompensationNgn: number;
  };
}

interface ReassignmentAuditLog {
  id: string;
  incidentId: string;
  orderId: string;
  originalRiderName: string;
  newRiderName: string;
  reason: string;
  transferCompensationNgn: number;
  slaPreservedMins: number;
  reassignedAt: string;
  autoRerouted: boolean;
}

interface DispatchStats {
  activeIncidentsCount: number;
  resolvedTodayCount: number;
  averageRecoveryMins: number;
  slaProtectionRatePct: number;
  autoRerouteEnabled: boolean;
  standstillThresholdMins: number;
  maxSearchRadiusKm: number;
}

export default function AdminDispatchReassignment() {
  const [incidents, setIncidents] = useState<DispatchIncident[]>([]);
  const [stats, setStats] = useState<DispatchStats | null>(null);
  const [logs, setLogs] = useState<ReassignmentAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "BREAKDOWN" | "TRAFFIC" | "SIGNAL" | "LOGS">("ALL");
  const [selectedIncident, setSelectedIncident] = useState<DispatchIncident | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  const [isReassigning, setIsReassigning] = useState(false);
  const [isAutoRerouting, setIsAutoRerouting] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [autoEnabled, setAutoEnabled] = useState(true);

  const fetchIncidents = async () => {
    try {
      const res = await apiClient.get("/admin/dispatch/incidents");
      if (res.data.success) {
        setIncidents(res.data.incidents || []);
        setStats(res.data.stats || null);
        setLogs(res.data.recentLogs || []);
        if (res.data.stats?.autoRerouteEnabled !== undefined) {
          setAutoEnabled(res.data.stats.autoRerouteEnabled);
        }
      }
    } catch (err) {
      console.error("Failed to load dispatch incidents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleManualReassign = async (incident: DispatchIncident, candidateId?: string) => {
    setIsReassigning(true);
    try {
      const targetCandidateId = candidateId || incident.candidates[0]?.id;
      const res = await apiClient.post("/admin/dispatch/reassign", {
        incidentId: incident.id,
        riderId: targetCandidateId,
        reason: incident.strandedRider.reportedReason,
        transferCompensationNgn: 1500
      });

      if (res.data.success) {
        setSuccessBanner(res.data.message);
        setSelectedIncident(null);
        await fetchIncidents();
        setTimeout(() => setSuccessBanner(null), 5000);
      }
    } catch (err: any) {
      alert("Reassignment failed: " + (err.response?.data?.message || err.message));
    } finally {
      setIsReassigning(false);
    }
  };

  const handleBatchAutoReroute = async () => {
    setIsAutoRerouting(true);
    try {
      const res = await apiClient.post("/admin/dispatch/auto-reroute");
      if (res.data.success) {
        setSuccessBanner(res.data.message);
        await fetchIncidents();
        setTimeout(() => setSuccessBanner(null), 6000);
      }
    } catch (err: any) {
      alert("Autonomous reroute failed: " + (err.response?.data?.message || err.message));
    } finally {
      setIsAutoRerouting(false);
    }
  };

  const handleToggleAutoEngine = async () => {
    const nextState = !autoEnabled;
    setAutoEnabled(nextState);
    try {
      await apiClient.post("/admin/dispatch/auto-reroute/config", {
        enabled: nextState
      });
      await fetchIncidents();
    } catch (err) {
      console.error("Failed to toggle config", err);
    }
  };

  const filteredIncidents = incidents.filter(inc => {
    if (activeTab === "ALL") return true;
    if (activeTab === "BREAKDOWN") return inc.type === "MECHANICAL_BREAKDOWN";
    if (activeTab === "TRAFFIC") return inc.type === "TRAFFIC_DEADLOCK";
    if (activeTab === "SIGNAL") return inc.type === "SIGNAL_LOST";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ═══ TOP BANNER: DISPATCH SLA PROTECTOR ═══ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-6 md:p-8 text-white shadow-xl shadow-indigo-950/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold tracking-wide uppercase">
              <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              Chowdeck-Grade Fleet Dispatch Matrix • FlowMart 2026
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Autonomous Dispatch Auto-Rerouting & SLA Protector
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Real-time telemetry incident detector. Automatically recovers stranded deliveries due to mechanical breakdown, traffic deadlocks, or device disconnects with zero customer friction.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Auto-Reroute Engine Toggle */}
            <button
              onClick={handleToggleAutoEngine}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                autoEnabled
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 shadow-lg shadow-emerald-950/20"
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>AI Auto-Reroute: {autoEnabled ? "ACTIVE (Standstill >10m)" : "PAUSED"}</span>
            </button>

            {/* Run Batch Reroute Button */}
            <button
              onClick={handleBatchAutoReroute}
              disabled={isAutoRerouting || incidents.filter(i => i.status === "PENDING_REASSIGNMENT").length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className={`w-4 h-4 text-amber-300 ${isAutoRerouting ? "animate-spin" : ""}`} />
              <span>{isAutoRerouting ? "Rerouting Fleet..." : "⚡ Autonomous 1-Click Reroute All"}</span>
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
            <span className="text-xs font-semibold uppercase tracking-wider">Critical Incidents</span>
            <AlertOctagon className="w-5 h-5 text-rose-400 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-rose-300">
            {stats ? stats.activeIncidentsCount : 0} <span className="text-xs font-normal text-slate-400">Stranded Deliveries</span>
          </div>
          <div className="mt-2 text-xs text-rose-400/80 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Highest standstill: 19 mins</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-white shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">SLA Protection Rate</span>
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-300">
            {stats ? `${stats.slaProtectionRatePct}%` : "97.4%"}
          </div>
          <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+2.1% SLA recovery this week</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-white shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Fleet Recovery</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300">
            {stats ? `${stats.averageRecoveryMins}m` : "4.2m"}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
            <span>Target: &lt; 6.0m auto-handoff</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-white shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Resolved Today</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300">
            {stats ? stats.resolvedTodayCount : 2} <span className="text-xs font-normal text-slate-400">Reassigned</span>
          </div>
          <div className="mt-2 text-xs text-indigo-400 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" />
            <span>₦1,500 courtesy payout per case</span>
          </div>
        </div>
      </div>

      {/* ═══ NAVIGATION TABS ═══ */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "ALL"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            All Incidents ({incidents.length})
          </button>
          <button
            onClick={() => setActiveTab("BREAKDOWN")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "BREAKDOWN"
                ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Mechanical Breakdown ({incidents.filter(i => i.type === "MECHANICAL_BREAKDOWN").length})
          </button>
          <button
            onClick={() => setActiveTab("TRAFFIC")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "TRAFFIC"
                ? "bg-amber-600 text-white shadow-lg shadow-amber-600/30"
                : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Traffic Deadlock ({incidents.filter(i => i.type === "TRAFFIC_DEADLOCK").length})
          </button>
          <button
            onClick={() => setActiveTab("SIGNAL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "SIGNAL"
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Telemetry Lost ({incidents.filter(i => i.type === "SIGNAL_LOST").length})
          </button>
          <button
            onClick={() => setActiveTab("LOGS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "LOGS"
                ? "bg-slate-800 text-white border border-slate-700"
                : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Audit Log ({logs.length})
          </button>
        </div>

        <button
          onClick={fetchIncidents}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Radar</span>
        </button>
      </div>

      {/* ═══ AUDIT LOG TAB VIEW ═══ */}
      {activeTab === "LOGS" ? (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              SLA Reassignment Audit Trail (FlowMart 2026 Fleet Operations)
            </h3>
            <span className="text-xs text-slate-400">Showing recent reroute actions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Log ID</th>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Original Rider</th>
                  <th className="py-3 px-4">Reassigned Champion</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">SLA Preserved</th>
                  <th className="py-3 px-4">Courtesy Top-Up</th>
                  <th className="py-3 px-4">Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-400">{log.id}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">{log.orderId}</td>
                    <td className="py-3.5 px-4 text-slate-300">{log.originalRiderName}</td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      {log.newRiderName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">{log.reason}</td>
                    <td className="py-3.5 px-4 text-emerald-400 font-bold">+{log.slaPreservedMins}m saved</td>
                    <td className="py-3.5 px-4 text-amber-400 font-medium">₦{log.transferCompensationNgn.toLocaleString()}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.autoRerouted
                          ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}>
                        {log.autoRerouted ? "AI Auto" : "Manual"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ═══ INCIDENT CARDS GRID ═══ */
        <div className="grid grid-cols-1 gap-6">
          {filteredIncidents.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">All Fleet Telemetry Healthy</h3>
              <p className="text-sm mt-1">No stranded couriers or SLA bottlenecks in this filter category.</p>
            </div>
          ) : (
            filteredIncidents.map((incident) => {
              const isResolved = incident.status === "REASSIGNED";
              return (
                <div
                  key={incident.id}
                  className={`rounded-2xl border transition-all p-6 ${
                    isResolved
                      ? "bg-slate-900/60 border-slate-800 opacity-80"
                      : "bg-slate-900 border-indigo-500/30 shadow-xl shadow-indigo-950/20"
                  }`}
                >
                  {/* Top Bar of Incident */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-sm font-bold text-indigo-400">
                        {incident.id}
                      </span>

                      {/* Type Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                        incident.type === "MECHANICAL_BREAKDOWN"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : incident.type === "TRAFFIC_DEADLOCK"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                      }`}>
                        {incident.type.replace("_", " ")}
                      </span>

                      {/* Standstill Pill */}
                      <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700">
                        <Clock className="w-3.5 h-3.5 text-rose-400" />
                        <span>{incident.strandedRider.standstillMins}m Standstill</span>
                      </span>

                      {/* SLA Urgency */}
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        isResolved
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse"
                      }`}>
                        {isResolved
                          ? "✓ REASSIGNED & SECURED"
                          : `SLA: ${incident.order.targetSlaMins - incident.order.elapsedMins}m to breach`}
                      </span>
                    </div>

                    {isResolved ? (
                      <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Transferred to {incident.reassignedTo?.riderName}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleManualReassign(incident)}
                          disabled={isReassigning}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 active:scale-95 disabled:opacity-50"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-300" />
                          <span>1-Click Reassign to Top Match</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Body Grid: Stranded Rider vs Order vs Recommended Candidates */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                    {/* Left Column: Stranded Rider Details (4 cols) */}
                    <div className="lg:col-span-4 space-y-4">
                      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Stranded Courier Champion
                          </span>
                          <span className="text-xs font-mono text-rose-400 font-bold">
                            {incident.strandedRider.id}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <Bike className="w-4 h-4 text-indigo-400" />
                            {incident.strandedRider.name}
                          </h4>
                          <p className="text-xs text-slate-400">{incident.strandedRider.vehicle}</p>
                        </div>

                        {/* Telemetry Metrics */}
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Speed</span>
                            <span className="font-bold text-rose-400">{incident.strandedRider.speedKmH} km/h</span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Battery</span>
                            <span className={`font-bold ${incident.strandedRider.batteryPct < 10 ? "text-rose-400" : "text-amber-400"}`}>
                              {incident.strandedRider.batteryPct}%
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Rating</span>
                            <span className="font-bold text-amber-300">★ {incident.strandedRider.rating}</span>
                          </div>
                        </div>

                        {/* Location & Reason */}
                        <div className="space-y-1.5 text-xs text-slate-300 pt-1">
                          <div className="flex items-start gap-1.5 text-slate-400">
                            <MapPin className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                            <span className="truncate">{incident.strandedRider.locationName}</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
                            <strong>Incident Cause:</strong> {incident.strandedRider.reportedReason}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <a
                            href={`tel:${incident.strandedRider.phone}`}
                            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call Stranded Courier</span>
                          </a>
                          <span className="text-[11px] text-emerald-400 font-medium">
                            +₦1,500 Breakdown Top-Up
                          </span>
                        </div>
                      </div>

                      {/* Impacted Order Details Box */}
                      <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Impacted Order
                          </span>
                          <span className="text-xs font-mono font-bold text-amber-300">
                            {incident.order.id}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-white truncate">
                          {incident.order.merchantName}
                        </h5>
                        <p className="text-xs text-slate-300 line-clamp-2">
                          {incident.order.itemsSummary}
                        </p>
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-700/60">
                          <span className="text-slate-400">Customer: <strong className="text-white">{incident.order.customerName}</strong></span>
                          <span className="font-extrabold text-emerald-400">₦{incident.order.totalAmountNgn.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Candidate Champions Radar (8 cols) */}
                    <div className="lg:col-span-8 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Navigation className="w-4 h-4 text-indigo-400" />
                          Ranked Candidate Courier Champions ({incident.candidates.length} Available Nearby)
                        </h4>
                        <span className="text-[11px] text-indigo-400">Ranked by Proximity & Tier Score</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {incident.candidates.map((cand, idx) => {
                          const isTopMatch = idx === 0;
                          return (
                            <div
                              key={cand.id}
                              className={`p-4 rounded-xl border transition-all relative flex flex-col justify-between ${
                                isTopMatch
                                  ? "bg-indigo-950/40 border-indigo-500/50 shadow-md shadow-indigo-950/30"
                                  : "bg-slate-800/50 border-slate-700/60"
                              }`}
                            >
                              {isTopMatch && (
                                <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-indigo-500 text-white text-[10px] font-black uppercase tracking-wider shadow">
                                  Top Recommendation
                                </span>
                              )}

                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-xs text-slate-400">{cand.id}</span>
                                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                                    {cand.championTier}
                                  </span>
                                </div>

                                <div>
                                  <h5 className="text-sm font-bold text-white flex items-center gap-1.5">
                                    {cand.name}
                                    <span className="text-xs font-normal text-amber-300">★ {cand.rating}</span>
                                  </h5>
                                  <p className="text-[11px] text-slate-400">{cand.vehicle}</p>
                                </div>

                                {/* Distance & ETA */}
                                <div className="grid grid-cols-2 gap-2 text-center text-xs py-1">
                                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                                    <span className="text-[10px] text-slate-400 block">Distance</span>
                                    <span className="font-bold text-indigo-300">{cand.distanceKm} km</span>
                                  </div>
                                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                                    <span className="text-[10px] text-slate-400 block">ETA to Handoff</span>
                                    <span className="font-bold text-emerald-400">{cand.etaMins} mins</span>
                                  </div>
                                </div>

                                {/* Match Score Meter */}
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-slate-400">Match Affinity</span>
                                    <span className="font-bold text-emerald-400">{cand.matchScorePct}%</span>
                                  </div>
                                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-1.5 rounded-full"
                                      style={{ width: `${cand.matchScorePct}%` }}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Assign Candidate Button */}
                              {!isResolved && (
                                <button
                                  onClick={() => handleManualReassign(incident, cand.id)}
                                  disabled={isReassigning}
                                  className={`mt-4 w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                    isTopMatch
                                      ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
                                      : "bg-slate-700 hover:bg-slate-600 text-slate-200"
                                  }`}
                                >
                                  <span>Assign {cand.name.split(" ")[0]}</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Handoff Rendezvous Note */}
                      <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/40 flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <Navigation className="w-4 h-4 text-indigo-400" />
                          <span>
                            Automated GPS rendezvous coordinates will be dispatched to both couriers upon assignment.
                          </span>
                        </div>
                        <span className="font-semibold text-slate-300">SLA Recovery SLA: &lt; 5m</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ═══ FOOTER BRANDING ═══ */}
      <div className="text-center py-4 border-t border-slate-800/60 text-xs text-slate-500">
        FlowMart Operations & Fleet Reassignment Matrix • Chowdeck-Grade Architecture © 2026 FlowMart Inc.
      </div>
    </div>
  );
}
