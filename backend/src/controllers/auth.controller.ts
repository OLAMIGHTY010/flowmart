import { Request, Response } from 'express';
import { db } from '../../db'; 
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, comparePassword } from '../utils/password';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { emailService } from '../services/email.service';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';

// Initialize Google Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper to generate a secure 6-digit OTP
const generateSecureOTP = () => crypto.randomInt(100000, 999999).toString();

// ==========================================
// GOOGLE AUTHENTICATION (Normal Users)
// ==========================================
export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { idToken, role } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Google ID token is required' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ success: false, message: 'Invalid Google token' });
    }

    const { email, name, sub: googleId, picture, gender, birthdate } = payload as any;

    let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      if (!role) {
         return res.status(403).json({ 
           success: false, 
           message: 'Account not found. Please click "Get Started" to register a new account.' 
         });
      }
      
      // Create new Google User
      const requestedRole = ['attendee', 'vendor', 'dispatch_rider'].includes(role) ? role : 'attendee';
      
      const [newUser] = await db.insert(users).values({
        fullName: name || 'Google User',
        email,
        authProvider: 'google',
        providerId: googleId,
        avatar: picture,
        role: requestedRole,
        gender: gender || null,
        dateOfBirth: birthdate ? new Date(birthdate) : null,
        isVerified: requestedRole === 'attendee', // Attendees are verified automatically; Vendors/Riders need admin approval
      }).returning();
      
      user = newUser;

      emailService.sendWelcomeEmail(user.email, { fullName: user.fullName, role: user.role }).catch(console.error);
    } else {
      // Prevent local users from logging in with Google unexpectedly
      if (user.authProvider === 'local') {
         return res.status(403).json({ success: false, message: 'This email is registered with a password. Please use standard login.' });
      }
      
      // Enforce strict role matching: an email cannot be used for a different role
      if (role && user.role !== role && ['attendee', 'vendor', 'dispatch_rider'].includes(role)) {
         return res.status(403).json({ 
           success: false, 
           message: `This email is already registered as a ${user.role}. Please log in with the correct role.` 
         });
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Google Login successful',
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
      }
    });

  } catch (error) {
    console.error('Google Auth Error:', error);
    return res.status(500).json({ success: false, message: 'Authentication failed' });
  }
};

// ==========================================
// REGISTRATION (Admins / Staff Only)
// ==========================================
export const register = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, role, phoneNumber, dateOfBirth, gender } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const staffRoles = ['super_admin', 'admin', 'camp_logistics_coordinator', 'zone_coordinator', 'finance', 'auditor', 'customer_service'];
    const requestedRole = role || 'attendee';

    if (!staffRoles.includes(requestedRole)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden: Normal users must sign up using Google Auth.' 
      });
    }

    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      const user = existingUser[0];
      
      if (!user.isVerified) {
        const otpCode = generateSecureOTP();
        const hashedOtp = await hashPassword(otpCode);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await db.update(users).set({
          otp: hashedOtp,
          otpExpiry: expiresAt,
        }).where(eq(users.id, user.id));

        emailService.sendOtpEmail(user.email, { fullName: user.fullName, otp: otpCode }).catch(console.error);

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

      return res.status(400).json({
        success: false,
        code: 'EMAIL_ALREADY_VERIFIED',
        message: 'This email is already registered and verified. If you forgot your password, please suggest/reset it.'
      });
    }

    const hashedPassword = await hashPassword(password);
    const otpCode = generateSecureOTP();
    const hashedOtp = await hashPassword(otpCode);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

    const [newUser] = await db.insert(users).values({
      fullName,
      email,
      password: hashedPassword,
      authProvider: 'local',
      role: requestedRole, 
      phone: phoneNumber || null,
      dateOfBirth: dateOfBirth || null,
      gender: gender || null,
      otp: hashedOtp,
      otpExpiry: expiresAt,
    }).returning();

    emailService.sendOtpEmail(newUser.email, { fullName: newUser.fullName, otp: otpCode }).catch(console.error);

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

    if (!user || !user.otp) {
      return res.status(400).json({ success: false, message: 'Invalid request or OTP' });
    }

    if (user.otpExpiry && new Date() > user.otpExpiry) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    const isValid = await comparePassword(otp, user.otp);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    const [verifiedUser] = await db.update(users).set({
      isVerified: true,
      otp: null,
      otpExpiry: null,
      updatedAt: new Date()
    }).where(eq(users.id, user.id)).returning();

    emailService.sendWelcomeEmail(verifiedUser.email, { 
      fullName: verifiedUser.fullName, 
      role: verifiedUser.role 
    }).catch(console.error);

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

// ==========================================
// LOGIN (Admins / Staff Only)
// ==========================================
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

    if (user.authProvider === 'google' || !user.password) {
      return res.status(403).json({ success: false, message: 'Please sign in with Google.' });
    }

    const staffRoles = ['super_admin', 'admin', 'camp_logistics_coordinator', 'zone_coordinator', 'finance', 'auditor', 'customer_service'];
    if (!staffRoles.includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Normal users must log in via Google.' });
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

export const logout = async (req: Request, res: Response) => {
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
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

    const hashedNewPassword = await hashPassword(newPassword);

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

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      return res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    if (user.authProvider === 'google') {
      return res.status(400).json({ success: false, message: 'Please sign in using Google.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await db.update(users).set({
      resetToken,
      resetTokenExpiry,
      updatedAt: new Date()
    }).where(eq(users.id, user.id));

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

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

export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const [userRecord] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!userRecord) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (userRecord.authProvider === 'google') {
       return res.status(400).json({ success: false, message: 'Google users do not need OTPs. Please sign in with Google.' });
    }

    const otpCode = generateSecureOTP();
    const hashedOtp = await hashPassword(otpCode);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); 

    await db.update(users).set({
      otp: hashedOtp,
      otpExpiry: expiresAt,
    }).where(eq(users.id, userRecord.id));

    emailService.sendOtpEmail(userRecord.email, { fullName: userRecord.fullName, otp: otpCode }).catch(console.error);

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

    const [userRecord] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!userRecord) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (userRecord.authProvider === 'google') {
       return res.status(400).json({ success: false, message: 'Please sign in using Google.' });
    }

    const otpCode = generateSecureOTP();
    const hashedOtp = await hashPassword(otpCode);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); 

    await db.update(users).set({
      otp: hashedOtp,
      otpExpiry: expiresAt,
    }).where(eq(users.id, userRecord.id));

    emailService.sendOtpEmail(userRecord.email, { fullName: userRecord.fullName, otp: otpCode }).catch(console.error);

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

    const [userRecord] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!userRecord) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!userRecord.otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP code' });
    }

    if (userRecord.otpExpiry && new Date() > userRecord.otpExpiry) {
      return res.status(400).json({ success: false, message: 'OTP code has expired' });
    }

    const isValid = await comparePassword(otp, userRecord.otp);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid OTP code' });
    }

    const hashedPassword = await hashPassword(newPassword);
    
    await db.update(users).set({ 
      password: hashedPassword,
      otp: null,
      otpExpiry: null
    }).where(eq(users.id, userRecord.id));

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully.'
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

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
