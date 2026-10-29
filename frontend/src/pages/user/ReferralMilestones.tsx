import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Gift,
  Share2,
  Copy,
  CheckCircle2,
  Trophy,
  Sparkles,
  Award,
  ArrowRight,
  TrendingUp,
  Wallet
} from "lucide-react";
import { apiClient } from "@/services/api";

interface MilestoneData {
  referralCode: string;
  shareUrl: string;
  totalInvited: number;
  successfulOrders: number;
  totalEarnedNaira: number;
  currentTier: {
    level: number;
    title: string;
    targetInvites: number;
    rewardDescription: string;
  };
  milestoneLadder: {
    level: number;
    title: string;
    target: number;
    perk: string;
    isUnlocked: boolean;
  }[];
  recentReferrals: {
    id: string;
    friendName: string;
    status: "joined" | "ordered";
    rewardAmount: number;
    date: string;
  }[];
}

export default function ReferralMilestones() {
  const [data, setData] = useState<MilestoneData>({
    referralCode: "FOLAKE26",
    shareUrl: "https://flowmart.ng/ref/FOLAKE26",
    totalInvited: 4,
    successfulOrders: 4,
    totalEarnedNaira: 4000,
    currentTier: {
      level: 1,
      title: "Foodie Scout",
      targetInvites: 5,
      rewardDescription: "Invite 1 more friend to unlock Level 2 (1 Month Free FlowPass VIP + ₦5,000 Bonus)",
    },
    milestoneLadder: [
      {
        level: 1,
        title: "Foodie Scout",
        target: 1,
        perk: "₦1,000 Instant Wallet Credit per Friend",
        isUnlocked: true,
      },
      {
        level: 2,
        title: "Chow Ambassador",
        target: 5,
        perk: "1 Month Free FlowPass VIP Tier + ₦5,000 Cash Credit",
        isUnlocked: false,
      },
      {
        level: 3,
        title: "Gold Legend",
        target: 10,
        perk: "Free Delivery on All Weekend Orders Forever + Exclusive VIP Tasting Box",
        isUnlocked: false,
      },
    ],
    recentReferrals: [
      {
        id: "ref-1",
        friendName: "Chidinma Okafor",
        status: "ordered",
        rewardAmount: 1000,
        date: "Yesterday",
      },
      {
        id: "ref-2",
        friendName: "Babatunde Alabi",
        status: "ordered",
        rewardAmount: 1000,
        date: "3 days ago",
      },
      {
        id: "ref-3",
        friendName: "Kelechi Eze",
        status: "ordered",
        rewardAmount: 1000,
        date: "Last week",
      },
      {
        id: "ref-4",
        friendName: "Zainab Bello",
        status: "ordered",
        rewardAmount: 1000,
        date: "2 weeks ago",
      },
    ],
  });

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    apiClient.get("/gamification/referrals").then((res) => {
      if (res.data?.success && res.data?.milestones) {
        setData(res.data.milestones);
      }
    }).catch(() => {});
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(data.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = `Hey! I get hot food delivered fast on FlowMart in under 35 mins. Use my invite code "${data.referralCode}" for ₦1,000 off your first delicious order! Link: ${data.shareUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleShareTwitter = () => {
    const text = `Ordering lunch on @FlowMartNG! Use my referral code "${data.referralCode}" to get ₦1,000 off your food delivery: ${data.shareUrl} 🍔🚀`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  };

  const progressPercent = Math.min(100, Math.round((data.totalInvited / data.currentTier.targetInvites) * 100));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-700 to-purple-800 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-bold uppercase tracking-wider mb-3 text-indigo-100">
            <Trophy size={14} className="text-amber-300" />
            <span>FlowMart Ambassador Club</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            Feed Your Friends, Earn Free Meals.
          </h1>
          <p className="text-sm text-indigo-100 mt-2 leading-relaxed">
            Give friends ₦1,000 off their first meal. You get ₦1,000 in your wallet the moment they order, plus unlock VIP FlowPass tiers!
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="mt-6 pt-6 border-t border-white/20 grid grid-cols-2 sm:grid-cols-3 gap-4 text-center sm:text-left">
          <div>
            <p className="text-xs text-indigo-200">Total Friends Invited</p>
            <p className="text-2xl font-black text-white mt-0.5">{data.totalInvited} Friends</p>
          </div>
          <div>
            <p className="text-xs text-indigo-200">Total Wallet Cash Earned</p>
            <p className="text-2xl font-black text-amber-300 mt-0.5">₦{data.totalEarnedNaira.toLocaleString()}</p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-xs text-indigo-200">Ambassador Rank</p>
            <p className="text-2xl font-black text-white mt-0.5">{data.currentTier.title}</p>
          </div>
        </div>
      </div>

      {/* Referral Link & Social Share Card */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
          <Share2 size={18} className="text-primary" />
          Your Unique Referral Link
        </h2>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full flex items-center bg-secondary/60 border border-border rounded-xl px-4 py-3 font-mono text-xs text-text-primary overflow-x-auto">
            <span className="truncate">{data.shareUrl}</span>
          </div>

          <button
            onClick={handleCopyLink}
            className="w-full sm:w-auto px-5 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Copy size={15} />
            {copied ? "Copied Link!" : "Copy Link"}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <span className="text-xs text-text-secondary font-medium">Quick share:</span>
          <button
            onClick={handleShareWhatsApp}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Share2 size={13} /> WhatsApp
          </button>
          <button
            onClick={handleShareTwitter}
            className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Share2 size={13} /> X (Twitter)
          </button>
        </div>
      </div>

      {/* Milestone Progress Bar */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Award size={18} className="text-amber-500" />
              Next Milestone: Level 2 (Chow Ambassador)
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              {data.currentTier.rewardDescription}
            </p>
          </div>
          <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full self-start sm:self-auto">
            {data.totalInvited} of {data.currentTier.targetInvites} Invited ({progressPercent}%)
          </span>
        </div>

        <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Milestone Ladder Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.milestoneLadder.map((tier) => (
          <div
            key={tier.level}
            className={`p-5 rounded-2xl border transition-all ${
              tier.isUnlocked
                ? "bg-primary/5 border-primary shadow-sm"
                : "bg-surface border-border opacity-85 hover:border-border/80"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  tier.isUnlocked
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-secondary text-text-muted"
                }`}
              >
                {tier.isUnlocked ? "✓ Unlocked" : `Target: ${tier.target} Friends`}
              </span>
              <Trophy
                size={18}
                className={tier.isUnlocked ? "text-amber-500" : "text-text-muted"}
              />
            </div>

            <h3 className="text-base font-bold text-text-primary">{tier.title}</h3>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">{tier.perk}</p>
          </div>
        ))}
      </div>

      {/* Recent Referral Activity Ledger */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Users size={16} className="text-primary" />
            Your Referral Activity
          </h3>
          <span className="text-xs text-text-muted">4 Friends Redeemed</span>
        </div>

        <div className="divide-y divide-border">
          {data.recentReferrals.map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                  {item.friendName.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-text-primary">{item.friendName}</p>
                  <p className="text-[11px] text-text-muted">{item.date}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  +₦{item.rewardAmount.toLocaleString()}
                </span>
                <p className="text-[10px] text-emerald-600 flex items-center gap-1 justify-end">
                  <CheckCircle2 size={11} /> First Order Placed
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center text-xs text-text-muted py-2">
        © 2026 FlowMart Technologies • Ambassador & Referral Growth Engine V2
      </div>
    </div>
  );
}
