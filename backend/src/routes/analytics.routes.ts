import { Router } from 'express';
import { getDashboardStats } from '../controllers/analytics.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, authorizeRoles('super_admin'), getDashboardStats);

export default router;
