import React, { useState, useEffect, useMemo } from "react";
import { apiClient } from "@/services/api";
import {
  Wallet,
  Gift,
  CheckCircle2,
  AlertCircle,
  Copy,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CreditCard,
  UserCheck,
  ShieldAlert,
  Calendar,
  X,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface RefundRecord {
  id: string;
  orderId: string;
  orderRef: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  reason: string;
  channel: "wallet" | "card_chargeback";
  issuedBy: string;
  issuedAt: string;
  status: "settled";
}

interface ApologyVoucher {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  reason: string;
  issuedAt: string;
  expiresAt: string;
  status: "active" | "redeemed";
}

export default function AdminRefundsLedger() {
  const [activeTab, setActiveTab] = useState<"refunds" | "vouchers">("refunds");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [ledger, setLedger] = useState<{
    totalRefundedAmount: number;
    totalVouchersAmount: number;
    refundsCount: number;
    vouchersCount: number;
    refunds: RefundRecord[];
    vouchers: ApologyVoucher[];
  }>({
    totalRefundedAmount: 13600,
    totalVouchersAmount: 1500,
    refundsCount: 2,
    vouchersCount: 1,
    refunds: [],
    vouchers: []
  });

  // Modals state
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");

  // Refund Form State
  const [orderRef, setOrderRef] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [refundAmount, setRefundAmount] = useState<number | string>(3500);
  const [refundReason, setRefundReason] = useState("");
  const [refundChannel, setRefundChannel] = useState<"wallet" | "card_chargeback">("wallet");

  // Voucher Form State
  const [voucherCustomerName, setVoucherCustomerName] = useState("");
  const [voucherCustomerPhone, setVoucherCustomerPhone] = useState("");
  const [voucherAmount, setVoucherAmount] = useState<number>(1500);
  const [voucherReason, setVoucherReason] = useState("Operations Late Delivery Goodwill");

  const fetchLedger = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await apiClient.get("/admin/refunds/ledger");
      if (res.data?.success && res.data?.ledger) {
        setLedger(res.data.ledger);
      }
    } catch (err) {
      console.error("Failed to load refunds ledger:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleIssueRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await apiClient.post("/admin/refunds/issue", {
        orderRef,
        customerName,
        customerPhone,
        amount: Number(refundAmount),
        reason: refundReason,
        channel: refundChannel
      });

      if (res.data?.success) {
        setActionSuccessMsg(res.data.message || "Escrow refund credited to customer wallet!");
        setTimeout(() => {
          setIsRefundModalOpen(false);
          setActionSuccessMsg("");
          // Reset form
          setOrderRef("");
          setCustomerName("");
          setCustomerPhone("");
          setRefundReason("");
          fetchLedger(true);
        }, 1500);
      }
    } catch (err) {
      console.error("Refund failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIssueVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await apiClient.post("/admin/refunds/issue-voucher", {
        customerName: voucherCustomerName,
        customerPhone: voucherCustomerPhone,
        amount: voucherAmount,
        reason: voucherReason
      });

      if (res.data?.success) {
        setActionSuccessMsg(res.data.message || "Apology voucher issued!");
        setTimeout(() => {
          setIsVoucherModalOpen(false);
          setActionSuccessMsg("");
          // Reset form
          setVoucherCustomerName("");
          setVoucherCustomerPhone("");
          fetchLedger(true);
        }, 1500);
      }
    } catch (err) {
      console.error("Voucher failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRefunds = useMemo(() => {
    return ledger.refunds.filter(
      (r) =>
        r.orderRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.customerPhone.includes(searchQuery) ||
        r.reason.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [ledger.refunds, searchQuery]);

  const filteredVouchers = useMemo(() => {
    return ledger.vouchers.filter(
      (v) =>
        v.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.customerPhone.includes(searchQuery) ||
        v.reason.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [ledger.vouchers, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1 text-primary">
            <Wallet size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">
              Dispute Resolution & Escrow Settlement
            </span>
          </div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">
            Customer Refund Ledger & Compensation Vouchers
          </h1>
          <p className="text-sm text-text-secondary">
            1-Click instant escrow returns, card chargeback processing, and branded goodwill apology credits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsRefundModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-sm shadow-md shadow-primary/20 transition active:scale-95"
          >
            <Plus size={16} />
            Issue Instant Refund
          </button>

          <button
            onClick={() => setIsVoucherModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-text-primary hover:bg-secondary/80 rounded-xl font-bold text-sm border border-border transition active:scale-95"
          >
            <Gift size={16} className="text-primary" />
            Issue Apology Voucher
          </button>

          <button
            onClick={() => fetchLedger(true)}
            disabled={refreshing}
            className="p-2.5 bg-secondary text-text-muted hover:text-text-primary rounded-xl border border-border transition active:scale-95"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin text-primary" : ""} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Escrow Refunded</span>
            <Wallet size={18} className="text-primary" />
          </div>
          <div className="text-3xl font-black text-text-primary">
            ₦{ledger.totalRefundedAmount.toLocaleString()}
          </div>
          <p className="text-xs text-emerald-500 font-semibold mt-1">
            {ledger.refundsCount} Disputes Settled
          </p>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Apology Credits</span>
            <Gift size={18} className="text-indigo-500" />
          </div>
          <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
            ₦{ledger.totalVouchersAmount.toLocaleString()}
          </div>
          <p className="text-xs text-text-muted mt-1">{ledger.vouchersCount} Branded Vouchers</p>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Resolution SLA</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">2.8 mins</div>
          <p className="text-xs text-text-muted mt-1">Average Ops Escrow Return</p>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Dispute Channel</span>
            <CreditCard size={18} className="text-text-muted" />
          </div>
          <div className="text-3xl font-black text-text-primary">Wallet 94%</div>
          <p className="text-xs text-text-muted mt-1">6% Direct Card Chargeback</p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Tab Switcher & Search Bar */}
        <div className="p-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-secondary/60 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("refunds")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "refunds"
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Escrow Refunds Ledger ({ledger.refunds.length})
            </button>
            <button
              onClick={() => setActiveTab("vouchers")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "vouchers"
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Apology Vouchers ({ledger.vouchers.length})
            </button>
          </div>

          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3 top-3 text-text-muted" />
            <input
              type="text"
              placeholder={
                activeTab === "refunds"
                  ? "Search by FLW ref, customer, or reason..."
                  : "Search voucher code, customer, or reason..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-secondary/50 border border-border rounded-xl text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Tab 1: Refunds Table */}
        {activeTab === "refunds" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 text-text-muted uppercase font-bold border-b border-border">
                <tr>
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Refund Amount</th>
                  <th className="py-3 px-4">Reason / Dispute</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Officer</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRefunds.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-text-muted">
                      No refund records match your search query.
                    </td>
                  </tr>
                ) : (
                  filteredRefunds.map((ref) => (
                    <tr key={ref.id} className="hover:bg-secondary/20 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-primary">
                        {ref.orderRef}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-text-primary">{ref.customerName}</p>
                        <p className="text-[11px] text-text-muted">{ref.customerPhone}</p>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-sm text-text-primary">
                        ₦{ref.amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs text-text-secondary truncate">
                        {ref.reason}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            ref.channel === "wallet"
                              ? "bg-indigo-500/10 text-indigo-500"
                              : "bg-emerald-500/10 text-emerald-500"
                          }`}
                        >
                          {ref.channel === "wallet" ? "In-App Wallet" : "Card Refund"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-text-muted text-[11px]">{ref.issuedBy}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full font-bold text-[10px]">
                          <CheckCircle2 size={12} /> Settled
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Vouchers Table */}
        {activeTab === "vouchers" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 text-text-muted uppercase font-bold border-b border-border">
                <tr>
                  <th className="py-3 px-4">Voucher Code</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Credit Value</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Expiration</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredVouchers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-text-muted">
                      No apology vouchers found.
                    </td>
                  </tr>
                ) : (
                  filteredVouchers.map((vch) => (
                    <tr key={vch.id} className="hover:bg-secondary/20 transition">
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-black text-xs rounded-lg border border-indigo-500/20">
                          {vch.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-text-primary">{vch.customerName}</p>
                        <p className="text-[11px] text-text-muted">{vch.customerPhone}</p>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-sm text-text-primary">
                        ₦{vch.amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary max-w-xs truncate">
                        {vch.reason}
                      </td>
                      <td className="py-3.5 px-4 text-text-muted text-[11px]">
                        {new Date(vch.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full font-bold text-[10px] uppercase">
                          {vch.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleCopyCode(vch.code)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-secondary hover:bg-secondary/80 rounded-lg text-text-primary text-[11px] font-semibold transition"
                        >
                          <Copy size={12} />
                          {copiedCode === vch.code ? "Copied!" : "Copy"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Issue Instant Escrow Refund */}
      <AnimatePresence>
        {isRefundModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-2xl border border-border shadow-2xl max-w-lg w-full p-6 relative"
            >
              <button
                onClick={() => setIsRefundModalOpen(false)}
                className="absolute right-4 top-4 text-text-muted hover:text-text-primary"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-2 mb-2 text-primary">
                <Wallet size={22} />
                <h3 className="text-lg font-bold text-text-primary">
                  Issue Instant Escrow Refund
                </h3>
              </div>
              <p className="text-xs text-text-secondary mb-4">
                Instantly credit customer's FlowMart wallet or issue payment gateway chargeback without bank wait times.
              </p>

              {actionSuccessMsg ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-500 text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  {actionSuccessMsg}
                </div>
              ) : (
                <form onSubmit={handleIssueRefund} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">
                        Order Reference:
                      </label>
                      <input
                        type="text"
                        placeholder="FLW-83921"
                        value={orderRef}
                        onChange={(e) => setOrderRef(e.target.value)}
                        className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary font-mono focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">
                        Refund Amount (₦):
                      </label>
                      <input
                        type="number"
                        placeholder="3500"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary font-bold focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">
                        Customer Full Name:
                      </label>
                      <input
                        type="text"
                        placeholder="Folake Adebayo"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">
                        Customer Phone:
                      </label>
                      <input
                        type="text"
                        placeholder="+2348028472910"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                      Refund Channel:
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRefundChannel("wallet")}
                        className={`p-3 rounded-xl border text-left flex items-center gap-2 transition ${
                          refundChannel === "wallet"
                            ? "border-primary bg-primary/10 text-primary font-bold"
                            : "border-border text-text-secondary hover:bg-secondary/50"
                        }`}
                      >
                        <Wallet size={16} />
                        <span className="text-xs">In-App Wallet (Instant)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRefundChannel("card_chargeback")}
                        className={`p-3 rounded-xl border text-left flex items-center gap-2 transition ${
                          refundChannel === "card_chargeback"
                            ? "border-primary bg-primary/10 text-primary font-bold"
                            : "border-border text-text-secondary hover:bg-secondary/50"
                        }`}
                      >
                        <CreditCard size={16} />
                        <span className="text-xs">Card Gateway (1-2 Days)</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                      Dispute Reason:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Spilled meal container, kitchen 86'd item, cold delivery"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsRefundModalOpen(false)}
                      className="px-4 py-2 bg-secondary text-text-secondary rounded-xl text-xs font-semibold hover:bg-secondary/80"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition shadow-md shadow-primary/20 disabled:opacity-50"
                    >
                      {isSubmitting ? "Processing..." : "Issue Escrow Refund"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 2: Issue Goodwill Apology Voucher */}
      <AnimatePresence>
        {isVoucherModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-2xl border border-border shadow-2xl max-w-lg w-full p-6 relative"
            >
              <button
                onClick={() => setIsVoucherModalOpen(false)}
                className="absolute right-4 top-4 text-text-muted hover:text-text-primary"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-2 mb-2 text-indigo-500">
                <Gift size={22} />
                <h3 className="text-lg font-bold text-text-primary">
                  Issue Branded Goodwill Voucher
                </h3>
              </div>
              <p className="text-xs text-text-secondary mb-4">
                Generate an instant FlowMart Apology voucher code with predetermined store credit for customer satisfaction recovery.
              </p>

              {actionSuccessMsg ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-500 text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  {actionSuccessMsg}
                </div>
              ) : (
                <form onSubmit={handleIssueVoucher} className="space-y-4">
                  {/* Preset Quick Credit Chips */}
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-2">
                      Select Apology Tier:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Slight Delay", amount: 1500 },
                        { label: "Cold Food", amount: 2500 },
                        { label: "Full Apology", amount: 5000 }
                      ].map((tier) => (
                        <button
                          key={tier.amount}
                          type="button"
                          onClick={() => setVoucherAmount(tier.amount)}
                          className={`p-2.5 rounded-xl border text-center transition ${
                            voucherAmount === tier.amount
                              ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                              : "border-border text-text-secondary hover:bg-secondary/50"
                          }`}
                        >
                          <div className="text-xs font-semibold">{tier.label}</div>
                          <div className="text-sm font-black text-text-primary">
                            ₦{tier.amount.toLocaleString()}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">
                        Customer Name:
                      </label>
                      <input
                        type="text"
                        placeholder="Folake Adebayo"
                        value={voucherCustomerName}
                        onChange={(e) => setVoucherCustomerName(e.target.value)}
                        className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">
                        Customer Phone:
                      </label>
                      <input
                        type="text"
                        placeholder="+2348028472910"
                        value={voucherCustomerPhone}
                        onChange={(e) => setVoucherCustomerPhone(e.target.value)}
                        className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                      Goodwill Reason:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Courier traffic delay apology, missing beverage"
                      value={voucherReason}
                      onChange={(e) => setVoucherReason(e.target.value)}
                      className="w-full p-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsVoucherModalOpen(false)}
                      className="px-4 py-2 bg-secondary text-text-secondary rounded-xl text-xs font-semibold hover:bg-secondary/80"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50"
                    >
                      {isSubmitting ? "Generating..." : `Issue ₦${voucherAmount.toLocaleString()} Voucher`}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="text-center text-xs text-text-muted py-2">
        © 2026 FlowMart Technologies. Operations Dispute & Escrow Ledger V2.
      </div>
    </div>
  );
}
