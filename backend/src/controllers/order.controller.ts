import { Request, Response } from "express";
import { db } from "../../db";
import { products, orders, orderItems, users, vendorProfiles, vendorKyc } from "../../db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { sendInAppNotification } from "../services/websocket";
import { emailService } from "../services/email.service";

// Helper to generate FLW-YYYYMMDD-XXXX
const generateOrderRef = () => {
	const date = new Date();
	const yyyy = date.getFullYear();
	const mm = String(date.getMonth() + 1).padStart(2, '0');
	const dd = String(date.getDate()).padStart(2, '0');
	const randomSeq = Math.floor(1000 + Math.random() * 9000).toString(); // 4 random digits
	return `FLW-${yyyy}${mm}${dd}-${randomSeq}`;
};

// 1. Place a New Order (Attendees)
export const placeOrder = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const attendeeId = req.user?.id;
		const { productId, quantity, deliveryZone, zone, payment_method, transaction_reference, payment_proof_url } = req.body;

		const finalZone = deliveryZone || zone;

		if (!productId || !quantity || !finalZone) {
			return res.status(400).json({ success: false, message: "Missing required order details" });
		}

		const [product] = await db.select().from(products).where(eq(products.id, productId as string)).limit(1);

		if (!product || product.stockQuantity < quantity) {
			return res.status(400).json({ success: false, message: "Product is unavailable or out of stock" });
		}

		const totalAmount = (Number(product.price) * quantity).toString();
		const deliveryPin = Math.floor(100000 + Math.random() * 900000).toString(); 
		const orderRef = generateOrderRef(); 

		const [newOrder] = await db.insert(orders).values({
			orderRef, 
			attendeeId: attendeeId!,
			vendorId: product.vendorId,
			deliveryZone: finalZone,
			totalAmount,
			deliveryPin,
			paymentMethod: payment_method || 'pay_on_delivery',
			transactionReference: transaction_reference,
			paymentProofUrl: payment_proof_url,
			status: "pending",
		}).returning();

		await db.insert(orderItems).values({
			orderId: newOrder.id,
			productId: product.id,
			quantity,
			unitPrice: product.price,
		});

		const newStockQuantity = product.stockQuantity - quantity;
		await db.update(products).set({ stockQuantity: newStockQuantity }).where(eq(products.id, product.id as string));

		// === EMAIL INTEGRATIONS ===
		const [attendee, vendor] = await Promise.all([
			db.select().from(users).where(eq(users.id, attendeeId!)).limit(1).then(res => res[0]),
			db.select().from(users).where(eq(users.id, product.vendorId)).limit(1).then(res => res[0])
		]);

		if (attendee) {
			emailService.sendOrderReceiptEmail(attendee.email, {
				fullName: attendee.fullName,
				orderId: newOrder.orderRef, 
				totalAmount,
				deliveryPin,
				items: [{ name: product.name, quantity, price: product.price.toString() }]
			}).catch(console.error);
		}

		if (newStockQuantity === 0 && vendor) {
			emailService.sendOutOfStockAlert(vendor.email, {
				vendorName: vendor.fullName,
				productName: product.name
			}).catch(console.error);
		}

		return res.status(201).json({
			success: true,
			message: "Order placed successfully",
			order: newOrder,
		});
	} catch (error) {
		console.error("Place Order Error:", error);
		return res.status(500).json({ success: false, message: "Internal Server Error" });
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

	return {
		...order,
		items: items.map(item => ({
			id: item.id,
			productId: item.productId,
			name: item.productName || "Unknown Product",
			imageUrl: item.productImage || "",
			category: item.productCategory || "",
			qty: item.quantity,
			price: item.unitPrice,
		})),
	};
};

// 2. View Orders (For both Attendees and Vendors)
export const getOrders = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user?.id;
		const role = req.user?.role;

		let userOrders;

		if (role === "vendor") {
			userOrders = await db
				.select()
				.from(orders)
				.where(eq(orders.vendorId, userId!))
				.orderBy(desc(orders.createdAt));
		} else if (role === "attendee") {
			userOrders = await db
				.select()
				.from(orders)
				.where(eq(orders.attendeeId, userId!))
				.orderBy(desc(orders.createdAt));
			userOrders = await db.select().from(orders).where(eq(orders.vendorId, userId!));

		} else {
			return res.status(403).json({ success: false, message: "Unauthorized view" });
		}

		// Enrich each order with its items
		const enrichedOrders = await Promise.all(
			userOrders.map(enrichOrderWithItems)
		);

		return res.status(200).json({ success: true, orders: enrichedOrders });
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

		// Verify the user is either the attendee or the vendor
		if (order.attendeeId !== userId && order.vendorId !== userId) {
			return res.status(403).json({ success: false, message: "Unauthorized" });
		}

		const enrichedOrder = await enrichOrderWithItems(order);

		// Get vendor bank details for payment if status is pending
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

		// Notify the attendee in real-time
		sendInAppNotification(existingOrder.attendeeId, "order:statusUpdate", {
			orderId,
			status,
		});

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

// 4. Attendee confirms order received
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

		if (existingOrder.status !== "delivered") {
			return res.status(400).json({ success: false, message: "Order has not been delivered yet" });
		}

		const [updatedOrder] = await db
			.update(orders)
			.set({ status: "delivered", updatedAt: new Date() })
			.where(eq(orders.id, orderId))
			.returning();

		// Notify vendor
		sendInAppNotification(existingOrder.vendorId, "order:statusUpdate", {
			orderId,
			status: "received",
		});

		return res.status(200).json({
			success: true,
			message: "Order confirmed as received",
			order: updatedOrder,
		});
	} catch (error) {
		console.error("Confirm Received Error:", error);
		return res.status(500).json({ success: false, message: "Internal Server Error" });
	}
};

// 5. Get vendor bank details for checkout
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
