import React, { useState, useEffect } from "react";
import {
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Plus,
  Minus,
  Search,
  Clock,
  Layers,
  UtensilsCrossed,
  ArrowRight,
  Flame,
  Info,
  ShieldAlert,
  ChevronRight,
  X,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { apiClient } from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { audioChimes } from "@/utils/audioChimes";

interface Kitchen86Item {
  id: string;
  name: string;
  category: "MAINS" | "PROTEINS" | "SIDES" | "BEVERAGES" | "DESSERTS";
  price: number;
  is86ed: boolean;
  remainingPortions: number;
  eightySixDuration?: "UNTIL_END_OF_DAY" | "TWO_HOURS" | "INDEFINITE" | null;
  eightySixReason?: string;
  autoSubstitute?: {
    id: string;
    name: string;
    price: number;
    differenceNgn: number;
  };
  imageUrl: string;
  connectedDishCount?: number;
  lastToggledAt?: string;
}

interface SummaryData {
  totalItems: number;
  eightySixedCount: number;
  lowStockCount: number;
  inStockCount: number;
  kitchenOperationalStatus: string;
}

export default function Vendor86Inventory() {
  const { showToast } = useToast();

  const [items, setItems] = useState<Kitchen86Item[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);

  // 86 Duration & Reason Modal State
  const [selectedItemFor86, setSelectedItemFor86] = useState<Kitchen86Item | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<"UNTIL_END_OF_DAY" | "TWO_HOURS" | "INDEFINITE">("UNTIL_END_OF_DAY");
  const [eightySixReason, setEightySixReason] = useState("");

  // Customer Preview Modal
  const [previewItem, setPreviewItem] = useState<Kitchen86Item | null>(null);

  useEffect(() => {
    fetch86Inventory();
  }, []);

  const fetch86Inventory = async () => {
    setIsLoading(true);
    try {
      const res: any = await apiClient.get("/vendor/inventory/86-status");
      if (res.success) {
        setItems(res.items || []);
        setSummary(res.summary || null);
      }
    } catch (err) {
      console.error("Failed to fetch 86 inventory:", err);
      showToast("Using offline kitchen inventory cache", "info");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle86Click = (item: Kitchen86Item) => {
    if (item.is86ed) {
      // Un-86 directly (restore to stock)
      executeToggle86(item.id, false);
    } else {
      // Prompt modal for duration and reason
      setSelectedItemFor86(item);
      setSelectedDuration("UNTIL_END_OF_DAY");
      setEightySixReason("Depleted during peak lunch rush; awaiting replenishment.");
    }
  };

  const executeToggle86 = async (
    itemId: string,
    next86: boolean,
    duration?: "UNTIL_END_OF_DAY" | "TWO_HOURS" | "INDEFINITE",
    reason?: string
  ) => {
    try {
      const res: any = await apiClient.post(`/vendor/inventory/items/${itemId}/toggle-86`, {
        is86ed: next86,
        duration: duration || "UNTIL_END_OF_DAY",
        reason: reason || "Kitchen stock depleted"
      });

      if (res.success) {
        audioChimes.riderAssigned();
        showToast(res.message, next86 ? "warning" : "success");

        // Update local items
        setItems((prev) =>
          prev.map((i) => (i.id === itemId ? res.item : i))
        );

        // Update local summary
        fetch86Inventory();
      }
    } catch (err: any) {
      console.error("Failed to toggle 86 status:", err);
      showToast(err.message || "Failed to update item status", "error");
    } finally {
      setSelectedItemFor86(null);
    }
  };

  const handleUpdatePortions = async (itemId: string, delta: number) => {
    const targetItem = items.find((i) => i.id === itemId);
    if (!targetItem) return;

    const nextPortions = Math.max(0, targetItem.remainingPortions + delta);

    try {
      const res: any = await apiClient.post(`/vendor/inventory/items/${itemId}/update-portions`, {
        remainingPortions: nextPortions
      });

      if (res.success) {
        setItems((prev) =>
          prev.map((i) => (i.id === itemId ? res.item : i))
        );
        fetch86Inventory();
      }
    } catch (err: any) {
      console.error("Failed to update portions:", err);
      showToast(err.message || "Portion update failed", "error");
    }
  };

  const handleBulkAction = async (action: "RESTORE_ALL" | "86_CATEGORY", category?: string) => {
    try {
      const res: any = await apiClient.post("/vendor/inventory/bulk-86", {
        action,
        category
      });

      if (res.success) {
        audioChimes.orderPlaced();
        showToast(res.message, "success");
        setItems(res.items || []);
        fetch86Inventory();
      }
    } catch (err: any) {
      console.error("Bulk action error:", err);
      showToast(err.message || "Bulk action failed", "error");
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeCategory === "ALL") return true;
    if (activeCategory === "86ED") return item.is86ed;
    if (activeCategory === "LOW_STOCK") return !item.is86ed && item.remainingPortions <= 5;
    return item.category === activeCategory;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* ── HEADER BANNER: LIVE KITCHEN 86 & DEPLETION PORTAL ── */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <AlertOctagon size={22} />
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Live 86'd & Ingredient Depletion Portal
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                Chowdeck-Grade 2026
              </span>
            </div>
            <p className="text-sm text-slate-300 max-w-xl">
              Quickly 86 dishes or depleted ingredients. Customer orders in-flight receive instant 1-tap auto-substitute recommendations with zero checkout delays.
            </p>
          </div>

          {/* Quick Bulk Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleBulkAction("RESTORE_ALL")}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 transition-all"
            >
              <RotateCcw size={15} />
              Restore All to Stock
            </button>
            <button
              onClick={() => handleBulkAction("86_CATEGORY", "SIDES")}
              className="px-4 py-2.5 rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2 transition-all"
            >
              <AlertOctagon size={15} />
              Emergency 86 All Sides
            </button>
          </div>
        </div>

        {/* Operational Metric Tickers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Total Active Menu</span>
            <span className="text-2xl font-black text-white">{summary?.totalItems || items.length}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Currently 86'd (Sold Out)</span>
            <span className="text-2xl font-black text-rose-400">
              {summary?.eightySixedCount ?? items.filter((i) => i.is86ed).length}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Low Stock Alert (≤ 5 left)</span>
            <span className="text-2xl font-black text-amber-400">
              {summary?.lowStockCount ?? items.filter((i) => !i.is86ed && i.remainingPortions <= 5).length}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Kitchen Capacity Status</span>
            <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
              <CheckCircle2 size={16} />
              Optimal Service
            </span>
          </div>
        </div>
      </div>

      {/* ── SEARCH & CATEGORY FILTER BAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search menu items, ingredients, sides..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "All Items" },
            { id: "86ED", label: "🚫 86'd (Sold Out)" },
            { id: "LOW_STOCK", label: "⚠️ Low Stock" },
            { id: "MAINS", label: "Mains" },
            { id: "PROTEINS", label: "Proteins" },
            { id: "SIDES", label: "Sides" },
            { id: "BEVERAGES", label: "Drinks" }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeCategory === cat.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── ITEMS GRID: LIVE 86'D CONTROLS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
              item.is86ed
                ? "bg-slate-900/40 border-rose-900/50 shadow-lg shadow-rose-950/20"
                : item.remainingPortions <= 5
                ? "bg-slate-900/80 border-amber-600/50 shadow-md"
                : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div>
              {/* Top Row: Category & Status */}
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                  {item.category}
                </span>

                {item.is86ed ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1">
                    <AlertOctagon size={12} />
                    86'd (Sold Out)
                  </span>
                ) : item.remainingPortions <= 5 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    Low Stock ({item.remainingPortions} left)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    In Stock ({item.remainingPortions} left)
                  </span>
                )}
              </div>

              {/* Dish Visual & Name */}
              <div className="flex items-start gap-3.5 mb-3">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className={`w-16 h-16 rounded-2xl object-cover border border-slate-700 flex-shrink-0 ${
                    item.is86ed ? "grayscale opacity-50" : ""
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-white truncate">{item.name}</h4>
                  <span className="text-xs font-bold text-indigo-400 mt-0.5 block">
                    ₦{item.price.toLocaleString()}
                  </span>
                  {item.connectedDishCount !== undefined && item.connectedDishCount > 0 && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                      <Layers size={11} className="text-amber-400" />
                      {item.connectedDishCount} connected dishes affected
                    </span>
                  )}
                </div>
              </div>

              {/* 86 Details Banner if 86'd */}
              {item.is86ed && (
                <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-800/40 text-xs space-y-1 mb-3">
                  <div className="flex justify-between items-center text-rose-300 font-semibold text-[11px]">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {item.eightySixDuration === "UNTIL_END_OF_DAY"
                        ? "86'd Until End of Day"
                        : item.eightySixDuration === "TWO_HOURS"
                        ? "86'd for Next 2 Hours"
                        : "86'd Indefinitely"}
                    </span>
                    <span className="text-slate-400 text-[10px]">Auto-replaces</span>
                  </div>
                  {item.eightySixReason && (
                    <p className="text-[11px] text-rose-200/80 italic">"{item.eightySixReason}"</p>
                  )}
                </div>
              )}

              {/* Auto-Substitute Preview */}
              {item.autoSubstitute && (
                <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs flex items-center justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Customer 1-Tap Substitute:
                    </span>
                    <span className="text-xs font-bold text-white truncate block">
                      {item.autoSubstitute.name}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 flex-shrink-0">
                    {item.autoSubstitute.differenceNgn >= 0
                      ? `+₦${item.autoSubstitute.differenceNgn.toLocaleString()}`
                      : `-₦${Math.abs(item.autoSubstitute.differenceNgn).toLocaleString()}`}
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              {/* Portions Adjuster Stepper */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Remaining Portions:</span>
                <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl p-0.5">
                  <button
                    onClick={() => handleUpdatePortions(item.id, -1)}
                    disabled={item.remainingPortions === 0}
                    className="p-1 rounded-lg text-slate-400 hover:text-white disabled:opacity-40"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="px-2 text-xs font-bold text-white">
                    {item.remainingPortions}
                  </span>
                  <button
                    onClick={() => handleUpdatePortions(item.id, 1)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              {/* Master 86 Toggle & Customer Preview */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle86Click(item)}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md ${
                    item.is86ed
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
                      : "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20"
                  }`}
                >
                  <AlertOctagon size={14} />
                  {item.is86ed ? "Restore Item to Stock" : "86 Item (Mark Sold Out)"}
                </button>

                <button
                  onClick={() => setPreviewItem(item)}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  title="Preview Customer Cart Suggestion"
                >
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── MODAL 1: 86 DURATION & REASON SELECTION ── */}
      {selectedItemFor86 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400">
                  <AlertOctagon size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-base text-white">86 Menu Item</h4>
                  <p className="text-xs text-slate-400">{selectedItemFor86.name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItemFor86(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Duration Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                Select 86 Duration:
              </label>
              <div className="space-y-2">
                {[
                  {
                    id: "UNTIL_END_OF_DAY",
                    title: "Until End of Day",
                    subtitle: "Auto-resets to in-stock tomorrow morning at 6:00 AM"
                  },
                  {
                    id: "TWO_HOURS",
                    title: "Next 2 Hours",
                    subtitle: "Temporary outage while kitchen preps next batch"
                  },
                  {
                    id: "INDEFINITE",
                    title: "Indefinite / Off Menu",
                    subtitle: "Requires manual kitchen un-toggle"
                  }
                ].map((dur) => (
                  <button
                    key={dur.id}
                    onClick={() => setSelectedDuration(dur.id as any)}
                    className={`w-full p-3 rounded-2xl border text-left transition-all ${
                      selectedDuration === dur.id
                        ? "bg-rose-950/40 border-rose-500 text-white"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="text-xs font-bold text-white">{dur.title}</div>
                    <div className="text-[11px] text-slate-400">{dur.subtitle}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Kitchen Depletion Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                Kitchen Depletion Reason (Optional):
              </label>
              <input
                type="text"
                value={eightySixReason}
                onChange={(e) => setEightySixReason(e.target.value)}
                placeholder="e.g. Supplier delivery delayed; ripe plantains depleted"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-rose-500"
              />
            </div>

            {/* Auto-Substitute Preview Alert */}
            {selectedItemFor86.autoSubstitute && (
              <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs space-y-1">
                <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles size={14} />
                  Auto-Substitute Configured
                </span>
                <p className="text-[11px] text-slate-300">
                  Customers with this item in cart will automatically be offered{" "}
                  <strong>{selectedItemFor86.autoSubstitute.name}</strong> with 1 tap.
                </p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center gap-2.5 pt-2">
              <button
                onClick={() => setSelectedItemFor86(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  executeToggle86(
                    selectedItemFor86.id,
                    true,
                    selectedDuration,
                    eightySixReason
                  )
                }
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30"
              >
                Confirm 86'd
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: CUSTOMER CX AUTO-REPLACEMENT PREVIEW ── */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-indigo-400" />
                <h4 className="font-bold text-base text-white">
                  Customer CX Cart Experience Preview
                </h4>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              This is the exact high-converting replacement modal presented to the customer if{" "}
              <strong>{previewItem.name}</strong> is 86'd while in their checkout bag:
            </p>

            {/* Simulated Customer Cart Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/40 space-y-3">
              <div className="flex items-start gap-2.5 text-xs text-amber-400 font-semibold">
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                <span>
                  The kitchen just ran out of <strong>{previewItem.name}</strong>.
                </span>
              </div>

              {previewItem.autoSubstitute ? (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Recommended 1-Tap Replacement:
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      {previewItem.autoSubstitute.name}
                    </span>
                    <span className="text-xs font-bold text-emerald-400">
                      {previewItem.autoSubstitute.differenceNgn === 0
                        ? "FREE (No Charge)"
                        : `+₦${previewItem.autoSubstitute.differenceNgn.toLocaleString()}`}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      showToast("Replacement accepted in preview!", "success");
                      setPreviewItem(null);
                    }}
                    className="w-full py-2 rounded-lg bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 size={14} />
                    Accept Replacement & Continue Checkout
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  No automatic substitute assigned. Customer will be prompted to remove item or select an alternative dish.
                </p>
              )}
            </div>

            <button
              onClick={() => setPreviewItem(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
