import { Router } from 'express';
import { openDispute, resolveDispute } from '../controllers/dispute.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticateJWT, openDispute);
router.post('/:id/resolve', authenticateJWT, resolveDispute);

export default router;
