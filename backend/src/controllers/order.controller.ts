import { Request, Response } from "express";
import { db } from "../../db";
import { products, orders, orderItems, users } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { emailService } from "../services/email.service";

// ✨ Helper to generate FLW-YYYYMMDD-XXXX
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
		const { productId, quantity, deliveryZone } = req.body;

		if (!productId || !quantity || !deliveryZone) {
			return res.status(400).json({ success: false, message: "Missing required order details" });
		}

		const [product] = await db.select().from(products).where(eq(products.id, productId as string)).limit(1);

		if (!product || product.stockQuantity < quantity) {
			return res.status(400).json({ success: false, message: "Product is unavailable or out of stock" });
		}

		const totalAmount = (Number(product.price) * quantity).toString();
		const deliveryPin = Math.floor(100000 + Math.random() * 900000).toString(); 
		const orderRef = generateOrderRef(); // ✨ Generate standard reference

		const [newOrder] = await db.insert(orders).values({
			orderRef, // ✨ Insert reference
			attendeeId: attendeeId!,
			vendorId: product.vendorId,
			deliveryZone,
			totalAmount,
			deliveryPin,
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
				orderId: newOrder.orderRef, // ✨ Pass the human-readable ref to the email template
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

// 2. View Orders (For both Attendees and Vendors)
export const getOrders = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user?.id;
		const role = req.user?.role;

		let userOrders;

		if (role === "vendor") {
			userOrders = await db.select().from(orders).where(eq(orders.vendorId, userId!));
		} else if (role === "attendee") {
			userOrders = await db.select().from(orders).where(eq(orders.attendeeId, userId!));
		} else {
			return res.status(403).json({ success: false, message: "Unauthorized view" });
		}

		return res.status(200).json({ success: true, orders: userOrders });
	} catch (error) {
		console.error("Get Orders Error:", error);
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
