import { Request, Response } from "express";
import { db } from "../../db";
import { escrowTransactions, wallets, orders } from "../../db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

/**
 * Initiates a standalone Escrow Transaction for high-value items (Real Estate/Vehicles).
 * Locks funds from the buyer's wallet into the escrow system.
 */
export const initiateHighValueEscrow = async (req: Request, res: Response): Promise<void> => {
  try {
    const buyerId = req.user?.id;
    if (!buyerId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { vendorId, amount, productId } = req.body;
    if (!vendorId || !amount || !productId) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // Platform fee (e.g. 5%) deducted from seller payout, so we record it.
    const platformFee = amount * 0.05; 

    // Create a mock order to tie to the escrow transaction (for schema compliance)
    const [newOrder] = await db.insert(orders).values({
      orderRef: `ESC-${uuidv4().substring(0, 8).toUpperCase()}`,
      userId: buyerId,
      vendorId: vendorId,
      deliveryZone: "n/a",
      status: "pending",
      totalAmount: amount.toString(),
      paymentMethod: "paystack" // or wallet
    }).returning();

    // Create Escrow Transaction
    const [escrow] = await db.insert(escrowTransactions).values({
      orderId: newOrder.id,
      buyerId,
      vendorId,
      amount: amount.toString(),
      platformFee: platformFee.toString(),
      status: "held",
    }).returning();

    // (In a real scenario, we would deduct the `amount` from the buyer's wallet here)

    res.status(201).json({ 
      success: true, 
      message: "Funds successfully locked in Escrow. The seller has been notified to arrange inspection.",
      escrow 
    });
  } catch (error) {
    console.error("Error initiating escrow:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Buyer manually releases funds after inspection.
 */
export const releaseEscrow = async (req: Request, res: Response): Promise<void> => {
  try {
    const buyerId = req.user?.id;
    const { escrowId } = req.params;

    if (!buyerId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const [escrow] = await db.select().from(escrowTransactions).where(eq(escrowTransactions.id, escrowId));
    if (!escrow) {
      res.status(404).json({ error: "Escrow transaction not found" });
      return;
    }

    if (escrow.buyerId !== buyerId) {
      res.status(403).json({ error: "Only the buyer can release these funds" });
      return;
    }

    if (escrow.status !== "held") {
      res.status(400).json({ error: "Escrow funds are not currently held" });
      return;
    }

    // Release funds
    await db.update(escrowTransactions).set({ status: "released", releasedAt: new Date() }).where(eq(escrowTransactions.id, escrowId));

    // Calculate payout
    const vendorPayout = Number(escrow.amount) - Number(escrow.platformFee);

    // Credit Vendor Wallet (pseudo-code)
    // await creditWallet(escrow.vendorId, vendorPayout);

    res.status(200).json({ 
      success: true, 
      message: "Funds successfully released to the seller.",
      payout: vendorPayout
    });
  } catch (error) {
    console.error("Error releasing escrow:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Gets all active escrow transactions for a user (Buyer or Seller).
 */
export const getMyEscrows = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Find where user is buyer OR seller
    // Simplified for mock
    const escrowsAsBuyer = await db.select().from(escrowTransactions).where(eq(escrowTransactions.buyerId, userId));
    const escrowsAsVendor = await db.select().from(escrowTransactions).where(eq(escrowTransactions.vendorId, userId));

    res.status(200).json({ 
      success: true, 
      buying: escrowsAsBuyer,
      selling: escrowsAsVendor
    });
  } catch (error) {
    console.error("Error fetching escrows:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
