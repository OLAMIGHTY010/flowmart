import { Router } from 'express';
import { placeOrder, getOrders, getOrderById, updateOrderStatus, confirmOrderReceived, getVendorBankDetails, paystackWebhook, calculateDelivery } from '../controllers/order.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { placeOrderSchema, updateOrderStatusSchema, calculateDeliverySchema } from '../schemas/order.schema';

const router = Router();

router.get('/', authenticateJWT, getOrders);
router.get('/:id', authenticateJWT, getOrderById);
router.post('/', authenticateJWT, authorizeRoles('user'), validateRequest({ body: placeOrderSchema }), placeOrder);
router.post('/calculate-delivery', authenticateJWT, authorizeRoles('user'), validateRequest({ body: calculateDeliverySchema }), calculateDelivery);
router.patch('/:id/received', authenticateJWT, authorizeRoles('user'), confirmOrderReceived);
router.patch('/:id/status', authenticateJWT, authorizeRoles('vendor', 'super_admin'), validateRequest({ body: updateOrderStatusSchema }), updateOrderStatus);
router.get('/vendor/:vendorId/bank-details', authenticateJWT, getVendorBankDetails);

// External Payment Processor Webhooks
router.post('/webhook/paystack', paystackWebhook); 

export default router;
