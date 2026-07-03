import { Router } from 'express';
import { processShoppingQuery } from '../controllers/ai.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// Protect AI routes
router.use(authenticateJWT);

router.post('/chat', processShoppingQuery);

export default router;
