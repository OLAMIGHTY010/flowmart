import { Request, Response } from 'express';
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


// ─── Chowdeck-Style Group Orders Engine ("Order with Friends") ─────────────
interface GroupCartItem {
  id: string;
  guestName: string;
  guestId?: string;
  productId: string;
  name: string;
  price: number;
  qty: number;
  modifiers?: any[];
  instructions?: string;
}

interface GroupCartSession {
  code: string;
  hostId: string;
  hostName: string;
  restaurantId?: string;
  items: GroupCartItem[];
  isLocked: boolean;
  createdAt: string;
  expiresAt: string;
}

const groupCartStore = new Map<string, GroupCartSession>();

export const createGroupCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'host-user';
    const hostName = (req.user as any)?.fullName || (req.user as any)?.email?.split('@')[0] || 'Host';
    const { restaurantId } = req.body;

    const code = `FLOW-${Math.floor(1000 + Math.random() * 9000)}`;
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const newSession: GroupCartSession = {
      code,
      hostId: userId,
      hostName,
      restaurantId,
      items: [],
      isLocked: false,
      createdAt: new Date().toISOString(),
      expiresAt,
    };

    groupCartStore.set(code, newSession);

    return res.status(201).json({ success: true, session: newSession });
  } catch (error) {
    console.error('Create Group Cart Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create group cart' });
  }
};

export const getGroupCart = async (req: Request, res: Response) => {
  try {
    const code = req.params.code as string;
    const session = groupCartStore.get(code);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Group order session not found or expired' });
    }

    return res.status(200).json({ success: true, session });
  } catch (error) {
    console.error('Get Group Cart Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve group cart' });
  }
};

export const addGroupCartItem = async (req: Request, res: Response) => {
  try {
    const code = req.params.code as string;
    const session = groupCartStore.get(code);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Group order not found' });
    }

    if (session.isLocked) {
      return res.status(400).json({ success: false, message: 'Group order is locked by the host for checkout' });
    }

    const { guestName, productId, name, price, qty = 1, modifiers, instructions } = req.body;

    if (!guestName || !productId || !price) {
      return res.status(400).json({ success: false, message: 'Missing required item fields' });
    }

    const newItem: GroupCartItem = {
      id: `gitem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      guestName: guestName.trim(),
      productId,
      name: name || 'Custom Meal',
      price: Number(price),
      qty: Number(qty),
      modifiers: modifiers || [],
      instructions: instructions || '',
    };

    session.items.push(newItem);

    return res.status(201).json({ success: true, item: newItem, session });
  } catch (error) {
    console.error('Add Group Cart Item Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to add item to group cart' });
  }
};

export const lockGroupCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const code = req.params.code as string;
    const session = groupCartStore.get(code);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Group order not found' });
    }

    session.isLocked = true;
    return res.status(200).json({ success: true, message: 'Group cart locked for checkout', session });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to lock group cart' });
  }
};
