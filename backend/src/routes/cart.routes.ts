import { Router } from 'express';
import { getCart, addToCart, removeFromCart, clearCart, createGroupCart, getGroupCart, addGroupCartItem, lockGroupCart,
  joinGroupCartRoom,
  updateGroupCartSettings,
  removeGroupCartItem,
  transferGroupCartToCheckout
} from '../controllers/cart.controller';
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


// Sprint Q: Live Group Order Room Endpoints (2026)
router.post('/group/:code/join', joinGroupCartRoom);
router.post('/group/:code/settings', updateGroupCartSettings);
router.delete('/group/:code/items/:itemId', removeGroupCartItem);
router.post('/group/:code/checkout-payload', transferGroupCartToCheckout);

export default router;
