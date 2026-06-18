import { Router } from 'express';
import { saveVendorProfile, submitKYC, getKYCStatus } from '../controllers/vendor.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticateJWT, authorizeRoles('vendor', 'super_admin'));

router.post('/profile', saveVendorProfile);
router.post('/kyc/submit', submitKYC);
router.get('/kyc/status', getKYCStatus);

export default router;
