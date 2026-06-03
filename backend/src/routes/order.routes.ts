import { Router } from 'express';
import { placeOrder, getOrders, updateOrderStatus } from '../controllers/order.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Both attendees and vendors can view their respective order histories
router.get('/', authenticateJWT, getOrders);

// Only attendees can place orders
router.post('/', authenticateJWT, authorizeRoles('attendee'), placeOrder);

// Only vendors (and later, riders/coordinators) can update the fulfillment status
router.patch('/:id/status', authenticateJWT, authorizeRoles('vendor', 'super_admin'), updateOrderStatus);

export default router;
