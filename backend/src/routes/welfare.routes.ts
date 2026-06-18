import { Router } from 'express';
import { 
  createWelfareEvent, 
  allocateWelfare, 
  bulkAllocateWelfare, 
  getWelfareReports,
  reportShortage,
  updateWelfareStatus
} from '../controllers/welfare.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.post('/events', authorizeRoles('super_admin', 'camp_logistics_coordinator'), createWelfareEvent);
router.post('/allocations', authorizeRoles('super_admin', 'camp_logistics_coordinator'), allocateWelfare);
router.get('/reports', authorizeRoles('super_admin', 'camp_logistics_coordinator', 'zone_coordinator'), getWelfareReports);

router.post('/allocations/bulk', authorizeRoles('super_admin', 'camp_logistics_coordinator'), bulkAllocateWelfare);

router.post('/allocations/:id/shortage', authorizeRoles('super_admin', 'camp_logistics_coordinator', 'zone_coordinator', 'dispatch_rider'), reportShortage);
router.patch('/allocations/:id/status', authorizeRoles('super_admin', 'camp_logistics_coordinator', 'dispatch_rider'), updateWelfareStatus);

export default router;
