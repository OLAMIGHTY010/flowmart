import { Request, Response } from 'express';
import { db } from '../../db'; // Assuming db is at the root
import { users, verificationOtps } from '../../db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { hashPassword, comparePassword } from '../utils/password';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../services/email';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
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
    const { fullName, email, password, role, phoneNumber, dateOfBirth, gender } = req.body;

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
      const user = existingUser[0];
      
      // Scenario A: User is registered but not verified
      if (!user.isVerified) {
        // Generate new OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await db.delete(verificationOtps).where(eq(verificationOtps.userId, user.id));
        await db.insert(verificationOtps).values({
          userId: user.id,
          otp: otpCode,
          expiresAt,
        });

        await sendEmail(
          user.email,
          'Verify Your FlowMart Account',
          `Hello ${user.fullName},\n\nYour 6-digit verification code is: ${otpCode}\n\nThis code will expire in 1 hour.\n\nBest regards,\nThe FlowMart Team`
        );

        // Generate Token
        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          process.env.JWT_SECRET!,
          { expiresIn: '24h' }
        );

        return res.status(200).json({
          success: true,
          message: 'This email is registered but not verified yet. We have sent a new verification code. Redirecting you to verify...',
          token,
          user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            phone: user.phone,
            dateOfBirth: user.dateOfBirth,
            gender: user.gender,
            isVerified: false,
            profileCompleted: user.profileCompleted
          }
        });
      }

      // Scenario B: User is registered and verified
      return res.status(400).json({
        success: false,
        code: 'EMAIL_ALREADY_VERIFIED',
        message: 'This email is already registered and verified. If you forgot your password, please suggest/reset it.'
      });
    }

    // Hash and save new user
    const hashedPassword = await hashPassword(password);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    const [newUser] = await db.insert(users).values({
      fullName,
      email,
      password: hashedPassword,
      role: role || 'attendee', 
      phone: phoneNumber || null,
      dateOfBirth: dateOfBirth || null,
      gender: gender || null,
    }).returning();

    // Generate a 6-digit OTP code (e.g. "123456")
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

    // Insert into verificationOtps
    await db.insert(verificationOtps).values({
      userId: newUser.id,
      otp: otpCode,
      expiresAt,
    });

    // Send verification email (logs to emails.log too!)
    await sendEmail(
      newUser.email,
      'Verify Your FlowMart Account',
      `Hello ${newUser.fullName},\n\nYour 6-digit verification code is: ${otpCode}\n\nThis code will expire in 1 hour.\n\nBest regards,\nThe FlowMart Team`
    );
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
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        dateOfBirth: newUser.dateOfBirth,
        gender: newUser.gender,
        isVerified: false,
        profileCompleted: false
      }
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
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. If you forgot your password, please suggest changing/resetting it.'
      });
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
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        isVerified: user.isVerified,
        profileCompleted: user.profileCompleted,
        forcePasswordChange: user.forcePasswordChange
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const [user] = await db.select().from(users).where(eq(users.id, authReq.user.id)).limit(1);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        isVerified: user.isVerified,
        profileCompleted: user.profileCompleted,
        forcePasswordChange: user.forcePasswordChange
      }
    });
  } catch (error) {
    console.error('getMe Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const forceChangePassword = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }

    const [user] = await db.select().from(users).where(eq(users.id, authReq.user.id)).limit(1);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Hash the new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update user record
    await db.update(users)
      .set({ 
        password: hashedNewPassword, 
        forcePasswordChange: false,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    return res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Force Change Password Error:', error);
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

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    let { otp } = req.body;

    // Support both raw string body and wrapped object body
    if (!otp && typeof req.body === 'string') {
      otp = req.body;
    }

    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP code is required' });
    }

    // Find valid OTP record (not expired)
    const now = new Date();
    const [otpRecord] = await db
      .select()
      .from(verificationOtps)
      .where(and(eq(verificationOtps.otp, otp), gt(verificationOtps.expiresAt, now)))
      .limit(1);

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
    }

    // Mark user as verified
    await db.update(users).set({ isVerified: true }).where(eq(users.id, otpRecord.userId));

    // Delete verification OTP
    await db.delete(verificationOtps).where(eq(verificationOtps.id, otpRecord.id));

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    console.error('OTP Verification Error:', error);
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

export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Find user by email
    const [userRecord] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!userRecord) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

    // Delete old OTPs first
    await db.delete(verificationOtps).where(eq(verificationOtps.userId, userRecord.id));

    // Insert new OTP
    await db.insert(verificationOtps).values({
      userId: userRecord.id,
      otp: otpCode,
      expiresAt,
    });

    // Send email (logs to emails.log too!)
    await sendEmail(
      userRecord.email,
      'Verify Your FlowMart Account (Resent OTP)',
      `Hello ${userRecord.fullName},\n\nYour new 6-digit verification code is: ${otpCode}\n\nThis code will expire in 1 hour.\n\nBest regards,\nThe FlowMart Team`
    );

    return res.status(200).json({
      success: true,
      message: 'OTP resent successfully'
    });
  } catch (error) {
    console.error('Resend OTP Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Find user by email
    const [userRecord] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!userRecord) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If unverified, redirect them to verify
    if (!userRecord.isVerified) {
      // Generate OTP and send email
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await db.delete(verificationOtps).where(eq(verificationOtps.userId, userRecord.id));
      await db.insert(verificationOtps).values({
        userId: userRecord.id,
        otp: otpCode,
        expiresAt,
      });

      await sendEmail(
        userRecord.email,
        'Verify Your FlowMart Account',
        `Hello ${userRecord.fullName},\n\nYour 6-digit verification code is: ${otpCode}\n\nThis code will expire in 1 hour.\n\nBest regards,\nThe FlowMart Team`
      );

      // Return token so frontend can log them in to verify
      const token = jwt.sign(
        { id: userRecord.id, email: userRecord.email, role: userRecord.role },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        success: false,
        code: 'EMAIL_UNVERIFIED',
        message: 'This email is registered but not verified yet. Redirecting to OTP verification...',
        token,
        user: {
          id: userRecord.id,
          fullName: userRecord.fullName,
          email: userRecord.email,
          role: userRecord.role,
          isVerified: false,
          profileCompleted: userRecord.profileCompleted
        }
      });
    }

    // Generate reset OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins for password reset

    await db.delete(verificationOtps).where(eq(verificationOtps.userId, userRecord.id));
    await db.insert(verificationOtps).values({
      userId: userRecord.id,
      otp: otpCode,
      expiresAt,
    });

    // Send reset password email
    await sendEmail(
      userRecord.email,
      'Reset Your FlowMart Password',
      `Hello ${userRecord.fullName},\n\nYour 6-digit password reset code is: ${otpCode}\n\nThis code will expire in 15 minutes.\n\nBest regards,\nThe FlowMart Team`
    );

    return res.status(200).json({
      success: true,
      message: 'Password reset code has been sent to your email.'
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP code, and new password are required' });
    }

    // Find user
    const [userRecord] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!userRecord) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Find valid OTP record
    const now = new Date();
    const [otpRecord] = await db
      .select()
      .from(verificationOtps)
      .where(and(eq(verificationOtps.otp, otp), eq(verificationOtps.userId, userRecord.id), gt(verificationOtps.expiresAt, now)))
      .limit(1);

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
    }

    // Hash and update password
    const hashedPassword = await hashPassword(newPassword);
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userRecord.id));

    // Delete OTP
    await db.delete(verificationOtps).where(eq(verificationOtps.id, otpRecord.id));

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully.'
    });
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
