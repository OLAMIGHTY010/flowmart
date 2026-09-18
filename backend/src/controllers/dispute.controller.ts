import { Response } from "express";
import { db } from "../../db";
import { disputes, escrowTransactions, wallets } from "../../db/schema";
import { eq, sql } from "drizzle-orm";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { emitDisputeUpdate, emitEscrowStatusUpdate, sendInAppNotification } from "../services/websocket";

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

		emitDisputeUpdate(dispute.id, 'open', { escrowId, raisedById: userId });
		emitEscrowStatusUpdate(escrowId, 'disputed', { disputeId: dispute.id });
		sendInAppNotification(escrow.buyerId, 'dispute:update', { disputeId: dispute.id, status: 'open' });
		sendInAppNotification(escrow.vendorId, 'dispute:update', { disputeId: dispute.id, status: 'open' });

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

		let resolvedStatus: 'resolved_buyer_refunded' | 'resolved_vendor_paid';
		if (resolution === 'refund_buyer') {
			resolvedStatus = 'resolved_buyer_refunded';
			await db.update(wallets).set({ balance: sql`${wallets.balance} + ${escrow.amount}` }).where(eq(wallets.userId, escrow.buyerId));
			await db.update(escrowTransactions).set({ status: 'refunded' }).where(eq(escrowTransactions.id, escrow.id));
			await db.update(disputes).set({ status: resolvedStatus, resolutionNotes: notes }).where(eq(disputes.id, dispute.id));
		} else if (resolution === 'pay_vendor') {
			resolvedStatus = 'resolved_vendor_paid';
			await db.update(wallets).set({ balance: sql`${wallets.balance} + ${escrow.amount}` }).where(eq(wallets.userId, escrow.vendorId));
			await db.update(escrowTransactions).set({ status: 'released' }).where(eq(escrowTransactions.id, escrow.id));
			await db.update(disputes).set({ status: resolvedStatus, resolutionNotes: notes }).where(eq(disputes.id, dispute.id));
		} else {
			return res.status(400).json({ success: false, message: "Invalid resolution type" });
		}

		emitDisputeUpdate(dispute.id, resolvedStatus, { resolution, notes });
		emitEscrowStatusUpdate(escrow.id, resolution === 'refund_buyer' ? 'refunded' : 'released');
		sendInAppNotification(escrow.buyerId, 'dispute:update', { disputeId: dispute.id, status: resolvedStatus });
		sendInAppNotification(escrow.vendorId, 'dispute:update', { disputeId: dispute.id, status: resolvedStatus });

		return res.status(200).json({ success: true, message: "Dispute resolved successfully" });
	} catch (error) {
		console.error("Resolve Dispute Error:", error);
		return res.status(500).json({ success: false, message: "Internal Server Error" });
	}
};
