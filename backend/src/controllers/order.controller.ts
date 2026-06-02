import { Request, Response } from 'express';
import { db } from '../../db';
import { products, orders, orderItems } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// 1. Place a New Order (Attendees)
export const placeOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const attendeeId = req.user?.id;
    const { productId, quantity, deliveryZone } = req.body;

    if (!productId || !quantity || !deliveryZone) {
      return res.status(400).json({ success: false, message: 'Missing required order details' });
    }

    // Check product availability and stock
    const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    
    if (!product || product.stockQuantity < quantity) {
      return res.status(400).json({ success: false, message: 'Product is unavailable or out of stock' });
    }

    const totalAmount = (Number(product.price) * quantity).toString();
    const deliveryPin = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit PIN for riders

    // Create the order
    const [newOrder] = await db.insert(orders).values({
      attendeeId: attendeeId!,
      vendorId: product.vendorId,
      deliveryZone,
      totalAmount,
      deliveryPin,
      status: 'pending',
    }).returning();

    // Create the order item record
    await db.insert(orderItems).values({
      orderId: newOrder.id,
      productId: product.id,
      quantity,
      unitPrice: product.price,
    });

    // Deduct from inventory
    await db.update(products)
      .set({ stockQuantity: product.stockQuantity - quantity })
      .where(eq(products.id, product.id));

    return res.status(201).json({ success: true, message: 'Order placed successfully', order: newOrder });
  } catch (error) {
    console.error('Place Order Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// 2. View Orders (For both Attendees and Vendors)
export const getOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    let userOrders;

    if (role === 'vendor') {
      // Vendors see orders placed with their shop
      userOrders = await db.select().from(orders).where(eq(orders.vendorId, userId!));
    } else if (role === 'attendee') {
      // Attendees see their own order history
      userOrders = await db.select().from(orders).where(eq(orders.attendeeId, userId!));
    } else {
      return res.status(403).json({ success: false, message: 'Unauthorized view' });
    }

    return res.status(200).json({ success: true, orders: userOrders });
  } catch (error) {
    console.error('Get Orders Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// 3. Update Order Status (Vendors & Logistics)
export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body; // e.g., 'confirmed', 'cancelled'
    const vendorId = req.user?.id;

    // Verify order belongs to this vendor
    const [existingOrder] = await db.select().from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.vendorId, vendorId!)))
      .limit(1);

    if (!existingOrder) {
      return res.status(404).json({ success: false, message: 'Order not found or unauthorized' });
    }

    const [updatedOrder] = await db.update(orders)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId))
      .returning();

    return res.status(200).json({ success: true, message: `Order marked as ${status}`, order: updatedOrder });
  } catch (error) {
    console.error('Update Status Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
