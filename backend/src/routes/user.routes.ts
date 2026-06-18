import { Router } from 'express';
import { updateProfile } from '../controllers/user.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();
router.put('/profile', authenticateJWT, updateProfile);

export default router;
