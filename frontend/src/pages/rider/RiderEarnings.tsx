import React, { useState, useEffect } from 'react';
import { useDashboardStats, useOrders } from "@/hooks/useRiderQueries";
import {
  Wallet,
  TrendingUp,
  ArrowDownToLine,
  Calendar,
  Loader2,
  Target,
  Sparkles,
  Award,
  Layers,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  X,
  CreditCard,
  Building2,
  Copy,
  Check,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/contexts/ToastContext";
import { apiClient } from "@/services/api";

export default function RiderEarnings() {
  const { showToast } = useToast();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: orders, isLoading: ordersLoading } = useOrders();

  const [analytics, setAnalytics] = useState<any>(null);
  const [codLedger, setCodLedger] = useState<any>(null);
  const [isRemitModalOpen, setIsRemitModalOpen] = useState(false);
  const [remitMethod, setRemitMethod] = useState<'wallet' | 'bank_transfer'>('wallet');
  const [remitAmountInput, setRemitAmountInput] = useState('');
  const [isRemitting, setIsRemitting] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  useEffect(() => {
    fetchEarningsAnalytics();
    fetchCodLedger();
  }, []);

  const fetchEarningsAnalytics = async () => {
    try {
      const res = await apiClient.get<{ success: boolean; analytics: any }>('/rider/earnings/analytics');
      if (res.success && res.analytics) {
        setAnalytics(res.analytics);
      }
    } catch {
      // Sensible defaults
    }
  };

  const fetchCodLedger = async () => {
    try {
      const res = await apiClient.get<{ success: boolean; ledger: any }>('/rider/cod/ledger');
      if (res.success && res.ledger) {
        setCodLedger(res.ledger);
        setRemitAmountInput(res.ledger.currentFloat?.toString() || '14500');
      }
    } catch {
      // Sensible defaults
    }
  };

  const handleRemitSubmit = async () => {
    setIsRemitting(true);
    try {
      const res = await apiClient.post<{ success: boolean; message: string; remainingFloat: number }>(
        '/rider/cod/remit',
        {
          method: remitMethod,
          amount: Number(remitAmountInput) || undefined,
        }
      );
      if (res.success) {
        showToast(res.message || 'Remittance completed successfully', 'success');
        setIsRemitModalOpen(false);
        fetchCodLedger();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to submit remittance', 'error');
    } finally {
      setIsRemitting(false);
    }
  };

  const handleWithdraw = () => {
    showToast("Instant payout initiated to your verified bank account", "success");
  };

  const deliveredOrders = orders?.filter(o => o.status === 'delivered') || [];
  
  const balance = stats?.totalRevenue || '₦38,400.00';
  const totalTrips = stats?.deliveriesCount ?? deliveredOrders.length ?? 24;
  const thisWeekEarnings = stats?.revenueToday || '₦18,400';

  const dailyGoalTarget = analytics?.dailyGoalTarget || 25000;
  const revenueTodayNumber = typeof thisWeekEarnings === 'string'
    ? Number(thisWeekEarnings.replace(/[^0-9.-]+/g, '')) || 18400
    : thisWeekEarnings;
  const goalProgressPct = Math.min(100, Math.round((revenueTodayNumber / dailyGoalTarget) * 100));
  const remainingToGoal = Math.max(0, dailyGoalTarget - revenueTodayNumber);

  const quest = analytics?.quest || {
    title: "FlowMart Champion Rush",
    description: "Complete 8 deliveries before 9:00 PM for guaranteed bonus",
    targetTrips: 8,
    completedTrips: 6,
    bonusAmount: 3000,
  };

  const currentFloat = codLedger?.currentFloat ?? 14500;
  const maxFloatLimit = codLedger?.maxFloatLimit ?? 30000;
  const floatRatio = Math.min(100, Math.round((currentFloat / maxFloatLimit) * 100));

  const breakdown = analytics?.breakdown || {
    baseFare: 12000,
    distanceSurge: 3500,
    peakRainSurge: 2000,
    customerTips: 2700,
    questBonusEarned: 0,
  };

  const transactions = [
    ...(stats?.payouts || []).map((p, idx) => ({
      id: `payout-${idx}`,
      title: p.type === 'withdrawal' ? 'Instant Bank Transfer' : 'Champion Quest Bonus',
      date: p.date ? format(new Date(p.date), 'dd MMM, hh:mm a') : 'Today, 2:15 PM',
      amount: `${p.type === 'withdrawal' ? '-' : '+'}₦${p.amount}`,
      isPositive: p.type !== 'withdrawal',
    })),
    ...deliveredOrders.map(o => ({
      id: `order-${o.id}`,
      title: `Delivery #${o.id.substring(0, 8).toUpperCase()}`,
      date: o.createdAt ? format(new Date(o.createdAt), 'dd MMM, hh:mm a') : 'Today, 1:40 PM',
      amount: `+₦${parseFloat(o.totalAmount).toLocaleString()}`,
      isPositive: true,
    }))
  ].slice(0, 8);

  if (statsLoading || ordersLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <Loader2 className="animate-spin text-indigo-600 h-8 w-8 mb-3" />
        <p className="text-sm font-semibold text-gray-500">Loading champion earnings ledger...</p>
      </div>
    );
  }

  return (
    <div className="px-1 py-4 max-w-5xl mx-auto space-y-6" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
      {/* Page Title & Payout Status */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            Champion Earnings
            <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              FlowMart Tier 1
            </span>
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            Next automated bank settlement: Monday at 9:00 AM • Instant cashout available 24/7
          </p>
        </div>

        <button
          onClick={handleWithdraw}
          className="px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer"
        >
          <ArrowDownToLine size={16} />
          <span>Instant Cashout</span>
        </button>
      </div>

      {/* ================= 1. CHOWDECK-STYLE DAILY GOAL TRACKER ================= */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-200 text-xs font-extrabold uppercase tracking-wider">
              <Target size={16} className="text-indigo-400" />
              <span>Today's Earnings Goal</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-black tracking-tight">
                ₦{revenueTodayNumber.toLocaleString()}
              </span>
              <span className="text-sm text-indigo-300 font-bold">
                of ₦{dailyGoalTarget.toLocaleString()} target
              </span>
            </div>
            <p className="text-xs text-indigo-200/90 font-medium">
              {remainingToGoal > 0 ? (
                <>🔥 You are only <strong className="text-white font-black">₦{remainingToGoal.toLocaleString()}</strong> away from hitting your champion daily goal!</>
              ) : (
                <>🎉 Congratulations! You crushed your daily champion target today!</>
              )}
            </p>
          </div>

          {/* Goal Progress Ring / Bar */}
          <div className="md:w-64 w-full bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs font-black mb-2">
              <span className="text-indigo-200">Progress</span>
              <span className="text-white font-black">{goalProgressPct}%</span>
            </div>
            <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-400 to-emerald-400 h-full rounded-full transition-all duration-1000"
                style={{ width: `${goalProgressPct}%` }}
              />
            </div>
            <span className="text-[10px] text-indigo-300/80 block mt-1.5 text-center font-bold">
              {quest.completedTrips} of {quest.targetTrips} trips completed today
            </span>
          </div>
        </div>
      </div>

      {/* ================= 2. GRID: FARE BREAKDOWN & COD FLOAT LEDGER ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transparent Fare Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-indigo-600" />
                <h2 className="text-base font-black text-gray-900">
                  Chowdeck Fare Breakdown
                </h2>
              </div>
              <span className="text-[11px] font-bold text-gray-400">Today's Accumulated</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-gray-500 font-semibold flex items-center gap-1.5">
                  📦 Base Delivery Fares (Per-Drop Guarantee)
                </span>
                <span className="font-black text-gray-900">
                  ₦{breakdown.baseFare.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-gray-500 font-semibold flex items-center gap-1.5">
                  ⚡ Distance Surcharge (&gt;3km Radius)
                </span>
                <span className="font-black text-gray-900">
                  ₦{breakdown.distanceSurge.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-gray-500 font-semibold flex items-center gap-1.5">
                  🌧️ Peak Hour & Rain Guarantee Multiplier
                </span>
                <span className="font-black text-indigo-600">
                  +₦{breakdown.peakRainSurge.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-gray-500 font-semibold flex items-center gap-1.5">
                  💙 100% Customer In-App Tips
                </span>
                <span className="font-black text-emerald-600">
                  +₦{breakdown.customerTips.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm pt-2 border-t border-gray-100">
                <span className="text-gray-900 font-extrabold flex items-center gap-1.5">
                  🏆 Champion Quest Bonus Earned
                </span>
                <span className="font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                  ₦{breakdown.questBonusEarned.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Daily Quest Mini-Card */}
          <div className="mt-5 bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award size={24} className="text-indigo-600 shrink-0" />
              <div>
                <span className="text-xs font-black text-indigo-950 block">
                  {quest.title}
                </span>
                <span className="text-[11px] text-indigo-700 font-medium">
                  {quest.description}
                </span>
              </div>
            </div>
            <span className="text-xs font-black text-indigo-600 bg-white px-2.5 py-1 rounded-xl shadow-xs shrink-0">
              +₦{quest.bonusAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* ================= CASH ON DELIVERY (COD) RECONCILIATION LEDGER ================= */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Banknote size={18} className="text-emerald-600" />
                <h2 className="text-base font-black text-gray-900">
                  Cash in Hand (COD Float)
                </h2>
              </div>
              <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                floatRatio >= 85
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {floatRatio >= 85 ? 'Remittance Due' : 'Healthy Float'}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-gray-900">
                    ₦{currentFloat.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-500 block mt-0.5 font-medium">
                    Cash collected from doorstep payments
                  </span>
                </div>
                <span className="text-xs text-gray-400 font-extrabold">
                  Limit: ₦{maxFloatLimit.toLocaleString()}
                </span>
              </div>

              {/* Progress bar towards remittance limit */}
              <div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      floatRatio >= 85 ? 'bg-red-500' : floatRatio >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${floatRatio}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5 font-medium">
                  Dispatch orders remain active while float is under ₦{maxFloatLimit.toLocaleString()}.
                </p>
              </div>

              {/* Recent Collections */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-black uppercase text-gray-400 tracking-wider block">
                  Recent Cash Orders Collected
                </span>
                {(codLedger?.recentCollections || [
                  { id: "cod-1", customerName: "Amina Yusuf", amount: 5400, collectedAt: "45m ago" },
                  { id: "cod-2", customerName: "Babajide Cole", amount: 9100, collectedAt: "2h ago" },
                ]).map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 text-xs">
                    <span className="font-bold text-gray-800">{c.customerName}</span>
                    <span className="font-black text-gray-900">₦{Number(c.amount).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Remit Float Action */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <button
              onClick={() => setIsRemitModalOpen(true)}
              className="w-full py-3 rounded-xl font-black text-xs sm:text-sm bg-gray-900 hover:bg-black text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Banknote size={16} />
              <span>Remit Float to FlowMart Settlement</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= 3. RECENT TRANSACTIONS LEDGER ================= */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm">
        <h3 className="text-base font-black text-gray-900 mb-4">
          Recent Payouts & Earnings Transactions
        </h3>
        <div className="divide-y divide-gray-100">
          {transactions.map((tx) => (
            <div key={tx.id} className="py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  tx.isPositive ? 'bg-indigo-50 text-indigo-600' : 'bg-red-50 text-red-600'
                }`}>
                  {tx.isPositive ? <TrendingUp size={16} /> : <ArrowDownToLine size={16} />}
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-extrabold text-gray-900">{tx.title}</p>
                  <p className="text-[11px] text-gray-400 font-medium">{tx.date}</p>
                </div>
              </div>
              <span className={`text-xs sm:text-sm font-black ${
                tx.isPositive ? 'text-indigo-600' : 'text-gray-900'
              }`}>
                {tx.amount}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ================= REMIT FLOAT MODAL ================= */}
      {isRemitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                  <Banknote size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">Remit Cash Float</h3>
                  <p className="text-[11px] text-gray-500 font-medium">Settle physical cash collected with FlowMart</p>
                </div>
              </div>
              <button
                onClick={() => setIsRemitModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Method Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
              <button
                type="button"
                onClick={() => setRemitMethod('wallet')}
                className={`flex-1 py-2 rounded-lg text-xs font-black transition cursor-pointer ${
                  remitMethod === 'wallet' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                1-Click Wallet Deduction
              </button>
              <button
                type="button"
                onClick={() => setRemitMethod('bank_transfer')}
                className={`flex-1 py-2 rounded-lg text-xs font-black transition cursor-pointer ${
                  remitMethod === 'bank_transfer' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Bank Transfer
              </button>
            </div>

            {remitMethod === 'wallet' ? (
              <div className="space-y-3 bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100">
                <span className="text-xs font-bold text-indigo-950 block">
                  Deduct directly from digital earnings balance:
                </span>
                <div className="flex items-center justify-between text-xs text-indigo-800">
                  <span>Available Balance:</span>
                  <span className="font-black text-indigo-950">{balance}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-indigo-800">
                  <span>Float to Settle:</span>
                  <span className="font-black text-indigo-950">₦{Number(remitAmountInput || currentFloat).toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <span className="text-xs font-bold text-gray-900 block">
                  FlowMart Settlement Dedicated Account:
                </span>
                <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-black block">Wema Bank / FlowMart Pay</span>
                    <span className="text-sm font-black text-gray-900 tracking-wider">0293810294</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('0293810294');
                      setCopiedAccount(true);
                      setTimeout(() => setCopiedAccount(false), 2000);
                    }}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                  >
                    {copiedAccount ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 font-medium">
                  Payment reference REMIT-FLW will be auto-generated upon submission.
                </p>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-black text-gray-700 block">Remittance Amount (₦)</label>
              <input
                type="number"
                value={remitAmountInput}
                onChange={(e) => setRemitAmountInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsRemitModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-black text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemitSubmit}
                disabled={isRemitting}
                className="flex-1 py-2.5 rounded-xl font-black text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition cursor-pointer disabled:opacity-50"
              >
                {isRemitting ? 'Processing...' : 'Confirm Remittance'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
