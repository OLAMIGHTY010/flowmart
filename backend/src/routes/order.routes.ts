import { Router } from 'express';
import { placeOrder, getOrders, getOrderById, updateOrderStatus, confirmOrderReceived, getVendorBankDetails } from '../controllers/order.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Both attendees and vendors can view their respective order histories
router.get('/', authenticateJWT, getOrders);

// Get single order by ID (attendee or vendor)
router.get('/:id', authenticateJWT, getOrderById);

// Only attendees can place orders
router.post('/', authenticateJWT, authorizeRoles('attendee'), placeOrder);

// Attendee confirms they received the order
router.patch('/:id/received', authenticateJWT, authorizeRoles('attendee'), confirmOrderReceived);

// Only vendors (and later, riders/coordinators) can update the fulfillment status
router.patch('/:id/status', authenticateJWT, authorizeRoles('vendor', 'super_admin'), updateOrderStatus);

// Get vendor bank details for checkout payment
router.get('/vendor/:vendorId/bank-details', authenticateJWT, getVendorBankDetails);

export default router;
