import { Router } from 'express';
import { getOrders, getOrderById, updateOrderStatus, getAvailableDeliveries, acceptDelivery, confirmDelivery, confirmDeliveryViaQR, submitKYC, getKYCStatus } from '../controllers/rider.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT, authorizeRoles('dispatch_rider', 'super_admin'));

router.get('/orders', getOrders);
router.get('/orders/:id', getOrderById);
router.patch('/orders/:id/status', updateOrderStatus);
router.post('/orders/:id/accept', acceptDelivery);
router.get('/available', getAvailableDeliveries); // Keep legacy just in case
router.post('/:id/accept', acceptDelivery);       // Keep legacy just in case
router.post('/:id/confirm', confirmDelivery);
router.post('/qr-confirm', confirmDeliveryViaQR); // Added QR Route
router.post('/kyc/submit', submitKYC);
router.get('/kyc/status', getKYCStatus);

export default router;
