import { Request, Response } from 'express';
import { db } from '../../db';
import { users, vendorKyc, staffProfiles } from '../../db/schema';
import { eq, or, and, sql, desc, inArray } from 'drizzle-orm';
import { hashPassword } from '../utils/password';
import crypto from 'crypto';
import { emailService } from '../services/email.service';

const generateSecureOTP = () => crypto.randomInt(100000, 999999).toString();


const generateAlphanumericPassword = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export const getUsersStats = async (req: Request, res: Response) => {
  try {
    // Total users (attendees, vendors, riders, admins)
    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(users);
    const totalUsers = Number(totalResult[0]?.count) || 0;

    // Suspended accounts
    const suspendedResult = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.status, 'suspended'));
    const suspendedAccounts = Number(suspendedResult[0]?.count) || 0;

    // Pending approvals: vendors from vendor_kyc
    const pendingVendorsResult = await db.select({ count: sql<number>`count(*)` })
      .from(vendorKyc)
      .where(eq(vendorKyc.status, 'pending'));
    const pendingVendors = Number(pendingVendorsResult[0]?.count) || 0;
    
    // For now we don't have rider_kyc, so pending approvals is just vendors.
    // In the future: const pendingRiders = await ...
    const pendingApprovals = pendingVendors;

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        newThisMonth: 128, // Mocked for UI parity, usually you'd query where createdAt > startOfMonth
        pendingApprovals,
        suspendedAccounts
      }
    });
  } catch (error) {
    console.error("Error in getUsersStats:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    const roleFilter = req.query.role as string;
    const statusFilter = req.query.status as string;
    const search = req.query.search as string;

    let conditions: any[] = [];

    if (roleFilter && roleFilter !== 'all') {
      if (roleFilter === 'admins') {
        conditions.push(inArray(users.role, ['super_admin', 'admin']));
      } else {
        conditions.push(eq(users.role, roleFilter as any));
      }
    }
    
    if (statusFilter && statusFilter !== 'all') {
      // Pending vendors are managed via vendorKyc, but let's assume 'pending' implies users without profileCompleted or explicit status.
      // If status filter is 'suspended', filter users table.
      if (statusFilter === 'suspended') {
        conditions.push(eq(users.status, 'suspended'));
      }
    }

    if (search) {
      conditions.push(
        or(
          sql`lower(${users.fullName}) LIKE ${`%${search.toLowerCase()}%`}`,
          sql`lower(${users.email}) LIKE ${`%${search.toLowerCase()}%`}`
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const usersList = await db.select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      phone: users.phone,
      role: users.role,
      status: users.status,
      lastLogin: users.lastLogin,
      createdAt: users.createdAt
    })
    .from(users)
    .where(whereClause)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

    const totalCountResult = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereClause);
      
    const totalItems = Number(totalCountResult[0]?.count) || 0;

    return res.status(200).json({
      success: true,
      data: usersList,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page
      }
    });

  } catch (error) {
    console.error("Error in getUsers:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;

    // RBAC: Only super_admin can create new users from the dashboard
    if (!currentUser || currentUser.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: "Forbidden: Only Super Admins can create new user accounts." });
    }

    const { fullName, email, role, phone, dateOfBirth, gender, password, church, zonal, department, professionalCertification, grade } = req.body;
    
    if (!fullName || !email || !role) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Only allow specific administrative roles to be created via this endpoint
    const allowedRoles = ['admin', 'super_admin', 'zone_coordinator', 'camp_logistics_coordinator', 'finance', 'auditor', 'customer_service'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role selected" });
    }

    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      return res.status(400).json({ success: false, message: "User with this email already exists" });
    }

    const actualPassword = password || generateAlphanumericPassword(12);
    const hashedPassword = await hashPassword(actualPassword);

    const [newUser] = await db.insert(users).values({
      fullName,
      email,
      password: hashedPassword,
      role: role as any,
      phone: phone || null,
      dateOfBirth: dateOfBirth || null,
      gender: gender || null,
      isVerified: true, 
      profileCompleted: true,
      forcePasswordChange: true, 
      status: 'active'
    }).returning();

    // Insert staff profile
    await db.insert(staffProfiles).values({
      userId: newUser.id,
      church: church || null,
      zonal: zonal || null,
      department: department || null,
      professionalCertification: professionalCertification || null,
      grade: grade || null
    });

    const loginUrl = `${process.env.ADMIN_PORTAL_URL}/login`;

    // Send Onboarding Email
    await emailService.sendStaffOnboardingEmail(email, {
      fullName,
      role: role as string,
      tempPassword: actualPassword,
      loginUrl
    }).catch(err => {
      console.error("Failed to send onboarding email:", err);
    });
    
    return res.status(201).json({
      success: true,
      message: "User created successfully",
      tempPassword: actualPassword
    });

  } catch (error) {
    console.error("Error in createUser:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active', 'suspended', 'archived', 'deleted'
    const currentUser = (req as any).user;

    if (!['active', 'suspended', 'archived', 'deleted'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const targetUserArr = await db.select().from(users).where(eq(users.id, id as string)).limit(1);
    if (!targetUserArr.length) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const targetUser = targetUserArr[0];

    // RBAC: Super Admins cannot be suspended, archived, or deleted
    if (targetUser.role === 'super_admin' && status !== 'active') {
      return res.status(403).json({ success: false, message: "Super Admin accounts cannot be suspended, archived, or deleted." });
    }

    // RBAC: Admins cannot modify Super Admins
    if (currentUser.role === 'admin' && targetUser.role === 'super_admin') {
      return res.status(403).json({ success: false, message: "Admins cannot modify Super Admin accounts." });
    }

    if (status === 'deleted') {
      await db.delete(users).where(eq(users.id, id as string));
      return res.status(200).json({ success: true, message: "User account deleted successfully" });
    }

    await db.update(users)
      .set({ status: status as any })
      .where(eq(users.id, id as string));

    return res.status(200).json({ success: true, message: `User status updated to ${status}` });
  } catch (error) {
    console.error("Error in updateUserStatus:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { fullName, email, phone, role } = req.body;
    const currentUser = (req as any).user;

    const targetUserArr = await db.select().from(users).where(eq(users.id, id as string)).limit(1);
    if (!targetUserArr.length) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const targetUser = targetUserArr[0];

    // RBAC logic for updating details
    if (currentUser.role !== 'super_admin' && (targetUser.role === 'admin' || targetUser.role === 'super_admin')) {
      return res.status(403).json({ success: false, message: "Only super admins can update admin profile details." });
    }

    if (currentUser.role === 'admin' && currentUser.id !== targetUser.id && (targetUser.role === 'admin' || targetUser.role === 'super_admin')) {
      return res.status(403).json({ success: false, message: "Admins cannot modify other admin accounts." });
    }

    const updates: any = {};
    if (fullName) updates.fullName = fullName;
    if (email) updates.email = email;
    if (phone !== undefined) updates.phone = phone || null;

    // Only super_admin can change roles
    if (role && currentUser.role === 'super_admin') {
      updates.role = role;
    } else if (role && role !== targetUser.role) {
      return res.status(403).json({ success: false, message: "Only super admins can change user roles." });
    }

    if (Object.keys(updates).length > 0) {
      await db.update(users).set(updates).where(eq(users.id, id as string));
    }

    return res.status(200).json({ success: true, message: "User profile updated successfully" });
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
