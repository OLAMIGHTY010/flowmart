import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  Heart, 
  ShieldCheck, 
  ShoppingBag, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  ExternalLink, 
  Copy, 
  Check, 
  ArrowRight,
  UserCheck,
  AlertCircle
} from "lucide-react";
import axios from "axios";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: string | number;
}

interface PayForMeOrder {
  id: string;
  orderRef: string;
  buyerName: string;
  totalAmount: string | number;
  status: string;
  deliveryZone?: string;
  items: OrderItem[];
  createdAt: string;
}

export default function PayForMe() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<PayForMeOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sponsor form
  const [payerName, setPayerName] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`/api/v1/orders/${id}/pay-for-me`);
        if (res.data?.success && res.data?.order) {
          setOrder(res.data.order);
        } else {
          setError(res.data?.message || "Order not found or link has expired");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Unable to load order details. Please verify link.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payerEmail || !payerEmail.includes("@")) {
      alert("Please enter a valid email address to receive your payment receipt.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await axios.post(`/api/v1/orders/${id}/pay-for-me/initialize`, {
        payerEmail: payerEmail.trim(),
        payerName: payerName.trim() || undefined,
      });

      if (res.data?.success && res.data?.authorizationUrl) {
        // Redirect to Paystack Secure Checkout
        window.location.href = res.data.authorizationUrl;
      } else {
        alert(res.data?.message || "Failed to initialize payment gateway.");
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to connect to checkout gateway. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedAmount = order 
    ? new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(order.totalAmount))
    : "";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-['Plus_Jakarta_Sans',sans-serif] text-slate-800 dark:text-slate-100 flex flex-col justify-between">
      {/* Brand Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-black bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent">
              FlowMart
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
              Pay For Me
            </span>
          </Link>

          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-bold">Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Share Link</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-500">Retrieving order details...</p>
          </div>
        ) : error || !order ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center max-w-md mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-500 mx-auto flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-2">Order Not Available</h2>
            <p className="text-sm text-slate-500 mb-6">{error || "This payment link might have expired or is invalid."}</p>
            <Link
              to="/"
              className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition"
            >
              Explore FlowMart
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Hero Sponsor Banner */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-600/10">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold mb-3 border border-white/20">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Social Checkout Sponsor</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Treat {order.buyerName} to this meal!
                  </h1>
                  <p className="text-indigo-100 text-sm mt-1 max-w-lg">
                    {order.buyerName} placed an order on FlowMart and requested a friend or loved one to sponsor it.
                  </p>
                </div>

                <div className="sm:text-right bg-white/10 sm:bg-transparent p-4 sm:p-0 rounded-2xl border border-white/10 sm:border-0 backdrop-blur-sm sm:backdrop-blur-none">
                  <div className="text-xs uppercase font-bold text-indigo-200 tracking-wider">Bill Total</div>
                  <div className="text-3xl sm:text-4xl font-black mt-0.5 tracking-tight text-white">
                    {formattedAmount}
                  </div>
                  <div className="text-xs text-indigo-200/80 mt-1">Ref: {order.orderRef}</div>
                </div>
              </div>
            </div>

            {/* If Order is already paid */}
            {order.status !== "pending" ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-3xl p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
                  Order Already Settled!
                </h3>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 max-w-md mx-auto">
                  This order has already been marked as <strong>{order.status}</strong>. Thank you for your goodwill!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Items Breakdown */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-bold text-slate-900 dark:text-slate-100">Order Summary</h3>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {order.items.length} {order.items.length === 1 ? "item" : "items"}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {order.items.map((item) => (
                      <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100 shrink-0">
                          ₦{(Number(item.price) * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Escrow & Dispatch Protection Note */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-start gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl text-xs text-slate-600 dark:text-slate-300">
                    <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold text-slate-900 dark:text-slate-100">Protected by FlowMart Escrow:</strong>
                      <p className="mt-0.5 text-slate-500 dark:text-slate-400 leading-relaxed">
                        Your payment is held safely until the courier brings {order.buyerName}&apos;s order to their doorstep with a 4-digit security PIN verification.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Sponsor Payment Form */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                  <form onSubmit={handlePayNow} className="space-y-4">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                        Sponsor this Bill
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Enter your details to receive payment proof & confirmation.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Your Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Big Sis Joy"
                        value={payerName}
                        onChange={(e) => setPayerName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Your Email (For Paystack Receipt) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="sponsor@example.com"
                        value={payerEmail}
                        onChange={(e) => setPayerEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Connecting Paystack...</span>
                        </>
                      ) : (
                        <>
                          <Heart className="w-4 h-4 fill-white" />
                          <span>Pay {formattedAmount}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>256-Bit SSL Encrypted by Paystack</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
        &copy; 2026 FlowMart. All rights reserved.
      </footer>
    </div>
  );
}
