import {
Router } from 'express';
import { placeOrder, getOrders, getOrderById, getOrderTrackingTelemetry, updateOrderStatus, confirmOrderReceived, getVendorBankDetails, paystackWebhook, calculateDelivery, getPayForMeOrder, initializePayForMePayment, getOrderMessages, sendOrderMessage, rateOrder, getFlowPassStatus, subscribeFlowPass, createSplitBillSession, getSplitBillSession, contributeToSplitBill, coverRemainingSplitBill, getActiveOrderTelemetry,
  getPostDeliveryAppreciationData,
  submitCourierTipAndReview,
  getMultiStopRouteSuggestions,
  createMultiStopFeastOrder,
  getMultiStopRouteTelemetry
} from '../controllers/order.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { checkoutLimiter } from '../middleware/rateLimiter.middleware';
import { placeOrderSchema, updateOrderStatusSchema, calculateDeliverySchema } from '../schemas/order.schema';

const router = Router();


// Sprint L: Live Split-the-Bill Group Checkout Engine
router.post('/split-bill/create', createSplitBillSession);
router.get('/split-bill/:code', getSplitBillSession);
router.post('/split-bill/:code/contribute', contributeToSplitBill);
router.post('/split-bill/:code/cover-remaining', coverRemainingSplitBill);

router.get('/', authenticateJWT, getOrders);

// Sprint R: Active Order Status Dynamic Island Telemetry (2026)
router.get('/active-telemetry', getActiveOrderTelemetry);

router.get('/:id', authenticateJWT, getOrderById);
router.get('/:id/tracking-telemetry', authenticateJWT, getOrderTrackingTelemetry);
router.get('/:id/pay-for-me', getPayForMeOrder);
router.post('/:id/pay-for-me/initialize', initializePayForMePayment);
router.get('/:id/messages', authenticateJWT, getOrderMessages);
router.post('/:id/messages', authenticateJWT, sendOrderMessage);
router.post('/:id/rate', authenticateJWT, rateOrder);
router.get('/flowpass/status', authenticateJWT, getFlowPassStatus);
router.post('/flowpass/subscribe', authenticateJWT, subscribeFlowPass);
router.post('/', authenticateJWT, authorizeRoles('user'), checkoutLimiter, validateRequest({ body: placeOrderSchema }), placeOrder);
router.post('/calculate-delivery', authenticateJWT, authorizeRoles('user'), validateRequest({ body: calculateDeliverySchema }), calculateDelivery);
router.patch('/:id/received', authenticateJWT, authorizeRoles('user'), confirmOrderReceived);
router.patch('/:id/status', authenticateJWT, authorizeRoles('vendor', 'super_admin'), validateRequest({ body: updateOrderStatusSchema }), updateOrderStatus);
router.get('/vendor/:vendorId/bank-details', authenticateJWT, getVendorBankDetails);

// External Payment Processor Webhooks
router.post('/webhook/paystack', paystackWebhook); 


// ══════════════════════════════════════════════════════════════════════════
// SPRINT U: POST-DELIVERY TIPPING & COURIER APPRECIATION (2026)
// ══════════════════════════════════════════════════════════════════════════
router.get('/:id/appreciation', getPostDeliveryAppreciationData);
router.post('/:id/appreciation', submitCourierTipAndReview);


// ══════════════════════════════════════════════════════════════════════════
// SPRINT X: MULTI-STOP GROUP FEAST ROUTING (2026)
// ══════════════════════════════════════════════════════════════════════════
router.get('/multi-stop/suggestions', getMultiStopRouteSuggestions);
router.post('/multi-stop', createMultiStopFeastOrder);
router.get('/multi-stop/:id/telemetry', getMultiStopRouteTelemetry);

export default router;
