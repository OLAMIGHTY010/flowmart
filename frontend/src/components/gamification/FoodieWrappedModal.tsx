import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Volume2,
  VolumeX,
  Share2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Award,
  Bike,
  Heart,
  TrendingUp,
  CheckCircle2,
  Copy,
  ExternalLink
} from "lucide-react";
import { apiClient } from "@/services/api";

interface FoodieWrappedData {
  year: number;
  totalOrders: number;
  totalSpent: number;
  totalDistanceKm: number;
  totalSavingsNaira: number;
  topRestaurant: {
    name: string;
    image: string;
    orderCount: number;
    favoriteDish: string;
  };
  topCuisine: string;
  foodiePersona: {
    title: string;
    tagline: string;
    icon: string;
    rarity: string;
  };
}

interface FoodieWrappedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FoodieWrappedModal({ isOpen, onClose }: FoodieWrappedModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [wrapped, setWrapped] = useState<FoodieWrappedData>({
    year: 2026,
    totalOrders: 42,
    totalSpent: 184500,
    totalDistanceKm: 186.4,
    totalSavingsNaira: 18400,
    topRestaurant: {
      name: "Mama Put Delights",
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop",
      orderCount: 18,
      favoriteDish: "Smoky Jollof & Grilled Catfish",
    },
    topCuisine: "Naija Comfort Meals",
    foodiePersona: {
      title: "The Lagos Midnight Connoisseur",
      tagline: "Top 2% of late-night foodies in Yaba & VI. You never let a craving slide.",
      icon: "Crown",
      rarity: "Top 2% Foodie",
    },
  });

  const totalSlides = 5;

  // Web Audio chime
  const playStoryBeep = (freq = 440) => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio context may require gesture
    }
  };

  useEffect(() => {
    if (isOpen) {
      apiClient.get("/gamification/wrapped").then((res) => {
        if (res.data?.success && res.data?.wrapped) {
          setWrapped(res.data.wrapped);
        }
      }).catch(() => {});
      setCurrentSlide(0);
      playStoryBeep(523.25);
    }
  }, [isOpen]);

  // Auto-advance story timer
  useEffect(() => {
    if (!isOpen || isPaused) return;

    const timer = setTimeout(() => {
      if (currentSlide < totalSlides - 1) {
        setCurrentSlide((prev) => prev + 1);
        playStoryBeep(587.33);
      }
    }, 6000);

    return () => clearTimeout(timer);
  }, [isOpen, currentSlide, isPaused]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide((prev) => prev + 1);
      playStoryBeep(659.25);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
      playStoryBeep(440);
    }
  };

  const handleShareStory = (platform: "whatsapp" | "twitter" | "copy") => {
    const shareText = `🔥 My FlowMart 2026 Wrapped is in! I made ${wrapped.totalOrders} orders, traveled ${wrapped.totalDistanceKm}km in deliveries, and earned "${wrapped.foodiePersona.title}" (${wrapped.foodiePersona.rarity})! Check yours on FlowMart: https://flowmart.ng/wrapped`;

    if (platform === "whatsapp") {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, "_blank");
    } else if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, "_blank");
    } else {
      navigator.clipboard.writeText(shareText);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="relative w-full max-w-md h-[680px] bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-indigo-500/30 select-none"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Top Story Segments Progress Bars */}
        <div className="absolute top-4 left-4 right-4 z-20 flex gap-1.5">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <div
              key={idx}
              className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlide(idx);
              }}
            >
              <div
                className={`h-full bg-white transition-all duration-300 ${
                  idx < currentSlide ? "w-full" : idx === currentSlide ? "w-full animate-pulse" : "w-0"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Story Header Controls */}
        <div className="absolute top-8 left-4 right-4 z-20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center font-black text-[10px] shadow">
              FM
            </div>
            <div>
              <p className="font-bold tracking-tight">FlowMart 2026 Wrapped</p>
              <p className="text-[10px] text-indigo-300 font-mono">FLOWMART FOODIE RECAP</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              className="p-1.5 bg-black/40 hover:bg-black/60 rounded-full transition"
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1.5 bg-black/40 hover:bg-black/60 rounded-full transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Touch / Click navigation zones */}
        <div className="absolute inset-y-16 left-0 w-1/3 z-10" onClick={handlePrev} />
        <div className="absolute inset-y-16 right-0 w-1/3 z-10" onClick={handleNext} />

        {/* Dynamic Story Slides Content */}
        <div className="flex-1 flex flex-col justify-center px-6 pt-16 pb-8 relative z-0">
          <AnimatePresence mode="wait">
            {/* ─── SLIDE 0: Overview ─── */}
            {currentSlide === 0 && (
              <motion.div
                key="slide-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center space-y-6"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-bold border border-indigo-400/30">
                  <Sparkles size={14} />
                  <span>2026 Season Finale</span>
                </div>

                <div>
                  <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                    You had quite a year of good food.
                  </h2>
                  <p className="text-sm text-indigo-200 mt-2">
                    Here is how you fueled your days and nights across Lagos in 2026.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                    <p className="text-xs text-indigo-300 font-semibold">Total Meals Ordered</p>
                    <p className="text-3xl font-black text-white mt-1">{wrapped.totalOrders}</p>
                    <p className="text-[10px] text-indigo-200">Across 24 distinct weeks</p>
                  </div>
                  <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                    <p className="text-xs text-indigo-300 font-semibold">Total Invested in Joy</p>
                    <p className="text-3xl font-black text-white mt-1">₦{(wrapped.totalSpent / 1000).toFixed(0)}k</p>
                    <p className="text-[10px] text-emerald-400 font-semibold">Pure satisfaction</p>
                  </div>
                </div>

                <p className="text-xs text-indigo-300/80 pt-4">Tap right to uncover your top cravings →</p>
              </motion.div>
            )}

            {/* ─── SLIDE 1: Top Restaurant & Dish ─── */}
            {currentSlide === 1 && (
              <motion.div
                key="slide-1"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="text-center space-y-5"
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold border border-amber-400/30">
                  <Heart size={14} className="fill-amber-400" />
                  <span>Your #1 Kitchen Crush</span>
                </div>

                <div className="relative mx-auto w-40 h-40 rounded-3xl overflow-hidden shadow-2xl border-4 border-indigo-400/40">
                  <img
                    src={wrapped.topRestaurant.image}
                    alt={wrapped.topRestaurant.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center pb-2">
                    <span className="text-[11px] font-bold text-amber-400">★ Favorite Spot</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white">{wrapped.topRestaurant.name}</h3>
                  <p className="text-xs text-indigo-300 mt-1">You ordered here {wrapped.topRestaurant.orderCount} times!</p>
                </div>

                <div className="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-left">
                  <p className="text-[11px] text-indigo-300 font-semibold uppercase tracking-wider">Your Signature Dish</p>
                  <p className="text-base font-bold text-white mt-0.5">{wrapped.topRestaurant.favoriteDish}</p>
                </div>
              </motion.div>
            )}

            {/* ─── SLIDE 2: Courier Kilometers ─── */}
            {currentSlide === 2 && (
              <motion.div
                key="slide-2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="text-center space-y-6"
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold border border-emerald-400/30">
                  <Bike size={14} />
                  <span>Distance Conquered</span>
                </div>

                <div>
                  <div className="text-5xl font-black text-emerald-400 font-mono tracking-tight">
                    {wrapped.totalDistanceKm} <span className="text-2xl">KM</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-3">
                    FlowMart Champions rode for you.
                  </h3>
                  <p className="text-xs text-indigo-200 mt-2 max-w-xs mx-auto">
                    That is equivalent to traveling across the Third Mainland Bridge over 15 times just to get your food steaming hot!
                  </p>
                </div>

                <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-around">
                  <div>
                    <p className="text-xs text-indigo-300">Avg Delivery Time</p>
                    <p className="text-2xl font-black text-white">28 mins</p>
                  </div>
                  <div className="h-8 w-px bg-white/20" />
                  <div>
                    <p className="text-xs text-indigo-300">On-Time Rate</p>
                    <p className="text-2xl font-black text-emerald-400">98.2%</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── SLIDE 3: FlowPass VIP Savings ─── */}
            {currentSlide === 3 && (
              <motion.div
                key="slide-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center space-y-6"
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-bold border border-indigo-400/30">
                  <TrendingUp size={14} />
                  <span>Money Back In Your Pocket</span>
                </div>

                <div>
                  <div className="text-5xl font-black text-white tracking-tight">
                    ₦{wrapped.totalSavingsNaira.toLocaleString()}
                  </div>
                  <h3 className="text-xl font-bold text-indigo-300 mt-2">
                    Saved via FlowPass VIP & Perks
                  </h3>
                  <p className="text-xs text-indigo-200 mt-2 max-w-xs mx-auto">
                    Zero delivery surcharges, priority rider dispatch, and member discount drops saved your wallet big time.
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-r from-indigo-600/40 to-purple-600/40 rounded-2xl border border-indigo-400/30">
                  <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">FlowPass Return On Investment</p>
                  <p className="text-2xl font-black text-white mt-1">4.2x Cost Return</p>
                  <p className="text-[11px] text-indigo-200 mt-1">VIP Member status renewed for 2026</p>
                </div>
              </motion.div>
            )}

            {/* ─── SLIDE 4: Foodie Persona & Share Card ─── */}
            {currentSlide === 4 && (
              <motion.div
                key="slide-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center space-y-4"
              >
                {/* Holographic Persona Card */}
                <div className="p-6 bg-gradient-to-br from-indigo-600 via-purple-700 to-indigo-900 rounded-3xl border-2 border-indigo-300/40 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-2 right-2 px-2.5 py-0.5 bg-white/20 backdrop-blur rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                    {wrapped.foodiePersona.rarity}
                  </div>

                  <div className="w-16 h-16 mx-auto mb-3 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 text-amber-300">
                    <Award size={36} />
                  </div>

                  <p className="text-xs text-indigo-200 uppercase tracking-widest font-bold">Your 2026 Identity</p>
                  <h3 className="text-2xl font-black text-white mt-1 leading-tight">
                    {wrapped.foodiePersona.title}
                  </h3>
                  <p className="text-xs text-indigo-100 mt-2 leading-relaxed">
                    {wrapped.foodiePersona.tagline}
                  </p>

                  <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-indigo-200">
                    <span>{wrapped.totalOrders} Orders</span>
                    <span>•</span>
                    <span>{wrapped.totalDistanceKm} km Delivered</span>
                    <span>•</span>
                    <span>Mama Put</span>
                  </div>
                </div>

                {/* Share Actions */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs text-indigo-300 font-semibold">Share your FlowMart persona:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleShareStory("whatsapp")}
                      className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow"
                    >
                      <Share2 size={14} /> WhatsApp
                    </button>
                    <button
                      onClick={() => handleShareStory("twitter")}
                      className="py-2.5 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow"
                    >
                      <Share2 size={14} /> X (Twitter)
                    </button>
                  </div>
                  <button
                    onClick={() => handleShareStory("copy")}
                    className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <Copy size={13} /> {copiedLink ? "Story Copied to Clipboard!" : "Copy Story Link"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Brand */}
        <div className="p-4 border-t border-white/10 text-center text-[11px] text-indigo-300/80">
          © 2026 FlowMart Technologies • Handcrafted with love in Lagos
        </div>
      </motion.div>
    </div>
  );
}
