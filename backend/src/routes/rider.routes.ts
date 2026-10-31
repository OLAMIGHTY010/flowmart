import { Router } from 'express';
import { getOrders, getOrderById, updateOrderStatus, getAvailableDeliveries, acceptDelivery, confirmDelivery, confirmDeliveryViaQR, submitKYC, getKYCStatus, updateLocation, getRiderEarningsAnalytics, getCashOnDeliveryLedger, remitCashFloat, getDemandHotspots, getActiveStackedBatch, acceptStackedBatch, verifyHandoverOTP, uploadProofOfDelivery, getAvailableShifts, bookShiftSlot, getActiveShiftStatus, checkInShift, checkOutShift, getShiftHistory,
  getChampionTierStatus,
  getChampionQuests,
  claimChampionQuestBounty,
  getChampionTierBenefitsMatrix,
  getActiveSOSIncident,
  triggerEmergencySOS,
  requestCargoHandoff,
  confirmCargoHandoff,
  claimEmergencyRepairAllowance,
  confirmSafetyCheckIn,
  resolveEmergencySOS
} from '../controllers/rider.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT, authorizeRoles('dispatch_rider', 'super_admin'));

// Platform B: Courier / Champion Experience Endpoints
router.get('/earnings/analytics', getRiderEarningsAnalytics);
router.get('/cod/ledger', getCashOnDeliveryLedger);
router.post('/cod/remit', remitCashFloat);
router.get('/hotspots', getDemandHotspots);


// Sprint K: Courier Shift Scheduling & Guaranteed Hourly Floor Pay
router.get('/shifts/available', getAvailableShifts);
router.post('/shifts/book', bookShiftSlot);
router.get('/shifts/active', getActiveShiftStatus);
router.post('/shifts/check-in', checkInShift);
router.post('/shifts/check-out', checkOutShift);
router.get('/shifts/history', getShiftHistory);

// Pack F: Multi-Order Stacked Batching & Proof-of-Delivery
router.get('/batch/active', getActiveStackedBatch);
router.post('/batch/accept', acceptStackedBatch);
router.post('/delivery/verify-otp', verifyHandoverOTP);
router.post('/delivery/upload-pod', uploadProofOfDelivery);

router.get('/orders', getOrders);
router.get('/orders/:id', getOrderById);
router.patch('/orders/:id/status', updateOrderStatus);
router.post('/orders/:id/accept', acceptDelivery);
router.post('/location', updateLocation);
router.get('/available', getAvailableDeliveries); // Keep legacy just in case
router.post('/:id/accept', acceptDelivery);       // Keep legacy just in case
router.post('/:id/confirm', confirmDelivery);
router.post('/qr-confirm', confirmDeliveryViaQR); // Added QR Route
router.post('/kyc/submit', submitKYC);
router.get('/kyc/status', getKYCStatus);


// Sprint O: Courier Champion Tier Progression & VIP Quest Badges (2026)
router.get('/champion-tier', getChampionTierStatus);
router.get('/champion-quests', getChampionQuests);
router.post('/champion-quests/:id/claim', claimChampionQuestBounty);
router.get('/tier-benefits', getChampionTierBenefitsMatrix);


// Sprint Y: Courier Champion Emergency SOS & Roadside Assistance Beacon (2026)
router.get('/sos/active', getActiveSOSIncident);
router.post('/sos/trigger', triggerEmergencySOS);
router.post('/sos/handoff/request', requestCargoHandoff);
router.post('/sos/handoff/confirm', confirmCargoHandoff);
router.post('/sos/allowance/claim', claimEmergencyRepairAllowance);
router.post('/sos/safety-checkin', confirmSafetyCheckIn);
router.post('/sos/resolve', resolveEmergencySOS);

export default router;
