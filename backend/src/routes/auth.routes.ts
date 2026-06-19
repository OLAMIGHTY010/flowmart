import { Router } from 'express';
import { 
  register, login, verifyOtp, resendOtp, getMe, logout,
  forgotPassword, resetPassword, forceChangePassword, assignRole 
} from '../controllers/auth.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticateJWT, logout);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/me', authenticateJWT, getMe);
router.post('/force-change-password', authenticateJWT, forceChangePassword);
router.patch('/assign-role', authenticateJWT, authorizeRoles('super_admin'), assignRole);

export default router;
