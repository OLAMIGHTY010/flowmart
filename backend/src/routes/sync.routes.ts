import { Router } from 'express';
import { processSyncQueue } from '../controllers/sync.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticateJWT, processSyncQueue);

export default router;
