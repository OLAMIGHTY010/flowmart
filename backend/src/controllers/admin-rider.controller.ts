import { Request, Response } from 'express';
import { db } from '../../db';
import { users, orders, riderKyc, riderProfiles } from '../../db/schema';
import { eq, or, and, sql, desc, ilike } from 'drizzle-orm';
import { emailService } from '../services/email.service';

export const getRiderStats = async (req: Request, res: Response) => {
  try {
    const totalResult = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, 'dispatch_rider'));
    const totalRiders = totalResult[0].count;

    const activeResult = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(
        and(
          eq(users.role, 'dispatch_rider'),
          eq(users.status, 'active')
        )
      );
    const activeNow = activeResult[0].count;

    const completedOrdersResult = await db.select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.status, 'delivered'));
    const completedDeliveries = Number(completedOrdersResult[0]?.count) || 0;

    const avgDeliveriesPerRider = totalRiders > 0 ? (completedDeliveries / totalRiders).toFixed(1) : 0;

    const allKyc = await db.select().from(riderKyc);
    
    let pendingReview = 0;
    let approvedThisMonth = 0;
    let rejected = 0;
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    allKyc.forEach(kyc => {
      if (kyc.status === 'pending' || kyc.status === 'under_review') {
        pendingReview++;
      } else if (kyc.status === 'rejected') {
        rejected++;
      } else if (kyc.status === 'approved') {
        const updatedAt = new Date(kyc.updatedAt);
        if (updatedAt >= startOfMonth) {
          approvedThisMonth++;
        }
      }
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalRiders,
        activeNow,
        completedDeliveries,
        avgDeliveriesPerRider: Number(avgDeliveriesPerRider),
        pendingReview,
        approvedThisMonth,
        rejected
      }
    });
  } catch (error) {
    console.error("Error in getRiderStats:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getRidersList = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    const statusFilter = req.query.status as string;
    const search = req.query.search as string;

    let conditions: any[] = [eq(users.role, 'dispatch_rider')];

    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        conditions.push(or(eq(riderKyc.status, 'pending'), eq(riderKyc.status, 'under_review')));
      } else {
        conditions.push(eq(riderKyc.status, statusFilter));
      }
    }

    if (search) {
      conditions.push(
        or(
          ilike(users.fullName, `%${search}%`),
          ilike(users.email, `%${search}%`)
        )
      );
    }

    const whereClause = and(...conditions);

    // Using mock data for location/deliveries since schema doesn't have it yet
    const rawRiders = await db.select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      phone: users.phone,
      lastLogin: users.lastLogin,
      status: riderKyc.status,
    })
    .from(riderKyc)
    .innerJoin(users, eq(users.id, riderKyc.riderId))
    .where(whereClause)
    .orderBy(desc(riderKyc.createdAt))
    .limit(limit)
    .offset(offset);

    const totalCountResult = await db.select({ count: sql<number>`count(*)` })
      .from(riderKyc)
      .innerJoin(users, eq(users.id, riderKyc.riderId))
      .where(whereClause);
    const totalItems = totalCountResult[0].count;

    const formattedRiders = await Promise.all(rawRiders.map(async (r) => {
      // Find today's deliveries
      const today = new Date();
      today.setHours(0,0,0,0);
      const deliveryRes = await db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(and(eq(orders.riderId, r.id), sql`${orders.createdAt} >= ${today}`, eq(orders.status, 'delivered')));

      const deliveriesToday = Number(deliveryRes[0]?.count) || 0;

      const kycDataList = await db.select().from(riderKyc).where(eq(riderKyc.riderId, r.id)).limit(1);
      const kycData = kycDataList[0];

      let score = 0;
      if (kycData) {
        if (kycData.governmentIdFile) score += 20;
        if (kycData.insuranceFile) score += 20;
        if (kycData.roadWorthinessFile) score += 15;
        if (kycData.guarantorIdFile) score += 15;
        if (kycData.riderImageFile) score += 15;
        if (kycData.carImageFile) score += 15;
      }

      return {
        ...r,
        riderId: `RID-${r.id.substring(0, 4).toUpperCase()}`,
        phone: r.phone || 'N/A', 
        currentLocation: 'Enroute', // No live GPS tracking yet
        deliveriesToday,
        complianceScore: score,
        efficiencyScore: deliveriesToday > 5 ? 95 : (deliveriesToday > 0 ? 80 : 0), 
        lastActivity: r.lastLogin ? new Date(r.lastLogin).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Offline'
      };
    }));

    return res.status(200).json({
      success: true,
      data: formattedRiders,
      pagination: {
        total: totalItems,
        page,
        limit,
        totalPages: Math.ceil(totalItems / limit)
      }
    });

  } catch (error) {
    console.error("Error in getRidersList:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getRiderDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const userList = await db.select().from(users).where(eq(users.id, id as string)).limit(1);
    const user = userList[0];

    if (!user) {
      return res.status(404).json({ success: false, message: 'Rider not found' });
    }

    const kycList = await db.select().from(riderKyc).where(eq(riderKyc.riderId, id as string)).limit(1);
    const profileList = await db.select().from(riderProfiles).where(eq(riderProfiles.riderId, id as string)).limit(1);
    
    let score = 0;
    const kyc = kycList[0];
    if (kyc) {
      if (kyc.governmentIdFile) score += 20;
      if (kyc.insuranceFile) score += 20;
      if (kyc.roadWorthinessFile) score += 15;
      if (kyc.guarantorIdFile) score += 15;
      if (kyc.riderImageFile) score += 15;
      if (kyc.carImageFile) score += 15;
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          status: user.status,
          createdAt: user.createdAt,
        },
        profile: profileList[0] || null,
        kyc: kycList[0] || null,
        complianceScore: score,
        history: [] // Add real history table mapping if needed in the future
      }
    });

  } catch (error) {
    console.error("Error in getRiderDetails:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const reviewRider = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const kycList = await db.select().from(riderKyc).where(eq(riderKyc.riderId, id as string)).limit(1);
    
    if (kycList.length === 0) {
      return res.status(404).json({ success: false, message: 'Rider KYC not found' });
    }

    await db.update(riderKyc).set({ 
      status, 
      updatedAt: new Date() 
    }).where(eq(riderKyc.riderId, id as string));

    // Update the main user status to active if approved
    const userList = await db.select().from(users).where(eq(users.id, id as string)).limit(1);
    const user = userList[0];

    if (status === 'approved') {
      await db.update(users).set({ status: 'active', updatedAt: new Date() }).where(eq(users.id, id as string));
    } else if (status === 'rejected') {
      await db.update(users).set({ status: 'suspended', updatedAt: new Date() }).where(eq(users.id, id as string));
      if (user && user.email) {
        await emailService.sendKYCRejection(user.email, user.fullName || 'Rider', notes || 'No reason provided.');
      }
    }

    return res.status(200).json({ success: true, message: `Rider ${status} successfully` });

  } catch (error) {
    console.error("Error in reviewRider:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
