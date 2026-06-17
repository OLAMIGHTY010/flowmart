import { Request, Response } from "express";
import { db } from "../../db";
import { products, orders, orderItems, users, vendorProfiles, vendorKyc } from "../../db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { sendInAppNotification } from "../services/websocket";

// 1. Place a New Order (Attendees)
export const placeOrder = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const attendeeId = req.user?.id;
		const { items, deliveryZone } = req.body;

		if (!items || !Array.isArray(items) || items.length === 0) {
			return res.status(400).json({
				success: false,
				message: "Cart is empty",
			});
		}

		// Group items by vendorId. For now, assume all items in an order are from the same vendor,
		// or create a separate order for each vendor. Let's create one order per vendor.
		// To simplify, let's assume the frontend groups by vendor and makes multiple requests,
		// OR we handle it here by picking the first item's vendor. The frontend checkout
		// currently assumes 1 order per checkout. Let's use the first item's vendorId for the order.
		
		let totalAmountNum = 0;
		const orderItemsData: any[] = [];
		const productUpdates: any[] = [];
		
		// 1. Fetch all products to verify stock and prices
		const productIds = items.map(item => item.productId);
		const dbProducts = await db
			.select()
			.from(products)
			.where(sql`${products.id} IN ${productIds}`);

		const productMap = new Map(dbProducts.map(p => [p.id, p]));
		let vendorId = dbProducts[0]?.vendorId;

		for (const item of items) {
			const product = productMap.get(item.productId);
			
			if (!product || product.stockQuantity < item.quantity) {
				return res.status(400).json({
					success: false,
					message: `Product ${product?.name || item.productId} is unavailable or out of stock`,
				});
			}

			totalAmountNum += Number(product.price) * item.quantity;
			
			orderItemsData.push({
				productId: product.id,
				quantity: item.quantity,
				unitPrice: product.price,
			});

			productUpdates.push({
				id: product.id,
				newStock: product.stockQuantity - item.quantity,
			});
		}

		const totalAmount = totalAmountNum.toString();
		const deliveryPin = Math.floor(100000 + Math.random() * 900000).toString();

		// Create the order
		const [newOrder] = await db
			.insert(orders)
			.values({
				attendeeId: attendeeId!,
				vendorId: vendorId,
				deliveryZone: deliveryZone || "Standard",
				totalAmount,
				deliveryPin,
				status: "pending",
			})
			.returning();

		// Create all order items
		await db.insert(orderItems).values(
			orderItemsData.map(item => ({
				orderId: newOrder.id,
				...item
			}))
		);

		// Deduct from inventory (run sequentially or use transaction)
		for (const update of productUpdates) {
			await db
				.update(products)
				.set({ stockQuantity: update.newStock })
				.where(eq(products.id, update.id));
		}

		return res.status(201).json({
			success: true,
			message: "Order placed successfully",
			order: newOrder,
		});
	} catch (error) {
		console.error("Place Order Error:", error);
		return res
			.status(500)
			.json({ success: false, message: "Internal Server Error" });
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
			productImage: products.imageUrl,
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
		} else {
			return res
				.status(403)
				.json({ success: false, message: "Unauthorized view" });
		}

		// Enrich each order with its items
		const enrichedOrders = await Promise.all(
			userOrders.map(enrichOrderWithItems)
		);

		return res.status(200).json({ success: true, orders: enrichedOrders });
	} catch (error) {
		console.error("Get Orders Error:", error);
		return res
			.status(500)
			.json({ success: false, message: "Internal Server Error" });
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
export const updateOrderStatus = async (
	req: AuthenticatedRequest,
	res: Response
) => {
	try {
		const orderId = req.params.id as string;
		const { status } = req.body;
		const vendorId = req.user?.id;

		// Verify order belongs to this vendor
		const [existingOrder] = await db
			.select()
			.from(orders)
			.where(
				and(
					eq(orders.id, orderId as string),
					eq(orders.vendorId, vendorId!)
				)
			)
			.limit(1);

		if (!existingOrder) {
			return res.status(404).json({
				success: false,
				message: "Order not found or unauthorized",
			});
		}

		const [updatedOrder] = await db
			.update(orders)
			.set({
				status,
				updatedAt: new Date(),
			})
			.where(eq(orders.id, orderId as string))
			.returning();

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
		return res
			.status(500)
			.json({ success: false, message: "Internal Server Error" });
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
