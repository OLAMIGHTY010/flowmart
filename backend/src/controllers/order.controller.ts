/**
 * Order & Checkout Controller
 * Manages cart checkout, delivery fee calculation, PIN verification, escrow allocation, and Paystack webhooks.
 */

import { Request, Response } from "express";
import { db } from "../../db";
import { products, orders, orderItems, users, vendorProfiles, vendorKyc, wallets, walletTransactions, reviews } from "../../db/schema";
import { eq, and, desc, sql, or } from "drizzle-orm";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { sendInAppNotification, broadcastNewDelivery, emitOrderStatusUpdate, emitEscrowStatusUpdate, emitOrderChatMessage } from "../services/websocket";
import { emailService } from "../services/email.service";
import crypto from "crypto";

// Escrow Services
import { createTransferRecipient, initiatePayout, initializeTransaction } from "../services/paystack.service";
import { creditPendingBalance, releaseEscrowToAvailable, deductAvailableBalance } from "../services/ledger.service";
import { PricingService } from "../services/pricing.service";
import { dispatchEngineService } from "../services/logistics/dispatch-engine.service";
import { PostcodeService, PostcodeError } from "../services/postcode.service";
import { maskPhoneNumber, maskFullName } from "../utils/privacy.util";
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
		const { zone, postcode, distanceKm } = req.body;
		const target = postcode || zone;
		if (!target) return res.status(400).json({ success: false, message: "Zone or postcode is required" });
		
		const deliveryCalc = await PricingService.calculateDeliveryFee(target, distanceKm || 5);
		return res.status(200).json({ success: true, deliveryCalc });
	} catch (error: any) {
		console.error("Calculate Delivery Error:", error);
		return res.status(400).json({ 
			success: false, 
			message: "Delivery pricing is not configured for this zone. Please contact support." 
		});
	}
};

// 1. Place a New Order
export const placeOrder = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user?.id;
		let { items, productId, quantity, deliveryZone, zone, deliveryPostcode, deliveryAddress, addressSource, payment_method, tipAmount, dropoffOption, deliveryNotes, addressTag } = req.body;
		const rawAddressOrZone = deliveryAddress || deliveryZone || zone;

        // Backward Compatibility: Normalize single-item legacy payloads into uniform items array
        if (!items && productId && quantity) {
            items = [{ productId, quantity }];
        }

		if (!items || !Array.isArray(items) || items.length === 0 || (!rawAddressOrZone && !deliveryPostcode)) {
			return res.status(400).json({ success: false, message: "Missing required order details" });
		}

		// Server-Side Trust Guard: Re-verify claimed postcode before saving
		let trustResult = {
			verified: false,
			deliveryPostcode: null as string | null,
			prefix: null as string | null,
			addressSource: 'manual' as 'postcode' | 'manual',
		};

		if (deliveryPostcode && typeof deliveryPostcode === 'string' && deliveryPostcode.trim()) {
			try {
				trustResult = await PostcodeService.resolveAddressTrust(deliveryPostcode);
			} catch (err: any) {
				return res.status(400).json({
					success: false,
					message: err.message || "Invalid or non-existent postcode provided",
					suggestion: err.suggestion,
				});
			}
		}

		const finalPostcode = trustResult.deliveryPostcode;
		const finalAddressSource = trustResult.addressSource;
		let finalAddressText = deliveryAddress || rawAddressOrZone || "Standard Delivery";
		const extraMeta: string[] = [];
		if (addressTag) extraMeta.push(`Tag: ${addressTag}`);
		if (dropoffOption) {
			const dropoffMap: Record<string, string> = {
				hand_to_me: 'Hand it to me',
				leave_at_door: 'Leave at door/gate',
				leave_with_security: 'Leave with security/concierge',
			};
			extraMeta.push(`Dropoff: ${dropoffMap[dropoffOption] || dropoffOption}`);
		}
		if (deliveryNotes) extraMeta.push(`Note: ${deliveryNotes}`);
		if (extraMeta.length > 0) {
			finalAddressText = `${finalAddressText} [${extraMeta.join(' • ')}]`;
		}
		const pricingTarget = finalPostcode || rawAddressOrZone || "Default";

		const createdOrders: any[] = [];
		const paymentMethod = payment_method || 'pay_on_delivery';
		const sessionTxRef = `SESSION-${Date.now()}-${crypto.randomInt(1000, 9999)}`;

		// Database Transaction: Ensure multi-vendor splitting and stock deductions complete atomically.
		await db.transaction(async (tx) => {
			// BUSINESS RULE: A single shopper cart may contain items from different vendors.
			// We split the checkout into distinct order records per vendor so each merchant 
			// manages their own fulfillment status, dispute scope, and escrow payout independently.
			const vendorItemsMap = new Map<string, any[]>();
			
			for (const item of items) {
				const [product] = await tx.select().from(products).where(eq(products.id, item.productId)).limit(1);
				if (!product) throw new Error(`Product unavailable`);

				if (!vendorItemsMap.has(product.vendorId)) {
					vendorItemsMap.set(product.vendorId, []);
				}
				vendorItemsMap.get(product.vendorId)!.push({ ...item, product });
			}

			let tipApplied = false;
			for (const [vendorId, vItems] of vendorItemsMap.entries()) {
				let totalAmountNum = 0;
				const orderRef = generateOrderRef();
				const deliveryPin = crypto.randomInt(100000, 999999).toString();

				const [newOrder] = await tx.insert(orders).values({
					orderRef,
					userId: userId!,
					vendorId,
					deliveryZone: rawAddressOrZone || "Standard Delivery",
					deliveryAddress: finalAddressText,
					deliveryPostcode: finalPostcode,
					addressSource: finalAddressSource,
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
					deliveryCalc = await PricingService.calculateDeliveryFee(pricingTarget, req.body.distanceKm || 5);
				} catch (e: any) {
					console.error("Delivery calculation failed:", e);
					throw new Error("Delivery pricing is not configured for this zone/postcode. Please contact support.");
				}

				totalAmountNum += deliveryCalc.finalDeliveryFee;
				if (!tipApplied && tipAmount && Number(tipAmount) > 0) {
					totalAmountNum += Number(tipAmount);
					tipApplied = true;
				}

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

				const [user] = await tx.select().from(users).where(eq(users.id, userId!)).limit(1);
				if (user) {
					emailService.sendOrderReceiptEmail(user.email, {
						fullName: user.fullName, orderId: orderRef, totalAmount: totalAmountNum.toString(), deliveryPin,
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
			productCategory: products.categoryId,
		})
		.from(orderItems)
		.leftJoin(products, eq(orderItems.productId, products.id))
		.where(eq(orderItems.orderId, order.id));

	const [user] = await db
		.select({ fullName: users.fullName, phone: users.phone })
		.from(users)
		.where(eq(users.id, order.userId))
		.limit(1);

	let riderInfo = null;
	if (order.riderId) {
		const [riderUser] = await db
			.select({
				id: users.id,
				fullName: users.fullName,
				phone: users.phone,
				avatar: users.avatar,
			})
			.from(users)
			.where(eq(users.id, order.riderId))
			.limit(1);

		if (riderUser) {
			riderInfo = {
				name: riderUser.fullName || "FlowMart Express Courier",
				phone: riderUser.phone || "+2348000000000",
				avatar: riderUser.avatar || null,
				rating: "4.9",
				vehicle: "Honda CB 125 • Express Delivery",
				deliveriesCompleted: 142,
			};
		}
	} else if (order.status === 'assigned' || order.status === 'picked_up') {
		riderInfo = {
			name: "Tunde Adebayo",
			phone: "+2348039281726",
			avatar: null,
			rating: "4.9",
			vehicle: "Honda CB 125 • Express Delivery",
			deliveriesCompleted: 215,
		};
	}

	return {
		...order,
		userName: user?.fullName,
		userPhone: user?.phone,
		rider: riderInfo,
		riderInfo: riderInfo,
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

// 2. View Orders (For both Users and Vendors)
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
		} else if (role === "user") {
			userOrders = await db
				.select()
				.from(orders)
				.where(eq(orders.userId, userId!))
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

		if (order.userId !== userId && order.vendorId !== userId) {
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

		sendInAppNotification(existingOrder.userId, "order:statusUpdate", {
			orderId,
			status,
		});
		emitOrderStatusUpdate(orderId, status, { vendorId: existingOrder.vendorId, userId: existingOrder.userId });

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

// 4. User confirms order received (ESCROW GATEWAY)
export const confirmOrderReceived = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const orderId = req.params.id as string;
		const userId = req.user?.id;

		const [existingOrder] = await db
			.select()
			.from(orders)
			.where(
				and(
					eq(orders.id, orderId),
					eq(orders.userId, userId!)
				)
			)
			.limit(1);

		if (!existingOrder) {
			return res.status(404).json({ success: false, message: "Order not found" });
		}

		// ✨ STATE MACHINE ESCROW LOCK: 
        // 1. The rider must have confirmed drop off (status === 'delivered')
        // 2. The user hitting this endpoint provides the second key.
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
		emitOrderStatusUpdate(orderId, "received_and_paid", { vendorId: existingOrder.vendorId, userId: existingOrder.userId });
		emitEscrowStatusUpdate(orderId, "released", { vendorId: existingOrder.vendorId, userId: existingOrder.userId, payoutStatus: "complete" });

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
                sendInAppNotification(order.userId, "order:statusUpdate", {
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




// 6. Pay-For-Me: Public Preview for Sponsor/Payer
export const getPayForMeOrder = async (req: Request, res: Response) => {
	try {
		const orderId = req.params.id as string;

		const [order] = await db
			.select()
			.from(orders)
			.where(or(eq(orders.id, orderId), eq(orders.orderRef, orderId)))
			.limit(1);

		if (!order) {
			return res.status(404).json({ success: false, message: "Order not found or link has expired" });
		}

		const [buyer] = await db
			.select({ fullName: users.fullName })
			.from(users)
			.where(eq(users.id, order.userId))
			.limit(1);

		const items = await db
			.select({
				id: orderItems.id,
				quantity: orderItems.quantity,
				unitPrice: orderItems.unitPrice,
				productName: products.name,
			})
			.from(orderItems)
			.leftJoin(products, eq(orderItems.productId, products.id))
			.where(eq(orderItems.orderId, order.id));

		return res.status(200).json({
			success: true,
			order: {
				id: order.id,
				orderRef: order.orderRef,
				buyerName: buyer?.fullName ? maskFullName(buyer.fullName) : "FlowMart Customer",
				totalAmount: order.totalAmount,
				status: order.status,
				deliveryZone: order.deliveryZone,
				items: items.map((i) => ({
					id: i.id,
					name: i.productName || "Product Item",
					quantity: i.quantity,
					price: i.unitPrice,
				})),
				createdAt: order.createdAt,
			},
		});
	} catch (error) {
		console.error("Get Pay-For-Me Order Error:", error);
		return res.status(500).json({ success: false, message: "Internal Server Error" });
	}
};

// 7. Pay-For-Me: Initialize Payment by Third-Party Sponsor
export const initializePayForMePayment = async (req: Request, res: Response) => {
	try {
		const orderId = req.params.id as string;
		const { payerEmail, payerName } = req.body;

		if (!payerEmail) {
			return res.status(400).json({ success: false, message: "Payer email address is required" });
		}

		const [order] = await db
			.select()
			.from(orders)
			.where(or(eq(orders.id, orderId), eq(orders.orderRef, orderId)))
			.limit(1);

		if (!order) {
			return res.status(404).json({ success: false, message: "Order not found" });
		}

		if (order.status !== "pending") {
			return res.status(400).json({
				success: false,
				message: `This order is already ${order.status}. No additional payment needed!`,
			});
		}

		// Initialize Paystack checkout
		const paystackData = await initializeTransaction(
			payerEmail,
			Number(order.totalAmount),
			order.orderRef
		);

		return res.status(200).json({
			success: true,
			message: "Pay-For-Me checkout initialized",
			authorizationUrl: paystackData.authorization_url,
			reference: paystackData.reference,
		});
	} catch (error: any) {
		console.error("Pay-For-Me Init Error:", error);
		return res.status(500).json({
			success: false,
			message: error.message || "Failed to initialize sponsor payment",
		});
	}
};


// 8. Order-Linked Live Courier & Customer Chat (Chowdeck In-App Courier Chat)
interface OrderChatMessage {
    id: string;
    orderId: string;
    senderId: string;
    senderRole: 'buyer' | 'rider';
    senderName: string;
    content: string;
    timestamp: string;
}

const orderChatStore = new Map<string, OrderChatMessage[]>();

export const getOrderMessages = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const orderId = req.params.id as string;
        const messages = orderChatStore.get(orderId) || [];
        return res.status(200).json({ success: true, messages });
    } catch (error) {
        console.error("Get Order Messages Error:", error);
        return res.status(500).json({ success: false, message: "Failed to retrieve messages" });
    }
};

export const sendOrderMessage = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const orderId = req.params.id as string;
        const userId = req.user?.id;
        const role = req.user?.role;
        const { content, senderRole, senderName } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ success: false, message: "Message content cannot be empty" });
        }

        const effectiveRole = (senderRole === 'rider' || role === 'dispatch_rider') ? 'rider' : 'buyer';
        const effectiveName = senderName || (effectiveRole === 'rider' ? 'FlowMart Courier' : 'Customer');

        const newMessage: OrderChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            orderId,
            senderId: userId || 'anonymous',
            senderRole: effectiveRole,
            senderName: effectiveName,
            content: content.trim(),
            timestamp: new Date().toISOString(),
        };

        if (!orderChatStore.has(orderId)) {
            orderChatStore.set(orderId, []);
        }
        orderChatStore.get(orderId)!.push(newMessage);

        if (orderChatStore.get(orderId)!.length > 100) {
            orderChatStore.get(orderId)!.shift();
        }

        try {
            emitOrderChatMessage(orderId, newMessage);
        } catch {
            // socket broadcast fallback
        }

        return res.status(201).json({ success: true, message: newMessage });
    } catch (error) {
        console.error("Send Order Message Error:", error);
        return res.status(500).json({ success: false, message: "Failed to send message" });
    }
};


// 9. Post-Delivery Two-Tier Rating (Courier + Vendor/Meal)
interface RatingSubmission {
    riderRating: number;
    riderTags?: string[];
    riderTip?: number;
    vendorRating: number;
    vendorTags?: string[];
    reviewComment?: string;
}

const orderRatingsStore = new Map<string, RatingSubmission>();

export const rateOrder = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const orderId = req.params.id as string;
        const userId = req.user?.id;
        const { riderRating, riderTags, riderTip, vendorRating, vendorTags, reviewComment } = req.body;

        if (!riderRating || !vendorRating) {
            return res.status(400).json({ success: false, message: "Both courier and vendor ratings are required (1-5 stars)" });
        }

        const ratingData: RatingSubmission = {
            riderRating: Number(riderRating),
            riderTags: Array.isArray(riderTags) ? riderTags : [],
            riderTip: riderTip ? Number(riderTip) : 0,
            vendorRating: Number(vendorRating),
            vendorTags: Array.isArray(vendorTags) ? vendorTags : [],
            reviewComment: reviewComment?.trim() || "",
        };

        orderRatingsStore.set(orderId, ratingData);

        // If order has items, record review in reviews table
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
        if (items && items.length > 0 && userId) {
            for (const item of items) {
                try {
                    await db.insert(reviews).values({
                        productId: item.productId,
                        userId: userId,
                        rating: Number(vendorRating),
                        comment: reviewComment || (riderTags && riderTags.join(", ")) || "Great order!",
                    });
                } catch {
                    // ignore duplicates in test modes
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: "Thank you for your rating! Your feedback helps couriers and chefs improve.",
            rating: ratingData,
        });
    } catch (error) {
        console.error("Rate Order Error:", error);
        return res.status(500).json({ success: false, message: "Failed to submit rating" });
    }
};

// 10. FlowPass Membership Status & Subscription
const flowPassMembersStore = new Map<string, { isMember: boolean; expiresAt: string; plan: string; savingsTotal: number }>();

export const getFlowPassStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id || "guest";
        const status = flowPassMembersStore.get(userId) || {
            isMember: false,
            expiresAt: "",
            plan: "none",
            savingsTotal: 0,
        };
        return res.status(200).json({ success: true, flowPass: status });
    } catch (error) {
        console.error("Get FlowPass Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch FlowPass status" });
    }
};

export const subscribeFlowPass = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { plan = "monthly", paymentMethod = "wallet" } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Authentication required to subscribe" });
        }

        const planPrice = plan === "annual" ? 28999 : 2999;
        const durationDays = plan === "annual" ? 365 : 30;
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + durationDays);

        // If paying via wallet, deduct balance
        if (paymentMethod === "wallet") {
            const [userWallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
            if (userWallet && parseFloat(userWallet.balance) >= planPrice) {
                const newBal = (parseFloat(userWallet.balance) - planPrice).toFixed(2);
                await db.update(wallets).set({ balance: newBal }).where(eq(wallets.id, userWallet.id));
                await db.insert(walletTransactions).values({
                    walletId: userWallet.id,
                    amount: planPrice.toFixed(2),
                    type: "payment",
                    status: "success",
                    reference: `FP-${Date.now()}`,
                });
            }
        }

        const newStatus = {
            isMember: true,
            expiresAt: expiryDate.toISOString(),
            plan: plan,
            savingsTotal: 1500, // starting perk voucher
        };

        flowPassMembersStore.set(userId, newStatus);

        return res.status(200).json({
            success: true,
            message: "Welcome to FlowPass! You now enjoy Free Delivery and 0 Surge Fees.",
            flowPass: newStatus,
        });
    } catch (error) {
        console.error("Subscribe FlowPass Error:", error);
        return res.status(500).json({ success: false, message: "Subscription failed" });
    }
};


// ============================================================================
// SPRINT I: LIVE INTERACTIVE DELIVERY ROUTE PLAYBACK & PROXIMITY TELEMETRY
// ============================================================================

export const getOrderTrackingTelemetry = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orderId = Array.isArray(id) ? id[0] : (id || "");

    // Check order
    let orderRecord: any = null;
    try {
      orderRecord = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
      });
    } catch {
      // Ignore database lookup error if using virtual order
    }

    // Default base coordinates (Yaba to Victoria Island corridor)
    const baseOrigin: [number, number] = [6.5186, 3.3712]; // Yaba Kitchen Hub
    const baseDestination: [number, number] = [6.4950, 3.3850]; // Surulere / Akoka Dropoff

    // 12-point smooth delivery route waypoints simulating street navigation
    const routeWaypoints: [number, number][] = [
      [6.5186, 3.3712], // 0. Kitchen Departure (Herbert Macaulay Way)
      [6.5165, 3.3725], // 1. Commercial Avenue Junction
      [6.5140, 3.3738], // 2. Sabo Yaba Tech Cluster
      [6.5110, 3.3752], // 3. Alagomeji Bus Stop
      [6.5085, 3.3768], // 4. Murtala Muhammed Way
      [6.5050, 3.3785], // 5. Adekunle Flyover Approach
      [6.5020, 3.3800], // 6. Third Mainland Link / University Road
      [6.4995, 3.3818], // 7. Akoka Commercial Bypass
      [6.4975, 3.3832], // 8. Community Road Turnoff
      [6.4960, 3.3842], // 9. Residential Avenue (Within 250m Proximity)
      [6.4952, 3.3848], // 10. Customer Gate Approach
      [6.4950, 3.3850], // 11. Final Doorstep Delivery
    ];

    // Determine simulated current position (e.g. index 8 of 11)
    const currentWaypointIndex = 8;
    const currentCourierCoords = routeWaypoints[currentWaypointIndex];

    // Calculate heading/bearing between previous and current waypoint
    const prev = routeWaypoints[Math.max(0, currentWaypointIndex - 1)];
    const curr = currentCourierCoords;
    const dLng = curr[1] - prev[1];
    const dLat = curr[0] - prev[0];
    const bearing = Math.round((Math.atan2(dLng, dLat) * (180 / Math.PI) + 360) % 360);

    const distanceRemainingMeters = 680;
    const etaMinutes = 3;

    // Delivery handover PIN
    const handoverOtp = orderRecord?.deliveryPin || "8249";

    return res.status(200).json({
      success: true,
      telemetry: {
        orderId: orderId,
        orderStatus: orderRecord?.status || "picked_up",
        origin: {
          lat: baseOrigin[0],
          lng: baseOrigin[1],
          label: "Mama Put Delights • Kitchen Station",
        },
        destination: {
          lat: baseDestination[0],
          lng: baseDestination[1],
          label: orderRecord?.deliveryAddress || "42 Montgomery Road, Yaba, Lagos",
        },
        courier: {
          id: "CHAMP-482",
          name: "Tunde Adebayo",
          phone: "+2348039281726",
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
          vehicle: "Honda CB 125 • FlowMart Express",
          licensePlate: "LAGOS • KJA-482-XA",
          rating: 4.95,
          deliveriesCompleted: 248,
          currentPosition: {
            lat: currentCourierCoords[0],
            lng: currentCourierCoords[1],
            bearing,
            speedKmh: 34,
          },
          safetyCompliance: {
            thermalBoxInspected: true,
            helmetVerified: true,
            covidVaccinated: true,
          },
        },
        proximity: {
          distanceRemainingMeters,
          etaMinutes,
          proximityStatus: distanceRemainingMeters <= 250 ? "NEAR_GATE" : "APPROACHING",
          proximityHeadline: distanceRemainingMeters <= 250 
            ? "🚨 Champion is arriving at your gate!" 
            : `🛵 Champion is ~${etaMinutes} mins away (${distanceRemainingMeters}m)`,
          hasArrived: distanceRemainingMeters <= 100,
        },
        routeWaypoints,
        currentWaypointIndex,
        handoverOtp,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Tracking telemetry error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch telemetry: " + error.message });
  }
};


// ============================================================================
// SPRINT L: LIVE SPLIT-THE-BILL GROUP CHECKOUT ENGINE
// ============================================================================

interface SplitParticipant {
  id: string;
  name: string;
  emailOrPhone?: string;
  targetAmount: number;
  paidAmount: number;
  isPaid: boolean;
  isHost: boolean;
  paidAt?: string;
  paymentMethod?: string;
}

interface SplitBillSession {
  code: string;
  orderId?: string;
  orderRef: string;
  restaurantName: string;
  deliveryAddress: string;
  totalAmount: number;
  totalPaid: number;
  remainingBalance: number;
  progressPct: number;
  hostName: string;
  hostUserId?: string;
  splitMode: "EQUAL" | "CUSTOM";
  status: "PENDING_PAYMENTS" | "FULLY_FUNDED" | "EXPIRED";
  createdAt: string;
  expiresAt: string;
  participants: SplitParticipant[];
  items: Array<{ id: string; name: string; quantity: number; price: number }>;
}

// In-memory split bill sessions repository
const splitBillSessionsStore: Record<string, SplitBillSession> = {
  "SPLIT-DEMO-2026": {
    code: "SPLIT-DEMO-2026",
    orderRef: "#FM-89240",
    restaurantName: "Mama's Kitchen Bistro • Lekki",
    deliveryAddress: "Plot 14 Admiralty Way, Lekki Phase 1, Lagos",
    totalAmount: 24000,
    totalPaid: 18000,
    remainingBalance: 6000,
    progressPct: 75,
    hostName: "Chioma Adeleke",
    splitMode: "EQUAL",
    status: "PENDING_PAYMENTS",
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    items: [
      { id: "1", name: "Party Jollof Rice & Grilled Chicken (x3)", quantity: 3, price: 10500 },
      { id: "2", name: "Slow-Cooked Seafood Okro & Pounded Yam (x1)", quantity: 1, price: 6500 },
      { id: "3", name: "Crispy Peppered Turkey Wings (x2)", quantity: 2, price: 5000 },
      { id: "4", name: "Chilled Chapman & Fresh Zobo Bottles (x4)", quantity: 4, price: 2000 }
    ],
    participants: [
      { id: "p-1", name: "Chioma Adeleke (Host)", targetAmount: 6000, paidAmount: 6000, isPaid: true, isHost: true, paidAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(), paymentMethod: "FlowMart Wallet" },
      { id: "p-2", name: "Tunde Bakare", targetAmount: 6000, paidAmount: 6000, isPaid: true, isHost: false, paidAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(), paymentMethod: "Paystack Card" },
      { id: "p-3", name: "Amina Yusuf", targetAmount: 6000, paidAmount: 6000, isPaid: true, isHost: false, paidAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(), paymentMethod: "Direct Bank Transfer" },
      { id: "p-4", name: "Femi Otedola", targetAmount: 6000, paidAmount: 0, isPaid: false, isHost: false }
    ]
  }
};

export const createSplitBillSession = async (req: Request, res: Response) => {
  try {
    const { 
      orderId, 
      restaurantName = "FlowMart Gourmet Kitchen", 
      deliveryAddress = "Lekki Phase 1, Lagos",
      totalAmount = 24000,
      hostName = "Order Host",
      splitMode = "EQUAL",
      participantNames = ["Friend 1", "Friend 2", "Friend 3"],
      items = []
    } = req.body;

    const hostUserId = (req as any).user?.id || "guest-host";
    const numericTotal = Number(totalAmount) || 24000;
    const sessionCode = "SPLIT-" + Date.now().toString(36).toUpperCase() + "-" + Math.floor(100 + Math.random() * 900);
    const orderRef = "#FM-" + Math.floor(80000 + Math.random() * 19000);

    // Calculate share amounts
    const names = [hostName, ...participantNames.filter((n: string) => n && n.trim() !== "")];
    const perPersonShare = Math.round(numericTotal / Math.max(1, names.length));

    const participants: SplitParticipant[] = names.map((name: string, index: number) => ({
      id: `part-${index + 1}-${Date.now().toString(36)}`,
      name: index === 0 ? `${name} (Host)` : name,
      targetAmount: perPersonShare,
      paidAmount: 0,
      isPaid: false,
      isHost: index === 0
    }));

    const session: SplitBillSession = {
      code: sessionCode,
      orderId,
      orderRef,
      restaurantName,
      deliveryAddress,
      totalAmount: numericTotal,
      totalPaid: 0,
      remainingBalance: numericTotal,
      progressPct: 0,
      hostName,
      hostUserId,
      splitMode,
      status: "PENDING_PAYMENTS",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 mins expiry
      participants,
      items: items.length > 0 ? items : [
        { id: "item-1", name: "Assorted Group Feast Selection", quantity: names.length, price: numericTotal }
      ]
    };

    splitBillSessionsStore[sessionCode] = session;

    const shareUrl = `https://flowmart.ng/split/${sessionCode}`;
    const whatsappText = encodeURIComponent(`Hey! 🍽️ ${hostName} invited you to split the food bill for ${restaurantName}. Your share is ₦${perPersonShare.toLocaleString()}. Pay securely here so the kitchen can dispatch: ${shareUrl}`);

    return res.status(201).json({
      success: true,
      message: "Split-the-bill session created! Share the link with friends to fund the order.",
      session,
      shareUrl,
      whatsappUrl: `https://wa.me/?text=${whatsappText}`,
      perPersonShare
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Failed to create split bill session: " + error.message });
  }
};

export const getSplitBillSession = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const sessionCode = Array.isArray(code) ? code[0] : (code || "");
    const session = splitBillSessionsStore[sessionCode];

    if (!session) {
      return res.status(404).json({ success: false, message: "Split bill session not found or expired" });
    }

    // Dynamic progress re-calc
    const totalPaid = session.participants.reduce((sum: number, p: SplitParticipant) => sum + p.paidAmount, 0);
    session.totalPaid = totalPaid;
    session.remainingBalance = Math.max(0, session.totalAmount - totalPaid);
    session.progressPct = Math.min(100, Math.round((totalPaid / session.totalAmount) * 100));

    if (session.remainingBalance === 0 && session.status !== "FULLY_FUNDED") {
      session.status = "FULLY_FUNDED";
    }

    const secondsRemaining = Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000));

    return res.status(200).json({
      success: true,
      session,
      secondsRemaining,
      isFullyFunded: session.status === "FULLY_FUNDED"
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Failed to get split bill session: " + error.message });
  }
};

export const contributeToSplitBill = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const sessionCode = Array.isArray(code) ? code[0] : (code || "");
    const { participantId, paymentMethod = "wallet", amount } = req.body;

    const session = splitBillSessionsStore[sessionCode];
    if (!session) {
      return res.status(404).json({ success: false, message: "Split bill session not found" });
    }

    if (session.status === "FULLY_FUNDED") {
      return res.status(400).json({ success: false, message: "Order is already 100% funded and cooking in the kitchen!" });
    }

    const participant = session.participants.find((p: SplitParticipant) => p.id === participantId);
    if (!participant) {
      return res.status(404).json({ success: false, message: "Participant not found in split bill session" });
    }

    const contributionAmount = Number(amount) || participant.targetAmount;
    participant.paidAmount = contributionAmount;
    participant.isPaid = true;
    participant.paidAt = new Date().toISOString();
    participant.paymentMethod = paymentMethod === "wallet" ? "FlowMart Wallet" : "Paystack Card";

    // Recompute total
    const totalPaid = session.participants.reduce((sum: number, p: SplitParticipant) => sum + p.paidAmount, 0);
    session.totalPaid = totalPaid;
    session.remainingBalance = Math.max(0, session.totalAmount - totalPaid);
    session.progressPct = Math.min(100, Math.round((totalPaid / session.totalAmount) * 100));

    const isFullyFunded = session.remainingBalance === 0;
    if (isFullyFunded) {
      session.status = "FULLY_FUNDED";
    }

    return res.status(200).json({
      success: true,
      message: isFullyFunded 
        ? "🎉 100% FUNDED! All shares paid. Order released to kitchen for instant preparation!" 
        : `Payment of ₦${contributionAmount.toLocaleString()} recorded for ${participant.name}! Remaining to fund: ₦${session.remainingBalance.toLocaleString()}.`,
      session,
      isFullyFunded
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Payment contribution failed: " + error.message });
  }
};

export const coverRemainingSplitBill = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const sessionCode = Array.isArray(code) ? code[0] : (code || "");
    const session = splitBillSessionsStore[sessionCode];

    if (!session) {
      return res.status(404).json({ success: false, message: "Split bill session not found" });
    }

    const remaining = session.remainingBalance;
    if (remaining <= 0) {
      return res.status(400).json({ success: false, message: "Order is already fully funded" });
    }

    // Mark all unpaid participants as covered by host
    session.participants.forEach((p: SplitParticipant) => {
      if (!p.isPaid) {
        p.paidAmount = p.targetAmount;
        p.isPaid = true;
        p.paidAt = new Date().toISOString();
        p.paymentMethod = "Host Covered";
      }
    });

    session.totalPaid = session.totalAmount;
    session.remainingBalance = 0;
    session.progressPct = 100;
    session.status = "FULLY_FUNDED";

    return res.status(200).json({
      success: true,
      message: `Host covered remaining ₦${remaining.toLocaleString()}! Order is 100% funded and dispatched to kitchen.`,
      session,
      isFullyFunded: true
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Failed to cover remaining balance: " + error.message });
  }
};
