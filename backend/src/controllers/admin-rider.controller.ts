import { Request, Response } from 'express';
import { db } from '../../db';
import { users, orders } from '../../db/schema';
import { eq, or, and, sql, desc, ilike } from 'drizzle-orm';

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
          eq(users.status, 'active') // In reality, maybe tracking a "is_online" field
        )
      );
    const activeNow = activeResult[0].count;

    const completedOrdersResult = await db.select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.status, 'delivered'));
    const completedDeliveries = Number(completedOrdersResult[0]?.count) || 0;

    const avgDeliveriesPerRider = totalRiders > 0 ? (completedDeliveries / totalRiders).toFixed(1) : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalRiders,
        activeNow,
        completedDeliveries,
        avgDeliveriesPerRider: Number(avgDeliveriesPerRider)
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
      conditions.push(eq(users.status, statusFilter));
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
      status: users.status,
      phone: users.phone,
      lastLogin: users.lastLogin
    })
    .from(users)
    .where(whereClause)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

    const totalCountResult = await db.select({ count: sql<number>`count(*)` })
      .from(users)
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

      return {
        ...r,
        riderId: `RID-${r.id.substring(0, 4).toUpperCase()}`,
        phone: r.phone || 'N/A', 
        currentLocation: 'Enroute', // No live GPS tracking yet
        deliveriesToday,
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
