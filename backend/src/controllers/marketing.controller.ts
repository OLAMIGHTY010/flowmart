import { Request, Response } from "express";
import { db } from "../../db";
import { products, promotions, wallets } from "../../db/schema";
import { eq, and } from "drizzle-orm";

export const boostProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const vendorId = req.user?.id;
    if (!vendorId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { productId, durationDays } = req.body;
    
    // Validate pricing
    let amountPaid = 0;
    if (durationDays === 3) amountPaid = 2500;
    else if (durationDays === 7) amountPaid = 5000;
    else if (durationDays === 30) amountPaid = 15000;
    else {
      res.status(400).json({ error: "Invalid duration. Must be 3, 7, or 30 days." });
      return;
    }

    // Verify product belongs to vendor
    const [product] = await db.select().from(products).where(and(eq(products.id, productId), eq(products.vendorId, vendorId)));
    if (!product) {
      res.status(404).json({ error: "Product not found or doesn't belong to you." });
      return;
    }

    // Process payment (mock deducting from wallet)
    // Normally we'd do a transaction here
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    // Create promotion record
    const [promo] = await db.insert(promotions).values({
      vendorId,
      productId,
      amountPaid: amountPaid.toString(),
      durationDays,
      status: "active",
      endDate
    }).returning();

    // Update product to be sponsored
    await db.update(products).set({
      isSponsored: true,
      sponsoredUntil: endDate
    }).where(eq(products.id, productId));

    res.status(201).json({ 
      success: true, 
      message: `Product successfully boosted for ${durationDays} days!`,
      promotion: promo
    });
  } catch (error) {
    console.error("Error boosting product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getVendorCampaigns = async (req: Request, res: Response): Promise<void> => {
  try {
    const vendorId = req.user?.id;
    if (!vendorId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const campaigns = await db.select().from(promotions).where(eq(promotions.vendorId, vendorId));

    res.status(200).json({ 
      success: true, 
      campaigns 
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
