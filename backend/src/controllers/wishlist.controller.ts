import { Response } from 'express';
import { db } from '../../db';
import { wishlists, products } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getWishlist = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const items = await db.select({
      id: wishlists.id,
      product: {
        id: products.id,
        name: products.name,
        price: products.price,
        images: products.images,
      }
    })
    .from(wishlists)
    .innerJoin(products, eq(wishlists.productId, products.id))
    .where(eq(wishlists.userId, userId!));

    return res.status(200).json({ success: true, wishlist: items });
  } catch (error) {
    console.error('getWishlist Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const toggleWishlist = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { productId } = req.body;

    const [existing] = await db.select().from(wishlists).where(
      and(eq(wishlists.userId, userId!), eq(wishlists.productId, productId))
    );

    if (existing) {
      await db.delete(wishlists).where(eq(wishlists.id, existing.id));
      return res.status(200).json({ success: true, message: 'Removed from wishlist' });
    }

    const [newItem] = await db.insert(wishlists)
      .values({ userId: userId!, productId })
      .returning();

    return res.status(201).json({ success: true, message: 'Added to wishlist', item: newItem });
  } catch (error) {
    console.error('toggleWishlist Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
