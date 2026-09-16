import { Router } from 'express';
import { getWalletBalance, getWalletTransactions, fundWallet } from '../controllers/wallet.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/balance', getWalletBalance);
router.get('/transactions', getWalletTransactions);
router.post('/fund', fundWallet);

export default router;
