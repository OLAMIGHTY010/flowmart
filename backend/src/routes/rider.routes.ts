import { Router } from 'express';
import { getAvailableDeliveries, acceptDelivery, confirmDelivery } from '../controllers/rider.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// All routes here are strictly for dispatch riders (and super admins for oversight)
router.use(authenticateJWT, authorizeRoles('dispatch_rider', 'super_admin'));

router.get('/available', getAvailableDeliveries);
router.post('/:id/accept', acceptDelivery);
router.post('/:id/confirm', confirmDelivery);

export default router;
