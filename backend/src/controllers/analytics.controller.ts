import { Request, Response } from 'express';
import { db } from '../../db';
import { orders, welfareAllocations } from '../../db/schema';
import { sql } from 'drizzle-orm';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [orderStats] = await db.select({
      totalOrders: sql<number>`count(${orders.id})`,
      deliveredOrders: sql<number>`sum(case when ${orders.status} = 'delivered' then 1 else 0 end)`
    }).from(orders);

    const [welfareStats] = await db.select({
      totalAllocated: sql<number>`sum(${welfareAllocations.totalItems})`,
      totalDistributed: sql<number>`sum(${welfareAllocations.distributedItems})`,
      totalShortages: sql<number>`sum(${welfareAllocations.shortageReported})`
    }).from(welfareAllocations);

    return res.status(200).json({
      success: true,
      stats: { commerce: orderStats, welfare: welfareStats }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
};
