import { Router } from 'express';
import { createWelfareEvent, allocateWelfare, getWelfareReports } from '../controllers/welfare.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT);
router.get('/reports', authorizeRoles('super_admin', 'camp_logistics_coordinator'), getWelfareReports);
router.post('/events', authorizeRoles('super_admin', 'camp_logistics_coordinator'), createWelfareEvent);
router.post('/allocations', authorizeRoles('super_admin', 'camp_logistics_coordinator'), allocateWelfare);

export default router;
