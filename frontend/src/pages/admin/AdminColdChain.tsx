import React, { useState, useEffect } from "react";
import { apiClient } from "@/services/api";
import {
  ThermometerSnowflake,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Package,
  Bike,
  Activity,
  Zap,
  Gauge,
  Flame,
  FileText,
  DollarSign,
  Plus,
  RefreshCw,
  Sliders,
  Sparkles,
  Phone,
  Eye,
  Camera,
  Layers,
  Award
} from "lucide-react";

interface ColdChainDelivery {
  id: string;
  orderId: string;
  category: "ARTISAN_GELATO_ICE_CREAM" | "TIERED_CELEBRATION_CAKE" | "PIPING_HOT_PEPPER_SOUP" | "PHARMACY_BIOLOGICS";
  itemsSummary: string;
  merchantName: string;
  courierName: string;
  courierPhone: string;
  vehicle: string;
  currentTempCelsius: number;
  targetTempRange: string;
  tempStatus: "OPTIMAL" | "ACCEPTABLE" | "BREACH_WARNING";
  icePackCount: number;
  thermoBoxVerified: boolean;
  speedLimitKmH: number;
  currentSpeedKmH: number;
  fragileTiltDeg: number;
  insuranceCoverNgn: number;
  status: "IN_TRANSIT" | "DELIVERED_SAFE" | "CLAIM_FILED";
  elapsedMins: number;
  etaMins: number;
  lastTelemetryPing: string;
}

interface InsuranceClaim {
  id: string;
  deliveryId: string;
  orderId: string;
  claimType: "MELTED_ICE_CREAM" | "TOPPLED_CAKE" | "SPILLED_SOUP" | "CONTAINER_CRUSHED";
  customerName: string;
  customerRefundNgn: number;
  faultAttribution: "MERCHANT_PACKAGING" | "COURIER_HANDLING" | "FLOWMART_INSURANCE_POOL";
  status: "APPROVED_PAID" | "UNDER_REVIEW" | "REJECTED";
  incidentSummary: string;
  settledAt: string;
}

interface ColdChainStats {
  activeColdChainDeliveriesCount: number;
  zeroSpillComplianceRatePct: number;
  totalInsuranceProtectedNgn: number;
  settledClaimsCount: number;
  autoDisburseClaimCapNgn: number;
  fragileSpeedCapKmH: number;
  zeroSpillGuaranteeActive: boolean;
}

export default function AdminColdChain() {
  const [deliveries, setDeliveries] = useState<ColdChainDelivery[]>([]);
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [stats, setStats] = useState<ColdChainStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "CLAIMS">("ACTIVE");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Claim Filing Modal State
  const [isFilingClaim, setIsFilingClaim] = useState(false);
  const [claimOrderId, setClaimOrderId] = useState("ORD-2026-9824");
  const [claimType, setClaimType] = useState<"MELTED_ICE_CREAM" | "TOPPLED_CAKE" | "SPILLED_SOUP" | "CONTAINER_CRUSHED">("TOPPLED_CAKE");
  const [claimAmount, setClaimAmount] = useState(18000);
  const [claimFault, setClaimFault] = useState<"MERCHANT_PACKAGING" | "COURIER_HANDLING" | "FLOWMART_INSURANCE_POOL">("FLOWMART_INSURANCE_POOL");
  const [claimNotes, setClaimNotes] = useState("Cake structural tier slipped during emergency braking; immediate customer refund");
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);

  const fetchData = async () => {
    try {
      const res = await apiClient.get("/admin/cold-chain");
      if (res.data.success) {
        setDeliveries(res.data.deliveries || []);
        setClaims(res.data.claims || []);
        setStats(res.data.stats || null);
      }
    } catch (err) {
      console.error("Failed to load cold chain deliveries", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleAuditAction = async (deliveryId: string, icePackIncrement: number) => {
    try {
      const del = deliveries.find((d) => d.id === deliveryId);
      if (!del) return;

      const res = await apiClient.post("/admin/cold-chain/audit", {
        deliveryId,
        thermoBoxVerified: true,
        icePackCount: del.icePackCount + icePackIncrement,
        tempCelsius: del.currentTempCelsius - 0.5
      });

      if (res.data.success) {
        setDeliveries((prev) =>
          prev.map((d) => (d.id === deliveryId ? res.data.delivery : d))
        );
        setSuccessMessage(res.data.message);
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      alert("Audit failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleFileClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingClaim(true);
    try {
      const res = await apiClient.post("/admin/cold-chain/claims", {
        orderId: claimOrderId,
        claimType,
        customerRefundNgn: claimAmount,
        faultAttribution: claimFault,
        incidentSummary: claimNotes
      });

      if (res.data.success) {
        setClaims((prev) => [res.data.claim, ...prev]);
        setIsFilingClaim(false);
        setSuccessMessage(res.data.message);
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err: any) {
      alert("Claim submission failed: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ═══ TOP BANNER: COLD-CHAIN & FRAGILE SAFEGUARDS ═══ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-6 md:p-8 text-white shadow-xl shadow-indigo-950/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-semibold tracking-wide uppercase">
              <ThermometerSnowflake className="w-3.5 h-3.5 text-cyan-400" />
              Chowdeck-Grade Quality Assurance • FlowMart Operations 2026
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Automated Cold-Chain & Fragile Handling Safeguards
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Real-time telemetry for temperature-sensitive gelato, fragile celebration cakes, and hot soups. Automated zero-spill insurance guarantees & instant liability payouts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsFilingClaim(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600/30 font-bold text-xs transition-all shadow-md active:scale-95"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Instant Damage Claim</span>
            </button>
            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Telemetry</span>
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="mt-5 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-sm flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span className="font-medium">{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-xs text-emerald-300 hover:text-white underline">
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* ═══ KPI METRIC CARDS ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-white shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Cold-Chain</span>
            <ThermometerSnowflake className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-300">
            {stats ? stats.activeColdChainDeliveriesCount : deliveries.length}{" "}
            <span className="text-xs font-normal text-slate-400">In-Transit</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
            <span>Gelato, Cakes, Soups & Biologics</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-white shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Zero-Spill Compliance</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300">
            {stats ? `${stats.zeroSpillComplianceRatePct}%` : "99.4%"}
          </div>
          <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>99.4% delivered without tilt/spill</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-white shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Protected Shipment Value</span>
            <DollarSign className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-300">
            ₦{stats ? stats.totalInsuranceProtectedNgn.toLocaleString() : "166,000"}
          </div>
          <div className="mt-2 text-xs text-indigo-400 flex items-center gap-1">
            <span>Backed by FlowMart Micro-Insurance</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-white shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Settled Claims Today</span>
            <FileText className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300">
            {stats ? stats.settledClaimsCount : claims.length}{" "}
            <span className="text-xs font-normal text-slate-400">Paid Out</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
            <span>Instant customer reimbursement</span>
          </div>
        </div>
      </div>

      {/* ═══ NAVIGATION TABS ═══ */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("ACTIVE")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "ACTIVE"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
              : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          Active Shipments ({deliveries.length})
        </button>
        <button
          onClick={() => setActiveTab("CLAIMS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "CLAIMS"
              ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
              : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          Spill & Damage Claims Ledger ({claims.length})
        </button>
      </div>

      {/* ═══ TAB 1: ACTIVE SHIPMENTS GRID ═══ */}
      {activeTab === "ACTIVE" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {deliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl transition-all hover:border-indigo-500/40"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-400">{delivery.id}</span>
                  <span className="font-mono text-xs text-slate-500">({delivery.orderId})</span>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    delivery.category === "ARTISAN_GELATO_ICE_CREAM"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : delivery.category === "TIERED_CELEBRATION_CAKE"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : delivery.category === "PIPING_HOT_PEPPER_SOUP"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  {delivery.category.replace(/_/g, " ")}
                </span>
              </div>

              {/* Order Info */}
              <div>
                <h4 className="text-sm font-bold text-white truncate">{delivery.merchantName}</h4>
                <p className="text-xs text-slate-300 line-clamp-2 mt-0.5">{delivery.itemsSummary}</p>
              </div>

              {/* Sensor Telemetry Box */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {/* Temperature */}
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Core Temp</span>
                  <span
                    className={`font-black text-sm block ${
                      delivery.tempStatus === "OPTIMAL"
                        ? "text-cyan-400"
                        : "text-amber-400"
                    }`}
                  >
                    {delivery.currentTempCelsius > 0 ? `+${delivery.currentTempCelsius}` : delivery.currentTempCelsius}°C
                  </span>
                  <span className="text-[10px] text-slate-500">Target: {delivery.targetTempRange}</span>
                </div>

                {/* Speed & Limit */}
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Speed</span>
                  <span className="font-black text-sm block text-indigo-300">
                    {delivery.currentSpeedKmH} km/h
                  </span>
                  <span className="text-[10px] text-slate-500">Cap: {delivery.speedLimitKmH} km/h</span>
                </div>

                {/* Tilt & Gel Packs */}
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Banking Tilt</span>
                  <span className="font-black text-sm block text-emerald-400">
                    {delivery.fragileTiltDeg}°
                  </span>
                  <span className="text-[10px] text-slate-500">{delivery.icePackCount} Gel Packs</span>
                </div>
              </div>

              {/* Courier & Guarantee Bar */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Bike className="w-4 h-4 text-indigo-400" />
                  <span className="text-slate-300 font-medium">{delivery.courierName}</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>₦{delivery.insuranceCoverNgn.toLocaleString()} Cover</span>
                </div>
              </div>

              {/* Action Suite */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAuditAction(delivery.id, 1)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-colors"
                  >
                    + Add Ice Pack
                  </button>
                  <button
                    onClick={() => handleAuditAction(delivery.id, 0)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                  >
                    Verify Box
                  </button>
                </div>

                <a
                  href={`tel:${delivery.courierPhone}`}
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Champion</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ═══ TAB 2: CLAIMS LEDGER ═══ */
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <FileText className="w-5 h-5 text-rose-400" />
              Spill, Thaw & Fragile Damage Claims Ledger
            </h3>
            <span className="text-xs text-slate-400">Instant Customer Refunds Audit</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Claim ID</th>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Claim Type</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Refund Amount</th>
                  <th className="py-3 px-4">Fault Attribution</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Settled At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-400">{claim.id}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">{claim.orderId}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                        {claim.claimType.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-200">{claim.customerName}</td>
                    <td className="py-3.5 px-4 font-black text-emerald-400">
                      ₦{claim.customerRefundNgn.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold border border-slate-700">
                        {claim.faultAttribution.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                        {claim.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(claim.settledAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ DAMAGE CLAIM MODAL ═══ */}
      {isFilingClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-6 space-y-5 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                Process Zero-Spill Damage Liability Claim
              </h3>
              <button
                onClick={() => setIsFilingClaim(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFileClaim} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Order ID</label>
                  <input
                    type="text"
                    value={claimOrderId}
                    onChange={(e) => setClaimOrderId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Claim Type</label>
                  <select
                    value={claimType}
                    onChange={(e: any) => setClaimType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="TOPPLED_CAKE">Toppled / Slipped Cake</option>
                    <option value="MELTED_ICE_CREAM">Melted / Thawed Gelato</option>
                    <option value="SPILLED_SOUP">Spilled Soup / Cocktail</option>
                    <option value="CONTAINER_CRUSHED">Crushed Box</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Refund Amount (₦)</label>
                  <input
                    type="number"
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Fault Attribution</label>
                  <select
                    value={claimFault}
                    onChange={(e: any) => setClaimFault(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="FLOWMART_INSURANCE_POOL">FlowMart Insurance Pool</option>
                    <option value="MERCHANT_PACKAGING">Merchant Poor Packaging</option>
                    <option value="COURIER_HANDLING">Courier Reckless Riding</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Incident Summary & Telemetry Audit</label>
                <textarea
                  rows={3}
                  value={claimNotes}
                  onChange={(e) => setClaimNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFilingClaim(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingClaim}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5"
                >
                  <span>Approve & Disburse Refund</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ FOOTER BRANDING ═══ */}
      <div className="text-center py-4 border-t border-slate-800/60 text-xs text-slate-500">
        FlowMart Cold-Chain & Fragile Quality Assurance • Chowdeck-Grade Architecture © 2026 FlowMart Inc.
      </div>
    </div>
  );
}
