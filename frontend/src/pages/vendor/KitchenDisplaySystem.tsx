import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  UtensilsCrossed,
  Clock,
  Bell,
  BellOff,
  CheckCircle2,
  AlertTriangle,
  Bike,
  Plus,
  RefreshCw,
  Maximize2,
  ArrowLeft,
  ChevronRight,
  Flame,
  Volume2,
  VolumeX,
  Sparkles,
  Phone
} from "lucide-react";
import { apiClient } from "@/services/api";

interface KdsItem {
  id: string;
  name: string;
  quantity: number;
  modifiers?: string[];
  isCompleted: boolean;
}

interface KdsTicket {
  id: string;
  orderNumber: string;
  customerName: string;
  channel: "delivery" | "pickup";
  orderType: "express" | "scheduled";
  status: "new" | "cooking" | "ready" | "dispatched";
  createdAt: string;
  prepMinutes: number;
  targetReadyTime: string;
  delayMinutes: number;
  specialInstructions?: string;
  items: KdsItem[];
  courier?: {
    name: string;
    phone: string;
    etaMinutes: number;
  };
}

export default function KitchenDisplaySystem() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<KdsTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "new" | "cooking" | "ready">("all");
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [toastMessage, setToastMessage] = useState("");

  // Web Audio Kitchen Buzzer
  const playKitchenTone = (type: "new_order" | "ready" | "urgent") => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === "new_order") {
        // Double ding bell
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1046, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === "ready") {
        // Uplifting single chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        // Urgent warning buzzer
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch {
      // Audio context requires gesture
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await apiClient.get("/vendor/kds/tickets");
      if (res.data?.success && res.data?.tickets) {
        setTickets(res.data.tickets);
      }
    } catch (err) {
      console.error("Failed to load KDS tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      fetchTickets();
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  // Clock ticker
  useEffect(() => {
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // 1. Status Transition
  const handleUpdateStatus = async (ticketId: string, status: "cooking" | "ready" | "dispatched") => {
    try {
      const res = await apiClient.post(`/vendor/kds/tickets/${ticketId}/status`, { status });
      if (res.data?.success) {
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, status } : t))
        );
        if (status === "cooking") {
          playKitchenTone("new_order");
          showToast(`Order marked Cooking & Timer Started`);
        } else if (status === "ready") {
          playKitchenTone("ready");
          showToast(`Order Ready! Courier Alerted for Pickup.`);
        } else {
          showToast(`Order Handed Over to Courier`);
        }
      }
    } catch {
      // Fallback local update
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status } : t))
      );
    }
  };

  // 2. Add Prep Delay
  const handleAddDelay = async (ticketId: string, additionalMinutes: number) => {
    try {
      const res = await apiClient.post(`/vendor/kds/tickets/${ticketId}/delay`, { additionalMinutes });
      if (res.data?.success) {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  prepMinutes: t.prepMinutes + additionalMinutes,
                  delayMinutes: t.delayMinutes + additionalMinutes,
                  targetReadyTime: new Date(
                    new Date(t.targetReadyTime).getTime() + additionalMinutes * 60 * 1000
                  ).toISOString(),
                }
              : t
          )
        );
        playKitchenTone("urgent");
        showToast(`+${additionalMinutes} mins added to kitchen timer`);
      }
    } catch {
      // Local fallback
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? { ...t, prepMinutes: t.prepMinutes + additionalMinutes }
            : t
        )
      );
    }
  };

  // 3. Item Prep Checklist Toggle
  const handleToggleItem = async (ticketId: string, itemId: string) => {
    try {
      const res = await apiClient.post(`/vendor/kds/tickets/${ticketId}/item-toggle`, { itemId });
      if (res.data?.success) {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  status: res.data.allDone && t.status === "cooking" ? "ready" : t.status,
                  items: t.items.map((i) =>
                    i.id === itemId ? { ...i, isCompleted: !i.isCompleted } : i
                  ),
                }
              : t
          )
        );
        if (res.data.allDone) {
          playKitchenTone("ready");
          showToast(`All items prepped! Order is Ready for Pickup.`);
        }
      }
    } catch {
      // Local fallback
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                items: t.items.map((i) =>
                  i.id === itemId ? { ...i, isCompleted: !i.isCompleted } : i
                ),
              }
            : t
        )
      );
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const filteredTickets = tickets.filter((t) => {
    if (activeFilter === "all") return t.status !== "dispatched";
    return t.status === activeFilter;
  });

  // Calculate timer countdown string and color
  const getTimerInfo = (targetReadyTime: string, status: string) => {
    if (status === "ready") {
      return { text: "READY FOR PICKUP", color: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30" };
    }
    const diffMs = new Date(targetReadyTime).getTime() - currentTime.getTime();
    const diffSec = Math.round(diffMs / 1000);

    if (diffSec <= 0) {
      const overdueMins = Math.abs(Math.floor(diffSec / 60));
      return { text: `OVERDUE -${overdueMins}m`, color: "text-rose-400 bg-rose-500/20 border-rose-500/30 animate-pulse" };
    }

    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    const timeStr = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

    if (mins < 5) {
      return { text: `⏳ ${timeStr} left`, color: "text-amber-300 bg-amber-500/20 border-amber-500/30" };
    }
    return { text: `⏱️ ${timeStr} left`, color: "text-indigo-300 bg-indigo-500/20 border-indigo-500/30" };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none">
      {/* ═══ KDS TOP BAR ═══ */}
      <header className="bg-slate-900 border-b border-white/10 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-40 shadow-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/vendor/dashboard")}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft size={16} /> Exit KDS
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <UtensilsCrossed size={18} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                Kitchen Display System (KDS)
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold border border-indigo-500/30">
                  LIVE COUNTER
                </span>
              </h1>
              <p className="text-xs text-white/60">Mama Put Delights • Active Station</p>
            </div>
          </div>
        </div>

        {/* Filter Pills & Alarm Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
            {(["all", "new", "cooking", "ready"] as const).map((filter) => {
              const count =
                filter === "all"
                  ? tickets.filter((t) => t.status !== "dispatched").length
                  : tickets.filter((t) => t.status === filter).length;
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition uppercase tracking-wider ${
                    activeFilter === filter
                      ? "bg-indigo-600 text-white shadow"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {filter} ({count})
                </button>
              );
            })}
          </div>

          {/* Audio Buzzer Toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2.5 rounded-xl border transition flex items-center gap-1.5 text-xs font-bold ${
              isMuted
                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            }`}
            title="Audio Alarm Buzzer"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span className="hidden sm:inline">{isMuted ? "Alarm Muted" : "Audio Active"}</span>
          </button>

          {/* Clock */}
          <div className="px-3 py-2 bg-black/40 border border-white/10 rounded-xl font-mono text-xs font-bold text-indigo-300 flex items-center gap-1.5">
            <Clock size={14} />
            <span>{currentTime.toLocaleTimeString()} WAT</span>
          </div>
        </div>
      </header>

      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-2xl shadow-2xl border border-indigo-400 flex items-center gap-2"
          >
            <Sparkles size={16} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ KDS TICKETS GRID ═══ */}
      <main className="flex-1 p-6 overflow-y-auto">
        {filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-white/50 space-y-3">
            <CheckCircle2 size={48} className="text-emerald-500/60" />
            <h3 className="text-xl font-bold text-white">All Kitchen Orders Cleared!</h3>
            <p className="text-xs text-white/50">New incoming orders will chime automatically.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTickets.map((ticket) => {
              const timerInfo = getTimerInfo(ticket.targetReadyTime, ticket.status);
              const allChecked = ticket.items.every((i) => i.isCompleted);

              return (
                <motion.div
                  key={ticket.id}
                  layout
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className={`rounded-3xl border-2 flex flex-col justify-between overflow-hidden shadow-2xl transition-all ${
                    ticket.status === "new"
                      ? "bg-slate-900 border-amber-500/60 ring-2 ring-amber-500/20"
                      : ticket.status === "cooking"
                      ? "bg-slate-900 border-indigo-500/50"
                      : "bg-slate-900 border-emerald-500/60 ring-2 ring-emerald-500/20"
                  }`}
                >
                  {/* Ticket Header */}
                  <div>
                    <div
                      className={`p-4 border-b flex items-start justify-between gap-2 ${
                        ticket.status === "new"
                          ? "bg-amber-500/15 border-amber-500/30"
                          : ticket.status === "cooking"
                          ? "bg-indigo-600/20 border-indigo-500/30"
                          : "bg-emerald-500/15 border-emerald-500/30"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xl text-white">
                            {ticket.orderNumber}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              ticket.status === "new"
                                ? "bg-amber-500 text-black"
                                : ticket.status === "cooking"
                                ? "bg-indigo-600 text-white"
                                : "bg-emerald-600 text-white"
                            }`}
                          >
                            {ticket.status}
                          </span>
                        </div>
                        <p className="text-xs text-white/80 font-semibold mt-0.5">
                          {ticket.customerName} • {ticket.channel.toUpperCase()}
                        </p>
                      </div>

                      {/* Timer Badge */}
                      <span
                        className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold border ${timerInfo.color}`}
                      >
                        {timerInfo.text}
                      </span>
                    </div>

                    {/* Special Instructions Alert */}
                    {ticket.specialInstructions && (
                      <div className="m-3 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs font-medium flex items-start gap-1.5">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                        <span>Note: {ticket.specialInstructions}</span>
                      </div>
                    )}

                    {/* Itemized Food Checklist */}
                    <div className="p-4 space-y-2">
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">
                        Plate Prep Checklist (Tap to Cross Off):
                      </p>

                      {ticket.items.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleToggleItem(ticket.id, item.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                            item.isCompleted
                              ? "bg-white/5 border-emerald-500/40 opacity-70"
                              : "bg-white/10 border-white/10 hover:border-indigo-400 hover:bg-white/15"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span
                              className={`w-6 h-6 rounded-lg font-mono font-black text-xs flex items-center justify-center shrink-0 ${
                                item.isCompleted
                                  ? "bg-emerald-500 text-white"
                                  : "bg-indigo-600 text-white"
                              }`}
                            >
                              {item.quantity}x
                            </span>

                            <div>
                              <p
                                className={`text-sm font-bold leading-tight ${
                                  item.isCompleted
                                    ? "line-through text-white/50"
                                    : "text-white"
                                }`}
                              >
                                {item.name}
                              </p>

                              {item.modifiers && item.modifiers.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.modifiers.map((mod, i) => (
                                    <span
                                      key={i}
                                      className="px-1.5 py-0.5 bg-white/10 text-indigo-300 rounded text-[10px] font-medium"
                                    >
                                      {mod}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 pt-0.5">
                            <CheckCircle2
                              size={18}
                              className={
                                item.isCompleted ? "text-emerald-400" : "text-white/20"
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Courier Status Strip */}
                  {ticket.courier && (
                    <div className="mx-4 mb-3 p-2.5 bg-black/40 border border-white/10 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Bike size={16} className="text-primary" />
                        <div>
                          <p className="font-bold text-white">{ticket.courier.name}</p>
                          <p className="text-[10px] text-white/60">ETA ~{ticket.courier.etaMinutes} mins away</p>
                        </div>
                      </div>
                      <a
                        href={`tel:${ticket.courier.phone}`}
                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-primary transition"
                      >
                        <Phone size={14} />
                      </a>
                    </div>
                  )}

                  {/* Bottom Action Strip */}
                  <div className="p-4 border-t border-white/10 bg-black/20 space-y-2">
                    {ticket.status === "new" ? (
                      <button
                        onClick={() => handleUpdateStatus(ticket.id, "cooking")}
                        className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-black font-black text-sm rounded-xl transition shadow-lg shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider"
                      >
                        <Flame size={18} className="fill-black" />
                        Start Prepping & Cooking
                      </button>
                    ) : ticket.status === "cooking" ? (
                      <div className="space-y-2">
                        {/* Prep Delay Incrementors */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-white/60">Delay:</span>
                          <button
                            onClick={() => handleAddDelay(ticket.id, 5)}
                            className="flex-1 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold transition"
                          >
                            +5m
                          </button>
                          <button
                            onClick={() => handleAddDelay(ticket.id, 10)}
                            className="flex-1 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold transition"
                          >
                            +10m
                          </button>
                          <button
                            onClick={() => handleAddDelay(ticket.id, 15)}
                            className="flex-1 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold transition"
                          >
                            +15m
                          </button>
                        </div>

                        <button
                          onClick={() => handleUpdateStatus(ticket.id, "ready")}
                          className={`w-full py-3 rounded-xl font-black text-sm transition shadow-lg active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider ${
                            allChecked
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 animate-pulse"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25"
                          }`}
                        >
                          <CheckCircle2 size={18} />
                          {allChecked ? "All Prepped • Mark Ready" : "Mark Ready for Pickup"}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(ticket.id, "dispatched")}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl transition shadow-lg shadow-emerald-600/25 active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider"
                      >
                        <Bike size={18} />
                        Handed to Courier (Dispatched)
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-white/10 px-6 py-2.5 flex items-center justify-between text-xs text-white/50">
        <span>© 2026 FlowMart Technologies • Busy Kitchen KDS V2</span>
        <span className="font-mono">LAGOS KITCHEN CLUSTER: YABA-01</span>
      </footer>
    </div>
  );
}
