import { Request, Response } from "express";
import { db } from "../../db";
import { orders } from "../../db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

// 1. View Available Deliveries (Riders)
export const getAvailableDeliveries = async (
	req: AuthenticatedRequest,
	res: Response
) => {
	try {
		// Find all orders that vendors have 'confirmed' but haven't been assigned a rider yet
		const availableOrders = await db
			.select()
			.from(orders)
			.where(and(eq(orders.status, "confirmed"), isNull(orders.riderId)));

		return res
			.status(200)
			.json({ success: true, deliveries: availableOrders });
	} catch (error) {
		console.error("Get Deliveries Error:", error);
		return res
			.status(500)
			.json({ success: false, message: "Internal Server Error" });
	}
};

// 2. Accept a Delivery Assignment (Riders)
export const acceptDelivery = async (
	req: AuthenticatedRequest,
	res: Response
) => {
	try {
		const orderId = req.params.id as string; // ✨ Explicitly cast to string to satisfy Drizzle type constraints
		const riderId = req.user?.id;

		// Ensure the order is still available (Preserved formatting and typeassertion)
		const [existingOrder] = await db
			.select()
			.from(orders)
			.where(
				and(eq(orders.id, orderId as string), isNull(orders.riderId))
			)
			.limit(1);

		if (!existingOrder) {
			return res.status(400).json({
				success: false,
				message: "Delivery no longer available or invalid",
			});
		}

		// Assign the rider and update status
		const [assignedOrder] = await db
			.update(orders)
			.set({
				riderId: riderId,
				status: "assigned",
				updatedAt: new Date(),
			})
			.where(eq(orders.id, orderId as string))
			.returning();

		return res.status(200).json({
			success: true,
			message: "Delivery accepted",
			order: assignedOrder,
		});
	} catch (error) {
		console.error("Accept Delivery Error:", error);
		return res
			.status(500)
			.json({ success: false, message: "Internal Server Error" });
	}
};

// 3. Confirm Delivery via PIN (Riders)
export const confirmDelivery = async (
	req: AuthenticatedRequest,
	res: Response
) => {
	try {
		const orderId = req.params.id as string; // ✨ Explicitly cast to string to satisfy Drizzle type constraints
		const { pin } = req.body;
		const riderId = req.user?.id;

		if (!pin) {
			return res
				.status(400)
				.json({ success: false, message: "Delivery PIN is required" });
		}

		// Find the order assigned to this specific rider
		const [activeOrder] = await db
			.select()
			.from(orders)
			.where(
				and(
					eq(orders.id, orderId as string),
					eq(orders.riderId, riderId!)
				)
			)
			.limit(1);

		if (!activeOrder) {
			return res.status(404).json({
				success: false,
				message: "Order not found or not assigned to you",
			});
		}

		// Verify the PIN provided by the attendee
		if (activeOrder.deliveryPin !== pin) {
			return res
				.status(400)
				.json({ success: false, message: "Invalid delivery PIN" });
		}

		// Mark as delivered
		const [deliveredOrder] = await db
			.update(orders)
			.set({
				status: "delivered",
				updatedAt: new Date(),
			})
			.where(eq(orders.id, orderId as string))
			.returning();

		return res.status(200).json({
			success: true,
			message: "Delivery confirmed successfully",
			order: deliveredOrder,
		});
	} catch (error) {
		console.error("Confirm Delivery Error:", error);
		return res
			.status(500)
			.json({ success: false, message: "Internal Server Error" });
	}
};

// 4. Confirm Delivery via QR Scan
export const confirmDeliveryViaQR = async (
	req: AuthenticatedRequest,
	res: Response
) => {
	try {
		const { scannedPayload } = req.body;
		const riderId = req.user?.id;

		if (!scannedPayload)
			return res
				.status(400)
				.json({ success: false, message: "Missing QR payload" });

		let parsedData;
		try {
			parsedData = JSON.parse(scannedPayload);
		} catch (e) {
			return res
				.status(400)
				.json({ success: false, message: "Invalid QR code format" });
		}

		// ✨ Explicitly type the destructured object fields as strings
		const { orderId, pin } = parsedData as { orderId: string; pin: string };

		const [activeOrder] = await db
			.select()
			.from(orders)
			.where(and(eq(orders.id, orderId), eq(orders.riderId, riderId!)))
			.limit(1);

		if (!activeOrder || activeOrder.deliveryPin !== pin) {
			return res.status(400).json({
				success: false,
				message: "Invalid QR Code or Order not assigned to you",
			});
		}

		const [deliveredOrder] = await db
			.update(orders)
			.set({ status: "delivered", updatedAt: new Date() })
			.where(eq(orders.id, orderId))
			.returning();

		return res.status(200).json({
			success: true,
			message: "QR Delivery confirmed",
			order: deliveredOrder,
		});
	} catch (error) {
		console.error("QR Confirm Error:", error);
		return res
			.status(500)
			.json({ success: false, message: "Internal Server Error" });
	}
};
