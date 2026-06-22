import { Router } from 'express';
import { getWalletBalance, getWalletTransactions } from '../controllers/wallet.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/balance', getWalletBalance);
router.get('/transactions', getWalletTransactions);

export default router;
