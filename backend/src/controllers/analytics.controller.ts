import { Request, Response } from 'express';
import { db } from '../../db';
import { orders, welfareAllocations, users } from '../../db/schema';
import { sql, eq, and, ne, gt } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [orderStats] = await db.select({
      totalOrders: sql<number>`count(${orders.id})`,
      deliveredOrders: sql<number>`sum(case when ${orders.status} = 'delivered' then 1 else 0 end)`
    }).from(orders);

    const [welfareStats] = await db.select({
      totalAllocated: sql<number>`sum(${welfareAllocations.totalItems})`,
      totalDistributed: sql<number>`sum(${welfareAllocations.distributedItems})`,
      totalShortages: sql<number>`sum(${welfareAllocations.shortageReported})`,
      pendingZones: sql<number>`sum(case when ${welfareAllocations.status} != 'delivered' then 1 else 0 end)`,
      shortageAlerts: sql<number>`sum(case when ${welfareAllocations.shortageReported} > 0 then 1 else 0 end)`
    }).from(welfareAllocations);

    const [riderStats] = await db.select({
      activeRiders: sql<number>`count(distinct ${users.id})`
    }).from(users).where(eq(users.role, 'dispatch_rider'));

    return res.status(200).json({
      success: true,
      stats: { 
        commerce: orderStats, 
        welfare: welfareStats,
        system: {
          activeRiders: riderStats?.activeRiders || 0
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
};

export const getUserDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;
    
    let pending = 0;
    let completed = 0;
    let alerts = 0;

    if (role === 'dispatch_rider') {
      const [orderStats] = await db.select({
        pending: sql<number>`sum(case when ${orders.status} = 'assigned' then 1 else 0 end)`,
        completed: sql<number>`sum(case when ${orders.status} = 'delivered' then 1 else 0 end)`
      }).from(orders).where(eq(orders.riderId, userId));

      const [welfareStats] = await db.select({
        pending: sql<number>`sum(case when ${welfareAllocations.status} = 'assigned' then 1 else 0 end)`,
        completed: sql<number>`sum(case when ${welfareAllocations.status} = 'delivered' then 1 else 0 end)`
      }).from(welfareAllocations).where(eq(welfareAllocations.riderId, userId));

      pending = Number(orderStats?.pending || 0) + Number(welfareStats?.pending || 0);
      completed = Number(orderStats?.completed || 0) + Number(welfareStats?.completed || 0);
      
    } else if (role === 'zone_coordinator') {
      const [welfareStats] = await db.select({
        pending: sql<number>`sum(case when ${welfareAllocations.status} != 'delivered' then 1 else 0 end)`,
        completed: sql<number>`sum(case when ${welfareAllocations.status} = 'delivered' then 1 else 0 end)`,
        alerts: sql<number>`sum(case when ${welfareAllocations.shortageReported} > 0 then 1 else 0 end)`
      }).from(welfareAllocations); 
      // Note: Assuming zone_coordinator views general zone data or filter by zone table if mapped

      pending = Number(welfareStats?.pending || 0);
      completed = Number(welfareStats?.completed || 0);
      alerts = Number(welfareStats?.alerts || 0);
    }

    return res.status(200).json({ 
      success: true, 
      stats: { pending, completed, alerts } 
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch user stats' });
  }
};
