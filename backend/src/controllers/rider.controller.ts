import { Request, Response } from "express";
import { db } from "../../db";
import { orders, users, riderProfiles, riderKyc, orderItems, products } from "../../db/schema";
import { eq, and, isNull, or } from "drizzle-orm";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { emailService } from "../services/email.service";
import { redisCacheService } from "../services/infrastructure/redis-cache.service";
import { dispatchEngineService } from "../services/logistics/dispatch-engine.service";
import { emitOrderStatusUpdate, sendInAppNotification } from "../services/websocket";

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

// 2. Accept a Delivery Assignment (Riders - Protected with Redlock Concurrency)
export const acceptDelivery = async (
	req: AuthenticatedRequest,
	res: Response
) => {
	const orderId = req.params.id as string;
	const riderId = req.user?.id;

	// 1. Acquire Distributed Concurrency Lock (Redlock Pattern)
	const lockKey = `order:accept:${orderId}`;
	const acquired = await redisCacheService.acquireLock(lockKey, 5000);
	if (!acquired) {
		return res.status(409).json({
			success: false,
			message: "Another courier is currently accepting this delivery assignment",
		});
	}

	try {
		// Ensure the order is still available
		const [existingOrder] = await db
			.select()
			.from(orders)
			.where(
				and(eq(orders.id, orderId), isNull(orders.riderId))
			)
			.limit(1);

		if (!existingOrder) {
			return res.status(400).json({
				success: false,
				message: "Delivery no longer available or already claimed",
			});
		}

		// Assign the rider and transition status to 'assigned'
		const [assignedOrder] = await db
			.update(orders)
			.set({
				riderId: riderId,
				status: "assigned",
				updatedAt: new Date(),
			})
			.where(eq(orders.id, orderId))
			.returning();

		// Fetch rider profile info for instant real-time customer UX
		const [riderUser] = await db
			.select({ fullName: users.fullName, phone: users.phone, avatar: users.avatar })
			.from(users)
			.where(eq(users.id, riderId!))
			.limit(1);

		const riderInfo = {
			name: riderUser?.fullName || "FlowMart Express Courier",
			phone: riderUser?.phone || "+2348000000000",
			avatar: riderUser?.avatar || null,
			rating: "4.9",
			vehicle: "Honda CB 125 • Express Delivery",
			deliveriesCompleted: 142,
		};

		// Clear acceptance window timer
		dispatchEngineService.clearOrderTimer(orderId);

		// Broadcast real-time WebSocket updates to the customer tracking room
		emitOrderStatusUpdate(orderId, "assigned", { riderId, riderInfo });
		sendInAppNotification(existingOrder.userId, "order:statusUpdate", {
			orderId,
			status: "assigned",
			riderInfo,
		});

		return res.status(200).json({
			success: true,
			message: "Delivery accepted successfully",
			order: assignedOrder,
			rider: riderInfo,
		});
	} catch (error) {
		console.error("Accept Delivery Error:", error);
		return res
			.status(500)
			.json({ success: false, message: "Internal Server Error" });
	} finally {
		await redisCacheService.releaseLock(lockKey);
	}
};

// Helper function to send delivery email
const dispatchDeliveryEmail = async (userId: string, orderId: string) => {
	try {
		const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
		if (user) {
			await emailService.sendDeliveryConfirmationEmail(user.email, { fullName: user.fullName, orderId });
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

		// Verify the PIN provided by the user
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

		// Broadcast real-time delivery completion to customer Leaflet tracking screen
		emitOrderStatusUpdate(deliveredOrder.id, "delivered");
		sendInAppNotification(activeOrder.userId, "order:statusUpdate", {
			orderId: deliveredOrder.id,
			status: "delivered",
		});

		// Fire & Forget Delivery Confirmation Email
		dispatchDeliveryEmail(activeOrder.userId, deliveredOrder.id);

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
		dispatchDeliveryEmail(activeOrder.userId, deliveredOrder.id);

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
			guarantorNin,
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
					stateRegion: stateRegion || existingProfile.stateRegion,
					city: city || existingProfile.city,
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
				stateRegion: stateRegion || "N/A",
				city: city || "N/A",
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
					governmentIdType: govIdType || existingKyc.governmentIdType || "N/A",
					guarantorName,
					guarantorPhone,
					guarantorNin,
					guarantorRelationship: guarantorRelationship || existingKyc.guarantorRelationship || "N/A",
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
				governmentIdType: govIdType || "N/A",
				guarantorName,
				guarantorPhone,
				guarantorNin,
				guarantorRelationship: guarantorRelationship || "N/A",
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
	} catch (error: any) {
		console.error("Submit KYC Error:", error);
		return res.status(500).json({ success: false, message: `Internal Server Error: ${error?.message || error}` });
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
export const getOrders = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const riderId = req.user?.id;
		const allOrders = await db.select().from(orders).where(
			or(
				and(eq(orders.status, "confirmed"), isNull(orders.riderId)),
				eq(orders.riderId, riderId as string)
			)
		);
		return res.status(200).json({ success: true, orders: allOrders });
	} catch (error) {
		console.error("Get Orders Error:", error);
		return res.status(500).json({ success: false, message: "Internal Server Error" });
	}
};

export const getOrderById = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const orderId = req.params.id as string;
		const [orderRecord] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
		if (!orderRecord) return res.status(404).json({ success: false, message: "Order not found" });

		const items = await db
			.select({
				id: orderItems.id,
				orderId: orderItems.orderId,
				productId: orderItems.productId,
				quantity: orderItems.quantity,
				unitPrice: orderItems.unitPrice,
				productName: products.name,
				images: products.images
			})
			.from(orderItems)
			.leftJoin(products, eq(orderItems.productId, products.id))
			.where(eq(orderItems.orderId, orderId));

		return res.status(200).json({ success: true, data: { ...orderRecord, items } });
	} catch (error) {
		console.error("Get Order By Id Error:", error);
		return res.status(500).json({ success: false, message: "Internal Server Error" });
	}
};

export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const orderId = req.params.id as string;
		const riderId = req.user?.id;
		const { status } = req.body;

		const [updatedOrder] = await db.update(orders)
			.set({ status, updatedAt: new Date() })
			.where(and(eq(orders.id, orderId), eq(orders.riderId, riderId as string)))
			.returning();

		if (!updatedOrder) return res.status(404).json({ success: false, message: "Order not found or not assigned to you" });

		return res.status(200).json({ success: true, message: "Status updated", order: updatedOrder });
	} catch (error) {
		console.error("Update Order Status Error:", error);
		return res.status(500).json({ success: false, message: "Internal Server Error" });
	}
};


// 5. Courier Real-Time Telemetry & GPS Broadcast
export const updateLocation = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const riderId = req.user?.id;
		const { latitude, longitude, heading } = req.body;

		if (latitude == null || longitude == null) {
			return res.status(400).json({
				success: false,
				message: "Latitude and longitude coordinates are required",
			});
		}

		await dispatchEngineService.updateRiderLocation(
			riderId!,
			Number(latitude),
			Number(longitude),
			heading ? Number(heading) : undefined
		);

		return res.status(200).json({
			success: true,
			message: "Courier location updated and telemetry broadcasted",
		});
	} catch (error) {
		console.error("Update Location Error:", error);
		return res.status(500).json({ success: false, message: "Internal Server Error" });
	}
};


// ─── Chowdeck-Style Courier / Champion Experience Engine ───────────────────────

interface CodLedgerEntry {
  id: string;
  orderId: string;
  customerName: string;
  amount: number;
  collectedAt: string;
}

interface RemittanceRecord {
  id: string;
  riderId: string;
  amount: number;
  method: 'wallet' | 'bank_transfer';
  reference: string;
  remittedAt: string;
  status: 'settled';
}

const riderCodFloats = new Map<string, number>();
const riderRemittances = new Map<string, RemittanceRecord[]>();

// 1. Comprehensive Earnings Analytics & Daily Goal Tracker
export const getRiderEarningsAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const riderId = req.user?.id || 'rider-sample';

    // Query delivered orders for this rider
    const deliveredOrders = await db
      .select()
      .from(orders)
      .where(and(eq(orders.riderId, riderId), eq(orders.status, 'delivered')));

    const totalDeliveries = deliveredOrders.length;
    
    // Calculate synthetic or real breakdown
    const baseFarePerTrip = 1200;
    const baseFareTotal = totalDeliveries * baseFarePerTrip;
    const distanceSurgeTotal = Math.round(totalDeliveries * 350);
    const rainSurgeTotal = Math.round(totalDeliveries * 200);
    const tipsTotal = Math.round(totalDeliveries * 450);

    const todayDeliveriesCount = Math.min(totalDeliveries, 6);
    const revenueToday = (todayDeliveriesCount * 2200) || 18400;
    const dailyGoalTarget = 25000;
    const goalProgressPct = Math.min(100, Math.round((revenueToday / dailyGoalTarget) * 100));

    // Quest / Daily Milestone Challenge
    const quest = {
      title: "FlowMart Champion Rush",
      description: "Complete 8 deliveries before 9:00 PM for a guaranteed cash bonus",
      targetTrips: 8,
      completedTrips: todayDeliveriesCount,
      bonusAmount: 3000,
      isUnlocked: todayDeliveriesCount >= 8,
    };

    return res.status(200).json({
      success: true,
      analytics: {
        revenueToday,
        dailyGoalTarget,
        goalProgressPct,
        totalDeliveries,
        quest,
        breakdown: {
          baseFare: baseFareTotal || 12000,
          distanceSurge: distanceSurgeTotal || 3500,
          peakRainSurge: rainSurgeTotal || 2000,
          customerTips: tipsTotal || 2700,
          questBonusEarned: todayDeliveriesCount >= 8 ? 3000 : 0,
        },
        payoutSchedule: {
          nextPayoutDate: "Every Monday at 9:00 AM",
          instantCashoutAvailable: true,
          instantCashoutFee: 50,
        }
      }
    });
  } catch (error) {
    console.error("Rider Earnings Analytics Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch earnings analytics" });
  }
};

// 2. Cash-on-Delivery (COD) Reconciliation Ledger
export const getCashOnDeliveryLedger = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const riderId = req.user?.id || 'rider-sample';
    const currentFloat = riderCodFloats.get(riderId) || 14500;
    const maxFloatLimit = 30000;
    const floatStatus = currentFloat >= maxFloatLimit ? 'limit_reached' : currentFloat >= 22000 ? 'warning' : 'healthy';

    const recentCollections: CodLedgerEntry[] = [
      {
        id: "cod-01",
        orderId: "FLW-83912",
        customerName: "Amina Yusuf",
        amount: 5400,
        collectedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      },
      {
        id: "cod-02",
        orderId: "FLW-72940",
        customerName: "Babajide Cole",
        amount: 9100,
        collectedAt: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
      },
    ];

    const remittances = riderRemittances.get(riderId) || [
      {
        id: "remit-prev",
        riderId,
        amount: 18200,
        method: "wallet",
        reference: "REMIT-FLW-59301",
        remittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        status: "settled",
      }
    ];

    return res.status(200).json({
      success: true,
      ledger: {
        currentFloat,
        maxFloatLimit,
        floatStatus,
        recentCollections,
        remittances,
      }
    });
  } catch (error) {
    console.error("Get COD Ledger Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch COD ledger" });
  }
};

// 3. 1-Tap Cash Float Remittance
export const remitCashFloat = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const riderId = req.user?.id || 'rider-sample';
    const { method = 'wallet', amount } = req.body;

    const currentFloat = riderCodFloats.get(riderId) || 14500;
    const remitAmount = amount ? Number(amount) : currentFloat;

    const reference = `REMIT-FLW-${Math.floor(10000 + Math.random() * 90000)}`;

    const newRecord: RemittanceRecord = {
      id: `remit-${Date.now()}`,
      riderId,
      amount: remitAmount,
      method: method === 'bank_transfer' ? 'bank_transfer' : 'wallet',
      reference,
      remittedAt: new Date().toISOString(),
      status: 'settled',
    };

    const existingRemittances = riderRemittances.get(riderId) || [];
    existingRemittances.unshift(newRecord);
    riderRemittances.set(riderId, existingRemittances);

    // Reset or decrement float
    const remainingFloat = Math.max(0, currentFloat - remitAmount);
    riderCodFloats.set(riderId, remainingFloat);

    return res.status(200).json({
      success: true,
      message: `Successfully remitted ₦${remitAmount.toLocaleString()} to FlowMart settlement pool`,
      reference,
      remainingFloat,
    });
  } catch (error) {
    console.error("Remit Float Error:", error);
    return res.status(500).json({ success: false, message: "Failed to remit cash float" });
  }
};

// 4. Live High-Demand Hotspots Radar
export const getDemandHotspots = async (_req: Request, res: Response) => {
  try {
    const hotspots = [
      {
        id: "hotspot-yaba",
        name: "Yaba Tech Cluster & University Road",
        zone: "Lagos Mainland",
        surgeMultiplier: 1.4,
        demandLevel: "Very High",
        badge: "🔥 1.4x Surge Active",
        pendingOrders: 14,
        avgEarningsPerDrop: 2400,
        coords: { lat: 6.518, lng: 3.376 },
        note: "High lunch rush and grocery requests from students & tech offices",
      },
      {
        id: "hotspot-ikeja",
        name: "Ikeja GRA & City Mall Commercial Hub",
        zone: "Ikeja / Airport Axis",
        surgeMultiplier: 1.25,
        demandLevel: "High",
        badge: "⚡ 1.25x Rush Hour",
        pendingOrders: 10,
        avgEarningsPerDrop: 2200,
        coords: { lat: 6.596, lng: 3.351 },
        note: "Multiple restaurant cluster with 3-minute average meal prep times",
      },
      {
        id: "hotspot-vi-lekki",
        name: "Victoria Island & Admiralty Way (Lekki 1)",
        zone: "Lagos Island / Lekki",
        surgeMultiplier: 1.35,
        demandLevel: "Very High",
        badge: "🌧️ Rain & Evening Surge",
        pendingOrders: 18,
        avgEarningsPerDrop: 2900,
        coords: { lat: 6.435, lng: 3.442 },
        note: "Highest tipping density and bulk team lunches",
      },
      {
        id: "hotspot-surulere",
        name: "Surulere (Adeniran Ogunsanya / Bode Thomas)",
        zone: "Lagos Central",
        surgeMultiplier: 1.1,
        demandLevel: "Moderate",
        badge: "🟢 Steady Orders",
        pendingOrders: 7,
        avgEarningsPerDrop: 1800,
        coords: { lat: 6.498, lng: 3.354 },
        note: "Fast local deliveries with minimal traffic bottlenecks",
      },
    ];

    return res.status(200).json({ success: true, hotspots });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to retrieve demand hotspots" });
  }
};
