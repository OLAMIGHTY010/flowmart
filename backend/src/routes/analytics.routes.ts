import { Router } from 'express';
import { getDashboardStats, getUserDashboardStats } from '../controllers/analytics.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, authorizeRoles('super_admin'), getDashboardStats);
router.get('/me', authenticateJWT, getUserDashboardStats);

export default router;
