import { Router } from 'express';
import { getCart, addToCart, removeFromCart, clearCart } from '../controllers/cart.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/', getCart);
router.post('/', addToCart);
router.delete('/:id', removeFromCart);
router.delete('/clear', clearCart);

export default router;
