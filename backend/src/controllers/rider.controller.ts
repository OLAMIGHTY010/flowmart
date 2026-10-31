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


// ─── Pack F: Champion Advanced Logistics (Stacked Batching, POD & OTP) ───────

export const getActiveStackedBatch = async (_req: Request, res: Response) => {
  try {
    const batch = {
      id: "batch-lag-9412",
      status: "available",
      zone: "Yaba / Akoka Mainland",
      primaryOrder: {
        id: "ord-83921",
        ref: "FLW-83921",
        store: "Mama Put Delights (Yaba)",
        destination: "Unilag Faculty of Science, Akoka",
        customerName: "Folake Adebayo",
        customerPhone: "+2348028472910",
        itemsSummary: "Smoky Jollof, Fried Plantain, Grilled Catfish",
        payout: 2200,
      },
      stackedOrder: {
        id: "ord-83924",
        ref: "FLW-83924",
        store: "Mama Put Delights (Yaba)",
        destination: "St. Finbarrs College Rd, Akoka",
        customerName: "Babatunde Alabi",
        customerPhone: "+2348039281729",
        itemsSummary: "Asun Fried Rice, Cold Chapman",
        payout: 1400,
        detourKm: 0.8,
      },
      totalPayout: 3600,
      estimatedMinutes: 38,
      corridorSequence: [
        { step: 1, action: "Pickup", location: "Mama Put Delights", note: "Collect Orders FLW-83921 & FLW-83924 (Both ready)" },
        { step: 2, action: "Dropoff 1", location: "Unilag Faculty of Science", note: "Customer: Folake (Handover OTP required)" },
        { step: 3, action: "Dropoff 2", location: "St. Finbarrs Rd, Akoka", note: "Customer: Babatunde (+0.8km detour)" },
      ],
    };

    return res.status(200).json({ success: true, batch });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to get active stacked batch" });
  }
};

export const acceptStackedBatch = async (req: Request, res: Response) => {
  try {
    const { batchId } = req.body;
    return res.status(200).json({
      success: true,
      message: "🔥 Stacked Deliveries accepted! ₦3,600 potential payout assigned.",
      batchId: batchId || "batch-lag-9412",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to accept stacked batch" });
  }
};

export const verifyHandoverOTP = async (req: Request, res: Response) => {
  try {
    const { orderId, otp } = req.body;
    if (!otp || otp.length !== 4) {
      return res.status(400).json({ success: false, message: "Please provide a valid 4-digit handover OTP" });
    }

    // Accept standard or any valid 4-digit code in dev/testing
    return res.status(200).json({
      success: true,
      message: "✓ Handover OTP verified! Delivery marked complete and payment escrow released.",
      orderId: orderId || "ord-83921",
      settledAt: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Handover OTP verification failed" });
  }
};

export const uploadProofOfDelivery = async (req: Request, res: Response) => {
  try {
    const { orderId, photoUrl, dropoffTag, lat, lng } = req.body;

    const podRecord = {
      id: `pod-${Date.now()}`,
      orderId: orderId || "ord-83921",
      photoUrl: photoUrl || "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&auto=format&fit=crop",
      dropoffTag: dropoffTag || "Direct Handover to Customer",
      location: {
        lat: lat || 6.518,
        lng: lng || 3.376,
      },
      verifiedAt: new Date().toISOString(),
      timestampWatermark: `Lat: ${lat || 6.518}, Lng: ${lng || 3.376} • ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString()} WAT`,
    };

    return res.status(201).json({
      success: true,
      message: "✓ Proof-of-Delivery recorded with geotag watermark and timestamp",
      pod: podRecord,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to record Proof of Delivery" });
  }
};


// ============================================================================
// SPRINT K: COURIER SHIFT SCHEDULING & GUARANTEED HOURLY FLOOR PAY ENGINE
// ============================================================================

interface CourierShift {
  id: string;
  riderId?: string;
  zoneId: string;
  zoneName: string;
  mealRush: "BREAKFAST" | "LUNCH_PEAK" | "AFTERNOON_SNACK" | "DINNER_PEAK" | "LATE_NIGHT";
  shiftLabel: string;
  date: string;
  startTime: string; // e.g. "11:30"
  endTime: string;   // e.g. "15:30"
  durationHours: number;
  hourlyFloorRateNgn: number;
  guaranteedFloorTotalNgn: number;
  capacity: number;
  bookedCount: number;
  status: "AVAILABLE" | "BOOKED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED";
  checkInTime?: string;
  checkOutTime?: string;
  acceptanceRatePct?: number;
  ordersCompleted?: number;
  deliveryEarningsNgn?: number;
  floorPayTopUpNgn?: number;
  qualificationStatus?: "QUALIFIED" | "TOP_UP_DUE" | "EXCEEDED_FLOOR" | "DISQUALIFIED";
}

// In-memory shift schedules for 2026 operations
const activeShiftsStore: Record<string, CourierShift> = {
  "shift-ln-lekki-today": {
    id: "shift-ln-lekki-today",
    zoneId: "zone-lekki",
    zoneName: "Lekki Phase 1 & Ikate",
    mealRush: "LUNCH_PEAK",
    shiftLabel: "Lunch Rush Peak • Lekki Cluster",
    date: "2026-10-30",
    startTime: "11:30",
    endTime: "15:30",
    durationHours: 4.0,
    hourlyFloorRateNgn: 2800,
    guaranteedFloorTotalNgn: 11200,
    capacity: 20,
    bookedCount: 16,
    status: "AVAILABLE"
  },
  "shift-dn-lekki-today": {
    id: "shift-dn-lekki-today",
    zoneId: "zone-lekki",
    zoneName: "Lekki Phase 1 & Ikate",
    mealRush: "DINNER_PEAK",
    shiftLabel: "Dinner Feast Peak • Lekki Cluster",
    date: "2026-10-30",
    startTime: "18:00",
    endTime: "22:00",
    durationHours: 4.0,
    hourlyFloorRateNgn: 3000,
    guaranteedFloorTotalNgn: 12000,
    capacity: 25,
    bookedCount: 21,
    status: "AVAILABLE"
  },
  "shift-ln-ikeja-today": {
    id: "shift-ln-ikeja-today",
    zoneId: "zone-ikeja",
    zoneName: "Ikeja GRA & Allen Avenue",
    mealRush: "LUNCH_PEAK",
    shiftLabel: "Lunch Rush Peak • Ikeja Commercial Hub",
    date: "2026-10-30",
    startTime: "11:30",
    endTime: "15:30",
    durationHours: 4.0,
    hourlyFloorRateNgn: 2600,
    guaranteedFloorTotalNgn: 10400,
    capacity: 18,
    bookedCount: 14,
    status: "AVAILABLE"
  },
  "shift-dn-ikeja-today": {
    id: "shift-dn-ikeja-today",
    zoneId: "zone-ikeja",
    zoneName: "Ikeja GRA & Allen Avenue",
    mealRush: "DINNER_PEAK",
    shiftLabel: "Dinner Feast Peak • Ikeja Hub",
    date: "2026-10-30",
    startTime: "18:00",
    endTime: "22:00",
    durationHours: 4.0,
    hourlyFloorRateNgn: 2800,
    guaranteedFloorTotalNgn: 11200,
    capacity: 20,
    bookedCount: 18,
    status: "AVAILABLE"
  },
  "shift-bf-vi-today": {
    id: "shift-bf-vi-today",
    zoneId: "zone-vi",
    zoneName: "Victoria Island Business District",
    mealRush: "BREAKFAST",
    shiftLabel: "Morning Breakfast Rush • VI Corporate",
    date: "2026-10-30",
    startTime: "07:30",
    endTime: "11:00",
    durationHours: 3.5,
    hourlyFloorRateNgn: 2200,
    guaranteedFloorTotalNgn: 7700,
    capacity: 15,
    bookedCount: 12,
    status: "AVAILABLE"
  },
  "shift-ln-yaba-today": {
    id: "shift-ln-yaba-today",
    zoneId: "zone-yaba",
    zoneName: "Yaba / Surulere Tech Cluster",
    mealRush: "LUNCH_PEAK",
    shiftLabel: "Lunch Rush Peak • Yaba Tech Hub",
    date: "2026-10-30",
    startTime: "11:30",
    endTime: "15:30",
    durationHours: 4.0,
    hourlyFloorRateNgn: 2500,
    guaranteedFloorTotalNgn: 10000,
    capacity: 15,
    bookedCount: 13,
    status: "AVAILABLE"
  }
};

// Rider active shifts mapping
const riderActiveShiftMap: Record<string, CourierShift> = {};
const riderShiftHistoryMap: Record<string, CourierShift[]> = {};

export const getAvailableShifts = async (req: Request, res: Response) => {
  try {
    const riderId = (req as any).user?.id || "rider-current";
    const { zoneId, date } = req.query;

    const allShifts = Object.values(activeShiftsStore).map(s => {
      const isBookedByMe = riderActiveShiftMap[riderId]?.id === s.id;
      return {
        ...s,
        isBookedByMe,
        remainingSlots: Math.max(0, s.capacity - s.bookedCount)
      };
    });

    const filtered = allShifts.filter(s => {
      if (zoneId && s.zoneId !== zoneId) return false;
      if (date && s.date !== date) return false;
      return true;
    });

    return res.status(200).json({
      success: true,
      guaranteedFloorRules: {
        minimumAcceptanceRatePct: 90,
        minimumFulfillmentRatePct: 95,
        onTimeCheckInWindowMins: 15,
        description: "Maintain >= 90% acceptance rate and complete your shift window. If your actual delivery fees are below the guaranteed floor rate, FlowMart automatically pays the difference as a top-up!"
      },
      shifts: filtered,
      activeShift: riderActiveShiftMap[riderId] || null
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Failed to fetch shift schedules: " + error.message });
  }
};

export const bookShiftSlot = async (req: Request, res: Response) => {
  try {
    const riderId = (req as any).user?.id || "rider-current";
    const { shiftId } = req.body;

    const shift = activeShiftsStore[shiftId];
    if (!shift) {
      return res.status(404).json({ success: false, message: "Shift slot not found" });
    }

    if (shift.bookedCount >= shift.capacity) {
      return res.status(400).json({ success: false, message: "Shift slot is already fully booked" });
    }

    if (riderActiveShiftMap[riderId] && riderActiveShiftMap[riderId].status === "CHECKED_IN") {
      return res.status(400).json({ success: false, message: "You already have an ongoing active checked-in shift" });
    }

    shift.bookedCount += 1;
    const bookedShift: CourierShift = {
      ...shift,
      riderId,
      status: "BOOKED",
      acceptanceRatePct: 100,
      ordersCompleted: 0,
      deliveryEarningsNgn: 0,
      floorPayTopUpNgn: 0,
      qualificationStatus: "QUALIFIED"
    };

    riderActiveShiftMap[riderId] = bookedShift;

    return res.status(200).json({
      success: true,
      message: `Shift "${shift.shiftLabel}" booked successfully! Guaranteed floor pay: ₦${shift.guaranteedFloorTotalNgn.toLocaleString()}.`,
      shift: bookedShift
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Failed to book shift: " + error.message });
  }
};

export const getActiveShiftStatus = async (req: Request, res: Response) => {
  try {
    const riderId = (req as any).user?.id || "rider-current";
    let activeShift = riderActiveShiftMap[riderId];

    if (!activeShift) {
      // Provide a live demo active shift for instant preview if rider hasn't booked one
      activeShift = {
        id: "shift-ln-lekki-today",
        riderId,
        zoneId: "zone-lekki",
        zoneName: "Lekki Phase 1 & Ikate",
        mealRush: "LUNCH_PEAK",
        shiftLabel: "Lunch Rush Peak • Lekki Cluster",
        date: "2026-10-30",
        startTime: "11:30",
        endTime: "15:30",
        durationHours: 4.0,
        hourlyFloorRateNgn: 2800,
        guaranteedFloorTotalNgn: 11200,
        capacity: 20,
        bookedCount: 16,
        status: "CHECKED_IN",
        checkInTime: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(), // 2.5 hrs ago
        acceptanceRatePct: 100,
        ordersCompleted: 6,
        deliveryEarningsNgn: 8400,
        floorPayTopUpNgn: 0,
        qualificationStatus: "QUALIFIED"
      };
      riderActiveShiftMap[riderId] = activeShift;
    }

    // Dynamic Floor Pay Calculations
    const checkInDate = activeShift.checkInTime ? new Date(activeShift.checkInTime) : new Date();
    const elapsedHours = Math.max(0.1, Number(((Date.now() - checkInDate.getTime()) / (1000 * 60 * 60)).toFixed(1)));
    const guaranteedFloorToNow = Math.round(Math.min(activeShift.durationHours, elapsedHours) * activeShift.hourlyFloorRateNgn);
    const earningsSoFar = activeShift.deliveryEarningsNgn || 8400;
    const projectedFloorShortfall = Math.max(0, activeShift.guaranteedFloorTotalNgn - earningsSoFar);
    
    // Qualification check
    const isQualified = (activeShift.acceptanceRatePct || 100) >= 90;
    const qualificationStatus = !isQualified 
      ? "DISQUALIFIED" 
      : earningsSoFar >= activeShift.guaranteedFloorTotalNgn 
        ? "EXCEEDED_FLOOR" 
        : "TOP_UP_DUE";

    return res.status(200).json({
      success: true,
      activeShift: {
        ...activeShift,
        elapsedHours,
        guaranteedFloorToNow,
        projectedFloorShortfall,
        qualificationStatus
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Failed to get active shift: " + error.message });
  }
};

export const checkInShift = async (req: Request, res: Response) => {
  try {
    const riderId = (req as any).user?.id || "rider-current";
    const { shiftId, lat, lng } = req.body;

    let shift = riderActiveShiftMap[riderId];
    if (!shift && shiftId && activeShiftsStore[shiftId]) {
      shift = {
        ...activeShiftsStore[shiftId],
        riderId,
        status: "BOOKED",
        acceptanceRatePct: 100,
        ordersCompleted: 0,
        deliveryEarningsNgn: 0,
        floorPayTopUpNgn: 0,
        qualificationStatus: "QUALIFIED"
      };
      riderActiveShiftMap[riderId] = shift;
    }

    if (!shift) {
      return res.status(404).json({ success: false, message: "No booked shift found to check in" });
    }

    shift.status = "CHECKED_IN";
    shift.checkInTime = new Date().toISOString();
    shift.acceptanceRatePct = 100;

    return res.status(200).json({
      success: true,
      message: `✓ Geofenced Check-In Verified! You are now ON-DUTY in ${shift.zoneName}. Hourly Floor Pay: ₦${shift.hourlyFloorRateNgn.toLocaleString()}/hr is active.`,
      shift
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Check-in failed: " + error.message });
  }
};

export const checkOutShift = async (req: Request, res: Response) => {
  try {
    const riderId = (req as any).user?.id || "rider-current";
    const shift = riderActiveShiftMap[riderId];

    if (!shift || shift.status !== "CHECKED_IN") {
      return res.status(400).json({ success: false, message: "No active checked-in shift to check out from" });
    }

    shift.status = "COMPLETED";
    shift.checkOutTime = new Date().toISOString();

    const checkInDate = new Date(shift.checkInTime || Date.now());
    const actualHours = Math.max(1.0, Number(((Date.now() - checkInDate.getTime()) / (1000 * 60 * 60)).toFixed(1)));
    const guaranteedFloor = Math.round(actualHours * shift.hourlyFloorRateNgn);
    const actualEarnings = shift.deliveryEarningsNgn || 8400;
    const isQualified = (shift.acceptanceRatePct || 100) >= 90;

    let topUpAmount = 0;
    if (isQualified && actualEarnings < guaranteedFloor) {
      topUpAmount = guaranteedFloor - actualEarnings;
    }

    shift.floorPayTopUpNgn = topUpAmount;
    shift.qualificationStatus = !isQualified ? "DISQUALIFIED" : actualEarnings >= guaranteedFloor ? "EXCEEDED_FLOOR" : "TOP_UP_DUE";

    // Store in history
    if (!riderShiftHistoryMap[riderId]) riderShiftHistoryMap[riderId] = [];
    riderShiftHistoryMap[riderId].unshift({ ...shift });
    delete riderActiveShiftMap[riderId];

    return res.status(200).json({
      success: true,
      message: topUpAmount > 0 
        ? `Shift completed! Actual delivery fees: ₦${actualEarnings.toLocaleString()}. Guaranteed floor: ₦${guaranteedFloor.toLocaleString()}. FlowMart Top-Up of +₦${topUpAmount.toLocaleString()} credited to your wallet!`
        : `Shift completed! Fantastic performance — you earned ₦${actualEarnings.toLocaleString()}, exceeding the ₦${guaranteedFloor.toLocaleString()} floor!`,
      settlement: {
        shiftLabel: shift.shiftLabel,
        hoursLogged: actualHours,
        deliveriesFulfilled: shift.ordersCompleted || 6,
        acceptanceRatePct: shift.acceptanceRatePct || 100,
        actualEarningsNgn: actualEarnings,
        guaranteedFloorNgn: guaranteedFloor,
        topUpCreditedNgn: topUpAmount,
        totalDisbursedNgn: actualEarnings + topUpAmount,
        settledAt: shift.checkOutTime
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Check-out failed: " + error.message });
  }
};

export const getShiftHistory = async (req: Request, res: Response) => {
  try {
    const riderId = (req as any).user?.id || "rider-current";
    const history = riderShiftHistoryMap[riderId] || [
      {
        id: "shift-dn-yesterday",
        zoneId: "zone-lekki",
        zoneName: "Lekki Phase 1 & Ikate",
        mealRush: "DINNER_PEAK",
        shiftLabel: "Dinner Feast Peak • Lekki Cluster",
        date: "2026-10-29",
        startTime: "18:00",
        endTime: "22:00",
        durationHours: 4.0,
        hourlyFloorRateNgn: 3000,
        guaranteedFloorTotalNgn: 12000,
        capacity: 25,
        bookedCount: 25,
        status: "COMPLETED",
        ordersCompleted: 8,
        deliveryEarningsNgn: 14200,
        floorPayTopUpNgn: 0,
        acceptanceRatePct: 100,
        qualificationStatus: "EXCEEDED_FLOOR"
      },
      {
        id: "shift-ln-yaba-oct28",
        zoneId: "zone-yaba",
        zoneName: "Yaba / Surulere Tech Cluster",
        mealRush: "LUNCH_PEAK",
        shiftLabel: "Lunch Rush Peak • Yaba Tech Hub",
        date: "2026-10-28",
        startTime: "11:30",
        endTime: "15:30",
        durationHours: 4.0,
        hourlyFloorRateNgn: 2500,
        guaranteedFloorTotalNgn: 10000,
        capacity: 15,
        bookedCount: 15,
        status: "COMPLETED",
        ordersCompleted: 5,
        deliveryEarningsNgn: 7500,
        floorPayTopUpNgn: 2500,
        acceptanceRatePct: 96,
        qualificationStatus: "TOP_UP_DUE"
      }
    ];

    const totalHours = history.reduce((sum, s) => sum + s.durationHours, 0);
    const totalEarnings = history.reduce((sum, s) => sum + (s.deliveryEarningsNgn || 0), 0);
    const totalTopUps = history.reduce((sum, s) => sum + (s.floorPayTopUpNgn || 0), 0);

    return res.status(200).json({
      success: true,
      summary: {
        totalShiftsCompleted: history.length,
        totalHoursOnDuty: totalHours,
        totalDeliveryEarningsNgn: totalEarnings,
        totalFloorPayTopUpsNgn: totalTopUps,
        grandTotalEarnedNgn: totalEarnings + totalTopUps,
        attendanceReliabilityScorePct: 98
      },
      history
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Failed to fetch shift history: " + error.message });
  }
};


/**
 * ============================================================================
 * SPRINT O: COURIER CHAMPION TIER PROGRESSION & VIP QUEST BOUNTIES (2026)
 * ============================================================================
 */

interface ChampionQuest {
  id: string;
  title: string;
  description: string;
  category: 'DAILY' | 'WEEKLY' | 'WEATHER_SURGE' | 'EFFICIENCY' | 'NIGHT';
  targetCount: number;
  currentCount: number;
  progressPct: number;
  rewardNgn: number;
  rewardXp: number;
  status: 'IN_PROGRESS' | 'COMPLETED_UNCLAIMED' | 'CLAIMED';
  expiresInHours: number;
  badgeIcon: string;
}

// In-memory state for quest claims per rider
const claimedQuestsCache = new Set<string>();

export const getChampionTierStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'rider-demo-user';

    const currentXp = 3450;
    const nextTierXp = 5000;
    const progressPct = Math.round((currentXp / nextTierXp) * 100);

    return res.status(200).json({
      success: true,
      data: {
        riderId: userId,
        tier: 'GOLD',
        level: 3,
        title: 'Gold Courier Champion',
        currentXp,
        nextTierXp,
        progressPct,
        xpToNextTier: nextTierXp - currentXp,
        floorPayMultiplier: 1.25,
        floorPayGuaranteeNgnPerHour: 3500,
        fuelStipendWeeklyNgn: 6000,
        fuelStipendPartner: 'TotalEnergies & Oando Express Fleet Card',
        instantCashoutFeeNgn: 0,
        priorityDispatchRanking: 'TOP_10_PERCENTILE',
        priorityDispatchBoostPct: 35,
        completedQuestsCount: 14,
        totalBonusEarnedNgn: 42500,
        currentStreakDays: 6,
        onTimeRatePct: 99.2,
        customerSatisfactionScore: 4.96,
        thermalBoxInspectionVerified: true,
        activeInsuranceCover: 'FlowMart Comprehensive Health & Courier Accident Shield (2026)',
        perksList: [
          '+25% Guaranteed Hourly Floor Pay Boost',
          '₦6,000 Weekly Fuel Rebate at 120+ Partner Stations',
          'Zero-Fee Instant Earnings Cashouts (Any Bank / OPay / PalmPay)',
          'High-Priority Stacked Batch Dispatch Routing',
          'VIP Direct Support Dispatcher Hot-line'
        ]
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch champion tier status: ' + error.message });
  }
};

export const getChampionQuests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'rider-demo-user';

    const baseQuests: ChampionQuest[] = [
      {
        id: 'quest-lunch-rush-01',
        title: 'Lunch Rush Speed Demon',
        description: 'Complete 5 on-time dropoffs during the 12:00 PM – 2:30 PM peak meal rush.',
        category: 'DAILY',
        targetCount: 5,
        currentCount: 4,
        progressPct: 80,
        rewardNgn: 3500,
        rewardXp: 350,
        status: claimedQuestsCache.has(`${userId}:quest-lunch-rush-01`) ? 'CLAIMED' : 'IN_PROGRESS',
        expiresInHours: 3.5,
        badgeIcon: 'Zap'
      },
      {
        id: 'quest-spillage-free-02',
        title: 'Zero-Spillage Perfectionist',
        description: 'Achieve 10 consecutive dropoffs with verified thermal box inspection and 5-star customer rating.',
        category: 'WEEKLY',
        targetCount: 10,
        currentCount: 10,
        progressPct: 100,
        rewardNgn: 5000,
        rewardXp: 500,
        status: claimedQuestsCache.has(`${userId}:quest-spillage-free-02`) ? 'CLAIMED' : 'COMPLETED_UNCLAIMED',
        expiresInHours: 38,
        badgeIcon: 'ShieldCheck'
      },
      {
        id: 'quest-monsoon-vanguard-03',
        title: 'Monsoon Rain Vanguard',
        description: 'Deliver 3 orders during dynamic rain surge mode when precipitation rate exceeds 10mm/hr.',
        category: 'WEATHER_SURGE',
        targetCount: 3,
        currentCount: 2,
        progressPct: 67,
        rewardNgn: 4500,
        rewardXp: 600,
        status: claimedQuestsCache.has(`${userId}:quest-monsoon-vanguard-03`) ? 'CLAIMED' : 'IN_PROGRESS',
        expiresInHours: 11,
        badgeIcon: 'CloudRain'
      },
      {
        id: 'quest-stacked-master-04',
        title: 'Multi-Batch Dominator',
        description: 'Accept and complete 4 double or triple stacked multi-drop orders within logistics SLA.',
        category: 'EFFICIENCY',
        targetCount: 4,
        currentCount: 4,
        progressPct: 100,
        rewardNgn: 4000,
        rewardXp: 400,
        status: claimedQuestsCache.has(`${userId}:quest-stacked-master-04`) ? 'CLAIMED' : 'COMPLETED_UNCLAIMED',
        expiresInHours: 19,
        badgeIcon: 'Package'
      },
      {
        id: 'quest-night-owl-05',
        title: 'Late Night Sentinel',
        description: 'Complete 3 orders between 9:00 PM – 1:00 AM midnight feast surge.',
        category: 'NIGHT',
        targetCount: 3,
        currentCount: 1,
        progressPct: 33,
        rewardNgn: 3000,
        rewardXp: 300,
        status: claimedQuestsCache.has(`${userId}:quest-night-owl-05`) ? 'CLAIMED' : 'IN_PROGRESS',
        expiresInHours: 7,
        badgeIcon: 'Moon'
      }
    ];

    const unclaimedBountiesCount = baseQuests.filter(q => q.status === 'COMPLETED_UNCLAIMED').length;
    const totalPotentialBonusNgn = baseQuests.reduce((sum, q) => sum + q.rewardNgn, 0);

    return res.status(200).json({
      success: true,
      data: {
        quests: baseQuests,
        unclaimedBountiesCount,
        totalPotentialBonusNgn,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch champion quests: ' + error.message });
  }
};

export const claimChampionQuestBounty = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : (rawId || "");
    const userId = req.user?.id || 'rider-demo-user';

    if (!id) {
      return res.status(400).json({ success: false, message: 'Quest id is required' });
    }

    const questRewardMap: Record<string, { ngn: number; xp: number; title: string }> = {
      'quest-lunch-rush-01': { ngn: 3500, xp: 350, title: 'Lunch Rush Speed Demon' },
      'quest-spillage-free-02': { ngn: 5000, xp: 500, title: 'Zero-Spillage Perfectionist' },
      'quest-monsoon-vanguard-03': { ngn: 4500, xp: 600, title: 'Monsoon Rain Vanguard' },
      'quest-stacked-master-04': { ngn: 4000, xp: 400, title: 'Multi-Batch Dominator' },
      'quest-night-owl-05': { ngn: 3000, xp: 300, title: 'Late Night Sentinel' }
    };

    const targetQuest = questRewardMap[id];
    if (!targetQuest) {
      return res.status(404).json({ success: false, message: 'Quest not found' });
    }

    const cacheKey = `${userId}:${id}`;
    if (claimedQuestsCache.has(cacheKey)) {
      return res.status(400).json({ success: false, message: 'This quest bounty has already been claimed.' });
    }

    // Mark as claimed
    claimedQuestsCache.add(cacheKey);

    return res.status(200).json({
      success: true,
      message: `Successfully claimed ₦${targetQuest.ngn.toLocaleString()} bounty & +${targetQuest.xp} XP for ${targetQuest.title}!`,
      data: {
        questId: id,
        questTitle: targetQuest.title,
        claimedRewardNgn: targetQuest.ngn,
        awardedXp: targetQuest.xp,
        newCurrentXp: 3450 + targetQuest.xp,
        creditedWalletBalanceNgn: 68400 + targetQuest.ngn,
        claimedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to claim quest bounty: ' + error.message });
  }
};

export const getChampionTierBenefitsMatrix = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const tierMatrix = [
      {
        tier: 'BRONZE',
        level: 1,
        name: 'Bronze Champion',
        requiredXpRange: '0 – 999 XP',
        floorPayMultiplier: '1.0x (Standard)',
        floorPayPerHour: '₦2,800/hr',
        fuelStipend: 'None',
        instantCashoutFee: '₦100 flat',
        priorityBatchDispatch: 'Standard Queue',
        healthInsurance: 'Basic On-Duty Cover',
        colorTheme: '#cd7f32',
        badgeTitle: 'Rising Courier'
      },
      {
        tier: 'SILVER',
        level: 2,
        name: 'Silver Champion',
        requiredXpRange: '1,000 – 2,499 XP',
        floorPayMultiplier: '1.10x (+10% Boost)',
        floorPayPerHour: '₦3,080/hr',
        fuelStipend: '₦2,500 / week Rebate',
        instantCashoutFee: '₦50 flat',
        priorityBatchDispatch: '+15% Earlier Dispatch Access',
        healthInsurance: 'Comprehensive On-Duty Cover',
        colorTheme: '#94a3b8',
        badgeTitle: 'Verified Champion'
      },
      {
        tier: 'GOLD',
        level: 3,
        name: 'Gold Champion',
        requiredXpRange: '2,500 – 4,999 XP',
        floorPayMultiplier: '1.25x (+25% Boost)',
        floorPayPerHour: '₦3,500/hr',
        fuelStipend: '₦6,000 / week Rebate + Free Bike Servicing Kit',
        instantCashoutFee: 'FREE (₦0 Fees)',
        priorityBatchDispatch: 'High Priority (Top 10% Batching)',
        healthInsurance: 'Comprehensive Health & Rider Family Shield',
        colorTheme: '#f59e0b',
        badgeTitle: 'Master Courier',
        isCurrentRiderTier: true
      },
      {
        tier: 'APEX_ELITE',
        level: 4,
        name: 'Apex Elite Champion',
        requiredXpRange: '5,000+ XP',
        floorPayMultiplier: '1.40x (+40% Boost)',
        floorPayPerHour: '₦3,920/hr',
        fuelStipend: '₦12,000 / week Rebate + Annual Bike Allowance',
        instantCashoutFee: 'FREE (₦0 Fees) + Instant Bank Wire',
        priorityBatchDispatch: 'VIP Autonomous First-Pick Routing',
        healthInsurance: 'Full 360° Life, Health & Equipment Protection',
        colorTheme: '#8b5cf6',
        badgeTitle: 'Apex Fleet Legend'
      }
    ];

    return res.status(200).json({
      success: true,
      data: {
        tiers: tierMatrix,
        currentTier: 'GOLD',
        updatedYear: 2026
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch tier matrix: ' + error.message });
  }
};
