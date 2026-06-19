import { Request, Response } from "express";
import { db } from "../../db";
import { orders, users, riderProfiles, riderKyc } from "../../db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { emailService } from "../services/email.service";

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

// Helper function to send delivery email
const dispatchDeliveryEmail = async (attendeeId: string, orderId: string) => {
	try {
		const [attendee] = await db.select().from(users).where(eq(users.id, attendeeId)).limit(1);
		if (attendee) {
			await emailService.sendDeliveryConfirmationEmail(attendee.email, { fullName: attendee.fullName, orderId });
		}
	} catch (err) {
		console.error('Email Dispatch Error:', err);
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

		// Fire & Forget Delivery Confirmation Email
		dispatchDeliveryEmail(activeOrder.attendeeId, deliveredOrder.id);

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

		// Fire & Forget Delivery Confirmation Email
		dispatchDeliveryEmail(activeOrder.attendeeId, deliveredOrder.id);

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

// 5. Submit Rider KYC
export const submitKYC = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const riderId = req.user?.id;
		if (!riderId) {
			return res.status(401).json({ success: false, message: "Unauthorized" });
		}

		const {
			// Profile fields
			displayName,
			phone,
			stateRegion,
			city,
			bio,
			avatar,
			
			// KYC fields
			fullName,
			dob,
			gender,
			bankName,
			accountNumber,
			accountName,
			vehicleType,
			makeModel,
			year,
			plateNumber,
			color,
			insuranceFile,
			roadWorthinessFile,
			govIdType,
			guarantorName,
			guarantorPhone,
			guarantorRelationship,
			governmentIdFile,
			guarantorIdFile,
			carImageFile,
			riderImageFile,
		} = req.body;

		// 1. CREATE OR UPDATE RIDER PROFILE
		const [existingProfile] = await db
			.select()
			.from(riderProfiles)
			.where(eq(riderProfiles.riderId, riderId))
			.limit(1);

		if (existingProfile) {
			await db
				.update(riderProfiles)
				.set({
					displayName: displayName || fullName,
					phone,
					stateRegion,
					city,
					bio: bio || null,
					avatar: avatar || null,
					updatedAt: new Date(),
				})
				.where(eq(riderProfiles.riderId, riderId));
		} else {
			await db.insert(riderProfiles).values({
				riderId,
				displayName: displayName || fullName,
				phone,
				stateRegion,
				city,
				bio: bio || null,
				avatar: avatar || null,
			});
		}

		// Mark user profile as completed
		await db
			.update(users)
			.set({
				fullName: fullName || undefined,
				phone: phone || undefined,
				dateOfBirth: dob || undefined,
				gender: gender || undefined,
				profileCompleted: true,
				updatedAt: new Date(),
			})
			.where(eq(users.id, riderId));

		// 2. CREATE OR UPDATE RIDER KYC
		const [existingKyc] = await db
			.select()
			.from(riderKyc)
			.where(eq(riderKyc.riderId, riderId))
			.limit(1);

		if (existingKyc) {
			await db
				.update(riderKyc)
				.set({
					bankName,
					accountNumber,
					accountName,
					vehicleType,
					makeModel,
					year,
					plateNumber,
					color,
					insuranceFile: insuranceFile || existingKyc.insuranceFile,
					roadWorthinessFile: roadWorthinessFile || existingKyc.roadWorthinessFile,
					governmentIdType: govIdType,
					guarantorName,
					guarantorPhone,
					guarantorRelationship,
					governmentIdFile: governmentIdFile || existingKyc.governmentIdFile,
					guarantorIdFile: guarantorIdFile || existingKyc.guarantorIdFile,
					carImageFile: carImageFile || existingKyc.carImageFile,
					riderImageFile: riderImageFile || existingKyc.riderImageFile,
					status: 'under_review',
					updatedAt: new Date(),
				})
				.where(eq(riderKyc.riderId, riderId));
		} else {
			await db.insert(riderKyc).values({
				riderId,
				bankName,
				accountNumber,
				accountName,
				vehicleType,
				makeModel,
				year,
				plateNumber,
				color,
				insuranceFile: insuranceFile || null,
				roadWorthinessFile: roadWorthinessFile || null,
				governmentIdType: govIdType,
				guarantorName,
				guarantorPhone,
				guarantorRelationship,
				governmentIdFile: governmentIdFile || null,
				guarantorIdFile: guarantorIdFile || null,
				carImageFile: carImageFile || null,
				riderImageFile: riderImageFile || null,
				status: 'under_review',
			});
		}

		return res.status(200).json({
			success: true,
			message: "KYC submitted successfully and is now under review.",
		});
	} catch (error) {
		console.error("Submit KYC Error:", error);
		return res.status(500).json({ success: false, message: "Internal Server Error" });
	}
};

// 6. Get Rider KYC Status
export const getKYCStatus = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const riderId = req.user?.id;
		if (!riderId) {
			return res.status(401).json({ success: false, message: "Unauthorized" });
		}

		const [kyc] = await db
			.select({ status: riderKyc.status })
			.from(riderKyc)
			.where(eq(riderKyc.riderId, riderId))
			.limit(1);

		return res.status(200).json({
			success: true,
			status: kyc ? kyc.status : 'unsubmitted',
		});
	} catch (error) {
		console.error("Get KYC Status Error:", error);
		return res.status(500).json({ success: false, message: "Internal Server Error" });
	}
};
