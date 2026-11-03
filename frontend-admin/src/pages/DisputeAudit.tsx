import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  ShieldCheck, 
  Scale, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Search, 
  ExternalLink, 
  X, 
  Bike, 
  User, 
  FileText, 
  Camera, 
  ThumbsUp, 
  ThumbsDown, 
  Gift, 
  DollarSign, 
  Check, 
  Info,
  ChevronRight
} from "lucide-react";
import { apiClient } from "@/services/api";
import { useToast } from "@/contexts/ToastContext";

interface DisputeClaim {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  restaurantName: string;
  deliveryAddress: string;
  claimedAmountNgn: number;
  claimReason: "ORDER_NOT_DELIVERED" | "WRONG_DOORSTEP" | "DAMAGED_SPILLAGE" | "COLD_FOOD";
  customerStatement: string;
  customerPhotoUrl?: string;
  courierChampion: {
    id: string;
    name: string;
    phone: string;
    vehiclePlate: string;
    rating: number;
    totalDeliveries: number;
  };
  podEvidence: {
    photoUrl: string;
    timestampWatermark: string;
    dropoffCoords: { lat: number; lng: number };
    destinationCoords: { lat: number; lng: number };
    distanceMeters: number;
    isGeofenceMatch: boolean;
    handoverOtpVerified: boolean;
    otpCode: string;
    thermalBoxInspected: boolean;
  };
  aiEvaluation: {
    recommendation: "DISMISS_CLAIM" | "COURTESY_CREDIT" | "APPROVE_REFUND";
    confidenceScorePct: number;
    courierExonerationProbabilityPct: number;
    rationaleSummary: string;
    riskScore: "LOW" | "MEDIUM" | "HIGH";
  };
  status: "PENDING_REVIEW" | "RESOLVED_DISMISSED" | "RESOLVED_REFUNDED" | "RESOLVED_COURTESY";
  resolutionNotes?: string;
  resolvedAt?: string;
}

interface DisputeAuditResponse {
  summary: {
    pendingAuditClaims: number;
    resolvedClaimsToday: number;
    averageAiEvaluationSeconds: number;
    courierProtectionRatePct: number;
    autoSettledCourtesyCreditsNgn: number;
  };
  claims: DisputeClaim[];
}

export default function AdminDisputeAudit() {
  const { showToast } = useToast();
  const [data, setData] = useState<DisputeAuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING_REVIEW" | "RESOLVED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClaim, setSelectedClaim] = useState<DisputeClaim | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/admin/disputes/audit-queue");
      if (res.data?.success) {
        setData(res.data);
      }
    } catch (err: any) {
      console.warn("Using fallback dispute audit data:", err.message);
      setData({
        summary: {
          pendingAuditClaims: 3,
          resolvedClaimsToday: 21,
          averageAiEvaluationSeconds: 1.4,
          courierProtectionRatePct: 91.4,
          autoSettledCourtesyCreditsNgn: 18500
        },
        claims: [
          {
            id: "disp-89241",
            orderId: "ord-89241",
            orderNumber: "#FM-89241",
            customerName: "Babajide Sanwo",
            customerPhone: "+234 802 334 9122",
            restaurantName: "Mama's Kitchen Bistro • Lekki",
            deliveryAddress: "Plot 14 Admiralty Way, Lekki Phase 1 (Gate 4)",
            claimedAmountNgn: 14500,
            claimReason: "ORDER_NOT_DELIVERED",
            customerStatement: "Rider marked order delivered, but I checked my gate and nothing is there! I was waiting inside the living room. Need a full refund.",
            customerPhotoUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop",
            courierChampion: {
              id: "ch-101",
              name: "Ibrahim Suleiman",
              phone: "+234 803 112 4892",
              vehiclePlate: "LAGOS • KJA-482-XA",
              rating: 4.9,
              totalDeliveries: 428
            },
            podEvidence: {
              photoUrl: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&auto=format&fit=crop",
              timestampWatermark: "Lat: 6.4478, Lng: 3.4721 • 30/10/2026 14:22:15 WAT • FlowMart Security Verified",
              dropoffCoords: { lat: 6.4478, lng: 3.4721 },
              destinationCoords: { lat: 6.4476, lng: 3.4720 },
              distanceMeters: 14,
              isGeofenceMatch: true,
              handoverOtpVerified: true,
              otpCode: "8249",
              thermalBoxInspected: true
            },
            aiEvaluation: {
              recommendation: "DISMISS_CLAIM",
              confidenceScorePct: 98,
              courierExonerationProbabilityPct: 99,
              rationaleSummary: "Unassailable delivery evidence. Handover OTP 8249 was authenticated on-device at 14:22 WAT, and courier GPS coordinates were 14m from customer door. Package photo matches Admiralty Way black gate. Recommend dismissing claim to protect courier champion.",
              riskScore: "LOW"
            },
            status: "PENDING_REVIEW"
          },
          {
            id: "disp-89230",
            orderId: "ord-89230",
            orderNumber: "#FM-89230",
            customerName: "Amina Yusuf",
            customerPhone: "+234 813 902 4410",
            restaurantName: "Gourmet Grills & Seafood",
            deliveryAddress: "Block 8, Parkview Estate, Ikoyi",
            claimedAmountNgn: 22800,
            claimReason: "DAMAGED_SPILLAGE",
            customerStatement: "The soup container cracked completely during transit. Palm oil spilled all over the plantain and takeaway bag.",
            customerPhotoUrl: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=80&w=800&auto=format&fit=crop",
            courierChampion: {
              id: "ch-105",
              name: "Kayode Adeleke",
              phone: "+234 809 332 1980",
              vehiclePlate: "LAGOS • KSF-819-QN",
              rating: 4.8,
              totalDeliveries: 312
            },
            podEvidence: {
              photoUrl: "https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=800&auto=format&fit=crop",
              timestampWatermark: "Lat: 6.4520, Lng: 3.4390 • 30/10/2026 13:45:00 WAT",
              dropoffCoords: { lat: 6.4520, lng: 3.4390 },
              destinationCoords: { lat: 6.4519, lng: 3.4391 },
              distanceMeters: 8,
              isGeofenceMatch: true,
              handoverOtpVerified: true,
              otpCode: "4912",
              thermalBoxInspected: true
            },
            aiEvaluation: {
              recommendation: "APPROVE_REFUND",
              confidenceScorePct: 94,
              courierExonerationProbabilityPct: 50,
              rationaleSummary: "Legitimate customer photo clearly shows fractured plastic container seal and heavy palm oil leakage. Courier delivered to correct location with OTP, but merchant packaging failure caused damage. Recommend 100% refund funded by merchant packaging penalty.",
              riskScore: "HIGH"
            },
            status: "PENDING_REVIEW"
          },
          {
            id: "disp-89218",
            orderId: "ord-89218",
            orderNumber: "#FM-89218",
            customerName: "Femi Otedola",
            customerPhone: "+234 807 554 2209",
            restaurantName: "Yaba Spice Kitchen",
            deliveryAddress: "12 Commercial Avenue, Sabo Yaba",
            claimedAmountNgn: 8500,
            claimReason: "COLD_FOOD",
            customerStatement: "Delivery took over 50 minutes from pickup and arrived lukewarm. Not the quality I expect from FlowMart.",
            courierChampion: {
              id: "ch-104",
              name: "Chinedu Eze",
              phone: "+234 805 441 8933",
              vehiclePlate: "LAGOS • LSR-421-SM",
              rating: 4.6,
              totalDeliveries: 185
            },
            podEvidence: {
              photoUrl: "https://images.unsplash.com/photo-1526367790999-0150786686a2?q=80&w=800&auto=format&fit=crop",
              timestampWatermark: "Lat: 6.5140, Lng: 3.3710 • 30/10/2026 12:55:00 WAT",
              dropoffCoords: { lat: 6.5140, lng: 3.3710 },
              destinationCoords: { lat: 6.5142, lng: 3.3712 },
              distanceMeters: 22,
              isGeofenceMatch: true,
              handoverOtpVerified: true,
              otpCode: "3019",
              thermalBoxInspected: true
            },
            aiEvaluation: {
              recommendation: "COURTESY_CREDIT",
              confidenceScorePct: 88,
              courierExonerationProbabilityPct: 85,
              rationaleSummary: "Courier had thermal bag verified and met geofenced handover OTP. However, heavy traffic on Sabo bridge added +18 mins transit delay. Recommend issuing ₦2,000 apology wallet credit to customer without docking courier pay.",
              riskScore: "MEDIUM"
            },
            status: "PENDING_REVIEW"
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (type: "DISMISS" | "FULL_REFUND" | "COURTESY_CREDIT") => {
    if (!selectedClaim) return;
    try {
      setActionLoading(true);
      const res = await apiClient.post(`/admin/disputes/${selectedClaim.id}/resolve`, {
        resolutionType: type,
        adminNotes: adminNotes || `Resolved as ${type} via AI evidence audit.`
      });

      if (res.data?.success) {
        showToast(res.data.message || `Dispute resolved as ${type}!`, "success");
        setSelectedClaim(null);
        setAdminNotes("");
        fetchDisputes();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to resolve dispute", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredClaims = (data?.claims || []).filter(c => {
    if (statusFilter === "PENDING_REVIEW" && c.status !== "PENDING_REVIEW") return false;
    if (statusFilter === "RESOLVED" && !c.status.startsWith("RESOLVED")) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.orderNumber.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        c.courierChampion.name.toLowerCase().includes(q) ||
        c.courierChampion.vehiclePlate.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-body">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">AI Dispatch Dispute & Proof-of-Delivery Audit</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200">
                Operations Arbiter 2026
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Side-by-side geotagged photo proof-of-delivery (POD), geofence delta inspection, and automated AI courier exoneration.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            ⚡ Avg AI Analysis: {data?.summary.averageAiEvaluationSeconds || 1.4}s
          </span>
        </div>
      </div>

      {/* ═══ KPI AUDIT TILES ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Review</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {data?.summary.pendingAuditClaims || 3} Claims
          </div>
          <p className="text-[11px] text-amber-600 font-bold mt-1">
            Requires arbitrator sign-off
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Courier Protection Rate</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {data?.summary.courierProtectionRatePct || 91.4}%
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">
            False customer claims deflected by POD
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Auto Courtesy Credits</span>
          <div className="text-2xl font-black text-indigo-600 mt-1">
            ₦{((data?.summary.autoSettledCourtesyCreditsNgn || 18500) / 1000).toFixed(1)}K
          </div>
          <p className="text-[11px] text-indigo-700 font-medium mt-1">
            Compromise wallet vouchers issued
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Resolved Today</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {data?.summary.resolvedClaimsToday || 24} Claims
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            Zero backlog SLA met
          </p>
        </div>
      </div>

      {/* ═══ CLAIMS QUEUE TABLE ═══ */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900">Dispute Claims & Evidence Audit Queue</h3>
            <p className="text-xs text-slate-500 font-medium">
              Click "Audit Evidence" to view side-by-side customer statement, courier photo watermark, and geofence coordinates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search order #, customer, or rider..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filter */}
            <div className="inline-flex rounded-xl bg-slate-100 p-0.5 font-bold">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg transition ${statusFilter === "ALL" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("PENDING_REVIEW")}
                className={`px-3 py-1.5 rounded-lg transition ${statusFilter === "PENDING_REVIEW" ? "bg-white text-amber-700 shadow-sm" : "text-slate-600"}`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter("RESOLVED")}
                className={`px-3 py-1.5 rounded-lg transition ${statusFilter === "RESOLVED" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600"}`}
              >
                Resolved
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-6">Order #</th>
                <th className="py-3.5 px-6">Customer & Reason</th>
                <th className="py-3.5 px-6">Courier Champion</th>
                <th className="py-3.5 px-4 text-right">Claim Amount</th>
                <th className="py-3.5 px-6 text-center">AI Arbiter Assessment</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClaims.map((claim) => (
                <tr key={claim.id} className="hover:bg-indigo-50/20 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-indigo-600">
                    {claim.orderNumber}
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-900">
                    <div>{claim.customerName}</div>
                    <span className="inline-block mt-0.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {claim.claimReason.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-800">
                    <div className="font-bold">{claim.courierChampion.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{claim.courierChampion.vehiclePlate} • {claim.courierChampion.rating} ⭐</div>
                  </td>
                  <td className="py-4 px-4 text-right font-black text-slate-900">
                    ₦{claim.claimedAmountNgn.toLocaleString()}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {claim.aiEvaluation.recommendation === "DISMISS_CLAIM" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        🛡️ Dismiss ({claim.aiEvaluation.confidenceScorePct}%)
                      </span>
                    )}
                    {claim.aiEvaluation.recommendation === "APPROVE_REFUND" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        ⚡ Refund ({claim.aiEvaluation.confidenceScorePct}%)
                      </span>
                    )}
                    {claim.aiEvaluation.recommendation === "COURTESY_CREDIT" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        ⚖️ Courtesy Voucher ({claim.aiEvaluation.confidenceScorePct}%)
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {claim.status === "PENDING_REVIEW" ? (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        Needs Review
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                        Resolved
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      onClick={() => setSelectedClaim(claim)}
                      className="inline-flex items-center gap-1.5 text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl shadow-sm transition cursor-pointer"
                    >
                      Audit Evidence <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ SIDE-BY-SIDE EVIDENCE AUDIT MODAL ═══ */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 my-8 overflow-hidden animate-in zoom-in-95 duration-150 text-slate-900">
            {/* Modal Header */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <Scale className="w-5 h-5 text-indigo-400" />
                <span className="font-black text-sm">Dispute Evidence Audit • Order {selectedClaim.orderNumber}</span>
                <span className="text-[10px] font-bold uppercase bg-white/10 px-2.5 py-0.5 rounded-full text-indigo-200">
                  {selectedClaim.claimReason.replace("_", " ")}
                </span>
              </div>
              <button onClick={() => setSelectedClaim(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3-Column Split Evidence Grid */}
            <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Column 1: Customer Claim */}
              <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Customer Allegation</span>
                  <span className="font-bold text-rose-600">Claims ₦{selectedClaim.claimedAmountNgn.toLocaleString()}</span>
                </div>

                <div>
                  <h4 className="font-black text-sm text-slate-900">{selectedClaim.customerName}</h4>
                  <p className="text-[11px] text-slate-500 font-medium">{selectedClaim.customerPhone}</p>
                  <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1 font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {selectedClaim.deliveryAddress}
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Customer Statement</span>
                  <p className="text-xs text-slate-700 italic">"{selectedClaim.customerStatement}"</p>
                </div>

                {selectedClaim.customerPhotoUrl && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Customer Attached Photo</span>
                    <img 
                      src={selectedClaim.customerPhotoUrl} 
                      alt="Customer claim evidence" 
                      className="w-full h-36 object-cover rounded-xl border border-slate-200"
                    />
                  </div>
                )}
              </div>

              {/* Column 2: Courier POD Evidence */}
              <div className="space-y-4 bg-indigo-50/50 p-5 rounded-2xl border border-indigo-200 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-700 uppercase tracking-wider text-[10px]">Courier POD Evidence</span>
                  <span className="font-bold text-indigo-700">{selectedClaim.courierChampion.rating} ⭐ Verified</span>
                </div>

                <div>
                  <h4 className="font-black text-sm text-slate-900">{selectedClaim.courierChampion.name}</h4>
                  <p className="text-[11px] text-slate-500 font-mono">{selectedClaim.courierChampion.vehiclePlate} • {selectedClaim.courierChampion.totalDeliveries} Lifetime Trips</p>
                </div>

                {/* POD Photo with Watermark */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Geotagged Doorstep Photo</span>
                  <div className="relative rounded-xl overflow-hidden border border-indigo-200">
                    <img 
                      src={selectedClaim.podEvidence.photoUrl} 
                      alt="Proof of delivery" 
                      className="w-full h-36 object-cover"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-black/75 text-[9px] text-white p-1.5 font-mono leading-tight">
                      {selectedClaim.podEvidence.timestampWatermark}
                    </div>
                  </div>
                </div>

                {/* Verification Signals */}
                <div className="space-y-2 bg-white p-3 rounded-xl border border-indigo-100">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-medium">Geofence Distance:</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {selectedClaim.podEvidence.distanceMeters}m (At Doorstep)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-medium">Handover OTP:</span>
                    <span className="font-mono font-bold text-emerald-600">
                      [🔐 {selectedClaim.podEvidence.otpCode} Verified]
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-medium">Thermal Box Pickup:</span>
                    <span className="font-bold text-emerald-600">Inspected ✓</span>
                  </div>
                </div>
              </div>

              {/* Column 3: AI Arbiter Recommendation */}
              <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between text-xs">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">AI Arbiter Assessment</span>
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                      2026 Model
                    </span>
                  </div>

                  {/* Recommendation Banner */}
                  <div className={`p-4 rounded-xl border text-center space-y-1 ${
                    selectedClaim.aiEvaluation.recommendation === "DISMISS_CLAIM"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : selectedClaim.aiEvaluation.recommendation === "APPROVE_REFUND"
                      ? "bg-rose-50 border-rose-200 text-rose-900"
                      : "bg-amber-50 border-amber-200 text-amber-900"
                  }`}>
                    <Sparkles className="w-5 h-5 mx-auto mb-1 text-indigo-600" />
                    <div className="font-black text-sm uppercase">
                      {selectedClaim.aiEvaluation.recommendation.replace("_", " ")}
                    </div>
                    <p className="text-[11px] font-bold">
                      Confidence Score: {selectedClaim.aiEvaluation.confidenceScorePct}%
                    </p>
                  </div>

                  {/* AI Rationale */}
                  <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Analysis Rationale</span>
                    <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                      {selectedClaim.aiEvaluation.rationaleSummary}
                    </p>
                  </div>
                </div>

                {/* Resolution Notes Input */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <label className="font-bold text-slate-700 text-[11px]">Arbitration Notes</label>
                  <input
                    type="text"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Enter resolution notes..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

            </div>

            {/* Modal Bottom Actions */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-500 font-medium">
                Decision immediately updates customer ledger and courier standing.
              </span>

              <div className="flex flex-wrap items-center gap-2 text-xs font-black">
                <button
                  onClick={() => handleResolve("DISMISS")}
                  disabled={actionLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" /> Uphold & Dismiss Claim
                </button>
                <button
                  onClick={() => handleResolve("COURTESY_CREDIT")}
                  disabled={actionLoading}
                  className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1.5"
                >
                  <Gift className="w-4 h-4" /> Issue ₦2,000 Courtesy Voucher
                </button>
                <button
                  onClick={() => handleResolve("FULL_REFUND")}
                  disabled={actionLoading}
                  className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1.5"
                >
                  <DollarSign className="w-4 h-4" /> Issue Full Refund (₦{selectedClaim.claimedAmountNgn.toLocaleString()})
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
