import { Response } from "express";
import { db } from "../../db";
import { disputes, escrowTransactions, wallets } from "../../db/schema";
import { eq, sql } from "drizzle-orm";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

export const openDispute = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user?.id;
		const { escrowId, reason, evidenceUrls } = req.body;

		if (!escrowId || !reason) {
			return res.status(400).json({ success: false, message: "Escrow ID and reason are required" });
		}

		// Verify escrow transaction exists
		const [escrow] = await db.select().from(escrowTransactions).where(eq(escrowTransactions.id, escrowId)).limit(1);
		if (!escrow) {
			return res.status(404).json({ success: false, message: "Escrow transaction not found" });
		}

		// Must be buyer or vendor
		if (escrow.buyerId !== userId && escrow.vendorId !== userId) {
			return res.status(403).json({ success: false, message: "Unauthorized" });
		}

		// Mark escrow as disputed
		await db.update(escrowTransactions).set({ status: 'disputed' }).where(eq(escrowTransactions.id, escrowId));

		const [dispute] = await db.insert(disputes).values({
			escrowId,
			raisedById: userId!,
			reason,
			evidenceUrls: evidenceUrls || [],
			status: 'open'
		}).returning();

		return res.status(201).json({ success: true, dispute });
	} catch (error) {
		console.error("Open Dispute Error:", error);
		return res.status(500).json({ success: false, message: "Internal Server Error" });
	}
};

export const resolveDispute = async (req: AuthenticatedRequest, res: Response) => {
	try {
		if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
			return res.status(403).json({ success: false, message: "Unauthorized" });
		}

		const disputeId = req.params.id;
		const { resolution, notes } = req.body; // 'refund_buyer' or 'pay_vendor'

		const [dispute] = await db.select().from(disputes).where(eq(disputes.id, disputeId as string)).limit(1);
		if (!dispute || dispute.status !== 'open' && dispute.status !== 'under_review') {
			return res.status(400).json({ success: false, message: "Invalid dispute or already resolved" });
		}

		const [escrow] = await db.select().from(escrowTransactions).where(eq(escrowTransactions.id, dispute.escrowId)).limit(1);

		if (resolution === 'refund_buyer') {
			await db.update(wallets).set({ balance: sql`${wallets.balance} + ${escrow.amount}` }).where(eq(wallets.userId, escrow.buyerId));
			await db.update(escrowTransactions).set({ status: 'refunded' }).where(eq(escrowTransactions.id, escrow.id));
			await db.update(disputes).set({ status: 'resolved_buyer_refunded', resolutionNotes: notes }).where(eq(disputes.id, dispute.id));
		} else if (resolution === 'pay_vendor') {
			await db.update(wallets).set({ balance: sql`${wallets.balance} + ${escrow.amount}` }).where(eq(wallets.userId, escrow.vendorId));
			await db.update(escrowTransactions).set({ status: 'released' }).where(eq(escrowTransactions.id, escrow.id));
			await db.update(disputes).set({ status: 'resolved_vendor_paid', resolutionNotes: notes }).where(eq(disputes.id, dispute.id));
		} else {
			return res.status(400).json({ success: false, message: "Invalid resolution type" });
		}

		return res.status(200).json({ success: true, message: "Dispute resolved successfully" });
	} catch (error) {
		console.error("Resolve Dispute Error:", error);
		return res.status(500).json({ success: false, message: "Internal Server Error" });
	}
};
