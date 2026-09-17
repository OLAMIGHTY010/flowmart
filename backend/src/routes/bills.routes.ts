import { Router } from 'express';
import { getBillCategories, validateCustomer, processBillPayment } from '../controllers/bills.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT);

// Get available bill categories (airtime, data, power, cable)
router.get('/categories', getBillCategories);

// Validate customer (meter number, smartcard, etc.)
router.get('/validate', validateCustomer);

// Process bill payment
router.post('/pay', processBillPayment);

export default router;
