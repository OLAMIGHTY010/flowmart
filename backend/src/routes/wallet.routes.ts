import { Router } from 'express';
import { getWalletBalance, getWalletTransactions, fundWallet, transferFunds } from '../controllers/wallet.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/balance', getWalletBalance);
router.get('/transactions', getWalletTransactions);
router.post('/fund', fundWallet);
router.post('/transfer', transferFunds);

export default router;
