import { Router } from 'express';
import { getCart, addToCart, removeFromCart, clearCart, createGroupCart, getGroupCart, addGroupCartItem, lockGroupCart } from '../controllers/cart.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// Public Group Cart Routes
router.get('/group/:code', getGroupCart);
router.post('/group/:code/items', addGroupCartItem);

router.use(authenticateJWT);
router.post('/group/create', createGroupCart);
router.post('/group/:code/lock', lockGroupCart);

router.get('/', getCart);
router.post('/', addToCart);
router.delete('/:id', removeFromCart);
router.delete('/clear', clearCart);

export default router;
