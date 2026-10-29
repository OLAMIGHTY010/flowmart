import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Zap,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle2,
  X,
  Navigation,
  ShieldCheck,
  TrendingUp,
  Store
} from "lucide-react";
import { apiClient } from "@/services/api";

interface StackedBatchData {
  id: string;
  status: string;
  zone: string;
  primaryOrder: {
    id: string;
    ref: string;
    store: string;
    destination: string;
    customerName: string;
    customerPhone: string;
    itemsSummary: string;
    payout: number;
  };
  stackedOrder: {
    id: string;
    ref: string;
    store: string;
    destination: string;
    customerName: string;
    customerPhone: string;
    itemsSummary: string;
    payout: number;
    detourKm: number;
  };
  totalPayout: number;
  estimatedMinutes: number;
  corridorSequence: {
    step: number;
    action: string;
    location: string;
    note: string;
  }[];
}

interface StackedBatchCardProps {
  onBatchAccepted?: (batchId: string) => void;
}

export default function StackedBatchCard({ onBatchAccepted }: StackedBatchCardProps) {
  const [batch, setBatch] = useState<StackedBatchData | null>(null);
  const [isAccepted, setIsAccepted] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    apiClient.get("/rider/batch/active").then((res) => {
      if (res.data?.success && res.data?.batch) {
        setBatch(res.data.batch);
      }
    }).catch(() => {});
  }, []);

  if (!batch || isDismissed) return null;

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const res = await apiClient.post("/rider/batch/accept", { batchId: batch.id });
      if (res.data?.success) {
        setIsAccepted(true);
        if (onBatchAccepted) onBatchAccepted(batch.id);
      }
    } catch {
      setIsAccepted(true);
      if (onBatchAccepted) onBatchAccepted(batch.id);
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border-2 border-indigo-500/40 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden"
    >
      {/* Top Banner Tag */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/30 rounded-full text-[11px] font-black uppercase tracking-wider text-indigo-300 border border-indigo-400/30">
          <Layers size={13} className="text-amber-400" />
          <span>Stacked Batch Available (+0.8km Detour)</span>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="text-white/60 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
        >
          <X size={16} />
        </button>
      </div>

      {/* Main Earnings & Detour Summary */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <span className="text-xs text-indigo-200">Joint Stacked Payout</span>
          <div className="text-3xl font-black text-amber-300 tracking-tight flex items-baseline gap-1 mt-0.5">
            ₦{batch.totalPayout.toLocaleString()}
            <span className="text-xs text-indigo-200 font-normal">
              (₦{batch.primaryOrder.payout} + ₦{batch.stackedOrder.payout} bonus)
            </span>
          </div>
          <p className="text-xs text-indigo-300 mt-1 flex items-center gap-1.5">
            <Clock size={13} /> ~{batch.estimatedMinutes} mins total corridor time
          </p>
        </div>

        <div className="text-right">
          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-bold border border-emerald-500/30">
            2 Deliveries Stacked
          </span>
        </div>
      </div>

      {/* Corridor Stepper Sequence */}
      <div className="bg-black/30 rounded-2xl p-4 border border-white/10 space-y-3 mb-4">
        <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
          Smart Optimized Route Sequence
        </p>

        <div className="space-y-2.5">
          {batch.corridorSequence.map((seq) => (
            <div key={seq.step} className="flex items-start gap-2.5 text-xs">
              <div className="w-5 h-5 rounded-full bg-indigo-600/60 text-white font-bold flex items-center justify-center shrink-0 text-[10px] border border-indigo-400">
                {seq.step}
              </div>
              <div className="flex-1">
                <span className="font-bold text-white">{seq.action}: </span>
                <span className="text-indigo-200 font-semibold">{seq.location}</span>
                <p className="text-[11px] text-white/60">{seq.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      {isAccepted ? (
        <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
          <CheckCircle2 size={16} />
          <span>✓ Stacked Batch Accepted! Routing to {batch.primaryOrder.store}...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setIsDismissed(true)}
            className="py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition"
          >
            Decline Add-on
          </button>
          <button
            onClick={handleAccept}
            disabled={isAccepting}
            className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
          >
            <Zap size={14} className="fill-amber-400 text-amber-400" />
            {isAccepting ? "Accepting..." : "Accept Stack (+₦1,400)"}
          </button>
        </div>
      )}
    </motion.div>
  );
}
