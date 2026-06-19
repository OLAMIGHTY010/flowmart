import { db } from '../../db';
import { vendorProfiles } from '../../db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Step 1: Lock funds in Escrow
 * Called by the Paystack Webhook when a customer successfully pays.
 */
export const creditPendingBalance = async (vendorId: string, amount: number) => {
  try {
    const [updatedProfile] = await db.update(vendorProfiles)
      .set({ 
        pendingBalance: sql`${vendorProfiles.pendingBalance} + ${amount}`,
        updatedAt: new Date()
      })
      .where(eq(vendorProfiles.vendorId, vendorId))
      .returning();

    return updatedProfile;
  } catch (error) {
    console.error(`Failed to credit pending balance for vendor ${vendorId}:`, error);
    throw error;
  }
};

/**
 * Step 2: Release funds from Escrow to Available
 * Called when both the Attendee and Rider confirm delivery.
 */
export const releaseEscrowToAvailable = async (vendorId: string, amount: number) => {
  try {
    const [updatedProfile] = await db.update(vendorProfiles)
      .set({ 
        // Deduct from pending, add to available, and track lifetime earnings
        pendingBalance: sql`${vendorProfiles.pendingBalance} - ${amount}`,
        availableBalance: sql`${vendorProfiles.availableBalance} + ${amount}`,
        totalEarned: sql`${vendorProfiles.totalEarned} + ${amount}`,
        updatedAt: new Date()
      })
      .where(eq(vendorProfiles.vendorId, vendorId))
      .returning();

    return updatedProfile;
  } catch (error) {
    console.error(`Failed to release escrow for vendor ${vendorId}:`, error);
    throw error;
  }
};

/**
 * Step 3: Deduct Available Balance (For Payouts)
 * Called right before triggering the Paystack Transfer API.
 */
export const deductAvailableBalance = async (vendorId: string, amount: number) => {
  try {
    // We add a safety check (WHERE available_balance >= amount) to prevent negative balances
    const [updatedProfile] = await db.update(vendorProfiles)
      .set({ 
        availableBalance: sql`${vendorProfiles.availableBalance} - ${amount}`,
        updatedAt: new Date()
      })
      .where(
        sql`${vendorProfiles.vendorId} = ${vendorId} AND ${vendorProfiles.availableBalance} >= ${amount}`
      )
      .returning();

    if (!updatedProfile) {
      throw new Error('Insufficient available balance for payout');
    }

    return updatedProfile;
  } catch (error) {
    console.error(`Failed to deduct payout balance for vendor ${vendorId}:`, error);
    throw error;
  }
};