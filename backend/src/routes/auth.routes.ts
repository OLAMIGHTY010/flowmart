import { Router } from 'express';
import { register, login, verifyOtp, resendOtp, getMe, forgotPassword, resetPassword, forceChangePassword } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { register, login, verifyOtp, requestPasswordReset, resetPassword, assignRole } from '../controllers/auth.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Public Routes
router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticateJWT, getMe);
router.post('/force-change-password', authenticateJWT, forceChangePassword);
router.post('/request-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);

// ✨ Secure Admin Routes
router.patch('/assign-role', authenticateJWT, authorizeRoles('super_admin'), assignRole);

export default router;
