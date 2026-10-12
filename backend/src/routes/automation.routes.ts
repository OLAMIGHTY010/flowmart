/**
 * ============================================================================
 * AUTONOMOUS OPERATIONS & MULTI-BODY AUTOMATION ROUTES
 * ============================================================================
 *
 * Base Path: /api/v1/automation
 *
 * Exposes:
 * - Vendor: /vendor/inventory-alerts, /vendor/payouts, /vendor/cart-recovery
 * - Rider: /rider/active-offer, /rider/respond
 * - User/Buyer: /user/dispute/arbitrate, /user/currency/convert, /user/diaspora/quote
 * - Admin: /admin/dashboard, /admin/heartbeat, /admin/fraud/lift-quarantine,
 *          /admin/dispute/threshold, /admin/fx/sync
 *
 * @module backend/src/routes/automation.routes
 */

import { Router } from 'express';
import { AutomationController } from '../controllers/automation.controller';
import { optionalAuthenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// ==========================================
// VENDOR AUTOMATION ROUTES
// ==========================================
router.get('/vendor/inventory-alerts', optionalAuthenticateJWT, AutomationController.getVendorInventoryAlerts);
router.get('/vendor/payouts', optionalAuthenticateJWT, AutomationController.getVendorPayoutStatement);
router.get('/vendor/cart-recovery', optionalAuthenticateJWT, AutomationController.getVendorCartRecovery);

// ==========================================
// RIDER AUTOMATION ROUTES
// ==========================================
router.get('/rider/active-offer', optionalAuthenticateJWT, AutomationController.getRiderActiveOffer);
router.post('/rider/respond', optionalAuthenticateJWT, AutomationController.handleRiderOfferResponse);

// ==========================================
// USER / BUYER AUTOMATION ROUTES
// ==========================================
router.post('/user/dispute/arbitrate', optionalAuthenticateJWT, AutomationController.arbitrateUserDispute);
router.post('/user/currency/convert', optionalAuthenticateJWT, AutomationController.convertCurrency);
router.post('/user/diaspora/quote', optionalAuthenticateJWT, AutomationController.getDiasporaQuote);

// ==========================================
// ADMIN CONTROL PLANE ROUTES
// ==========================================
router.get('/admin/dashboard', optionalAuthenticateJWT, AutomationController.getAdminDashboard);
router.post('/admin/heartbeat', optionalAuthenticateJWT, AutomationController.triggerAutonomousHeartbeat);
router.post('/admin/fraud/lift-quarantine', optionalAuthenticateJWT, AutomationController.liftFraudQuarantine);
router.post('/admin/dispute/threshold', optionalAuthenticateJWT, AutomationController.setMicroDisputeThreshold);
router.post('/admin/fx/sync', optionalAuthenticateJWT, AutomationController.syncExchangeRates);

export default router;
