import { Router } from 'express';
import { processShoppingQuery } from '../controllers/ai.controller';
import { optionalAuthenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// Allow optional auth so guest shoppers can chat too
router.use(optionalAuthenticateJWT);

router.post('/chat', processShoppingQuery);

export default router;
