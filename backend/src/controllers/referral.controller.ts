import { Request, Response } from "express";
import { db } from "../../db";
import { users, referrals } from "../../db/schema";
import { eq, sql } from "drizzle-orm";

export const getReferralStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Get user to fetch their referral code
    const [user] = await db.select({ referralCode: users.referralCode }).from(users).where(eq(users.id, userId));

    // If user has no referral code yet, generate one
    let refCode = user?.referralCode;
    if (!refCode) {
      refCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await db.update(users).set({ referralCode: refCode }).where(eq(users.id, userId));
    }

    // Get referrals
    const myReferrals = await db.select().from(referrals).where(eq(referrals.referrerId, userId));

    let totalEarned = 0;
    let pendingRewards = 0;

    myReferrals.forEach(ref => {
      if (ref.status === 'completed') {
        totalEarned += Number(ref.rewardAmount);
      } else if (ref.status === 'pending') {
        pendingRewards += Number(ref.rewardAmount);
      }
    });

    res.status(200).json({ 
      success: true, 
      referralCode: refCode,
      stats: {
        totalEarned,
        pendingRewards,
        totalInvited: myReferrals.length
      },
      referrals: myReferrals 
    });
  } catch (error) {
    console.error("Error fetching referrals:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Mock endpoint to test the Anti-Fraud / First Purchase logic
export const mockFirstPurchaseTrigger = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Find if this user was referred by someone and it's still pending
    const [referral] = await db.select().from(referrals).where(eq(referrals.referredUserId, userId));

    if (referral && referral.status === 'pending') {
      
      // IP Tracking Verification (Mock check against users table)
      const [referredUser] = await db.select({ ip: users.registrationIp }).from(users).where(eq(users.id, userId));
      const [referrerUser] = await db.select({ ip: users.registrationIp }).from(users).where(eq(users.id, referral.referrerId));

      if (referredUser?.ip && referrerUser?.ip && referredUser.ip === referrerUser.ip) {
        // FRAUD DETECTED: Same IP
        await db.update(referrals).set({ status: 'invalid' }).where(eq(referrals.id, referral.id));
        res.status(400).json({ success: false, message: "Fraud detected: Referral invalid due to IP match." });
        return;
      }

      // Valid: Unlock Rewards
      await db.update(referrals).set({ 
        status: 'completed', 
        completedAt: new Date() 
      }).where(eq(referrals.id, referral.id));

      // Normally we would credit both wallets here.
      // creditWallet(referral.referrerId, referral.rewardAmount);
      // creditWallet(referral.referredUserId, referral.friendRewardAmount);

      res.status(200).json({ success: true, message: "Referral rewards unlocked successfully!" });
      return;
    }

    res.status(200).json({ success: true, message: "Purchase completed. No active referrals to unlock." });
  } catch (error) {
    console.error("Error triggering referral:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
