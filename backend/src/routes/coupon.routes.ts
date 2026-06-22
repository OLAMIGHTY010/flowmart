import { Router } from 'express';
import { getVendorCoupons, createCoupon, validateCoupon } from '../controllers/coupon.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/vendor', authorizeRoles('vendor'), getVendorCoupons);
router.post('/vendor', authorizeRoles('vendor'), createCoupon);
router.post('/validate', validateCoupon);

export default router;
