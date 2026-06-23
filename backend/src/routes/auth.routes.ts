import { Router } from 'express';
import { 
  register, login, verifyOtp, resendOtp, getMe, logout,
  forgotPassword, resetPassword, forceChangePassword, assignRole,
  googleAuth
} from '../controllers/auth.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================

// Normal Users (Attendees, Vendors, Riders)
router.post('/google', googleAuth);

// Admins / Staff 
router.post('/register', register);
router.post('/login', login);

// Password recovery / Verification (Staff predominantly, except verifyOtp if needed)
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// ==========================================
// PROTECTED ROUTES
// ==========================================
router.post('/logout', authenticateJWT, logout);
router.get('/me', authenticateJWT, getMe);
router.post('/force-change-password', authenticateJWT, forceChangePassword);
router.patch('/assign-role', authenticateJWT, authorizeRoles('super_admin'), assignRole);

export default router;
