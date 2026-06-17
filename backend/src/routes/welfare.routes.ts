import { Router } from 'express';
import { 
  createWelfareEvent, 
  allocateWelfare, 
  bulkAllocateWelfare, 
  getWelfareReports 
} from '../controllers/welfare.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all routes in this module
router.use(authenticateJWT);

router.post('/events', authorizeRoles('super_admin', 'camp_logistics_coordinator'), createWelfareEvent);
router.post('/allocations', authorizeRoles('super_admin', 'camp_logistics_coordinator'), allocateWelfare);
router.get('/reports', authorizeRoles('super_admin', 'camp_logistics_coordinator'), getWelfareReports);

router.post('/allocations/bulk', authorizeRoles('super_admin', 'camp_logistics_coordinator'), bulkAllocateWelfare);

export default router;