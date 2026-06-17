import { Request, Response } from 'express';
import { db } from '../../db';
import { orders, users, vendorKyc, welfareEvents, welfareAllocations } from '../../db/schema';
import { sql, eq, desc } from 'drizzle-orm';
import { parse } from 'json2csv';

export const getPlatformOverview = async (req: Request, res: Response) => {
  try {
    const ordersCount = await db.select({ count: sql<number>`count(*)` }).from(orders);
    const totalTransactions = Number(ordersCount[0]?.count) || 0;
    
    const activeVendorsResult = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'vendor'));
    const activeVendors = Number(activeVendorsResult[0]?.count) || 0;

    const activeRidersResult = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'dispatch_rider'));
    const activeRiders = Number(activeRidersResult[0]?.count) || 0;

    return res.status(200).json({
      success: true,
      data: {
        totalTransactions,
        transactionGrowth: 12.5, // Trend calculation complex without historical snapshot, keeping static for now
        averageDeliveryTime: 18, 
        slaAdherence: 94.2, 
        activeVendors,
        vendorGrowth: 8.4, 
        systemUptime: 99.99,
        activeRiders
      }
    });
  } catch (error) {
    console.error("Error in getPlatformOverview:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getDeliveryTrends = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 6);

    const ordersData = await db.select({ status: orders.status, createdAt: orders.createdAt })
      .from(orders)
      .where(sql`${orders.createdAt} >= ${last7Days}`);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const map = new Map<string, { date: string, volume: number, returns: number }>();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayName = days[d.getDay()];
      map.set(dayName, { date: dayName, volume: 0, returns: 0 });
    }

    ordersData.forEach(o => {
      const dayName = days[new Date(o.createdAt).getDay()];
      const entry = map.get(dayName);
      if (entry) {
        if (o.status === 'delivered') entry.volume++;
        if (o.status === 'cancelled') entry.returns++;
      }
    });

    return res.status(200).json({ success: true, data: Array.from(map.values()) });
  } catch (error) {
    console.error("Error in getDeliveryTrends:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getVendorPerformance = async (req: Request, res: Response) => {
  try {
    const data = await db.select({
      category: vendorKyc.businessName, // We don't have category, grouping by business name for now
      count: sql<number>`count(${orders.id})`,
      revenue: sql<number>`sum(${orders.totalAmount})`
    })
    .from(orders)
    .innerJoin(vendorKyc, eq(vendorKyc.vendorId, orders.vendorId))
    .groupBy(vendorKyc.businessName)
    .limit(5);

    const colors = ['#16a34a', '#3b82f6', '#f59e0b', '#8b5cf6', '#64748b'];
    
    const formattedData = data.map((d, i) => ({
      category: d.category || 'Unknown Vendor',
      count: Number(d.count) || 0,
      revenue: Number(d.revenue) || 0,
      color: colors[i % colors.length]
    }));

    // If empty DB
    if (formattedData.length === 0) {
      formattedData.push({ category: 'No Data Yet', count: 0, revenue: 0, color: '#cbd5e1' });
    }

    return res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    console.error("Error in getVendorPerformance:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const exportAnalytics = async (req: Request, res: Response) => {
  try {
    const allOrders = await db.select().from(orders).limit(100);
    const csv = parse(allOrders);
    res.header('Content-Type', 'text/csv');
    res.attachment('analytics-export.csv');
    return res.send(csv);
  } catch (error) {
    console.error("Error in exportAnalytics:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getCoordinatorOverview = async (req: Request, res: Response) => {
  try {
    const activeEventsResult = await db.select({ count: sql<number>`count(*)` }).from(welfareEvents).where(eq(welfareEvents.status, 'active'));
    
    const allocResult = await db.select({ 
      total: sql<number>`sum(${welfareAllocations.totalItems})`,
      distributed: sql<number>`sum(${welfareAllocations.distributedItems})`,
      shortage: sql<number>`sum(${welfareAllocations.shortageReported})`
    }).from(welfareAllocations);

    const alloc = allocResult[0];

    return res.status(200).json({
      success: true,
      data: {
        activeEvents: Number(activeEventsResult[0]?.count) || 0,
        totalAllocated: Number(alloc?.total) || 0,
        distributed: Number(alloc?.distributed) || 0,
        shortageReported: Number(alloc?.shortage) || 0,
        deliverySuccessRate: alloc?.total ? Math.round((Number(alloc?.distributed) / Number(alloc?.total)) * 100) : 0,
        activeZones: 4
      }
    });
  } catch (error) {
    console.error("Error in getCoordinatorOverview:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getCoordinatorDeliveryTrends = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 6);

    const allocData = await db.select()
      .from(welfareAllocations)
      .where(sql`${welfareAllocations.updatedAt} >= ${last7Days}`);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const map = new Map<string, { date: string, expected: number, actual: number }>();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayName = days[d.getDay()];
      map.set(dayName, { date: dayName, expected: 0, actual: 0 });
    }

    allocData.forEach(a => {
      const dayName = days[new Date(a.updatedAt).getDay()];
      const entry = map.get(dayName);
      if (entry) {
        entry.expected += a.totalItems;
        entry.actual += a.distributedItems;
      }
    });

    return res.status(200).json({ success: true, data: Array.from(map.values()) });
  } catch (error) {
    console.error("Error in getCoordinatorDeliveryTrends:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getZonePerformance = async (req: Request, res: Response) => {
  try {
    const allocData = await db.select({
      zoneId: welfareAllocations.zoneId,
      distributed: sql<number>`sum(${welfareAllocations.distributedItems})`,
      shortage: sql<number>`sum(${welfareAllocations.shortageReported})`
    })
    .from(welfareAllocations)
    .groupBy(welfareAllocations.zoneId);

    const formatted = allocData.map(d => ({
      zone: d.zoneId || 'Unknown',
      completed: Number(d.distributed) || 0,
      shortage: Number(d.shortage) || 0
    }));

    return res.status(200).json({ success: true, data: formatted.length ? formatted : [{ zone: 'No Data', completed: 0, shortage: 0 }] });
  } catch (error) {
    console.error("Error in getZonePerformance:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getRiderEfficiencyDist = async (req: Request, res: Response) => {
  try {
    // Rider efficiency requires a lot of complex location/time tracking logic.
    // For now we'll mock the distribution, as we don't have the table yet.
    return res.status(200).json({ 
      success: true, 
      data: [
        { name: 'Highly Efficient', value: 45, fill: '#16a34a' },
        { name: 'Average', value: 35, fill: '#3b82f6' },
        { name: 'Needs Attention', value: 20, fill: '#f59e0b' }
      ] 
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getEventMetricsSummary = async (req: Request, res: Response) => {
  try {
    const events = await db.select({
      name: welfareEvents.name,
      status: welfareEvents.status,
      date: welfareEvents.date
    }).from(welfareEvents).orderBy(desc(welfareEvents.createdAt)).limit(5);

    const data = events.map(e => ({
      eventName: e.name,
      attendance: 0, // Mock for now since we don't have attendance table
      itemsDistributed: 0,
      efficiency: 100
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error in getEventMetricsSummary:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getShortageIncidents = async (req: Request, res: Response) => {
  try {
    const allocData = await db.select({
      zoneId: welfareAllocations.zoneId,
      shortage: sql<number>`sum(${welfareAllocations.shortageReported})`
    })
    .from(welfareAllocations)
    .where(sql`${welfareAllocations.shortageReported} > 0`)
    .groupBy(welfareAllocations.zoneId);

    const data = allocData.map(d => ({
      location: d.zoneId,
      severity: Number(d.shortage) > 50 ? 'high' : 'medium',
      issue: `Shortage of ${d.shortage} items`,
      time: 'Recently'
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error in getShortageIncidents:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
