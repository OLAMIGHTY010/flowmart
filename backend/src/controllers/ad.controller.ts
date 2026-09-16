import { Response } from "express";
import { db } from "../../db";
import { sponsoredAds, products, wallets, walletTransactions } from "../../db/schema";
import { eq, sql } from "drizzle-orm";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

export const createAd = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const vendorId = req.user?.id;
		const { productId, amountPaid, durationDays } = req.body;
		
		if (!productId || !amountPaid || !durationDays) {
			return res.status(400).json({ success: false, message: "Missing required fields" });
		}

		// Verify product belongs to vendor
		const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
		if (!product || product.vendorId !== vendorId) {
			return res.status(403).json({ success: false, message: "Product not found or unauthorized" });
		}

		// Deduct from wallet
		const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, vendorId!)).limit(1);
		if (!wallet || Number(wallet.balance) < Number(amountPaid)) {
			return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
		}

		const startDate = new Date();
		const endDate = new Date();
		endDate.setDate(startDate.getDate() + Number(durationDays));

		// Transaction logic (simulated in Drizzle by sequential awaits for simplicity here)
		await db.update(wallets).set({ balance: sql`${wallets.balance} - ${amountPaid}` }).where(eq(wallets.id, wallet.id));
		
		await db.insert(walletTransactions).values({
			walletId: wallet.id,
			amount: amountPaid,
			type: 'payment',
			status: 'success',
			reference: `AD-${Date.now()}`
		});

		const [ad] = await db.insert(sponsoredAds).values({
			productId,
			vendorId: vendorId!,
			amountPaid,
			startDate,
			endDate,
			status: 'active'
		}).returning();

		await db.update(products).set({ isSponsored: true }).where(eq(products.id, productId));

		return res.status(201).json({ success: true, ad });
	} catch (error) {
		console.error("Create Ad Error:", error);
		return res.status(500).json({ success: false, message: "Internal Server Error" });
	}
};

export const getVendorAds = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const vendorId = req.user?.id;
		const ads = await db.select().from(sponsoredAds).where(eq(sponsoredAds.vendorId, vendorId!));
		return res.status(200).json({ success: true, ads });
	} catch (error) {
		return res.status(500).json({ success: false, message: "Internal Server Error" });
	}
};
