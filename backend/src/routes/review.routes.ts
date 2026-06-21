import { Router } from 'express';
import { getProductReviews, createReview } from '../controllers/review.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.get('/:productId', getProductReviews);
router.post('/', authenticateJWT, createReview);

export default router;
