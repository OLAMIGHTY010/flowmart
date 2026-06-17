import { Request, Response } from 'express';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { hashPassword, comparePassword } from '../utils/password';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { emailService } from '../services/email.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// Helper to generate a 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const register = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // ✨ SECURITY FIX: Restrict public registration roles
    const allowedPublicRoles = ['attendee', 'vendor', 'dispatch_rider'];
    const requestedRole = role || 'attendee';

    if (!allowedPublicRoles.includes(requestedRole)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden: Institutional roles must be assigned by an admin' 
      });
    }

    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await hashPassword(password);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    const [newUser] = await db.insert(users).values({
      fullName,
      email,
      password: hashedPassword,
      role: requestedRole, // ✨ Safely insert the validated role
      isVerified: false,
      otp,
      otpExpiry,
    }).returning();

    // Fire & Forget Email
    emailService.sendOtpEmail(newUser.email, { fullName: newUser.fullName, otp }).catch(console.error);

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for the verification code.',
    });

  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user || user.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (user.otpExpiry && new Date() > user.otpExpiry) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Mark as verified and clear OTP
    const [verifiedUser] = await db.update(users).set({
      isVerified: true,
      otp: null,
      otpExpiry: null,
      updatedAt: new Date()
    }).where(eq(users.id, user.id)).returning();

    // Fire & Forget Email
    emailService.sendWelcomeEmail(verifiedUser.email, { 
      fullName: verifiedUser.fullName, 
      role: verifiedUser.role 
    }).catch(console.error);

    // Generate Token
    const token = jwt.sign(
      { id: verifiedUser.id, email: verifiedUser.email, role: verifiedUser.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Account verified successfully',
      token,
      user: { id: verifiedUser.id, fullName: verifiedUser.fullName, email: verifiedUser.email, role: verifiedUser.role }
    });

  } catch (error) {
    console.error('Verify OTP Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: 'Please verify your email before logging in.' });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role }
    });

  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      return res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await db.update(users).set({
      resetToken,
      resetTokenExpiry,
      updatedAt: new Date()
    }).where(eq(users.id, user.id));

    // For production, this should be your frontend domain
    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

    emailService.sendPasswordResetEmail(user.email, { 
      fullName: user.fullName, 
      resetLink 
    }).catch(console.error);

    return res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Password Reset Request Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ success: false, message: 'Token and new password required' });

    const [user] = await db.select().from(users).where(
      and(eq(users.resetToken, token), gt(users.resetTokenExpiry, new Date()))
    ).limit(1);

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const hashedPassword = await hashPassword(newPassword);

    await db.update(users).set({
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
      updatedAt: new Date()
    }).where(eq(users.id, user.id));

    return res.status(200).json({ success: true, message: 'Password has been successfully reset. You can now log in.' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ✨ NEW: Secure Role Assignment Gateway
export const assignRole = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, newRole } = req.body;

    if (!userId || !newRole) {
      return res.status(400).json({ success: false, message: 'User ID and new role are required' });
    }

    const validRoles = ['super_admin', 'camp_logistics_coordinator', 'zone_coordinator', 'vendor', 'dispatch_rider', 'attendee'];
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({ success: false, message: 'Invalid role provided' });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const [updatedUser] = await db.update(users).set({ 
      role: newRole as any, 
      updatedAt: new Date() 
    }).where(eq(users.id, userId)).returning();

    return res.status(200).json({ 
      success: true, 
      message: `User role successfully updated to ${newRole}`,
      user: { id: updatedUser.id, fullName: updatedUser.fullName, email: updatedUser.email, role: updatedUser.role }
    });

  } catch (error) {
    console.error('Assign Role Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};