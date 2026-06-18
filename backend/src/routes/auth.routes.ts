import { Router } from 'express';
import { register, login, verifyOtp, requestPasswordReset, resetPassword, assignRole } from '../controllers/auth.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Public Routes
router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.post('/request-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);

// ✨ Secure Admin Routes
router.patch('/assign-role', authenticateJWT, authorizeRoles('super_admin'), assignRole);

export default router;
