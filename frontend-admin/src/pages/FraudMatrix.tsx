import React, { useState, useEffect, useMemo } from "react";
import { apiClient } from "@/services/api";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Unlock,
  Smartphone,
  Laptop,
  Globe,
  Search,
  Filter,
  RefreshCw,
  UserX,
  UserCheck,
  CheckCircle2,
  XCircle,
  Eye,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FraudEntity {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  deviceFingerprint: string;
  ipAddress: string;
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  flags: string[];
  isBlocked: boolean;
  createdAt: string;
}

export default function AdminFraudMatrix() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<"ALL" | "HIGH" | "MEDIUM" | "LOW">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "BLOCKED" | "ACTIVE">("ALL");
  const [selectedEntity, setSelectedEntity] = useState<FraudEntity | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");

  const [matrixData, setMatrixData] = useState<{
    totalAnalyzed: number;
    highRiskCount: number;
    mediumRiskCount: number;
    blockedCount: number;
    entities: FraudEntity[];
  }>({
    totalAnalyzed: 1420,
    highRiskCount: 1,
    mediumRiskCount: 1,
    blockedCount: 1,
    entities: []
  });

  const fetchMatrix = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await apiClient.get("/admin/fraud/matrix");
      if (res.data?.success && res.data?.matrix) {
        setMatrixData(res.data.matrix);
      }
    } catch (err) {
      console.error("Failed to load fraud matrix:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
  }, []);

  const handleToggleBlock = async (entity: FraudEntity) => {
    try {
      const res = await apiClient.post(`/admin/fraud/block/${entity.id}`);
      if (res.data?.success) {
        setActionSuccessMsg(res.data.message);
        setMatrixData((prev) => ({
          ...prev,
          entities: prev.entities.map((e) =>
            e.id === entity.id ? { ...e, isBlocked: !e.isBlocked } : e
          ),
          blockedCount: entity.isBlocked ? prev.blockedCount - 1 : prev.blockedCount + 1
        }));
        setTimeout(() => setActionSuccessMsg(""), 3000);
      }
    } catch (err) {
      console.error("Failed to toggle block:", err);
    }
  };

  const filteredEntities = useMemo(() => {
    return matrixData.entities.filter((entity) => {
      const matchSearch =
        entity.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entity.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entity.phone.includes(searchQuery) ||
        entity.deviceFingerprint.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entity.ipAddress.includes(searchQuery);

      const matchRisk = riskFilter === "ALL" || entity.riskLevel === riskFilter;
      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "BLOCKED" && entity.isBlocked) ||
        (statusFilter === "ACTIVE" && !entity.isBlocked);

      return matchSearch && matchRisk && matchStatus;
    });
  }, [matrixData.entities, searchQuery, riskFilter, statusFilter]);

  const getRiskColor = (score: number) => {
    if (score >= 70) return "text-rose-600 bg-rose-500/10 border-rose-500/20";
    if (score >= 40) return "text-amber-600 bg-amber-500/10 border-amber-500/20";
    return "text-emerald-600 bg-emerald-500/10 border-emerald-500/20";
  };

  const getRiskBarColor = (score: number) => {
    if (score >= 70) return "bg-rose-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1 text-rose-500">
            <ShieldAlert size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">
              Fraud & Risk Defense Engine
            </span>
          </div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            Multi-Accounting Risk Matrix & Device Fingerprints
          </h1>
          <p className="text-sm text-text-secondary">
            Hardware fingerprint collisions, phone reuse detection, rapid account fraud telemetry, and 1-tap account freeze.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchMatrix(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-text-primary hover:bg-secondary/80 rounded-xl font-bold text-sm border border-border transition active:scale-95"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin text-primary" : ""} />
            {refreshing ? "Scanning Fleet..." : "Re-Scan Accounts"}
          </button>
        </div>
      </div>

      {/* Action Notification */}
      <AnimatePresence>
        {actionSuccessMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-primary/10 border border-primary/30 rounded-2xl flex items-center gap-3 text-primary font-semibold text-sm shadow-sm"
          >
            <CheckCircle2 size={18} />
            <span>{actionSuccessMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Accounts Scanned</span>
            <Globe size={18} className="text-primary" />
          </div>
          <div className="text-3xl font-black text-text-primary">
            {matrixData.totalAnalyzed.toLocaleString()}
          </div>
          <p className="text-xs text-text-muted mt-1">24h Fingerprint Telemetry</p>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">High Risk Collisions</span>
            <AlertTriangle size={18} className="text-rose-500" />
          </div>
          <div className="text-3xl font-black text-rose-600 dark:text-rose-400">
            {matrixData.highRiskCount}
          </div>
          <p className="text-xs text-rose-500 font-semibold mt-1">Score ≥ 70 / 100</p>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Medium Risk Warning</span>
            <ShieldAlert size={18} className="text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
            {matrixData.mediumRiskCount}
          </div>
          <p className="text-xs text-text-muted mt-1">Under Investigation</p>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Frozen Accounts</span>
            <Lock size={18} className="text-text-muted" />
          </div>
          <div className="text-3xl font-black text-text-primary">{matrixData.blockedCount}</div>
          <p className="text-xs text-text-muted mt-1">Blocked from Ordering</p>
        </div>
      </div>

      {/* Main Table / Matrix View */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-secondary/60 p-1 rounded-xl">
              {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setRiskFilter(level)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    riskFilter === level
                      ? "bg-primary text-white shadow-sm"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {level === "ALL" ? "All Risks" : level}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-secondary/60 p-1 rounded-xl">
              {(["ALL", "BLOCKED", "ACTIVE"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    statusFilter === st
                      ? "bg-primary text-white shadow-sm"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {st === "ALL" ? "All Status" : st}
                </button>
              ))}
            </div>
          </div>

          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3 top-3 text-text-muted" />
            <input
              type="text"
              placeholder="Search user, phone, IP or fingerprint..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-secondary/50 border border-border rounded-xl text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/40 text-text-muted uppercase font-bold border-b border-border">
              <tr>
                <th className="py-3 px-4">Account User</th>
                <th className="py-3 px-4">Device & IP Signature</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Detected Risk Flags</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Operations Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEntities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-text-muted">
                    No flagged accounts found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredEntities.map((entity) => (
                  <tr key={entity.id} className="hover:bg-secondary/20 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-text-primary text-xs">
                          {entity.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-text-primary text-sm">{entity.fullName}</p>
                          <p className="text-[11px] text-text-muted">{entity.email}</p>
                          <p className="text-[11px] text-text-muted font-mono">{entity.phone}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5 text-text-primary">
                        <Laptop size={13} className="text-text-muted" />
                        <span className="bg-secondary px-1.5 py-0.5 rounded border border-border">
                          {entity.deviceFingerprint}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-text-muted mt-1">
                        <Globe size={13} />
                        <span>IP: {entity.ipAddress}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-1 min-w-[100px]">
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${getRiskColor(
                              entity.riskScore
                            )}`}
                          >
                            {entity.riskLevel} • {entity.riskScore}/100
                          </span>
                        </div>
                        <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getRiskBarColor(entity.riskScore)}`}
                            style={{ width: `${entity.riskScore}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {entity.flags.map((flag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-md text-[10px] font-medium"
                          >
                            {flag}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {entity.isBlocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 text-rose-600 rounded-full font-bold text-[10px] border border-rose-500/20">
                          <Lock size={12} /> FROZEN / BLOCKED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-600 rounded-full font-bold text-[10px] border border-emerald-500/20">
                          <CheckCircle2 size={12} /> ACTIVE
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleBlock(entity)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition shadow-sm ${
                          entity.isBlocked
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-rose-600 hover:bg-rose-700 text-white"
                        }`}
                      >
                        {entity.isBlocked ? (
                          <>
                            <Unlock size={14} /> Unfreeze Account
                          </>
                        ) : (
                          <>
                            <Lock size={14} /> Freeze & Block
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-text-muted py-2">
        © 2026 FlowMart Technologies. Fraud & Risk Defense Matrix V2.
      </div>
    </div>
  );
}
