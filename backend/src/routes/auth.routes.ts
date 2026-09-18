import { Router } from 'express';
import { 
  register, login, verifyOtp, resendOtp, getMe, logout,
  forgotPassword, resetPassword, forceChangePassword, assignRole, syncSession,
  googleAuth
} from '../controllers/auth.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

import { validateRequest } from '../middleware/validate.middleware';
import { 
  registerSchema, loginSchema, verifyOtpSchema, resendOtpSchema, 
  forgotPasswordSchema, resetPasswordSchema, googleAuthSchema 
} from '../schemas/auth.schema';

const router = Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================

// Normal Users (Users, Vendors, Riders)
router.post('/google', validateRequest({ body: googleAuthSchema }), googleAuth);

// Admins / Staff 
router.post('/register', validateRequest({ body: registerSchema }), register);
router.post('/login', validateRequest({ body: loginSchema }), login);
router.post('/logout', authenticateJWT, logout);
router.post('/sync', authenticateJWT, syncSession);

// Password recovery / Verification (Staff predominantly, except verifyOtp if needed)
router.post('/verify-otp', validateRequest({ body: verifyOtpSchema }), verifyOtp);
router.post('/resend-otp', validateRequest({ body: resendOtpSchema }), resendOtp);
router.post('/forgot-password', validateRequest({ body: forgotPasswordSchema }), forgotPassword);
router.post('/reset-password', validateRequest({ body: resetPasswordSchema }), resetPassword);

// ==========================================
// PROTECTED ROUTES
// ==========================================
router.post('/logout', authenticateJWT, logout);
router.get('/me', authenticateJWT, getMe);
router.post('/force-change-password', authenticateJWT, forceChangePassword);
router.patch('/assign-role', authenticateJWT, authorizeRoles('super_admin'), assignRole);

export default router;
