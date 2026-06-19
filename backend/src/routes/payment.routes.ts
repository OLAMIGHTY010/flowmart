import { Router } from 'express';
import { getPaystackKey, paystackWebhook } from '../controllers/payment.controller';

const router = Router();

// Used by frontend to grab the key safely
router.get('/config', getPaystackKey);

// The core webhook Paystack will hit
router.post('/webhook', paystackWebhook);

export default router;
