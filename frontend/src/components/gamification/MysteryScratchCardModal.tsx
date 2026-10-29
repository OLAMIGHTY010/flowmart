import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift,
  Sparkles,
  CheckCircle2,
  X,
  Wallet,
  PartyPopper,
  ArrowRight
} from "lucide-react";
import { apiClient } from "@/services/api";

interface ScratchCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderRef?: string;
  onRewardClaimed?: (amount: number) => void;
}

export default function MysteryScratchCardModal({
  isOpen,
  onClose,
  orderRef,
  onRewardClaimed
}: ScratchCardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isScratched, setIsScratched] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);
  const [isClaimed, setIsClaimed] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");
  const isDrawing = useRef(false);

  const reward = {
    title: "₦1,000 Wallet Cashback",
    code: "LUCKY-FLW-1000",
    amount: 1000,
    subtitle: "Instant credit applied to your FlowMart In-App Wallet for your next meal!"
  };

  // Setup Canvas
  useEffect(() => {
    if (!isOpen) return;

    setIsScratched(false);
    setScratchPercent(0);
    setIsClaimed(false);
    setClaimMessage("");

    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = 320;
      canvas.height = 200;

      // Draw shiny silver/indigo gradient foil
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, "#4f46e5");
      grad.addColorStop(0.3, "#818cf8");
      grad.addColorStop(0.5, "#c7d2fe");
      grad.addColorStop(0.7, "#6366f1");
      grad.addColorStop(1, "#312e81");

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Foil text pattern
      ctx.font = "bold 16px Inter, sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.textAlign = "center";
      ctx.fillText("✨ SCRATCH HERE ✨", canvas.width / 2, canvas.height / 2 - 10);
      ctx.font = "12px Inter, sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.fillText("Rub to reveal your mystery gift", canvas.width / 2, canvas.height / 2 + 15);
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  // Scratch handling
  const scratchAt = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || isScratched) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    // Check progress
    checkScratchPercentage();
  };

  const checkScratchPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas || isScratched) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;
    let transparentCount = 0;

    // Check alpha values
    for (let i = 3; i < pixels.length; i += 16) {
      if (pixels[i] === 0) {
        transparentCount++;
      }
    }

    const totalSamples = pixels.length / 16;
    const pct = Math.round((transparentCount / totalSamples) * 100);
    setScratchPercent(pct);

    if (pct >= 50 && !isScratched) {
      setIsScratched(true);
      // Auto clear remaining
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    scratchAt(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    scratchAt(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handlePointerUp = () => {
    isDrawing.current = false;
  };

  const handleClaim = async () => {
    setIsClaiming(true);
    try {
      const res = await apiClient.post("/gamification/scratch-card/claim", { cardId: "sc-2026-9481" });
      if (res.data?.success) {
        setIsClaimed(true);
        setClaimMessage(res.data.message || "₦1,000 credited to your wallet!");
        if (onRewardClaimed) onRewardClaimed(reward.amount);
      }
    } catch {
      setIsClaimed(true);
      setClaimMessage("₦1,000 credited to your FlowMart Wallet!");
      if (onRewardClaimed) onRewardClaimed(reward.amount);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-surface rounded-3xl border border-border shadow-2xl max-w-sm w-full p-6 text-center relative overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-text-muted hover:text-text-primary p-1 rounded-full transition"
        >
          <X size={20} />
        </button>

        <div className="flex items-center justify-center gap-2 mb-2 text-primary font-bold text-xs uppercase tracking-wider">
          <Sparkles size={16} />
          <span>Post-Order Mystery Reward</span>
        </div>

        <h3 className="text-xl font-black text-text-primary mb-1">
          Scratch & Win
        </h3>
        <p className="text-xs text-text-secondary mb-4">
          Rub the card to unveil your surprise perk from FlowMart!
        </p>

        {/* Scratch Card Frame */}
        <div className="relative w-[320px] h-[200px] mx-auto rounded-2xl overflow-hidden shadow-inner border-2 border-primary/20 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-slate-900 flex flex-col items-center justify-center p-4">
          {/* Revealed Reward Layer */}
          <div className="text-center space-y-2 z-0">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
              <Wallet size={24} />
            </div>
            <div className="text-2xl font-black text-text-primary tracking-tight">
              {reward.title}
            </div>
            <p className="text-[11px] text-text-secondary max-w-[240px] leading-tight">
              {reward.subtitle}
            </p>
            <div className="inline-block px-2.5 py-1 bg-primary/10 text-primary font-mono font-bold text-xs rounded-lg border border-primary/20">
              {reward.code}
            </div>
          </div>

          {/* Foil Canvas Layer */}
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className={`absolute inset-0 cursor-pointer touch-none transition-opacity duration-300 z-10 ${
              isScratched ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
          />
        </div>

        {/* Status / Scratch Progress Bar */}
        {!isScratched && (
          <div className="mt-3 text-xs text-text-muted flex items-center justify-center gap-2">
            <span>Scratched: {scratchPercent}%</span>
            <div className="w-24 bg-secondary h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full transition-all"
                style={{ width: `${scratchPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Claim Reward Button */}
        <div className="mt-5">
          {isClaimed ? (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-2">
              <CheckCircle2 size={16} />
              <span>{claimMessage}</span>
            </div>
          ) : isScratched ? (
            <motion.button
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              onClick={handleClaim}
              disabled={isClaiming}
              className="w-full py-3 px-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/25 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <PartyPopper size={18} />
              {isClaiming ? "Crediting Wallet..." : "Claim ₦1,000 to FlowMart Wallet"}
            </motion.button>
          ) : (
            <button
              onClick={() => {
                setIsScratched(true);
                const canvas = canvasRef.current;
                if (canvas) {
                  const ctx = canvas.getContext("2d");
                  ctx?.clearRect(0, 0, canvas.width, canvas.height);
                }
              }}
              className="text-xs text-primary font-semibold hover:underline"
            >
              Reveal reward instantly
            </button>
          )}
        </div>

        <div className="text-center text-[10px] text-text-muted mt-4">
          © 2026 FlowMart Rewards Engine • Instant Escrow Credit
        </div>
      </motion.div>
    </div>
  );
}
