import { Response } from 'express';
import { db } from '../../db';
import { cartItems, products } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const items = await db.select({
      id: cartItems.id,
      quantity: cartItems.quantity,
      product: {
        id: products.id,
        name: products.name,
        price: products.price,
        images: products.images,
      }
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.userId, userId!));

    return res.status(200).json({ success: true, cart: items });
  } catch (error) {
    console.error('getCart Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const addToCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { productId, quantity = 1 } = req.body;

    const [existing] = await db.select().from(cartItems).where(
      and(eq(cartItems.userId, userId!), eq(cartItems.productId, productId))
    );

    if (existing) {
      const [updated] = await db.update(cartItems)
        .set({ quantity: existing.quantity + quantity, updatedAt: new Date() })
        .where(eq(cartItems.id, existing.id))
        .returning();
      return res.status(200).json({ success: true, item: updated });
    }

    const [newItem] = await db.insert(cartItems)
      .values({ userId: userId!, productId, quantity })
      .returning();

    return res.status(201).json({ success: true, item: newItem });
  } catch (error) {
    console.error('addToCart Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const removeFromCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await db.delete(cartItems).where(eq(cartItems.id, id));
    return res.status(200).json({ success: true, message: 'Item removed' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const clearCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    await db.delete(cartItems).where(eq(cartItems.userId, userId!));
    return res.status(200).json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
