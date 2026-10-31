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
export interface GroupCartMember {
  id: string;
  name: string;
  isHost: boolean;
  isOnline: boolean;
  avatarColor: string;
  joinedAt: string;
  lastActiveAt: string;
}

export interface GroupCartItem {
  id: string;
  guestName: string;
  guestId?: string;
  productId: string;
  name: string;
  price: number;
  qty: number;
  imageUrl?: string;
  modifiers?: any[];
  instructions?: string;
  addedAt?: string;
}

export interface GroupCartSession {
  code: string;
  hostId: string;
  hostName: string;
  restaurantId?: string;
  restaurantName?: string;
  items: GroupCartItem[];
  members: GroupCartMember[];
  isLocked: boolean;
  spendingLimitPerPersonNgn?: number;
  paymentMode: 'HOST_PAYS_ALL' | 'SPLIT_BILL';
  deliveryAddress?: string;
  createdAt: string;
  expiresAt: string;
}

const groupCartStore = new Map<string, GroupCartSession>();

// Seed default active room for instant demo & resilience
const defaultDemoRoom: GroupCartSession = {
  code: 'FLOW-2026',
  hostId: 'host-babatunde-01',
  hostName: 'Babatunde Adeyemi',
  restaurantId: 'rest-chicken-republic',
  restaurantName: 'Chicken Republic Express',
  deliveryAddress: '14B Admiralty Way, Lekki Phase 1, Lagos',
  spendingLimitPerPersonNgn: 6000,
  paymentMode: 'HOST_PAYS_ALL',
  isLocked: false,
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
  members: [
    {
      id: 'member-host',
      name: 'Babatunde Adeyemi',
      isHost: true,
      isOnline: true,
      avatarColor: '#4f46e5',
      joinedAt: new Date(Date.now() - 3600000).toISOString(),
      lastActiveAt: new Date().toISOString()
    },
    {
      id: 'member-chidinma',
      name: 'Chidinma Okafor',
      isHost: false,
      isOnline: true,
      avatarColor: '#ec4899',
      joinedAt: new Date(Date.now() - 1800000).toISOString(),
      lastActiveAt: new Date().toISOString()
    },
    {
      id: 'member-emeka',
      name: 'Emeka Nwosu',
      isHost: false,
      isOnline: true,
      avatarColor: '#06b6d4',
      joinedAt: new Date(Date.now() - 900000).toISOString(),
      lastActiveAt: new Date().toISOString()
    }
  ],
  items: [
    {
      id: 'gitem-demo-1',
      guestName: 'Babatunde Adeyemi',
      guestId: 'member-host',
      productId: 'voice-prod-jollof-2026',
      name: 'Smokey Party Jollof Rice Special',
      price: 3200,
      qty: 1,
      imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=500&auto=format&fit=crop&q=80',
      instructions: 'Extra spicy pepper',
      addedAt: new Date(Date.now() - 1200000).toISOString()
    },
    {
      id: 'gitem-demo-2',
      guestName: 'Babatunde Adeyemi',
      guestId: 'member-host',
      productId: 'voice-prod-protein-2026',
      name: 'Crispy Southern Fried Chicken',
      price: 2600,
      qty: 1,
      imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&auto=format&fit=crop&q=80',
      instructions: 'Well done',
      addedAt: new Date(Date.now() - 1100000).toISOString()
    },
    {
      id: 'gitem-demo-3',
      guestName: 'Chidinma Okafor',
      guestId: 'member-chidinma',
      productId: 'voice-prod-pizza-2026',
      name: 'Artisan Double Pepperoni Pizza',
      price: 5200,
      qty: 1,
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80',
      instructions: 'Extra cheese, sliced thin',
      addedAt: new Date(Date.now() - 800000).toISOString()
    },
    {
      id: 'gitem-demo-4',
      guestName: 'Emeka Nwosu',
      guestId: 'member-emeka',
      productId: 'voice-prod-burger-2026',
      name: 'Jumbo Double Beef Shawarma',
      price: 3800,
      qty: 1,
      imageUrl: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500&auto=format&fit=crop&q=80',
      instructions: 'Spicy garlic sauce',
      addedAt: new Date(Date.now() - 500000).toISOString()
    }
  ]
};

groupCartStore.set('FLOW-2026', defaultDemoRoom);

export const createGroupCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'host-user';
    const hostName = (req.user as any)?.fullName || (req.user as any)?.email?.split('@')[0] || 'Host';
    const { restaurantId } = req.body;

    const code = `FLOW-${Math.floor(1000 + Math.random() * 9000)}`;
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const { restaurantName, spendingLimitPerPersonNgn, paymentMode, deliveryAddress } = req.body;

    const newSession: GroupCartSession = {
      code,
      hostId: userId,
      hostName,
      restaurantId: restaurantId || 'rest-chicken-republic',
      restaurantName: restaurantName || 'Chicken Republic Express',
      deliveryAddress: deliveryAddress || 'Lekki Phase 1, Lagos',
      spendingLimitPerPersonNgn: spendingLimitPerPersonNgn || 6000,
      paymentMode: paymentMode || 'HOST_PAYS_ALL',
      items: [],
      members: [
        {
          id: userId,
          name: hostName,
          isHost: true,
          isOnline: true,
          avatarColor: '#4f46e5',
          joinedAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString()
        }
      ],
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


/**
 * Join Group Order Room as a participant
 */
export const joinGroupCartRoom = async (req: Request, res: Response) => {
  try {
    const rawCode = req.params.code;
    const code = Array.isArray(rawCode) ? rawCode[0] : (rawCode || '');
    const { name, memberId } = req.body;

    const session = groupCartStore.get(code);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Group order room not found' });
    }

    const participantName = (name || 'Guest Participant').trim();
    const id = memberId || `guest-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const existingIndex = (session.members || []).findIndex((m: GroupCartMember) => m.id === id || m.name.toLowerCase() === participantName.toLowerCase());
    const avatarColors = ['#4f46e5', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];

    if (existingIndex >= 0) {
      session.members[existingIndex].isOnline = true;
      session.members[existingIndex].lastActiveAt = new Date().toISOString();
    } else {
      session.members.push({
        id,
        name: participantName,
        isHost: false,
        isOnline: true,
        avatarColor: avatarColors[session.members.length % avatarColors.length],
        joinedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString()
      });
    }

    return res.status(200).json({ success: true, memberId: id, session });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to join group room' });
  }
};

/**
 * Update Group Order Room Settings (Host only)
 */
export const updateGroupCartSettings = async (req: Request, res: Response) => {
  try {
    const rawCode = req.params.code;
    const code = Array.isArray(rawCode) ? rawCode[0] : (rawCode || '');
    const { spendingLimitPerPersonNgn, paymentMode, deliveryAddress, restaurantName } = req.body;

    const session = groupCartStore.get(code);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Group room not found' });
    }

    if (spendingLimitPerPersonNgn !== undefined) {
      session.spendingLimitPerPersonNgn = Number(spendingLimitPerPersonNgn);
    }
    if (paymentMode) {
      session.paymentMode = paymentMode;
    }
    if (deliveryAddress) {
      session.deliveryAddress = deliveryAddress;
    }
    if (restaurantName) {
      session.restaurantName = restaurantName;
    }

    return res.status(200).json({ success: true, message: 'Room settings updated', session });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
};

/**
 * Remove an item from the Group Order Room
 */
export const removeGroupCartItem = async (req: Request, res: Response) => {
  try {
    const rawCode = req.params.code;
    const code = Array.isArray(rawCode) ? rawCode[0] : (rawCode || '');
    const rawItemId = req.params.itemId;
    const itemId = Array.isArray(rawItemId) ? rawItemId[0] : (rawItemId || '');

    const session = groupCartStore.get(code);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Group room not found' });
    }

    if (session.isLocked) {
      return res.status(400).json({ success: false, message: 'Cart is locked for checkout' });
    }

    session.items = session.items.filter(i => i.id !== itemId);
    return res.status(200).json({ success: true, message: 'Item removed', session });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to remove item' });
  }
};

/**
 * Lock and Transfer Group Cart to Host Checkout Payload
 */
export const transferGroupCartToCheckout = async (req: Request, res: Response) => {
  try {
    const rawCode = req.params.code;
    const code = Array.isArray(rawCode) ? rawCode[0] : (rawCode || '');

    const session = groupCartStore.get(code);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Group room not found' });
    }

    session.isLocked = true;

    // Normalize group cart items into cart line items
    const normalizedItems = session.items.map((it, idx) => ({
      id: it.productId || `group-item-${idx}`,
      name: `${it.name} (for ${it.guestName})`,
      price: it.price,
      quantity: it.qty,
      imageUrl: it.imageUrl || 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=500&auto=format&fit=crop&q=80',
      specialInstructions: `Group Order: ${it.guestName} - ${it.instructions || 'Standard'}`,
      vendorName: session.restaurantName || 'Chicken Republic Express',
      stockQuantity: 99,
      sku: `SKU-GROUP-${it.id}`
    }));

    const subtotalNgn = normalizedItems.reduce((sum, it) => sum + (it.price * it.quantity), 0);
    const deliveryFeeNgn = 850;
    const serviceFeeNgn = 250;
    const totalNgn = subtotalNgn + deliveryFeeNgn + serviceFeeNgn;

    return res.status(200).json({
      success: true,
      data: {
        sessionCode: code,
        items: normalizedItems,
        subtotalNgn,
        deliveryFeeNgn,
        serviceFeeNgn,
        totalNgn,
        paymentMode: session.paymentMode,
        participantCount: session.members.length,
        deliveryAddress: session.deliveryAddress || '14B Admiralty Way, Lekki Phase 1, Lagos'
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to prepare group checkout payload' });
  }
};
