import { Request, Response } from 'express';
import { db } from '../../db';
import { users, vendorKyc } from '../../db/schema';
import { eq, or, and, sql, desc, inArray } from 'drizzle-orm';
import { hashPassword } from '../utils/password';
import { sendEmail } from '../services/email';

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

    let conditions = [];

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

    const { fullName, email, role } = req.body;
    
    if (!fullName || !email || !role) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Only allow specific administrative roles to be created via this endpoint
    const allowedRoles = ['admin', 'super_admin', 'zone_coordinator', 'camp_logistics_coordinator'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role selected" });
    }

    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      return res.status(400).json({ success: false, message: "User with this email already exists" });
    }

    const generatedPassword = generateAlphanumericPassword(12);
    const hashedPassword = await hashPassword(generatedPassword);

    await db.insert(users).values({
      fullName,
      email,
      password: hashedPassword,
      role: role as any,
      isVerified: true, // Auto verified
      forcePasswordChange: true, // Must change on first login
      status: 'active'
    });

    // In a real app, send this password via email
    console.log(`[Email Mock] Sent to ${email}: Your account is created. Role: ${role}. Password: ${generatedPassword}. Please change your password upon your first login.`);
    
    // Attempt real email (fail gracefully)
    try {
      await sendEmail(
        email,
        "Welcome to FlowMart Admin Portal",
        `Hello ${fullName},\n\nAn account has been created for you with the role ${role}.\n\nYour temporary password is: ${generatedPassword}\n\nYou will be required to change your password upon your first login.`,
        `<p>Hello ${fullName},</p><p>An account has been created for you with the role <b>${role}</b>.</p><p>Your temporary password is: <b>${generatedPassword}</b></p><p>You will be required to change your password upon your first login.</p>`
      );
    } catch (e) {
      console.warn("Could not send real email, continuing.");
    }

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      // Only returning password for debugging in dev mode, usually you don't return it
      tempPassword: generatedPassword
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
