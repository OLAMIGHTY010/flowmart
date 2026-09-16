import { Router } from 'express';
import { 
  createPromoEvent, 
  allocatePromo, 
  bulkAllocatePromo, 
  getPromoReports,
  reportShortage,
  updatePromoStatus
} from '../controllers/welfare.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.post('/events', authorizeRoles('super_admin', 'regional_coordinator'), createPromoEvent);
router.post('/allocations', authorizeRoles('super_admin', 'regional_coordinator'), allocatePromo);
router.get('/reports', authorizeRoles('super_admin', 'regional_coordinator', 'area_manager'), getPromoReports);

router.post('/allocations/bulk', authorizeRoles('super_admin', 'regional_coordinator'), bulkAllocatePromo);

router.post('/allocations/:id/shortage', authorizeRoles('super_admin', 'regional_coordinator', 'area_manager', 'dispatch_rider'), reportShortage);
router.patch('/allocations/:id/status', authorizeRoles('super_admin', 'regional_coordinator', 'dispatch_rider'), updatePromoStatus);

export default router;
