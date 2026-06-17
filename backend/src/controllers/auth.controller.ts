import { Request, Response } from 'express';
import { db } from '../../db'; // Assuming db is at the root
import { users, verificationOtps } from '../../db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { hashPassword, comparePassword } from '../utils/password';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../services/email';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const register = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, role, phoneNumber, dateOfBirth, gender } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Check if user exists
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

    // Generate Token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
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
    });

  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    // Find user
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. If you forgot your password, please suggest changing/resetting it.'
      });
    }

    // Generate Token
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
