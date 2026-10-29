import { Request, Response } from 'express';

// ─── Pack E: Gamification & Growth Engine ─────────────────────────────────────

export interface FoodieWrappedData {
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
  monthlyProgression: { month: string; orders: number }[];
}

export interface ScratchCardData {
  id: string;
  orderRef?: string;
  rewardType: 'wallet_credit' | 'free_delivery' | 'discount_voucher';
  rewardTitle: string;
  rewardSubtitle: string;
  amount: number;
  code: string;
  isClaimed: boolean;
  expiresAt: string;
}

export interface ReferralMilestoneData {
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
    status: 'joined' | 'ordered';
    rewardAmount: number;
    date: string;
  }[];
}

// 1. Get User's Foodie Wrapped Recap
export const getFoodieWrapped = async (req: Request, res: Response) => {
  try {
    const wrapped: FoodieWrappedData = {
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
      monthlyProgression: [
        { month: "Jan", orders: 3 },
        { month: "Feb", orders: 4 },
        { month: "Mar", orders: 5 },
        { month: "Apr", orders: 4 },
        { month: "May", orders: 6 },
        { month: "Jun", orders: 5 },
        { month: "Jul", orders: 7 },
        { month: "Aug", orders: 8 },
      ],
    };

    return res.status(200).json({
      success: true,
      wrapped,
    });
  } catch (error) {
    console.error("Wrapped error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate Foodie Wrapped" });
  }
};

// 2. Get Mystery Scratch Card
export const getScratchCard = async (req: Request, res: Response) => {
  try {
    const scratchCard: ScratchCardData = {
      id: "sc-2026-9481",
      orderRef: "FLW-83921",
      rewardType: "wallet_credit",
      rewardTitle: "₦1,000 Wallet Cashback",
      rewardSubtitle: "Instant cash credit added to your FlowMart in-app wallet",
      amount: 1000,
      code: "LUCKY-FLW-1000",
      isClaimed: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    };

    return res.status(200).json({
      success: true,
      scratchCard,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load scratch card" });
  }
};

// 3. Claim Scratch Card Reward
export const claimScratchCard = async (req: Request, res: Response) => {
  try {
    const { cardId } = req.body;
    return res.status(200).json({
      success: true,
      message: "🎉 ₦1,000 has been credited to your FlowMart Wallet!",
      cardId: cardId || "sc-2026-9481",
      creditedAmount: 1000,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to claim reward" });
  }
};

// 4. Get Referral Milestones & Ambassador Ladder
export const getReferralMilestones = async (req: Request, res: Response) => {
  try {
    const milestones: ReferralMilestoneData = {
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
          title: "Foodie Scout (1 Friend)",
          target: 1,
          perk: "₦1,000 Instant Wallet Credit",
          isUnlocked: true,
        },
        {
          level: 2,
          title: "Chow Ambassador (5 Friends)",
          target: 5,
          perk: "1 Month Free FlowPass VIP Tier + ₦5,000 Cash Credit",
          isUnlocked: false,
        },
        {
          level: 3,
          title: "Gold Legend (10+ Friends)",
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
    };

    return res.status(200).json({
      success: true,
      milestones,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load referral milestones" });
  }
};
