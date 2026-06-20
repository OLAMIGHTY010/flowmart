import { Router } from 'express';
import { getPaystackKey, paystackWebhook, verifyPayment } from '../controllers/payment.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// Used by frontend to grab the key safely
router.get('/config', getPaystackKey);

// Immediate frontend confirmation for gateways
router.post('/verify', authenticateJWT, verifyPayment);

// The core webhook Paystack will hit
router.post('/webhook', paystackWebhook);

export default router;
