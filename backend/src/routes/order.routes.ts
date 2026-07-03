import { Router } from 'express';
import { placeOrder, getOrders, getOrderById, updateOrderStatus, confirmOrderReceived, getVendorBankDetails, paystackWebhook, calculateDelivery } from '../controllers/order.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, getOrders);
router.get('/:id', authenticateJWT, getOrderById);
router.post('/', authenticateJWT, authorizeRoles('user'), placeOrder);
router.post('/calculate-delivery', authenticateJWT, authorizeRoles('user'), calculateDelivery);
router.patch('/:id/received', authenticateJWT, authorizeRoles('user'), confirmOrderReceived);
router.patch('/:id/status', authenticateJWT, authorizeRoles('vendor', 'super_admin'), updateOrderStatus);
router.get('/vendor/:vendorId/bank-details', authenticateJWT, getVendorBankDetails);

// External Payment Processor Webhooks
router.post('/webhook/paystack', paystackWebhook); 

export default router;
