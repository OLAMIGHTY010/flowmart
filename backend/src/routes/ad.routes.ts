import { Router } from 'express';
import { createAd, getVendorAds } from '../controllers/ad.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticateJWT, createAd);
router.get('/me', authenticateJWT, getVendorAds);

export default router;
