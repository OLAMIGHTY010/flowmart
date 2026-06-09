import { Router } from 'express';
import { getAvailableDeliveries, acceptDelivery, confirmDelivery, confirmDeliveryViaQR } from '../controllers/rider.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT, authorizeRoles('dispatch_rider', 'super_admin'));

router.get('/available', getAvailableDeliveries);
router.post('/:id/accept', acceptDelivery);
router.post('/:id/confirm', confirmDelivery);
router.post('/qr-confirm', confirmDeliveryViaQR); // Added QR Route

export default router;
