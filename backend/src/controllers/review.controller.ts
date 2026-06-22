import { Request, Response } from 'express';
import { db } from '../../db';
import { reviews, users } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId as string;
    const productReviews = await db.select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      user: {
        id: users.id,
        fullName: users.fullName,
      }
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt));

    return res.status(200).json({ success: true, reviews: productReviews });
  } catch (error) {
    console.error('getProductReviews Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const createReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { productId, rating, comment } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const [newReview] = await db.insert(reviews)
      .values({ productId, userId: userId!, rating, comment })
      .returning();

    return res.status(201).json({ success: true, review: newReview });
  } catch (error) {
    console.error('createReview Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
