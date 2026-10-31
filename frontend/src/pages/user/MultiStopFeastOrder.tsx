import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiClient } from "@/services/api";
import {
  MapPin,
  Bike,
  Plus,
  CheckCircle2,
  DollarSign,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  ThermometerSnowflake,
  Flame,
  Clock,
  Layers,
  UtensilsCrossed,
  ShoppingBag,
  Award,
  ChevronRight,
  RefreshCw,
  Navigation,
  Compass
} from "lucide-react";

interface SecondaryMerchant {
  merchantId: string;
  name: string;
  category: string;
  distanceFromPrimaryKm: number;
  prepTimeMins: number;
  bundledDeliveryFeeNgn: number;
  bundleSavingsNgn: number;
  rating: number;
  heroImage: string;
  featuredItems: {
    id: string;
    name: string;
    priceNgn: number;
    description: string;
  }[];
}

interface Waypoint {
  stopNumber: number;
  type: string;
  title: string;
  address: string;
  status: "COMPLETED" | "IN_PROGRESS" | "PENDING";
  estimatedArrival: string;
  thermalInstruction: string;
}

interface FeastOrder {
  id: string;
  status: string;
  primaryMerchant: {
    id: string;
    name: string;
    itemsSummary: string;
    subtotalNgn: number;
  };
  secondaryMerchant: {
    id: string;
    name: string;
    itemsSummary: string;
    subtotalNgn: number;
  };
  deliverySummary: {
    customerAddress: string;
    gateOtp: string;
    baseDeliveryFeeNgn: number;
    bundledDiscountNgn: number;
    finalDeliveryFeeNgn: number;
    totalAmountNgn: number;
  };
  courier: {
    id: string;
    name: string;
    phone: string;
    vehicle: string;
    championTier: string;
    rating: number;
    hotBagVerified: boolean;
    coldBoxVerified: boolean;
    currentSpeedKmH: number;
  };
  waypoints: Waypoint[];
  estimatedDeliveryMins: number;
}

export default function MultiStopFeastOrder() {
  const navigate = useNavigate();

  const [primaryMerchant, setPrimaryMerchant] = useState<any>({
    name: "Mega Chicken Victoria Island",
    itemsSummary: "2x Asun Jollof Combo, 4x Peppered Chicken",
    subtotalNgn: 16500
  });

  const [suggestions, setSuggestions] = useState<SecondaryMerchant[]>([]);
  const [selectedSecondary, setSelectedSecondary] = useState<SecondaryMerchant | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [activeOrder, setActiveOrder] = useState<FeastOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOrdering, setIsOrdering] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await apiClient.get("/orders/multi-stop/suggestions");
      if (res.data.success) {
        setSuggestions(res.data.suggestions || []);
        if (res.data.suggestions?.length > 0 && !selectedSecondary) {
          const first = res.data.suggestions[0];
          setSelectedSecondary(first);
          if (first.featuredItems?.length > 0) {
            setSelectedItemIds([first.featuredItems[0].id]);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch suggestions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleItem = (itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const calculateSecondarySubtotal = () => {
    if (!selectedSecondary) return 0;
    return selectedSecondary.featuredItems
      .filter((i) => selectedItemIds.includes(i.id))
      .reduce((acc, i) => acc + i.priceNgn, 0);
  };

  const calculateTotal = () => {
    const primary = primaryMerchant.subtotalNgn;
    const secondary = calculateSecondarySubtotal();
    const fee = selectedSecondary ? selectedSecondary.bundledDeliveryFeeNgn : 1000;
    return primary + secondary + fee;
  };

  const handleConfirmFeastOrder = async () => {
    setIsOrdering(true);
    try {
      const secondaryItemsSummary = selectedSecondary?.featuredItems
        .filter((i) => selectedItemIds.includes(i.id))
        .map((i) => i.name)
        .join(", ");

      const res = await apiClient.post("/orders/multi-stop", {
        primaryItems: primaryMerchant.itemsSummary,
        secondaryMerchantId: selectedSecondary?.merchantId,
        secondaryItems: secondaryItemsSummary || "Gelato Tubs & Chilled Drinks",
        deliveryAddress: "Apt 4B, Admiralty Way, Lekki Phase 1, Lagos"
      });

      if (res.data.success) {
        setActiveOrder(res.data.order);
        setSuccessBanner(res.data.message);
      }
    } catch (err: any) {
      alert("Order failed: " + (err.response?.data?.message || err.message));
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* ═══ TOP BANNER: MULTI-STOP FEAST ROUTER ═══ */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-6 md:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold tracking-wide uppercase">
                <Compass className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                Chowdeck-Grade Multi-Stop Feast Router • FlowMart 2026
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Multi-Stop Feast Courier Routing (Double-Drop)
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                Combine cravings from 2 complementary restaurants into 1 seamless delivery. One Courier Champion picks up both stops. Enjoy piping hot food and sub-zero desserts while saving up to ₦1,500 on delivery fees!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-900/40 border border-indigo-500/40 text-center sm:text-right">
              <span className="text-[11px] text-indigo-300 uppercase tracking-wider font-bold block">
                Bundled Savings
              </span>
              <span className="text-2xl font-black text-emerald-400">
                Save ₦{selectedSecondary?.bundleSavingsNgn.toLocaleString() || "1,400"}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                On Combined Delivery Fee
              </span>
            </div>
          </div>

          {/* Success Banner */}
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

        {/* ═══ LIVE ORDER TRACKER VIEW (WHEN ORDER IS CREATED) ═══ */}
        {activeOrder ? (
          <div className="space-y-6 animate-fadeIn">
            <div className="rounded-3xl bg-slate-900 border border-indigo-500/40 p-6 md:p-8 space-y-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <span className="font-mono text-xs text-indigo-400 font-bold">
                    ORDER #{activeOrder.id}
                  </span>
                  <h2 className="text-xl font-black text-white mt-0.5">
                    Multi-Stop Feast Route Active
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold flex items-center gap-1.5 border border-rose-500/30">
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                    En Route to Stop 2 (Hans & Rene)
                  </span>
                </div>
              </div>

              {/* Courier Champion Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
                    <Bike className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      {activeOrder.courier.name}
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-extrabold">
                        {activeOrder.courier.championTier}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400">{activeOrder.courier.vehicle}</p>
                  </div>
                </div>

                {/* Thermal Compartment Telemetry */}
                <div className="flex items-center gap-4 text-xs">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">Hot Bag</span>
                    <span className="font-bold text-rose-400 flex items-center gap-1">
                      <Flame className="w-3 h-3" /> 64.5°C
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">Cold Box</span>
                    <span className="font-bold text-cyan-400 flex items-center gap-1">
                      <ThermometerSnowflake className="w-3 h-3" /> -2.8°C
                    </span>
                  </div>
                </div>
              </div>

              {/* 3-Waypoint Route Timeline */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-indigo-400" />
                  Optimized Single-Courier Route (3 Sequential Waypoints)
                </h3>

                <div className="space-y-3">
                  {activeOrder.waypoints.map((wp) => (
                    <div
                      key={wp.stopNumber}
                      className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                        wp.status === "COMPLETED"
                          ? "bg-emerald-950/20 border-emerald-500/30 text-slate-400"
                          : wp.status === "IN_PROGRESS"
                          ? "bg-indigo-950/40 border-indigo-500/60 text-white shadow-lg shadow-indigo-950/30"
                          : "bg-slate-950 border-slate-800 text-slate-500"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                          wp.status === "COMPLETED"
                            ? "bg-emerald-500 text-slate-950"
                            : wp.status === "IN_PROGRESS"
                            ? "bg-indigo-600 text-white animate-pulse"
                            : "bg-slate-800 text-slate-500"
                        }`}
                      >
                        {wp.status === "COMPLETED" ? "✓" : wp.stopNumber}
                      </div>

                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-white">{wp.title}</h4>
                          <span className="text-xs font-mono font-semibold text-indigo-300">
                            {wp.estimatedArrival}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{wp.address}</p>
                        <div className="text-[11px] text-emerald-400 font-medium pt-1">
                          🛡️ {wp.thermalInstruction}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery OTP Card */}
              <div className="p-4 rounded-2xl bg-indigo-950/50 border border-indigo-500/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Combined Handover OTP
                  </span>
                  <span className="text-xs text-slate-200">
                    Provide code to Ibrahim upon final delivery
                  </span>
                </div>
                <span className="font-mono text-2xl font-black text-amber-300 tracking-widest bg-slate-950 px-4 py-1.5 rounded-xl border border-amber-400/30">
                  {activeOrder.deliverySummary.gateOtp}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* ═══ FEAST BUILDER WORKSPACE ═══ */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: PRIMARY DISH + SECONDARY MERCHANTS (7 COLS) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Primary Dish Card */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <UtensilsCrossed className="w-4 h-4" /> Stop 1: Primary Main Kitchen
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    In Cart
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{primaryMerchant.name}</h4>
                    <p className="text-xs text-slate-400">{primaryMerchant.itemsSummary}</p>
                  </div>
                  <span className="font-mono text-sm font-black text-white">
                    ₦{primaryMerchant.subtotalNgn.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Secondary Merchant Recommendation Carousel */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Plus className="w-4 h-4 text-emerald-400" />
                    Add Stop 2: Nearby Desserts, Grills & Drinks
                  </h3>
                  <span className="text-xs text-indigo-400">Within 1.5 km Radius</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {suggestions.map((sec) => {
                    const isSelected = selectedSecondary?.merchantId === sec.merchantId;
                    return (
                      <button
                        key={sec.merchantId}
                        onClick={() => {
                          setSelectedSecondary(sec);
                          if (sec.featuredItems?.length > 0) {
                            setSelectedItemIds([sec.featuredItems[0].id]);
                          }
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all relative space-y-2 flex flex-col justify-between ${
                          isSelected
                            ? "bg-indigo-950/50 border-indigo-500 shadow-lg shadow-indigo-950/30 ring-1 ring-indigo-500"
                            : "bg-slate-900 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="space-y-1">
                          <img
                            src={sec.heroImage}
                            alt={sec.name}
                            className="w-full h-20 rounded-xl object-cover"
                          />
                          <h4 className="text-xs font-bold text-white truncate pt-1">{sec.name}</h4>
                          <span className="text-[10px] text-slate-400 block truncate">{sec.category}</span>
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
                          <span className="text-indigo-300 font-bold">{sec.distanceFromPrimaryKm} km away</span>
                          <span className="text-emerald-400 font-bold">+₦{sec.bundledDeliveryFeeNgn} fee</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Secondary Items Selector */}
              {selectedSecondary && (
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-indigo-400" />
                      Select Items from {selectedSecondary.name}
                    </h4>
                    <span className="text-xs text-slate-400">
                      Subtotal: <strong className="text-emerald-400 font-mono">₦{calculateSecondarySubtotal().toLocaleString()}</strong>
                    </span>
                  </div>

                  <div className="space-y-2">
                    {selectedSecondary.featuredItems.map((item) => {
                      const isChecked = selectedItemIds.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleToggleItem(item.id)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                            isChecked
                              ? "bg-indigo-600/20 border-indigo-500/50 text-white"
                              : "bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] ${
                                isChecked
                                  ? "bg-indigo-600 border-indigo-400 text-white"
                                  : "border-slate-600"
                              }`}
                            >
                              {isChecked && "✓"}
                            </span>
                            <div>
                              <span className="font-semibold block">{item.name}</span>
                              <span className="text-[11px] text-slate-400 block">{item.description}</span>
                            </div>
                          </div>

                          <span className="font-mono font-bold text-emerald-400">
                            ₦{item.priceNgn.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: ROUTE PREVIEW & BUNDLE CHECKOUT (5 COLS) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-indigo-400" />
                    Feast Route Simulation
                  </h3>
                  <span className="text-[11px] text-emerald-400 font-bold">1 Single Courier</span>
                </div>

                {/* Route Visualizer */}
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center gap-3 text-slate-300">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-indigo-300 flex items-center justify-center font-bold text-[11px]">
                      1
                    </span>
                    <span>Pickup: <strong>{primaryMerchant.name}</strong></span>
                  </div>
                  <div className="pl-3 border-l-2 border-dashed border-indigo-500/40 ml-3 py-1 text-[11px] text-slate-400">
                    0.8 km transit in hot insulated thermo-bag
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px]">
                      2
                    </span>
                    <span>Pickup: <strong>{selectedSecondary?.name || "Secondary Spot"}</strong></span>
                  </div>
                  <div className="pl-3 border-l-2 border-dashed border-indigo-500/40 ml-3 py-1 text-[11px] text-slate-400">
                    Direct combined run to customer gate (Lekki Phase 1)
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-[11px]">
                      3
                    </span>
                    <span>Dropoff: <strong>Apt 4B, Admiralty Way</strong></span>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Stop 1 Subtotal ({primaryMerchant.name.split(" ")[0]}):</span>
                    <span className="font-mono text-white">₦{primaryMerchant.subtotalNgn.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Stop 2 Subtotal ({selectedSecondary?.name.split(" ")[0] || "Dessert"}):</span>
                    <span className="font-mono text-white">₦{calculateSecondarySubtotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Standard Delivery (2 Separate Couriers):</span>
                    <span className="font-mono line-through text-slate-500">₦2,400</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Bundled Route Delivery Savings:</span>
                    <span className="font-mono">-₦{selectedSecondary?.bundleSavingsNgn.toLocaleString() || "1,400"}</span>
                  </div>
                  <div className="flex justify-between text-slate-300 pt-2 border-t border-slate-800 font-bold">
                    <span>Bundled Delivery Fee:</span>
                    <span className="font-mono text-indigo-300">
                      ₦{selectedSecondary?.bundledDeliveryFeeNgn.toLocaleString() || "1,000"}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-800">
                    <span>Total Feast Bill:</span>
                    <span className="font-mono text-emerald-400">₦{calculateTotal().toLocaleString()}</span>
                  </div>
                </div>

                {/* Confirm Feast Order Button */}
                <button
                  onClick={handleConfirmFeastOrder}
                  disabled={isOrdering || selectedItemIds.length === 0}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-sm transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                >
                  <Zap className={`w-4 h-4 ${isOrdering ? "animate-spin" : ""}`} />
                  <span>
                    {isOrdering
                      ? "Dispatching Courier Route..."
                      : `Confirm Multi-Stop Feast Delivery (₦${calculateTotal().toLocaleString()})`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-4 border-t border-slate-800/60 text-xs text-slate-500">
          FlowMart Multi-Stop Feast Courier Routing • Chowdeck-Grade Architecture © 2026 FlowMart Inc.
        </div>
      </div>
    </div>
  );
}
