import { Router } from 'express';
import { openDispute, resolveDispute } from '../controllers/dispute.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { openDisputeSchema, resolveDisputeSchema } from '../schemas/dispute.schema';

const router = Router();

router.post('/', authenticateJWT, validateRequest({ body: openDisputeSchema }), openDispute);
router.post('/:id/resolve', authenticateJWT, validateRequest({ body: resolveDisputeSchema }), resolveDispute);

export default router;
