import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  Share2, 
  Copy, 
  Check, 
  Sparkles, 
  Wallet, 
  CreditCard, 
  Zap, 
  ArrowRight, 
  ExternalLink, 
  Utensils, 
  MapPin, 
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  PartyPopper
} from "lucide-react";
import { apiClient } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/contexts/ToastContext";
import { audioChimes } from "@/utils/audioChimes";

interface SplitParticipant {
  id: string;
  name: string;
  emailOrPhone?: string;
  targetAmount: number;
  paidAmount: number;
  isPaid: boolean;
  isHost: boolean;
  paidAt?: string;
  paymentMethod?: string;
}

interface SplitSession {
  code: string;
  orderId?: string;
  orderRef: string;
  restaurantName: string;
  deliveryAddress: string;
  totalAmount: number;
  totalPaid: number;
  remainingBalance: number;
  progressPct: number;
  hostName: string;
  status: "PENDING_PAYMENTS" | "FULLY_FUNDED" | "EXPIRED";
  expiresAt: string;
  participants: SplitParticipant[];
  items: Array<{ id: string; name: string; quantity: number; price: number }>;
}

export default function SplitBill() {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [session, setSession] = useState<SplitSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<SplitParticipant | null>(null);
  const [payMethod, setPayMethod] = useState<"wallet" | "paystack">("wallet");
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(600);

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 5000); // Polling every 5s for live group funding
    return () => clearInterval(interval);
  }, [code]);

  useEffect(() => {
    if (session?.status === "FULLY_FUNDED" && !hasCelebrated) {
      setHasCelebrated(true);
      try {
        audioChimes.orderPlaced();
      } catch (e) {
        console.warn("Audio chime failed", e);
      }
    }
  }, [session?.status, hasCelebrated]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchSession = async () => {
    try {
      const res = await apiClient.get(`/orders/split-bill/${code || "SPLIT-DEMO-2026"}`);
      if (res.data?.success) {
        setSession(res.data.session);
        if (res.data.secondsRemaining) {
          setSecondsRemaining(res.data.secondsRemaining);
        }
      }
    } catch (err: any) {
      console.warn("Using fallback demo split session:", err.message);
      setSession({
        code: code || "SPLIT-DEMO-2026",
        orderRef: "#FM-89240",
        restaurantName: "Mama's Kitchen Bistro • Lekki",
        deliveryAddress: "Plot 14 Admiralty Way, Lekki Phase 1, Lagos",
        totalAmount: 24000,
        totalPaid: 18000,
        remainingBalance: 6000,
        progressPct: 75,
        hostName: "Chioma Adeleke",
        status: "PENDING_PAYMENTS",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        items: [
          { id: "1", name: "Party Jollof Rice & Grilled Chicken (x3)", quantity: 3, price: 10500 },
          { id: "2", name: "Slow-Cooked Seafood Okro & Pounded Yam (x1)", quantity: 1, price: 6500 },
          { id: "3", name: "Crispy Peppered Turkey Wings (x2)", quantity: 2, price: 5000 },
          { id: "4", name: "Chilled Chapman & Fresh Zobo Bottles (x4)", quantity: 4, price: 2000 }
        ],
        participants: [
          { id: "p-1", name: "Chioma Adeleke (Host)", targetAmount: 6000, paidAmount: 6000, isPaid: true, isHost: true, paidAt: "Just now", paymentMethod: "FlowMart Wallet" },
          { id: "p-2", name: "Tunde Bakare", targetAmount: 6000, paidAmount: 6000, isPaid: true, isHost: false, paidAt: "3 mins ago", paymentMethod: "Paystack Card" },
          { id: "p-3", name: "Amina Yusuf", targetAmount: 6000, paidAmount: 6000, isPaid: true, isHost: false, paidAt: "1 min ago", paymentMethod: "Direct Bank Transfer" },
          { id: "p-4", name: "Femi Otedola", targetAmount: 6000, paidAmount: 0, isPaid: false, isHost: false }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    showToast("Split Bill link copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2500);
  };

  const openWhatsApp = () => {
    if (!session) return;
    const url = window.location.href;
    const shareAmount = session.participants[0]?.targetAmount || 6000;
    const text = encodeURIComponent(`Hey! 🍽️ ${session.hostName} invited you to split the food bill for ${session.restaurantName}. Your share is ₦${shareAmount.toLocaleString()}. Pay securely here so the kitchen can dispatch: ${url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleContributeSubmit = async () => {
    if (!selectedParticipant || !session) return;
    try {
      setIsSubmitting(true);
      const res = await apiClient.post(`/orders/split-bill/${session.code}/contribute`, {
        participantId: selectedParticipant.id,
        paymentMethod: payMethod,
        amount: selectedParticipant.targetAmount
      });

      if (res.data?.success) {
        showToast(`Payment of ₦${selectedParticipant.targetAmount.toLocaleString()} recorded!`, "success");
        setIsPayModalOpen(false);
        fetchSession();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Payment contribution failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCoverRemaining = async () => {
    if (!session) return;
    if (!window.confirm(`Cover remaining ₦${session.remainingBalance.toLocaleString()} to dispatch the order immediately?`)) return;

    try {
      setIsSubmitting(true);
      const res = await apiClient.post(`/orders/split-bill/${session.code}/cover-remaining`);
      if (res.data?.success) {
        showToast("Remaining balance covered! Kitchen order is now released.", "success");
        fetchSession();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to cover remaining balance", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (loading && !session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto animate-bounce">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-sm font-black text-slate-700">Loading Live Split Session...</p>
        </div>
      </div>
    );
  }

  const isFunded = session?.status === "FULLY_FUNDED" || session?.remainingBalance === 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-body">
      {/* ═══ TOP NAVBAR ═══ */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 font-black text-sm">
            FM
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-slate-900 tracking-tight">Split the Bill • Group Order</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                2026 Live Multi-Payer
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Order Ref: {session?.orderRef} • Hosted by {session?.hostName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Time Left: {formatTimer(secondsRemaining)}</span>
          </div>
          <button
            onClick={openWhatsApp}
            className="inline-flex items-center gap-1.5 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl transition shadow-sm cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" /> Invite via WhatsApp
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {/* ═══ CELEBRATION BANNER (WHEN 100% FUNDED) ═══ */}
        {isFunded && (
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-4 animate-in zoom-in-95 duration-200 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <PartyPopper className="w-7 h-7 text-amber-300" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full border border-white/30">
                  🎉 100% FUNDED & PAID
                </span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
                  Order Dispatched to Kitchen!
                </h2>
              </div>
            </div>

            <p className="text-xs text-emerald-100 font-medium max-w-xl">
              All participant shares have been successfully collected! {session?.restaurantName} has received the ticket on their Kitchen Display System (KDS) and cooking has begun.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to={`/orders/track/${session?.orderId || "FM-89240"}`}
                className="bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-black px-5 py-3 rounded-xl shadow-md transition inline-flex items-center gap-2"
              >
                Track Live Courier Delivery <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={copyShareLink}
                className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-3 rounded-xl border border-white/20 backdrop-blur-sm transition inline-flex items-center gap-2"
              >
                <Copy className="w-3.5 h-3.5" /> Share Tracking Link
              </button>
            </div>
          </div>
        )}

        {/* ═══ LIVE FUNDING PROGRESS CARD (HERO) ═══ */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Group Bill</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-4xl font-black text-slate-900">
                  ₦{(session?.totalAmount || 24000).toLocaleString()}
                </span>
                <span className="text-xs font-bold text-slate-500">NGN Total</span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Remaining to Fund</span>
              <div className="text-2xl font-black text-amber-600 mt-0.5">
                ₦{(session?.remainingBalance || 0).toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {isFunded ? "All paid" : "Kitchen unlocks when 100% funded"}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-indigo-600 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> ₦{(session?.totalPaid || 0).toLocaleString()} Collected
              </span>
              <span className="text-slate-700">{session?.progressPct || 0}% Funded</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${isFunded ? "bg-emerald-500" : "bg-indigo-600"}`}
                style={{ width: `${session?.progressPct || 0}%` }}
              />
            </div>
          </div>

          {/* Quick Share Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-500 font-medium truncate max-w-xs sm:max-w-md">
                https://flowmart.ng/split/{session?.code}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyShareLink}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold px-3 py-1.5 rounded-xl border border-slate-200 transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <button
                onClick={openWhatsApp}
                className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-xl border border-emerald-200 transition cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" /> WhatsApp
              </button>
            </div>
          </div>
        </div>

        {/* ═══ PARTICIPANTS CONTRIBUTION GRID ═══ */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">Friends & Contributor Shares</h3>
              <p className="text-xs text-slate-500 font-medium">
                Click "Pay Share" on your name to contribute via FlowMart Wallet or Card.
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              {session?.participants.filter(p => p.isPaid).length} of {session?.participants.length} Paid
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {(session?.participants || []).map((p) => (
              <div 
                key={p.id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  p.isPaid 
                    ? "bg-emerald-50/50 border-emerald-200" 
                    : "bg-slate-50 border-slate-200 hover:border-indigo-300"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 ${
                    p.isPaid ? "bg-emerald-600 text-white" : "bg-indigo-100 text-indigo-700"
                  }`}>
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 truncate">{p.name}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Share: ₦{p.targetAmount.toLocaleString()}
                    </p>
                    {p.isPaid && (
                      <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                        ✓ Paid via {p.paymentMethod || "Wallet"}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  {p.isPaid ? (
                    <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Paid
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedParticipant(p);
                        setIsPayModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl shadow-sm transition cursor-pointer"
                    >
                      Pay ₦{p.targetAmount.toLocaleString()}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Host Unlock Action */}
          {!isFunded && (session?.remainingBalance || 0) > 0 && (
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/60 p-4 rounded-2xl">
              <div>
                <p className="text-xs font-black text-indigo-950">Host Quick Action: Don't want to wait?</p>
                <p className="text-[11px] text-indigo-700 font-medium">
                  Cover the remaining ₦{(session?.remainingBalance || 0).toLocaleString()} to unlock kitchen dispatch immediately.
                </p>
              </div>
              <button
                onClick={handleCoverRemaining}
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md transition cursor-pointer flex-shrink-0"
              >
                {isSubmitting ? "Processing..." : `⚡ Cover ₦${(session?.remainingBalance || 0).toLocaleString()} & Release`}
              </button>
            </div>
          )}
        </div>

        {/* ═══ ORDER SUMMARY TRAY ═══ */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-black text-slate-900">{session?.restaurantName}</h3>
            </div>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" /> {session?.deliveryAddress}
            </span>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl p-2 text-xs">
            {(session?.items || []).map((item) => (
              <div key={item.id} className="py-2.5 px-3 flex justify-between items-center">
                <span className="font-semibold text-slate-800">{item.name}</span>
                <span className="font-black text-slate-900">₦{item.price.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* ═══ CONTRIBUTION PAYMENT MODAL ═══ */}
      {isPayModalOpen && selectedParticipant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Pay Your Share</h3>
                <p className="text-xs text-slate-500">Contributing as: {selectedParticipant.name}</p>
              </div>
              <button onClick={() => setIsPayModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-xs text-slate-500 font-medium">Assigned Share Amount</span>
              <div className="text-3xl font-black text-indigo-600">
                ₦{selectedParticipant.targetAmount.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">For {session?.restaurantName} group meal</p>
            </div>

            {/* Payment Options */}
            <div className="space-y-2 text-xs">
              <label 
                onClick={() => setPayMethod("wallet")}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                  payMethod === "wallet" ? "bg-indigo-50 border-indigo-400 ring-1 ring-indigo-400" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Wallet className="w-4 h-4 text-indigo-600" />
                  <div>
                    <div className="font-bold text-slate-900">FlowMart In-App Wallet</div>
                    <div className="text-[11px] text-slate-500">Instant 1-Tap payment</div>
                  </div>
                </div>
                <input type="radio" checked={payMethod === "wallet"} readOnly className="accent-indigo-600" />
              </label>

              <label 
                onClick={() => setPayMethod("paystack")}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                  payMethod === "paystack" ? "bg-indigo-50 border-indigo-400 ring-1 ring-indigo-400" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="font-bold text-slate-900">Debit Card / Paystack</div>
                    <div className="text-[11px] text-slate-500">Pay securely via Mastercard / Visa / Verve</div>
                  </div>
                </div>
                <input type="radio" checked={payMethod === "paystack"} readOnly className="accent-indigo-600" />
              </label>
            </div>

            <button
              onClick={handleContributeSubmit}
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs py-3.5 rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-white" />
              {isSubmitting ? "Authorizing Payment..." : `Confirm Payment of ₦${selectedParticipant.targetAmount.toLocaleString()}`}
            </button>
          </div>
        </div>
      )}

      {/* ═══ FOOTER ═══ */}
      <footer className="max-w-4xl mx-auto px-6 pt-12 text-center text-xs text-slate-400">
        <p>© 2026 FlowMart Logistics Technologies Nigeria Ltd. All rights reserved.</p>
        <p className="mt-1">Licensed group payments secured with 256-bit bank-grade encryption.</p>
      </footer>
    </div>
  );
}
