import { Router } from 'express';
import { register, login, verifyOtp, resendOtp, getMe, forgotPassword, resetPassword, forceChangePassword } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticateJWT, getMe);
router.post('/force-change-password', authenticateJWT, forceChangePassword);

export default router;
