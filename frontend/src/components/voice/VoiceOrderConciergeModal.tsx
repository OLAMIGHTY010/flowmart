import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mic,
  MicOff,
  Sparkles,
  X,
  Volume2,
  CheckCircle2,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  RefreshCw,
  Clock,
  Store,
  ShieldCheck,
  Flame,
  ChevronRight,
  SlidersHorizontal,
  Info
} from "lucide-react";
import { apiClient } from "@/services/api";
import { useCartStore } from "@/stores/cartStore";
import { useToast } from "@/contexts/ToastContext";
import { audioChimes } from "@/utils/audioChimes";

interface VoiceItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  customization?: string;
  dietaryBadges: string[];
  vendorName: string;
  imageUrl: string;
  inStock: boolean;
}

interface ParsedVoiceData {
  rawTranscript: string;
  normalizedTranscript: string;
  detectedLanguage: string;
  vendor: {
    name: string;
    rating: number;
    prepTimeMinutes: string;
    verified: boolean;
  };
  items: VoiceItem[];
  subtotalNgn: number;
  deliveryFeeNgn: number;
  serviceFeeNgn: number;
  totalNgn: number;
  estimatedDeliveryTime: string;
  confidenceScore: number;
  intentSummary: string;
  suggestedAddons: Array<{
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    vendorName: string;
  }>;
}

interface VoiceOrderConciergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

const PRESET_VOICE_QUERIES = [
  {
    title: "2 Jollof Rice & Fried Chicken",
    phrase: "2 Jollof Rice with Fried Chicken and a cold Malt from Chicken Republic",
    tag: "Most Popular",
    icon: "🍛"
  },
  {
    title: "Abeg Sharp Sharp Pidgin Order",
    phrase: "Abeg sharp sharp 2 jollof rice with dodo and chilled chapman",
    tag: "Pidgin Dialect",
    icon: "🇳🇬"
  },
  {
    title: "Pepperoni Pizza & Double Coke",
    phrase: "Large Pepperoni Pizza with extra cheese and 2 cans of Coke",
    tag: "Late Night Feast",
    icon: "🍕"
  },
  {
    title: "Double Beef Shawarma Combo",
    phrase: "Double beef shawarma with extra sausage and chilled fresh juice",
    tag: "Street Style",
    icon: "🌯"
  },
  {
    title: "Healthy Lunch under ₦5,000",
    phrase: "Healthy lunch under 5000 naira with grilled fish and plantain",
    tag: "Fitness & Diet",
    icon: "🥗"
  }
];

export default function VoiceOrderConciergeModal({
  isOpen,
  onClose,
  initialQuery = ""
}: VoiceOrderConciergeModalProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const addToCartCustomized = useCartStore((s) => s.addToCartCustomized);

  const [mode, setMode] = useState<"IDLE" | "LISTENING" | "ANALYZING" | "REVIEW">("IDLE");
  const [transcript, setTranscript] = useState(initialQuery);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [parsedData, setParsedData] = useState<ParsedVoiceData | null>(null);
  const [selectedItems, setSelectedItems] = useState<VoiceItem[]>([]);
  const [addedAddons, setAddedAddons] = useState<string[]>([]);
  const [isSubmittingCart, setIsSubmittingCart] = useState(false);

  // Audio waveform visualizer references
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-NG"; // Supports Nigerian English & Pidgin phonetic accents

      rec.onstart = () => {
        setMode("LISTENING");
        audioChimes.voiceListeningStarted();
      };

      rec.onresult = (event: any) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (final) {
          setTranscript((prev) => (prev ? `${prev} ${final}` : final).trim());
        }
        setInterimTranscript(interim);
      };

      rec.onerror = (err: any) => {
        console.warn("Speech recognition error:", err);
      };

      rec.onend = () => {
        if (mode === "LISTENING") {
          // If stopped while in listening mode, check if we have text to parse
          stopMicrophoneStream();
        }
      };

      recognitionRef.current = rec;
    }

    return () => {
      stopMicrophoneStream();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  // Handle open state
  useEffect(() => {
    if (isOpen) {
      if (initialQuery) {
        setTranscript(initialQuery);
        executeParse(initialQuery);
      } else {
        setMode("IDLE");
        setTranscript("");
        setInterimTranscript("");
        setParsedData(null);
      }
    } else {
      stopListening();
    }
  }, [isOpen, initialQuery]);

  // Real-time Canvas Waveform Visualizer
  useEffect(() => {
    if (mode === "LISTENING" || mode === "ANALYZING") {
      startCanvasWaveform();
    } else {
      stopCanvasWaveform();
    }

    return () => {
      stopCanvasWaveform();
    };
  }, [mode]);

  const startMicrophoneStream = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioContextRef.current = ctx;
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          analyserRef.current = analyser;

          const source = ctx.createMediaStreamSource(stream);
          source.connect(analyser);
        }
      }
    } catch (e) {
      console.warn("Microphone stream not accessible for visualizer, using synthetic waves:", e);
    }
  };

  const stopMicrophoneStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  const startCanvasWaveform = () => {
    let phase = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barCount = 32;
      const barWidth = canvas.width / barCount - 3;
      phase += 0.08;

      let freqData: Uint8Array | null = null;
      if (analyserRef.current) {
        freqData = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(freqData as any);
      }

      for (let i = 0; i < barCount; i++) {
        let height = 12;

        if (freqData && freqData.length > i) {
          height = Math.max(8, (freqData[i] / 255) * (canvas.height * 0.85));
        } else {
          // Synthetic dynamic wave
          const wave = Math.sin(phase + i * 0.3) * Math.cos(phase * 0.6 + i * 0.1);
          const baseHeight = mode === "LISTENING" ? 40 : 20;
          height = Math.max(6, Math.abs(wave) * baseHeight + 8);
        }

        const x = i * (barWidth + 3);
        const y = (canvas.height - height) / 2;

        // FlowMart Indigo & Violet Gradient
        const gradient = ctx.createLinearGradient(0, y, 0, y + height);
        gradient.addColorStop(0, "#818cf8"); // Indigo 400
        gradient.addColorStop(0.5, "#4f46e5"); // Indigo 600
        gradient.addColorStop(1, "#c084fc"); // Purple 400

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, height, 4);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();
  };

  const stopCanvasWaveform = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const startListening = async () => {
    setTranscript("");
    setInterimTranscript("");
    setParsedData(null);
    setMode("LISTENING");

    await startMicrophoneStream();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Recognition start error or already started:", err);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    stopMicrophoneStream();
  };

  const handleDoneSpeaking = () => {
    stopListening();
    const finalQuery = (transcript + " " + interimTranscript).trim();
    if (!finalQuery) {
      showToast("Please speak your order or select a sample dish.", "info");
      setMode("IDLE");
      return;
    }
    executeParse(finalQuery);
  };

  const executeParse = async (queryText: string) => {
    setMode("ANALYZING");
    try {
      const res: any = await apiClient.post("/ai/voice-order/parse", {
        transcript: queryText,
        context: {
          preferredVendor: "Chicken Republic Express"
        }
      });

      if (res.success && res.data) {
        setParsedData(res.data);
        setSelectedItems(res.data.items);
        setMode("REVIEW");
        audioChimes.voiceOrderSuccess();
      } else {
        throw new Error("Unable to parse audio order");
      }
    } catch (err) {
      console.error("Voice parse error:", err);
      showToast("Could not recognize meal items. Please try again or type your order.", "error");
      setMode("IDLE");
    }
  };

  // Quantity updates
  const updateItemQty = (id: string, delta: number) => {
    setSelectedItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = Math.max(1, item.quantity + delta);
            return { ...item, quantity: nextQty };
          }
          return item;
        })
    );
  };

  const removeItem = (id: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Add suggested addon
  const handleAddAddon = (addon: { id: string; name: string; price: number; imageUrl: string; vendorName: string }) => {
    if (addedAddons.includes(addon.id)) return;

    const newItem: VoiceItem = {
      id: addon.id,
      name: addon.name,
      price: addon.price,
      quantity: 1,
      customization: "Chef Side Accompaniment",
      dietaryBadges: ["Addon"],
      vendorName: addon.vendorName,
      imageUrl: addon.imageUrl,
      inStock: true
    };

    setSelectedItems((prev) => [...prev, newItem]);
    setAddedAddons((prev) => [...prev, addon.id]);
    showToast(`Added ${addon.name} to your voice cart!`, "success");
  };

  // Calculations based on live selected items
  const currentSubtotal = selectedItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
  const deliveryFee = parsedData?.deliveryFeeNgn || 850;
  const serviceFee = parsedData?.serviceFeeNgn || 200;
  const currentTotal = currentSubtotal + deliveryFee + serviceFee;

  // 1-Tap Add All to Cart
  const handleAddAllToCart = () => {
    if (selectedItems.length === 0) {
      showToast("No items selected to add to cart.", "error");
      return;
    }

    setIsSubmittingCart(true);

    selectedItems.forEach((item) => {
      addToCartCustomized({
        product: {
          id: item.id,
          sku: `SKU-${item.id}`,
          name: item.name,
          description: item.customization || "Voice Concierge Verified Selection",
          price: item.price,
          stockQuantity: 99,
          imageUrl: item.imageUrl,
          productType: "food",
          dietaryTags: item.dietaryBadges,
          vendor: {
            id: "vendor-voice",
            name: item.vendorName,
            logo: item.imageUrl,
            verified: true,
            rating: 4.8,
            totalProducts: 50
          }
        },
        quantity: item.quantity,
        specialInstructions: item.customization || "Voice Concierge 2026 Special pack",
        unitPriceWithModifiers: item.price
      });
    });

    audioChimes.orderPlaced();
    showToast(`✨ Added ${selectedItems.length} items to your cart!`, "success");
    setIsSubmittingCart(false);
    onClose();
  };

  // 1-Tap Express Voice Checkout
  const handleExpressCheckout = () => {
    handleAddAllToCart();
    navigate("/checkout");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          boxShadow: "0 25px 60px -15px rgba(79, 70, 229, 0.35)"
        }}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Sparkles size={20} className="animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">FlowMart AI Voice Concierge</h3>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  2026 Speech-to-Cart
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Natural Nigerian English & Pidgin meal orders with instant cart assembly
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close Voice Concierge"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STATE 1: IDLE / READY TO LISTEN */}
          {mode === "IDLE" && (
            <div className="text-center py-6 space-y-6">
              <div className="relative inline-block">
                <div className="absolute -inset-4 rounded-full bg-indigo-500/20 blur-xl animate-pulse" />
                <button
                  onClick={startListening}
                  className="relative w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex flex-col items-center justify-center gap-1 shadow-xl shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all group"
                >
                  <Mic size={32} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold tracking-wider uppercase">Tap to Speak</span>
                </button>
              </div>

              <div>
                <h4 className="text-lg font-bold text-white mb-1">
                  What are you craving today?
                </h4>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  Speak naturally in English or Pidgin: dish names, portion count, extra pepper, or your favorite vendor.
                </p>
              </div>

              {/* Natural Voice Preset Chips */}
              <div className="pt-2 text-left">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                  Or Try Popular Voice Presets:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PRESET_VOICE_QUERIES.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setTranscript(preset.phrase);
                        executeParse(preset.phrase);
                      }}
                      className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-indigo-500/50 hover:bg-slate-800 transition-all text-left group"
                    >
                      <span className="text-2xl mt-0.5">{preset.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                            {preset.title}
                          </span>
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            {preset.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 italic">
                          "{preset.phrase}"
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STATE 2: LISTENING WITH LIVE WAVEFORM */}
          {mode === "LISTENING" && (
            <div className="py-6 space-y-6 text-center">
              <div className="relative inline-block">
                <div className="absolute -inset-6 rounded-full bg-indigo-500/30 blur-2xl animate-pulse" />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600 via-violet-600 to-pink-500 text-white flex flex-col items-center justify-center shadow-2xl shadow-indigo-500/50">
                  <Mic size={36} className="animate-bounce" />
                </div>
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Listening live... Speak your order
                </span>
                <h4 className="text-lg font-bold text-white">
                  FlowMart AI is capturing your voice
                </h4>
              </div>

              {/* Dynamic Soundwave Canvas */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-indigo-500/20">
                <canvas
                  ref={canvasRef}
                  width={480}
                  height={70}
                  className="w-full h-16 rounded-xl"
                />
              </div>

              {/* Live Transcript Stream */}
              <div className="min-h-[60px] p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-left">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Live Spoken Audio Transcript:
                </span>
                <p className="text-sm font-medium text-white">
                  {transcript || interimTranscript ? (
                    <>
                      <span>{transcript}</span>{" "}
                      <span className="text-indigo-400 italic underline">
                        {interimTranscript}
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-500 italic">
                      "2 plates of jollof rice with crispy chicken and a cold malt..."
                    </span>
                  )}
                </p>
              </div>

              {/* Done Speaking Trigger */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleDoneSpeaking}
                  className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
                >
                  <CheckCircle2 size={18} />
                  Done Speaking • Parse Meal
                </button>
                <button
                  onClick={() => setMode("IDLE")}
                  className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* STATE 3: ANALYZING INTENT */}
          {mode === "ANALYZING" && (
            <div className="py-12 space-y-6 text-center">
              <div className="relative inline-block">
                <div className="w-20 h-20 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 shadow-xl">
                  <RefreshCw size={36} className="animate-spin text-indigo-400" />
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-bold text-white">
                  Analyzing Voice Intent & Customizations
                </h4>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">
                  Extracting dishes, portion counts, spice levels, and matching live kitchen menus...
                </p>
              </div>
            </div>
          )}

          {/* STATE 4: REVIEW & ASSEMBLE CART */}
          {mode === "REVIEW" && parsedData && (
            <div className="space-y-6">
              {/* Spoken Query Banner */}
              <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 mt-0.5">
                  <Volume2 size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                      Spoken Request Recognized
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {Math.round(parsedData.confidenceScore * 100)}% Match Accuracy
                    </span>
                  </div>
                  <p className="text-xs text-white font-medium italic">
                    "{parsedData.rawTranscript}"
                  </p>
                  <p className="text-[11px] text-indigo-300/80 mt-1">
                    {parsedData.intentSummary}
                  </p>
                </div>
              </div>

              {/* Vendor & Delivery Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Store size={16} className="text-indigo-400" />
                  <span>{parsedData.vendor.name}</span>
                  <span className="text-amber-400">★ {parsedData.vendor.rating}</span>
                </div>
                <div className="flex items-center gap-4 text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} className="text-indigo-400" />
                    {parsedData.estimatedDeliveryTime}
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <ShieldCheck size={14} />
                    Verified Kitchen
                  </span>
                </div>
              </div>

              {/* Itemized Dish Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                  <span>Assembled Meal Items ({selectedItems.length})</span>
                  <span>Adjust Portions</span>
                </div>

                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center gap-3.5 hover:border-slate-600 transition-colors"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-700 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-sm text-white truncate">
                        {item.name}
                      </h5>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {item.dietaryBadges.map((badge, bIdx) => (
                          <span
                            key={bIdx}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 font-medium"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                      {item.customization && (
                        <p className="text-[11px] text-amber-300/90 mt-1 italic">
                          Note: {item.customization}
                        </p>
                      )}
                      <div className="text-xs font-bold text-white mt-1">
                        ₦{(item.price * item.quantity).toLocaleString()}
                        <span className="text-slate-400 font-normal ml-1">
                          (₦{item.price.toLocaleString()} each)
                        </span>
                      </div>
                    </div>

                    {/* Quantity Stepper & Delete */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-1">
                        <button
                          onClick={() => updateItemQty(item.id, -1)}
                          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="px-2 text-xs font-bold text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateItemQty(item.id, 1)}
                          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Remove Item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                {selectedItems.length === 0 && (
                  <div className="p-8 text-center bg-slate-800/40 rounded-2xl border border-dashed border-slate-700">
                    <p className="text-sm text-slate-400">All items removed.</p>
                    <button
                      onClick={() => setMode("IDLE")}
                      className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                    >
                      Speak Again
                    </button>
                  </div>
                )}
              </div>

              {/* Recommended Accompaniments / Addons */}
              {parsedData.suggestedAddons && parsedData.suggestedAddons.length > 0 && (
                <div className="space-y-2.5 pt-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Recommended Accompaniments:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {parsedData.suggestedAddons.map((addon) => {
                      const isAdded = addedAddons.includes(addon.id);
                      return (
                        <div
                          key={addon.id}
                          className="p-2.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between gap-3"
                        >
                          <img
                            src={addon.imageUrl}
                            alt={addon.name}
                            className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h6 className="text-xs font-bold text-white truncate">
                              {addon.name}
                            </h6>
                            <span className="text-[11px] font-semibold text-indigo-400">
                              +₦{addon.price.toLocaleString()}
                            </span>
                          </div>
                          <button
                            onClick={() => handleAddAddon(addon)}
                            disabled={isAdded}
                            className={`p-2 rounded-xl text-xs font-bold transition-all ${
                              isAdded
                                ? "bg-emerald-500/20 text-emerald-400 cursor-default"
                                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20"
                            }`}
                          >
                            {isAdded ? <CheckCircle2 size={16} /> : <Plus size={16} />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Financial Calculation Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Meal Subtotal:</span>
                  <span className="text-white font-medium">₦{currentSubtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Courier Delivery Fee:</span>
                  <span className="text-white font-medium">₦{deliveryFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Packaging & Service:</span>
                  <span className="text-white font-medium">₦{serviceFee.toLocaleString()}</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-sm font-bold">
                  <span className="text-white">Estimated Order Total:</span>
                  <span className="text-lg text-indigo-400">₦{currentTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {mode === "REVIEW" && (
              <button
                onClick={() => setMode("IDLE")}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw size={14} />
                Speak Again
              </button>
            )}
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              FlowMart AI © 2026 • Chowdeck-Grade Engine
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {mode === "REVIEW" ? (
              <>
                <button
                  onClick={handleAddAllToCart}
                  disabled={isSubmittingCart || selectedItems.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <ShoppingBag size={15} />
                  Add to Cart (₦{currentTotal.toLocaleString()})
                </button>
                <button
                  onClick={handleExpressCheckout}
                  disabled={isSubmittingCart || selectedItems.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
                >
                  Express Checkout
                  <ArrowRight size={15} />
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
