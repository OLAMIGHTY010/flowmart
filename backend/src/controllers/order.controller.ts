import { Request, Response } from "express";
import { db } from "../../db";
import { products, orders, orderItems, users, vendorProfiles, vendorKyc } from "../../db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { sendInAppNotification, broadcastNewDelivery } from "../services/websocket";
import { emailService } from "../services/email.service";
import crypto from "crypto";

// Escrow Services
import { createTransferRecipient, initiatePayout, initializeTransaction } from "../services/paystack.service";
import { creditPendingBalance, releaseEscrowToAvailable, deductAvailableBalance } from "../services/ledger.service";
import { PricingService } from "../services/pricing.service";
import { globalSettings, orderDelivery } from "../../db/schema";

// Helper to generate FLW-YYYYMMDD-XXXX Securely
const generateOrderRef = () => {
	const date = new Date();
	const yyyy = date.getFullYear();
	const mm = String(date.getMonth() + 1).padStart(2, '0');
	const dd = String(date.getDate()).padStart(2, '0');
	const randomSeq = crypto.randomInt(1000, 9999).toString(); 
	return `FLW-${yyyy}${mm}${dd}-${randomSeq}`;
};

const calculateVendorNetEarnings = async (txOrDb: any, orderId: string, vendorId: string, totalAmount: number) => {
    const [od] = await txOrDb.select().from(orderDelivery).where(eq(orderDelivery.orderId, orderId)).limit(1);
    const deliveryFee = od ? Number(od.finalDeliveryFee) : 0;
    const subtotal = totalAmount - deliveryFee;

    let vendorCommissionPct = 5;
    const [vendorProf] = await txOrDb.select().from(vendorProfiles).where(eq(vendorProfiles.vendorId, vendorId)).limit(1);
    if (vendorProf?.vendorCommissionPct != null) {
        vendorCommissionPct = vendorProf.vendorCommissionPct;
    } else {
        const [globalComm] = await txOrDb.select().from(globalSettings).where(eq(globalSettings.key, 'vendor_commission_pct')).limit(1);
        if (globalComm?.value) {
            vendorCommissionPct = Number(globalComm.value);
        }
    }
    
    const flowmartVendorShare = subtotal * (vendorCommissionPct / 100);
    return subtotal - flowmartVendorShare;
};

// 0. Calculate Delivery Fee
export const calculateDelivery = async (req: Request, res: Response) => {
	try {
		const { zone, distanceKm } = req.body;
		if (!zone) return res.status(400).json({ success: false, message: "Zone is required" });
		
		const deliveryCalc = await PricingService.calculateDeliveryFee(zone, distanceKm || 5);
		return res.status(200).json({ success: true, deliveryCalc });
	} catch (error: any) {
		console.error("Calculate Delivery Error:", error);
		return res.status(400).json({ 
			success: false, 
			message: "Delivery pricing is not configured for this zone. Please contact support." 
		});
	}
};

// 1. Place a New Order (Attendees)
export const placeOrder = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const attendeeId = req.user?.id;
		let { items, productId, quantity, deliveryZone, zone, payment_method } = req.body;
		const finalZone = deliveryZone || zone;

        // Gracefully support old single-item structure
        if (!items && productId && quantity) {
            items = [{ productId, quantity }];
        }

		if (!items || !Array.isArray(items) || items.length === 0 || !finalZone) {
			return res.status(400).json({ success: false, message: "Missing required order details" });
		}

		const createdOrders: any[] = [];
		const paymentMethod = payment_method || 'pay_on_delivery';
		const sessionTxRef = `SESSION-${Date.now()}-${crypto.randomInt(1000, 9999)}`;

		await db.transaction(async (tx) => {
			const vendorItemsMap = new Map<string, any[]>();
			
			for (const item of items) {
				const [product] = await tx.select().from(products).where(eq(products.id, item.productId)).limit(1);
				if (!product) throw new Error(`Product unavailable`);

				if (!vendorItemsMap.has(product.vendorId)) {
					vendorItemsMap.set(product.vendorId, []);
				}
				vendorItemsMap.get(product.vendorId)!.push({ ...item, product });
			}

			for (const [vendorId, vItems] of vendorItemsMap.entries()) {
				let totalAmountNum = 0;
				const orderRef = generateOrderRef();
				const deliveryPin = crypto.randomInt(100000, 999999).toString();

				const [newOrder] = await tx.insert(orders).values({
					orderRef, 
                    attendeeId: attendeeId!, 
                    vendorId, 
                    deliveryZone: finalZone,
					totalAmount: "0", 
                    deliveryPin, 
                    paymentMethod, 
                    transactionReference: sessionTxRef,
                    status: "pending",
				}).returning();

				for (const item of vItems) {
                    // SECURE ATOMIC SQL DEDUCTION (Resolves Race Condition)
					const [updatedProduct] = await tx.update(products)
						.set({ stockQuantity: sql`${products.stockQuantity} - ${item.quantity}` })
						.where(and(eq(products.id, item.productId), sql`${products.stockQuantity} >= ${item.quantity}`))
						.returning();

					if (!updatedProduct) throw new Error(`Product ${item.product.name} out of stock`);

					const unitPrice = updatedProduct.price;
					totalAmountNum += Number(unitPrice) * item.quantity;

					await tx.insert(orderItems).values({
						orderId: newOrder.id, 
                        productId: item.productId, 
                        quantity: item.quantity, 
                        unitPrice,
					});

					if (updatedProduct.stockQuantity === 0) {
						const [vendor] = await tx.select().from(users).where(eq(users.id, vendorId)).limit(1);
						if (vendor) {
							emailService.sendOutOfStockAlert(vendor.email, { vendorName: vendor.fullName, productName: updatedProduct.name }).catch(console.error);
						}
					}
				}

				let deliveryCalc: any = null;
				try {
					deliveryCalc = await PricingService.calculateDeliveryFee(finalZone, req.body.distanceKm || 5);
				} catch (e: any) {
					console.error("Delivery calculation failed:", e);
					throw new Error("Delivery pricing is not configured for this zone. Please contact support.");
				}

				totalAmountNum += deliveryCalc.finalDeliveryFee;

				const [finalOrder] = await tx.update(orders).set({ totalAmount: totalAmountNum.toString() }).where(eq(orders.id, newOrder.id)).returning();
				createdOrders.push(finalOrder);

				// Persist delivery calculations
				await tx.insert(orderDelivery).values({
					orderId: finalOrder.id,
					distanceKm: deliveryCalc.distanceKm.toString(),
					baseFee: deliveryCalc.baseFee.toString(),
					distanceFee: deliveryCalc.distanceFee.toString(),
					ruleAdjustments: deliveryCalc.ruleAdjustments,
					riderShare: deliveryCalc.riderShare.toString(),
					platformShare: deliveryCalc.platformShare.toString(),
					finalDeliveryFee: deliveryCalc.finalDeliveryFee.toString()
				});

				const [attendee] = await tx.select().from(users).where(eq(users.id, attendeeId!)).limit(1);
				if (attendee) {
					emailService.sendOrderReceiptEmail(attendee.email, {
						fullName: attendee.fullName, orderId: orderRef, totalAmount: totalAmountNum.toString(), deliveryPin,
						items: vItems.map(i => ({ name: i.product.name, quantity: i.quantity, price: i.product.price }))
					}).catch(console.error);
				}
			}
		});

        // Backend Payment Initialization
        if (paymentMethod === 'paystack') {
             try {
                 const orderRef = createdOrders[0].orderRef;
                 const email = req.user?.email || "customer@flowmart.com";
                 
                 // Compute grand total
                 const grandTotal = createdOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
                 
                 let paymentUrl = "";
                 
                 const initData = await initializeTransaction(email, grandTotal, sessionTxRef);
                 paymentUrl = initData.authorization_url;
                 
                 return res.status(201).json({
                     success: true, 
                     message: "Order logged. Redirecting to secure gateway...",
                     paymentUrl,
                     order: createdOrders[0], 
                     orders: createdOrders
                 });
             } catch (gatewayErr: any) {
                 console.error("Gateway Initialization Error:", gatewayErr);
                 return res.status(500).json({ success: false, message: "Could not connect to payment gateway. Please try again." });
             }
        }

		return res.status(201).json({ success: true, message: "Order placed successfully", order: createdOrders[0], orders: createdOrders });
	} catch (error: any) {
		console.error("Place Order Error:", error);
		return res.status(400).json({ success: false, message: error.message || "Internal Server Error" }); 
	}
};

// Helper: Enrich orders with their items and product details
const enrichOrderWithItems = async (order: any) => {
	const items = await db
		.select({
			id: orderItems.id,
			productId: orderItems.productId,
			quantity: orderItems.quantity,
			unitPrice: orderItems.unitPrice,
			productName: products.name,
			productImage: products.images,
			productCategory: products.category,
		})
		.from(orderItems)
		.leftJoin(products, eq(orderItems.productId, products.id))
		.where(eq(orderItems.orderId, order.id));

	const [attendee] = await db
		.select({ fullName: users.fullName, phone: users.phone })
		.from(users)
		.where(eq(users.id, order.attendeeId))
		.limit(1);

	return {
		...order,
		attendeeName: attendee?.fullName,
		attendeePhone: attendee?.phone,
		items: items.map(item => ({
			id: item.id,
			productId: item.productId,
			name: item.productName,
			productName: item.productName,
			imageUrl: item.productImage,
			category: item.productCategory,
			qty: item.quantity,
			quantity: item.quantity,
			price: item.unitPrice,
			unitPrice: item.unitPrice,
		})),
	};
};

// 2. View Orders (For both Attendees and Vendors)
export const getOrders = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user?.id;
		const role = req.user?.role;

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = (page - 1) * limit;

		let userOrders;

		if (role === "vendor") {
			userOrders = await db
				.select()
				.from(orders)
				.where(eq(orders.vendorId, userId!))
				.orderBy(desc(orders.createdAt))
                .limit(limit)
                .offset(offset);
		} else if (role === "attendee") {
			userOrders = await db
				.select()
				.from(orders)
				.where(eq(orders.attendeeId, userId!))
				.orderBy(desc(orders.createdAt))
                .limit(limit)
                .offset(offset);
		} else {
			return res.status(403).json({ success: false, message: "Unauthorized view" });
		}

		const enrichedOrders = await Promise.all(
			userOrders.map(enrichOrderWithItems)
		);

		return res.status(200).json({ success: true, orders: enrichedOrders, meta: { page, limit } });
	} catch (error) {
		console.error("Get Orders Error:", error);
		return res.status(500).json({ success: false, message: "Internal Server Error" });
	}
};

// 2b. Get Single Order by ID
export const getOrderById = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user?.id;
		const orderId = req.params.id as string;

		const [order] = await db
			.select()
			.from(orders)
			.where(eq(orders.id, orderId))
			.limit(1);

		if (!order) {
			return res.status(404).json({ success: false, message: "Order not found" });
		}

		if (order.attendeeId !== userId && order.vendorId !== userId) {
			return res.status(403).json({ success: false, message: "Unauthorized" });
		}

		const enrichedOrder = await enrichOrderWithItems(order);

		let vendorBankDetails = null;
		if (order.status === "pending") {
			const [kyc] = await db
				.select({
					bankName: vendorKyc.bankName,
					accountNumber: vendorKyc.accountNumber,
					accountName: vendorKyc.accountName,
				})
				.from(vendorKyc)
				.where(eq(vendorKyc.vendorId, order.vendorId))
				.limit(1);
			vendorBankDetails = kyc || null;
		}

		return res.status(200).json({
			success: true,
			order: enrichedOrder,
			vendorBankDetails,
		});
	} catch (error) {
		console.error("Get Order By ID Error:", error);
		return res.status(500).json({ success: false, message: "Internal Server Error" });
	}
};

// 3. Update Order Status (Vendors & Logistics)
export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const orderId = req.params.id as string;
		const { status } = req.body;
		const vendorId = req.user?.id;

		const [existingOrder] = await db.select().from(orders).where(
			and(eq(orders.id, orderId as string), eq(orders.vendorId, vendorId!))
		).limit(1);

		if (!existingOrder) {
			return res.status(404).json({ success: false, message: "Order not found or unauthorized" });
		}
		const [updatedOrder] = await db.update(orders).set({
			status,
			updatedAt: new Date(),
		}).where(eq(orders.id, orderId as string)).returning();

		sendInAppNotification(existingOrder.attendeeId, "order:statusUpdate", {
			orderId,
			status,
		});

        // Broadcast to riders if the vendor just published it for delivery
        if (status === "confirmed") {
            broadcastNewDelivery({
                orderId,
                zone: existingOrder.deliveryZone,
                vendorId: existingOrder.vendorId,
                totalAmount: existingOrder.totalAmount
            });
        }

		return res.status(200).json({
			success: true,
			message: `Order marked as ${status}`,
			order: updatedOrder,
		});
	} catch (error) {
		console.error("Update Status Error:", error);
		return res.status(500).json({ success: false, message: "Internal Server Error" });
	}
};

// 4. Attendee confirms order received (ESCROW GATEWAY)
export const confirmOrderReceived = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const orderId = req.params.id as string;
		const attendeeId = req.user?.id;

		const [existingOrder] = await db
			.select()
			.from(orders)
			.where(
				and(
					eq(orders.id, orderId),
					eq(orders.attendeeId, attendeeId!)
				)
			)
			.limit(1);

		if (!existingOrder) {
			return res.status(404).json({ success: false, message: "Order not found" });
		}

		// ✨ STATE MACHINE ESCROW LOCK: 
        // 1. The rider must have confirmed drop off (status === 'delivered')
        // 2. The attendee hitting this endpoint provides the second key.
		if (existingOrder.status !== "delivered") {
			return res.status(400).json({ success: false, message: "Action required: The rider must confirm drop-off before you can release escrow." });
		}

        // 3. Prevent Double Payouts
        if (existingOrder.paymentProofUrl === 'payout_complete') {
            return res.status(400).json({ success: false, message: "Escrow funds have already been released for this order." });
        }

        // Step A: Calculate Platform Deductions (E.g. 5% Total Platform + Paystack Gateway Fee)
        const totalAmountNaira = Number(existingOrder.totalAmount);
        const vendorShare = await calculateVendorNetEarnings(db, existingOrder.id, existingOrder.vendorId, totalAmountNaira);

        // Step B: Adjust Internal Ledgers
        await releaseEscrowToAvailable(existingOrder.vendorId, vendorShare);
        await deductAvailableBalance(existingOrder.vendorId, vendorShare);

        // Step C: Fetch Vendor KYC Bank Info for External Transfer
        const [vendorBankInfo] = await db.select().from(vendorKyc).where(eq(vendorKyc.vendorId, existingOrder.vendorId)).limit(1);
        
        if (!vendorBankInfo || !vendorBankInfo.bankName || !vendorBankInfo.accountNumber) {
            return res.status(400).json({ success: false, message: "Vendor has incomplete bank details. Payout aborted." });
        }

        // Step D: Hit Paystack APIs for Recipient & Payout
        const recipientData = await createTransferRecipient(vendorBankInfo.bankName, vendorBankInfo.accountNumber, vendorBankInfo.accountName);
        
        // Pass the strict unique orderRef to prevent duplicate network retries
        await initiatePayout(recipientData.recipient_code, vendorShare, existingOrder.orderRef);

        // Step E: Update Final Order State
		const [updatedOrder] = await db
			.update(orders)
			.set({ paymentProofUrl: "payout_complete", updatedAt: new Date() })
			.where(eq(orders.id, orderId))
			.returning();

		// Notify vendor of successful payout
		sendInAppNotification(existingOrder.vendorId, "order:statusUpdate", {
			orderId,
			status: "received_and_paid",
		});

		return res.status(200).json({
			success: true,
			message: "Order confirmed. Vendor payout initiated successfully.",
			order: updatedOrder,
		});
	} catch (error) {
		console.error("Confirm Received Error:", error);
		return res.status(500).json({ success: false, message: "Internal Server Error" });
	}
};

export const getVendorBankDetails = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const vendorId = req.params.vendorId as string;

		const [kyc] = await db
			.select({
				bankName: vendorKyc.bankName,
				accountNumber: vendorKyc.accountNumber,
				accountName: vendorKyc.accountName,
			})
			.from(vendorKyc)
			.where(eq(vendorKyc.vendorId, vendorId))
			.limit(1);

		if (!kyc) {
			return res.status(404).json({ success: false, message: "Vendor bank details not found" });
		}

		return res.status(200).json({ success: true, bankDetails: kyc });
	} catch (error) {
		console.error("Get Bank Details Error:", error);
		return res.status(500).json({ success: false, message: "Internal Server Error" });
	}
};

// 5. Paystack Server-to-Server Webhook
export const paystackWebhook = async (req: Request, res: Response) => {
    try {
        const secret = process.env.PAYSTACK_SECRET_KEY as string;
        
        // Secure HMAC SHA512 Signature Verification
        const hash = crypto.createHmac('sha512', secret)
                           .update(JSON.stringify(req.body))
                           .digest('hex');

        if (hash !== req.headers['x-paystack-signature']) {
            return res.status(401).send('Invalid signature');
        }

        const event = req.body;

        if (event.event === 'charge.success') {
            const sessionTxRef = event.data.reference;

            // Find matching orders for this session
            const sessionOrders = await db.select().from(orders).where(eq(orders.transactionReference, sessionTxRef));
            
            if (!sessionOrders || sessionOrders.length === 0) {
                return res.status(200).send('Webhook unhandled: Order not found');
            }

            for (const order of sessionOrders) {
                // Idempotency: Prevent re-processing the same success event
                if (order.status !== 'pending') {
                    continue;
                }

                // Update order status
                await db.update(orders)
                    .set({ status: 'confirmed', paymentProofUrl: 'paystack_cleared', updatedAt: new Date() })
                    .where(eq(orders.id, order.id));

                // Credit the Escrow (Pending Balance) for the vendor.
                const amountInNaira = Number(order.totalAmount); // Paystack payload is total, but we credit per order
                const vendorShare = await calculateVendorNetEarnings(db, order.id, order.vendorId, amountInNaira);

                await creditPendingBalance(order.vendorId, vendorShare);

                // Real-time Notification
                sendInAppNotification(order.attendeeId, "order:statusUpdate", {
                    orderId: order.orderRef,
                    status: "confirmed",
                });
            }
        }

        return res.status(200).send('OK');
    } catch (err) {
        console.error("Paystack Webhook Error:", err);
        // Returning 500 signals Paystack to retry sending the webhook later
        return res.status(500).send();
    }
};
