import { Router } from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';
import { LogisticsPricingController } from '../controllers/logistics-pricing.controller';

const router = Router();

router.use(authenticateJWT);
router.use(authorizeRoles('super_admin', 'admin', 'finance', 'camp_logistics_coordinator', 'zone_coordinator'));

// Zones
router.get('/zones', LogisticsPricingController.getZones);
// Only logistics coordinators can create zones
router.post('/zones', authorizeRoles('camp_logistics_coordinator', 'zone_coordinator'), LogisticsPricingController.createZone);
// Update zone (both finance and logistics can update, but we filter fields in the controller)
router.patch('/zones/:id', LogisticsPricingController.updateZone);

// Rules (Only Finance can create/update pricing rules)
router.get('/rules', LogisticsPricingController.getRules);
router.post('/rules', authorizeRoles('finance'), LogisticsPricingController.createRule);
router.patch('/rules/:id', authorizeRoles('finance'), LogisticsPricingController.updateRule);

export default router;
