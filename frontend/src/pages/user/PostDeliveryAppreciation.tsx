import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiClient } from "@/services/api";
import {
  Heart,
  Star,
  Zap,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Sparkles,
  Bike,
  Award,
  ArrowLeft,
  Share2,
  Send,
  MessageSquare,
  Gift,
  Clock,
  ThumbsUp,
  CreditCard,
  Wallet,
  Receipt
} from "lucide-react";

interface TipPreset {
  amountNgn: number;
  label: string;
  icon: string;
  popular?: boolean;
}

interface ChampionBadge {
  id: string;
  label: string;
  icon: string;
  description: string;
}

interface CourierInfo {
  id: string;
  name: string;
  phone: string;
  avatarUrl: string;
  vehicle: string;
  championTier: string;
  rating: number;
  totalDeliveries: number;
  acceptanceRatePct: number;
  currentLevel: string;
}

interface OrderInfo {
  id: string;
  merchantName: string;
  itemsSummary: string;
  totalAmountNgn: number;
  deliveredAt: string;
  deliveryDurationMins: number;
  targetSlaMins: number;
  timeSavedMins: number;
}

export default function PostDeliveryAppreciation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [courier, setCourier] = useState<CourierInfo | null>(null);
  const [tipPresets, setTipPresets] = useState<TipPreset[]>([]);
  const [availableBadges, setAvailableBadges] = useState<ChampionBadge[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedTip, setSelectedTip] = useState<number>(1000); // default to ₦1000
  const [customTip, setCustomTip] = useState<string>("");
  const [selectedBadges, setSelectedBadges] = useState<string[]>(["FAST", "CAREFUL"]);
  const [rating, setRating] = useState<number>(5);
  const [thankYouNote, setThankYouNote] = useState<string>("Lightning fast delivery! Food arrived steaming hot. Thank you Ibrahim!");
  const [paymentMethod, setPaymentMethod] = useState<string>("FLOWMART_WALLET");

  // Submission result state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [riderMessage, setRiderMessage] = useState<string | null>(null);

  const quickNotes = [
    "Food arrived steaming hot! Thank you!",
    "Super fast delivery! Keep shining bro! ⚡",
    "Handled with extreme care, zero spills! 🛡️",
    "Best courier in Lagos! 5 stars all the way! 🌟"
  ];

  useEffect(() => {
    const fetchAppreciationData = async () => {
      try {
        const orderId = id || "ORD-2026-9812";
        const res = await apiClient.get(`/orders/${orderId}/appreciation`);
        if (res.data.success) {
          const d = res.data.data;
          setOrder(d.order);
          setCourier(d.courier);
          setTipPresets(d.tipPresets || []);
          setAvailableBadges(d.availableBadges || []);
          if (d.alreadySubmitted && d.submission) {
            setIsSubmitted(true);
            setReceiptData(d.submission);
          }
        }
      } catch (err) {
        console.error("Failed to load appreciation details", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppreciationData();
  }, [id]);

  // Web Audio celebration chime
  const playCelebratoryChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.12 + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.12);
        osc.stop(audioCtx.currentTime + idx * 0.12 + 0.4);
      });
    } catch (e) {
      // Audio autoplay policy fallback
    }
  };

  const activeTipAmount = customTip !== "" ? Number(customTip) || 0 : selectedTip;

  const handleBadgeToggle = (badgeId: string) => {
    setSelectedBadges((prev) =>
      prev.includes(badgeId) ? prev.filter((b) => b !== badgeId) : [...prev, badgeId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const orderId = id || "ORD-2026-9812";
      const res = await apiClient.post(`/orders/${orderId}/appreciation`, {
        tipAmountNgn: activeTipAmount,
        badges: selectedBadges,
        thankYouNote,
        rating,
        paymentMethod
      });

      if (res.data.success) {
        playCelebratoryChime();
        setIsSubmitted(true);
        setReceiptData(res.data.submission);
        setRiderMessage(res.data.riderThankYouMessage);
      }
    } catch (err: any) {
      alert("Submission failed: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-indigo-400 text-sm font-semibold animate-pulse">
          <Heart className="w-6 h-6 animate-bounce" />
          <span>Loading Courier Champion Appreciation Portal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Orders</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-indigo-400 font-bold">{order?.id}</span>
          </div>
        </div>

        {/* ═══ SUCCESS SUBMITTED STATE ═══ */}
        {isSubmitted ? (
          <div className="rounded-3xl bg-slate-900 border border-emerald-500/30 p-8 text-center space-y-6 shadow-2xl animate-fadeIn">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                Instant Transfer Confirmed
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {receiptData?.tipAmountNgn > 0
                  ? `₦${receiptData.tipAmountNgn.toLocaleString()} Sent to ${courier?.name}!`
                  : `Review Submitted for ${courier?.name}!`}
              </h2>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                100% of your tip has been instantly credited to {courier?.name}'s personal Moniepoint/Opay wallet with zero platform deductions.
              </p>
            </div>

            {/* Rider Thank-You Speech Bubble */}
            {riderMessage && (
              <div className="p-4 rounded-2xl bg-indigo-950/50 border border-indigo-500/40 text-left space-y-2">
                <div className="flex items-center gap-3">
                  <img
                    src={courier?.avatarUrl}
                    alt={courier?.name}
                    className="w-10 h-10 rounded-full object-cover border border-indigo-400"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      {courier?.name}
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300">
                        {courier?.championTier}
                      </span>
                    </h4>
                    <span className="text-[11px] text-indigo-300">Courier Champion Response</span>
                  </div>
                </div>
                <p className="text-xs text-slate-200 italic pl-2 border-l-2 border-indigo-400">
                  {riderMessage}
                </p>
              </div>
            )}

            {/* Receipt Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left font-mono text-xs space-y-2 text-slate-300">
              <div className="flex justify-between text-slate-500 pb-2 border-b border-slate-800">
                <span>RECEIPT #{receiptData?.transactionId || "TIP-2026-9912"}</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Courier Recipient:</span>
                <span className="font-bold text-white">{courier?.name} ({courier?.vehicle})</span>
              </div>
              <div className="flex justify-between">
                <span>Tip Disbursal:</span>
                <span className="font-bold text-emerald-400">₦{(receiptData?.tipAmountNgn || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Rating Awarded:</span>
                <span className="text-amber-400">{"★".repeat(receiptData?.rating || 5)} ({receiptData?.rating || 5}/5)</span>
              </div>
              <div className="flex justify-between">
                <span>Badges Bestowed:</span>
                <span className="text-indigo-300 font-bold">{receiptData?.badges?.join(", ") || "Champion"}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                to="/"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30"
              >
                Return to Home
              </Link>
              <Link
                to="/orders"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all"
              >
                View Order History
              </Link>
            </div>
          </div>
        ) : (
          /* ═══ APPRECIATION FORM ═══ */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Top Spotlight Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-6 md:p-8 shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                <div className="relative">
                  <img
                    src={courier?.avatarUrl}
                    alt={courier?.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-400 shadow-xl"
                  />
                  <div className="absolute -bottom-2 -right-2 p-1.5 rounded-lg bg-indigo-600 text-white shadow">
                    <Bike className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow">
                      {courier?.championTier} ⚡
                    </span>
                    <span className="text-xs text-amber-300 font-bold flex items-center gap-1">
                      ★ {courier?.rating} ({courier?.totalDeliveries}+ deliveries)
                    </span>
                  </div>

                  <h1 className="text-2xl font-black text-white">{courier?.name}</h1>
                  <p className="text-xs text-slate-300">{courier?.vehicle}</p>

                  <div className="pt-2 text-xs text-emerald-400 flex items-center justify-center sm:justify-start gap-1 font-semibold">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Delivered in {order?.deliveryDurationMins}m ({order?.timeSavedMins}m ahead of SLA!)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Star Rating Selector */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3 shadow-lg">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Rate Courier Champion
              </span>
              <div className="flex items-center justify-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating
                          ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                          : "text-slate-700"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400">
                {rating === 5 && "Flawless Delivery! (Apex Champion)"}
                {rating === 4 && "Great Delivery! Very fast"}
                {rating === 3 && "Good Delivery"}
                {rating < 3 && "Needs Improvement"}
              </p>
            </div>

            {/* Quick Tip Chips Selector */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    Add a Courier Champion Tip
                  </h3>
                  <p className="text-xs text-slate-400">
                    100% of your tip goes directly to Ibrahim Musa with zero platform fees.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  ₦{activeTipAmount.toLocaleString()}
                </span>
              </div>

              {/* Tip Preset Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {tipPresets.map((preset) => {
                  const isSelected = selectedTip === preset.amountNgn && customTip === "";
                  return (
                    <button
                      key={preset.amountNgn}
                      type="button"
                      onClick={() => {
                        setSelectedTip(preset.amountNgn);
                        setCustomTip("");
                      }}
                      className={`p-3.5 rounded-xl border text-center transition-all relative ${
                        isSelected
                          ? "bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30 scale-102"
                          : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
                      }`}
                    >
                      {preset.popular && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black uppercase">
                          Popular
                        </span>
                      )}
                      <span className="text-lg block mb-1">{preset.icon}</span>
                      <span className="text-sm font-black block">₦{preset.amountNgn.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-400 block truncate">{preset.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Tip Input */}
              <div className="pt-2">
                <label className="text-[11px] text-slate-400 block mb-1">Or enter custom tip amount (₦)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₦</span>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    placeholder="Enter custom amount"
                    value={customTip}
                    onChange={(e) => setCustomTip(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Praise Badges Grid */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  Bestow Praise Badges
                </h3>
                <span className="text-xs text-slate-400">Select all that apply</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableBadges.map((badge) => {
                  const isSelected = selectedBadges.includes(badge.id);
                  return (
                    <button
                      key={badge.id}
                      type="button"
                      onClick={() => handleBadgeToggle(badge.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "bg-indigo-950/40 border-indigo-500/60 text-white shadow-md shadow-indigo-950/30"
                          : "bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800"
                      }`}
                    >
                      <span className="text-2xl flex-shrink-0">{badge.icon}</span>
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-white block">{badge.label}</span>
                        <span className="text-[11px] text-slate-400 block">{badge.description}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Thank-You Note Prompt */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                Personal Thank-You Note to Ibrahim
              </h3>

              {/* Quick Pills */}
              <div className="flex flex-wrap gap-2">
                {quickNotes.map((phrase, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setThankYouNote(phrase)}
                    className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition-colors text-left"
                  >
                    "{phrase}"
                  </button>
                ))}
              </div>

              <textarea
                rows={2}
                value={thankYouNote}
                onChange={(e) => setThankYouNote(e.target.value)}
                placeholder="Write an encouraging note..."
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Payment Source Selector */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Payment Method
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("FLOWMART_WALLET")}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    paymentMethod === "FLOWMART_WALLET"
                      ? "bg-indigo-600/20 border-indigo-500 text-white"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
                  }`}
                >
                  <Wallet className="w-5 h-5 text-indigo-400" />
                  <div>
                    <span className="font-bold block">FlowMart Wallet</span>
                    <span className="text-[10px] text-slate-400">Instant 1-Click Disbursal</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("DEBIT_CARD")}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    paymentMethod === "DEBIT_CARD"
                      ? "bg-indigo-600/20 border-indigo-500 text-white"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  <div>
                    <span className="font-bold block">Debit Card / Paystack</span>
                    <span className="text-[10px] text-slate-400">Direct Bank Card</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Submit Appreciation Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-sm transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              <Send className={`w-4 h-4 ${isSubmitting ? "animate-spin" : ""}`} />
              <span>
                {isSubmitting
                  ? "Processing Appreciation..."
                  : activeTipAmount > 0
                  ? `Send ₦${activeTipAmount.toLocaleString()} Tip & Praise to ${courier?.name}`
                  : `Send Praise & Badges to ${courier?.name}`}
              </span>
            </button>
          </form>
        )}

        {/* Footer Branding */}
        <div className="text-center py-4 text-xs text-slate-500">
          FlowMart Courier Champion Appreciation • 100% Direct Driver Tips © 2026 FlowMart Inc.
        </div>
      </div>
    </div>
  );
}
