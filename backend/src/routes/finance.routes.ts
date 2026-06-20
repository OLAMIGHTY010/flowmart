import { Router } from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';
import { FinanceController } from '../controllers/finance.controller';

const router = Router();

router.use(authenticateJWT);
router.use(authorizeRoles('super_admin', 'admin', 'finance', 'auditor'));

router.get('/payouts-impact', FinanceController.getPayoutsImpact);
router.get('/reconciliation', FinanceController.getReconciliation);
router.get('/report', FinanceController.generateFinancialReport);

// Payout Resolution
router.get('/payouts/failed', FinanceController.getFailedPayouts);
router.post('/payouts/:id/retry', authorizeRoles('super_admin', 'finance'), FinanceController.retryPayout);

export default router;
