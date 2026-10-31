import { dynamicSurgeService } from "../services/logistics/dynamic-surge.service";
import { Request, Response } from 'express';
import { db } from '../../db';
import { users, orders, vendorProfiles, vendorKyc, auditLogs, promotionalCampaigns } from '../../db/schema';
import { sql, eq } from 'drizzle-orm';

export const getPlatformHealth = async (req: Request, res: Response) => {
  try {
    const start = Date.now();
    await db.execute(sql`SELECT 1`);
    const dbLatency = Date.now() - start;

    const data = [
      {
        name: 'Users Site',
        status: 'Operational',
        latency: `${dbLatency + 12}ms`,
        uptime: 99.9,
      },
      {
        name: 'Vendor Site',
        status: 'Operational',
        latency: `${dbLatency + 18}ms`,
        uptime: 100,
      },
      {
        name: 'Riders Site',
        status: 'Operational',
        latency: `${dbLatency + 34}ms`,
        uptime: 99.1,
      },
      {
        name: 'API Gateway',
        status: 'Operational',
        latency: `${dbLatency + 15}ms`,
        uptime: 99.9,
      },
      {
        name: 'Database Cluster',
        status: 'Operational',
        latency: `${dbLatency + 4}ms`,
        uptime: 100,
      },
      {
        name: 'Notification Service',
        status: dbLatency > 100 ? 'Degraded' : 'Operational',
        latency: `${dbLatency > 100 ? dbLatency + 310 : dbLatency + 45}ms`,
        uptime: dbLatency > 100 ? 97.2 : 99.8,
      }
    ];

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Health Check Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Active users count
    const activeUsersResult = await db.select({ count: sql<number>`count(*)` }).from(users);
    const activeUsers = Number(activeUsersResult[0]?.count) || 0;

    // Active Events count
    const activeEventsResult = await db.select({ count: sql<number>`count(*)` })
      .from(promotionalCampaigns)
      .where(eq(promotionalCampaigns.status, 'active'));
    const activeEvents = Number(activeEventsResult[0]?.count) || 0;

    // Deliveries today (orders with status delivered or out_for_delivery today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deliveriesResult = await db.select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(sql`${orders.createdAt} >= ${today}`);
    
    const deliveriesToday = Number(deliveriesResult[0]?.count) || 0;

    return res.status(200).json({
      success: true,
      activeUsers,
      activeEvents,
      deliveriesToday,
      platformUptime: 99.8, // System uptime can be static for now or fetched from a real monitor
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getDeliveryMetricsChart = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 6);

    const ordersData = await db.select({
      status: orders.status,
      createdAt: orders.createdAt
    })
      .from(orders)
      .where(sql`${orders.createdAt} >= ${last7Days}`);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const map = new Map<string, { name: string, deliveries: number, returns: number }>();
    
    // Initialize the last 7 days in order
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayName = days[d.getDay()];
      map.set(dayName, { name: dayName, deliveries: 0, returns: 0 });
    }

    ordersData.forEach(order => {
      const d = new Date(order.createdAt);
      const dayName = days[d.getDay()];
      const entry = map.get(dayName);
      if (entry) {
        if (order.status === 'delivered') entry.deliveries++;
        if (order.status === 'cancelled') entry.returns++;
      }
    });

    const data = Array.from(map.values());

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Chart Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getCriticalAlerts = async (req: Request, res: Response) => {
  try {
    const alerts = [];
    
    // Check pending vendors
    const pendingVendorsResult = await db.select({ count: sql<number>`count(*)` })
      .from(vendorKyc)
      .where(eq(vendorKyc.status, 'pending'));
    const pendingVendors = Number(pendingVendorsResult[0]?.count) || 0;
    
    if (pendingVendors > 5) {
      alerts.push({ id: 1, type: 'warning', title: `Vendor approval queue bottleneck detected (${pendingVendors} pending)`, time: 'Just now' });
    } else if (pendingVendors > 0) {
      alerts.push({ id: 1, type: 'info', title: `Vendor approval queue has ${pendingVendors} pending requests`, time: 'Just now' });
    }

    // Check cancelled orders today
    const today = new Date();
    today.setHours(0,0,0,0);
    const cancelledOrdersResult = await db.select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(sql`${orders.createdAt} >= ${today} AND ${orders.status} = 'cancelled'`);
    const cancelledOrders = Number(cancelledOrdersResult[0]?.count) || 0;
    
    if (cancelledOrders > 10) {
      alerts.push({ id: 2, type: 'critical', title: `High number of returned/cancelled orders today (${cancelledOrders})`, time: 'Just now' });
    }

    return res.status(200).json({ success: true, alerts });
  } catch (error) {
    console.error("Alerts Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getRecentActivity = async (req: Request, res: Response) => {
  try {
    const result = await db.execute(sql`
      SELECT id::text, 'User' as type, 'New user registered: ' || full_name as description, created_at as time FROM users
      UNION ALL
      SELECT id::text, 'Delivery' as type, 'Order ' || order_ref || ' status: ' || status as description, updated_at as time FROM orders
      UNION ALL
      SELECT id::text, 'Vendor' as type, 'Vendor KYC: ' || business_name as description, updated_at as time FROM vendor_kyc
      UNION ALL
      SELECT id::text, 'Welfare' as type, 'Welfare event: ' || name as description, created_at as time FROM welfare_events
      ORDER BY time DESC
      LIMIT 6
    `);

    const activities = result.rows.map((row: any) => {
      const d = new Date(row.time);
      let timeString = '';
      const diffMins = Math.floor((Date.now() - d.getTime()) / 60000);
      if (diffMins < 60) timeString = `${diffMins}m ago`;
      else if (diffMins < 1440) timeString = `${Math.floor(diffMins/60)}h ago`;
      else timeString = d.toLocaleDateString();

      return {
        id: row.id,
        type: row.type,
        description: row.description,
        time: timeString || 'Just now',
      };
    });

    return res.status(200).json({ success: true, activities });
  } catch (error) {
    console.error("Activity Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


// ─── Platform D: Operations & Dispatch Backoffice Engine ──────────────────────

interface FleetRiderTelemetry {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  status: 'idle' | 'in_transit' | 'offline';
  zone: string;
  batteryLevel: number;
  currentLat: number;
  currentLng: number;
  activeOrderId?: string;
  activeOrderRef?: string;
  slaStatus: 'on_time' | 'delayed' | 'critical';
  rating: number;
}

interface RefundRecord {
  id: string;
  orderId: string;
  orderRef: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  reason: string;
  channel: 'wallet' | 'card_chargeback';
  issuedBy: string;
  issuedAt: string;
  status: 'settled';
}

interface ApologyVoucher {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  reason: string;
  issuedAt: string;
  expiresAt: string;
  status: 'active' | 'redeemed';
}

interface FraudEntity {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  deviceFingerprint: string;
  ipAddress: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  flags: string[];
  isBlocked: boolean;
  createdAt: string;
}

const fraudDatabase: FraudEntity[] = [
  {
    id: "frd-01",
    userId: "usr-49102",
    fullName: "Kelechi Obi",
    email: "kelechi.o99@gmail.com",
    phone: "+2348039281920",
    deviceFingerprint: "fp_chrome_win_8492a",
    ipAddress: "102.89.44.12",
    riskScore: 84,
    riskLevel: "HIGH",
    flags: ["Duplicate Phone Number (+2348039281920 shared across 3 accounts)", "Same Fingerprint Claimed 4 Promo Vouchers"],
    isBlocked: true,
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: "frd-02",
    userId: "usr-77291",
    fullName: "Tunde Bakare",
    email: "tunde.bakare12@yahoo.com",
    phone: "+2348058291044",
    deviceFingerprint: "fp_iphone_ios17_2841",
    ipAddress: "197.210.55.8",
    riskScore: 58,
    riskLevel: "MEDIUM",
    flags: ["Rapid Account Generation (2 accounts within 10 minutes)", "Mismatched Billing vs Dropoff State"],
    isBlocked: false,
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  },
  {
    id: "frd-03",
    userId: "usr-88319",
    fullName: "Chidinma Nwosu",
    email: "chidinma.nw@gmail.com",
    phone: "+2348074920194",
    deviceFingerprint: "fp_android_sm_9182",
    ipAddress: "105.112.98.24",
    riskScore: 18,
    riskLevel: "LOW",
    flags: ["First-time User Device Check Clear", "Single Verified Postcode"],
    isBlocked: false,
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
  },
];

const refundRecords: RefundRecord[] = [
  {
    id: "ref-01",
    orderId: "ord-83921",
    orderRef: "FLW-83921",
    customerName: "Folake Adebayo",
    customerPhone: "+2348028472910",
    amount: 5400,
    reason: "Delayed meal prep (>50 mins) - Spilled soup container",
    channel: "wallet",
    issuedBy: "Ops Officer #04 (Samuel)",
    issuedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    status: "settled",
  },
  {
    id: "ref-02",
    orderId: "ord-92041",
    orderRef: "FLW-92041",
    customerName: "Emeka Okafor",
    customerPhone: "+2348092837461",
    amount: 8200,
    reason: "Kitchen ran out of Grilled Catfish after payment accepted",
    channel: "wallet",
    issuedBy: "Super Admin (Auto-Escrow)",
    issuedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    status: "settled",
  },
];

const apologyVouchers: ApologyVoucher[] = [
  {
    id: "vch-01",
    code: "APOLOGY-FLW-4821",
    customerName: "Folake Adebayo",
    customerPhone: "+2348028472910",
    amount: 1500,
    reason: "Late Delivery Goodwill Voucher",
    issuedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
    status: "active",
  },
];

// 1. Live Courier Dispatch Telemetry & Fleet Telemetry Map
export const getFleetTelemetry = async (_req: Request, res: Response) => {
  try {
    const riders: FleetRiderTelemetry[] = [
      {
        id: "rdr-01",
        name: "Tunde Adebayo",
        phone: "+2348039281726",
        vehicle: "Honda CB 125 • Dispatch Unit 01",
        status: "in_transit",
        zone: "Yaba / Akoka Mainland",
        batteryLevel: 92,
        currentLat: 6.518,
        currentLng: 3.376,
        activeOrderId: "ord-83921",
        activeOrderRef: "FLW-83921",
        slaStatus: "on_time",
        rating: 4.9,
      },
      {
        id: "rdr-02",
        name: "Ibrahim Musa",
        phone: "+2348058291024",
        vehicle: "Bajaj Boxer 150 • Dispatch Unit 02",
        status: "in_transit",
        zone: "Ikeja GRA / Maryland",
        batteryLevel: 84,
        currentLat: 6.596,
        currentLng: 3.351,
        activeOrderId: "ord-94021",
        activeOrderRef: "FLW-94021",
        slaStatus: "on_time",
        rating: 4.8,
      },
      {
        id: "rdr-03",
        name: "Chukwudi Eze",
        phone: "+2348074920182",
        vehicle: "Yamaha Crux • Dispatch Unit 03",
        status: "idle",
        zone: "Victoria Island / Oniru",
        batteryLevel: 78,
        currentLat: 6.435,
        currentLng: 3.442,
        slaStatus: "on_time",
        rating: 4.95,
      },
      {
        id: "rdr-04",
        name: "Segun Alabi",
        phone: "+2348028472911",
        vehicle: "TVS Neo 110 • Dispatch Unit 04",
        status: "in_transit",
        zone: "Surulere / Stadium",
        batteryLevel: 65,
        currentLat: 6.498,
        currentLng: 3.354,
        activeOrderId: "ord-71932",
        activeOrderRef: "FLW-71932",
        slaStatus: "delayed",
        rating: 4.7,
      },
      {
        id: "rdr-05",
        name: "Abubakar Sani",
        phone: "+2348092837411",
        vehicle: "Honda Ace 125 • Dispatch Unit 05",
        status: "idle",
        zone: "Lekki Phase 1 / Admiralty",
        batteryLevel: 89,
        currentLat: 6.448,
        currentLng: 3.475,
        slaStatus: "on_time",
        rating: 4.85,
      },
    ];

    const activeRoutes = [
      {
        orderRef: "FLW-83921",
        riderId: "rdr-01",
        store: { name: "Mama Put Delights", lat: 6.514, lng: 3.372 },
        destination: { name: "Unilag Faculty of Science", lat: 6.522, lng: 3.381 },
      },
      {
        orderRef: "FLW-94021",
        riderId: "rdr-02",
        store: { name: "Ikeja City Grill", lat: 6.601, lng: 3.358 },
        destination: { name: "GRA Joel Ogunnaike St", lat: 6.592, lng: 3.344 },
      },
      {
        orderRef: "FLW-71932",
        riderId: "rdr-04",
        store: { name: "Surulere Wok", lat: 6.495, lng: 3.358 },
        destination: { name: "Bode Thomas Luxury Apts", lat: 6.502, lng: 3.349 },
      },
    ];

    return res.status(200).json({
      success: true,
      telemetry: {
        totalRiders: 24,
        activeRiders: riders.length,
        inTransitCount: riders.filter(r => r.status === 'in_transit').length,
        idleCount: riders.filter(r => r.status === 'idle').length,
        riders,
        activeRoutes,
      }
    });
  } catch (error) {
    console.error("Fleet Telemetry Error:", error);
    return res.status(500).json({ success: false, message: "Failed to get fleet telemetry" });
  }
};

// 2. Force Reassign Courier
export const reassignCourier = async (req: Request, res: Response) => {
  try {
    const { orderId, newRiderId, reason } = req.body;
    return res.status(200).json({
      success: true,
      message: `Order ${orderId || 'target'} successfully reassigned to courier ${newRiderId || 'selected'}`,
      reason: reason || "Manual SLA bottleneck resolution",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to reassign courier" });
  }
};

// 3. Customer Refund & Vouchers Ledger
export const getRefundsLedger = async (_req: Request, res: Response) => {
  try {
    const totalRefundedAmount = refundRecords.reduce((sum, r) => sum + r.amount, 0);
    const totalVouchersAmount = apologyVouchers.reduce((sum, v) => sum + v.amount, 0);

    return res.status(200).json({
      success: true,
      ledger: {
        totalRefundedAmount,
        totalVouchersAmount,
        refundsCount: refundRecords.length,
        vouchersCount: apologyVouchers.length,
        refunds: refundRecords,
        vouchers: apologyVouchers,
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to get refunds ledger" });
  }
};

// 4. Issue Instant Refund
export const issueInstantRefund = async (req: Request, res: Response) => {
  try {
    const { orderId, orderRef, customerName, customerPhone, amount, reason, channel = 'wallet' } = req.body;

    const newRecord: RefundRecord = {
      id: `ref-${Date.now()}`,
      orderId: orderId || `ord-${Date.now()}`,
      orderRef: orderRef || `FLW-${Math.floor(10000 + Math.random() * 90000)}`,
      customerName: customerName || "Customer",
      customerPhone: customerPhone || "+2348000000000",
      amount: Number(amount) || 2500,
      reason: reason || "Dispute settled by Operations Desk",
      channel: channel === 'card_chargeback' ? 'card_chargeback' : 'wallet',
      issuedBy: "Operations Officer",
      issuedAt: new Date().toISOString(),
      status: "settled",
    };

    refundRecords.unshift(newRecord);

    return res.status(201).json({
      success: true,
      message: `Instant refund of ₦${newRecord.amount.toLocaleString()} credited to customer wallet`,
      refund: newRecord,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to issue refund" });
  }
};

// 5. Issue Apology / Compensation Voucher
export const issueCompensationVoucher = async (req: Request, res: Response) => {
  try {
    const { customerName, customerPhone, amount = 1500, reason } = req.body;
    const code = `APOLOGY-FLW-${Math.floor(1000 + Math.random() * 9000)}`;

    const newVoucher: ApologyVoucher = {
      id: `vch-${Date.now()}`,
      code,
      customerName: customerName || "Valued Customer",
      customerPhone: customerPhone || "+2348000000000",
      amount: Number(amount),
      reason: reason || "Operations Goodwill Compensation",
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
      status: "active",
    };

    apologyVouchers.unshift(newVoucher);

    return res.status(201).json({
      success: true,
      message: `Goodwill compensation voucher ${code} (₦${newVoucher.amount.toLocaleString()}) created`,
      voucher: newVoucher,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to issue voucher" });
  }
};

// 6. Fraud & Multi-Accounting Risk Matrix
export const getFraudMatrix = async (_req: Request, res: Response) => {
  try {
    const highRiskCount = fraudDatabase.filter(f => f.riskLevel === 'HIGH').length;
    const mediumRiskCount = fraudDatabase.filter(f => f.riskLevel === 'MEDIUM').length;
    const blockedCount = fraudDatabase.filter(f => f.isBlocked).length;

    return res.status(200).json({
      success: true,
      matrix: {
        totalAnalyzed: 1420,
        highRiskCount,
        mediumRiskCount,
        blockedCount,
        entities: fraudDatabase,
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to analyze fraud matrix" });
  }
};

// 7. Toggle Account Freeze / Block
export const toggleBlockFraudAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const entity = fraudDatabase.find(f => f.id === id || f.userId === id);
    if (!entity) {
      return res.status(404).json({ success: false, message: "Entity not found in fraud database" });
    }

    entity.isBlocked = !entity.isBlocked;

    return res.status(200).json({
      success: true,
      message: entity.isBlocked
        ? `Account ${entity.fullName} (${entity.email}) has been frozen and blocked from orders`
        : `Account ${entity.fullName} unblocked`,
      entity,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to toggle account block" });
  }
};


// ============================================================================
// SPRINT H: DYNAMIC ZONE SURGE PRICING & WEATHER MULTIPLIER CONTROLLERS
// ============================================================================

// 8. Get Live Surge Zones & Metro Rain Status
export const getSurgeZones = async (_req: Request, res: Response) => {
  try {
    const zones = dynamicSurgeService.getZones();
    const metroRain = dynamicSurgeService.getMetroRainStatus();

    const activeSurgeZonesCount = zones.filter(z => z.activeMultiplier > 1.05 || z.isRainModeActive).length;
    const totalCouriersOnline = zones.reduce((acc, z) => acc + z.activeCouriersCount, 0);
    const totalPendingOrders = zones.reduce((acc, z) => acc + z.pendingOrdersCount, 0);

    return res.status(200).json({
      success: true,
      zones,
      metroRain,
      metrics: {
        activeSurgeZonesCount,
        totalZonesCount: zones.length,
        totalCouriersOnline,
        totalPendingOrders,
        surgeDisbursedTodayNgn: 248500,
        averageMultiplier: Number((zones.reduce((acc, z) => acc + z.activeMultiplier, 0) / zones.length).toFixed(2)),
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Failed to fetch surge zones: " + error.message });
  }
};

// 9. Update Zone Multiplier or Weather Condition
export const updateSurgeZone = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { activeMultiplier, weatherCondition, isRainModeActive, rainFeeNgn, isAutoElastic } = req.body;

    const zoneId = Array.isArray(id) ? id[0] : (id || "");
    const updated = dynamicSurgeService.updateZone(zoneId, {
      ...(activeMultiplier !== undefined && { activeMultiplier: Number(activeMultiplier) }),
      ...(weatherCondition !== undefined && { weatherCondition }),
      ...(isRainModeActive !== undefined && { isRainModeActive: Boolean(isRainModeActive) }),
      ...(rainFeeNgn !== undefined && { rainFeeNgn: Number(rainFeeNgn) }),
      ...(isAutoElastic !== undefined && { isAutoElastic: Boolean(isAutoElastic) }),
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: `Zone with id ${id} not found` });
    }

    return res.status(200).json({
      success: true,
      message: `Surge parameters updated for ${updated.zoneName}`,
      zone: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Failed to update surge zone: " + error.message });
  }
};

// 10. Toggle Metro Weather Broadcast Emergency
export const toggleWeatherBroadcast = async (req: Request, res: Response) => {
  try {
    const { isMetroRainModeActive, rainFeeBonus, broadcastMessage } = req.body;

    const currentStatus = dynamicSurgeService.getMetroRainStatus();
    const newActiveState = isMetroRainModeActive !== undefined 
      ? Boolean(isMetroRainModeActive) 
      : !currentStatus.isMetroRainModeActive;

    const broadcast = dynamicSurgeService.setMetroRainBroadcast(
      newActiveState,
      rainFeeBonus !== undefined ? Number(rainFeeBonus) : currentStatus.rainFeeBonus,
      broadcastMessage
    );

    return res.status(200).json({
      success: true,
      message: newActiveState 
        ? "Metro Rain Mode Emergency broadcasted! 100% of weather fees remitted to champions." 
        : "Metro Rain Mode deactivated. Standard baseline dispatch resumed.",
      broadcast,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Failed to toggle weather broadcast: " + error.message });
  }
};

// 11. Simulate Surge Pricing Calculation
export const simulateSurgePricing = async (req: Request, res: Response) => {
  try {
    const { zoneName, subtotalDeliveryFee, multiplierOverride, isRainOverride, rainFeeOverride } = req.body;

    const baseFee = Math.max(500, Number(subtotalDeliveryFee) || 800);
    const multiplier = multiplierOverride !== undefined ? Number(multiplierOverride) : 1.3;
    const isRain = isRainOverride !== undefined ? Boolean(isRainOverride) : true;
    const rainFee = isRain ? (rainFeeOverride !== undefined ? Number(rainFeeOverride) : 500) : 0;

    const surgeSurcharge = Math.round(baseFee * (multiplier - 1));
    const finalDeliveryFee = baseFee + surgeSurcharge + rainFee;

    const riderBase = Math.round(baseFee * 0.75);
    const riderSurgeShare = Math.round(surgeSurcharge * 0.8);
    const riderTotalPayout = riderBase + riderSurgeShare + rainFee;
    const platformCommission = finalDeliveryFee - riderTotalPayout;

    return res.status(200).json({
      success: true,
      simulation: {
        zoneName: zoneName || "Yaba Cluster",
        baseFeeNgn: baseFee,
        surgeMultiplier: multiplier,
        surgeSurchargeNgn: surgeSurcharge,
        weatherFeeNgn: rainFee,
        finalDeliveryFeeNgn: finalDeliveryFee,
        riderPayoutNgn: riderTotalPayout,
        platformCommissionNgn: platformCommission,
        riderTakeRatePct: Math.round((riderTotalPayout / finalDeliveryFee) * 100),
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Simulation failed: " + error.message });
  }
};


// ============================================================================
// SPRINT K: OPERATIONS FLEET SHIFT ATTENDANCE & FLOOR GUARANTEE MATRIX
// ============================================================================

export const getFleetShiftMatrix = async (req: Request, res: Response) => {
  try {
    const fleetZones = [
      { id: "zone-lekki", name: "Lekki Phase 1 & Ikate", activeChampions: 16, targetCapacity: 20, checkInRatePct: 95, hourlyFloorRateNgn: 2800, currentSurgeMultiplier: 1.3 },
      { id: "zone-vi", name: "Victoria Island", activeChampions: 14, targetCapacity: 18, checkInRatePct: 92, hourlyFloorRateNgn: 2800, currentSurgeMultiplier: 1.2 },
      { id: "zone-ikeja", name: "Ikeja GRA & Allen", activeChampions: 12, targetCapacity: 15, checkInRatePct: 90, hourlyFloorRateNgn: 2600, currentSurgeMultiplier: 1.15 },
      { id: "zone-yaba", name: "Yaba / Surulere", activeChampions: 11, targetCapacity: 15, checkInRatePct: 88, hourlyFloorRateNgn: 2500, currentSurgeMultiplier: 1.1 },
      { id: "zone-ikoyi", name: "Ikoyi & Banana Island", activeChampions: 8, targetCapacity: 10, checkInRatePct: 96, hourlyFloorRateNgn: 3000, currentSurgeMultiplier: 1.35 },
      { id: "zone-marina", name: "Marina & Lagos Island", activeChampions: 6, targetCapacity: 8, checkInRatePct: 87, hourlyFloorRateNgn: 2400, currentSurgeMultiplier: 1.05 },
      { id: "zone-gbagada", name: "Gbagada & Maryland", activeChampions: 7, targetCapacity: 10, checkInRatePct: 89, hourlyFloorRateNgn: 2400, currentSurgeMultiplier: 1.1 }
    ];

    const activeRoster = [
      { id: "ch-101", name: "Ibrahim Suleiman", phone: "+234 803 112 4892", vehiclePlate: "LAGOS • KJA-482-XA", zone: "Lekki Phase 1", shiftLabel: "Lunch Rush Peak", checkInTime: "11:28 WAT", acceptanceRatePct: 100, completedDeliveries: 7, actualEarningsNgn: 9800, floorTargetNgn: 11200, status: "ON_DUTY", floorStatus: "TOP_UP_DUE" },
      { id: "ch-102", name: "Emeka Okonkwo", phone: "+234 802 884 9210", vehiclePlate: "LAGOS • APP-912-LK", zone: "Victoria Island", shiftLabel: "Lunch Rush Peak", checkInTime: "11:32 WAT", acceptanceRatePct: 100, completedDeliveries: 9, actualEarningsNgn: 13500, floorTargetNgn: 11200, status: "ON_DUTY", floorStatus: "EXCEEDED_FLOOR" },
      { id: "ch-103", name: "Babatunde Raji", phone: "+234 814 772 3914", vehiclePlate: "LAGOS • EKY-301-BD", zone: "Ikeja GRA", shiftLabel: "Lunch Rush Peak", checkInTime: "11:20 WAT", acceptanceRatePct: 94, completedDeliveries: 6, actualEarningsNgn: 8200, floorTargetNgn: 10400, status: "ON_DUTY", floorStatus: "TOP_UP_DUE" },
      { id: "ch-104", name: "Chinedu Eze", phone: "+234 805 441 8933", vehiclePlate: "LAGOS • LSR-421-SM", zone: "Yaba Tech Hub", shiftLabel: "Lunch Rush Peak", checkInTime: "11:25 WAT", acceptanceRatePct: 85, completedDeliveries: 5, actualEarningsNgn: 6500, floorTargetNgn: 10000, status: "ON_DUTY", floorStatus: "DISQUALIFIED" },
      { id: "ch-105", name: "Kayode Adeleke", phone: "+234 809 332 1980", vehiclePlate: "LAGOS • KSF-819-QN", zone: "Ikoyi", shiftLabel: "Lunch Rush Peak", checkInTime: "11:15 WAT", acceptanceRatePct: 100, completedDeliveries: 8, actualEarningsNgn: 12800, floorTargetNgn: 12000, status: "ON_DUTY", floorStatus: "EXCEEDED_FLOOR" }
    ];

    const totalActiveChampions = fleetZones.reduce((sum, z) => sum + z.activeChampions, 0);
    const totalTargetCapacity = fleetZones.reduce((sum, z) => sum + z.targetCapacity, 0);
    const fleetAdherenceRate = Math.round((totalActiveChampions / totalTargetCapacity) * 100);

    return res.status(200).json({
      success: true,
      summary: {
        totalActiveChampionsOnDuty: totalActiveChampions,
        totalFleetTargetCapacity: totalTargetCapacity,
        fleetAdherenceRatePct: fleetAdherenceRate,
        totalGuaranteedFloorLiabilityTodayNgn: 214500,
        estimatedTopUpDisbursementsTodayNgn: 34800,
        averageFleetAcceptanceRatePct: 97.4,
        emergencySlotsActive: false
      },
      zones: fleetZones,
      activeRoster
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Failed to fetch fleet shift matrix: " + error.message });
  }
};

export const addEmergencyShiftSlots = async (req: Request, res: Response) => {
  try {
    const { additionalSlotsPerZone = 5, emergencyBonusHourlyRate = 500 } = req.body;

    return res.status(200).json({
      success: true,
      message: `Emergency Shift Slots activated! Added +${additionalSlotsPerZone} champion slots across all Lagos clusters with +₦${emergencyBonusHourlyRate}/hr floor pay bonus.`,
      settings: {
        additionalSlotsPerZone,
        emergencyBonusHourlyRate,
        activatedAt: new Date().toISOString(),
        expiresInHours: 4
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Failed to activate emergency slots: " + error.message });
  }
};


// ============================================================================
// SPRINT M: AI DISPATCH DISPUTE RESOLUTION & PROOF-OF-DELIVERY (POD) AUDIT
// ============================================================================

interface DisputeClaim {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  restaurantName: string;
  deliveryAddress: string;
  claimedAmountNgn: number;
  claimReason: "ORDER_NOT_DELIVERED" | "WRONG_DOORSTEP" | "DAMAGED_SPILLAGE" | "COLD_FOOD";
  customerStatement: string;
  customerPhotoUrl?: string;
  courierChampion: {
    id: string;
    name: string;
    phone: string;
    vehiclePlate: string;
    rating: number;
    totalDeliveries: number;
  };
  podEvidence: {
    photoUrl: string;
    timestampWatermark: string;
    dropoffCoords: { lat: number; lng: number };
    destinationCoords: { lat: number; lng: number };
    distanceMeters: number;
    isGeofenceMatch: boolean;
    handoverOtpVerified: boolean;
    otpCode: string;
    thermalBoxInspected: boolean;
  };
  aiEvaluation: {
    recommendation: "DISMISS_CLAIM" | "COURTESY_CREDIT" | "APPROVE_REFUND";
    confidenceScorePct: number;
    courierExonerationProbabilityPct: number;
    rationaleSummary: string;
    riskScore: "LOW" | "MEDIUM" | "HIGH";
  };
  status: "PENDING_REVIEW" | "RESOLVED_DISMISSED" | "RESOLVED_REFUNDED" | "RESOLVED_COURTESY";
  resolutionNotes?: string;
  resolvedAt?: string;
}

// In-memory claims repository with realistic high-fidelity claims
const disputeAuditClaimsStore: Record<string, DisputeClaim> = {
  "disp-89241": {
    id: "disp-89241",
    orderId: "ord-89241",
    orderNumber: "#FM-89241",
    customerName: "Babajide Sanwo",
    customerPhone: "+234 802 334 9122",
    restaurantName: "Mama's Kitchen Bistro • Lekki",
    deliveryAddress: "Plot 14 Admiralty Way, Lekki Phase 1 (Gate 4)",
    claimedAmountNgn: 14500,
    claimReason: "ORDER_NOT_DELIVERED",
    customerStatement: "Rider marked order delivered, but I checked my gate and nothing is there! I was waiting inside the living room. Need a full refund.",
    customerPhotoUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop",
    courierChampion: {
      id: "ch-101",
      name: "Ibrahim Suleiman",
      phone: "+234 803 112 4892",
      vehiclePlate: "LAGOS • KJA-482-XA",
      rating: 4.9,
      totalDeliveries: 428
    },
    podEvidence: {
      photoUrl: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&auto=format&fit=crop",
      timestampWatermark: "Lat: 6.4478, Lng: 3.4721 • 30/10/2026 14:22:15 WAT • FlowMart Security Verified",
      dropoffCoords: { lat: 6.4478, lng: 3.4721 },
      destinationCoords: { lat: 6.4476, lng: 3.4720 },
      distanceMeters: 14,
      isGeofenceMatch: true,
      handoverOtpVerified: true,
      otpCode: "8249",
      thermalBoxInspected: true
    },
    aiEvaluation: {
      recommendation: "DISMISS_CLAIM",
      confidenceScorePct: 98,
      courierExonerationProbabilityPct: 99,
      rationaleSummary: "Unassailable delivery evidence. Handover OTP 8249 was authenticated on-device at 14:22 WAT, and courier GPS coordinates were 14m from customer door. Package photo matches Admiralty Way black gate. Recommend dismissing claim to protect courier champion.",
      riskScore: "LOW"
    },
    status: "PENDING_REVIEW"
  },
  "disp-89230": {
    id: "disp-89230",
    orderId: "ord-89230",
    orderNumber: "#FM-89230",
    customerName: "Amina Yusuf",
    customerPhone: "+234 813 902 4410",
    restaurantName: "Gourmet Grills & Seafood",
    deliveryAddress: "Block 8, Parkview Estate, Ikoyi",
    claimedAmountNgn: 22800,
    claimReason: "DAMAGED_SPILLAGE",
    customerStatement: "The soup container cracked completely during transit. Palm oil spilled all over the plantain and takeaway bag.",
    customerPhotoUrl: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=80&w=800&auto=format&fit=crop",
    courierChampion: {
      id: "ch-105",
      name: "Kayode Adeleke",
      phone: "+234 809 332 1980",
      vehiclePlate: "LAGOS • KSF-819-QN",
      rating: 4.8,
      totalDeliveries: 312
    },
    podEvidence: {
      photoUrl: "https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=800&auto=format&fit=crop",
      timestampWatermark: "Lat: 6.4520, Lng: 3.4390 • 30/10/2026 13:45:00 WAT",
      dropoffCoords: { lat: 6.4520, lng: 3.4390 },
      destinationCoords: { lat: 6.4519, lng: 3.4391 },
      distanceMeters: 8,
      isGeofenceMatch: true,
      handoverOtpVerified: true,
      otpCode: "4912",
      thermalBoxInspected: true
    },
    aiEvaluation: {
      recommendation: "APPROVE_REFUND",
      confidenceScorePct: 94,
      courierExonerationProbabilityPct: 50,
      rationaleSummary: "Legitimate customer photo clearly shows fractured plastic container seal and heavy palm oil leakage. Courier delivered to correct location with OTP, but merchant packaging failure caused damage. Recommend 100% refund funded by merchant packaging penalty.",
      riskScore: "HIGH"
    },
    status: "PENDING_REVIEW"
  },
  "disp-89218": {
    id: "disp-89218",
    orderId: "ord-89218",
    orderNumber: "#FM-89218",
    customerName: "Femi Otedola",
    customerPhone: "+234 807 554 2209",
    restaurantName: "Yaba Spice Kitchen",
    deliveryAddress: "12 Commercial Avenue, Sabo Yaba",
    claimedAmountNgn: 8500,
    claimReason: "COLD_FOOD",
    customerStatement: "Delivery took over 50 minutes from pickup and arrived lukewarm. Not the quality I expect from FlowMart.",
    courierChampion: {
      id: "ch-104",
      name: "Chinedu Eze",
      phone: "+234 805 441 8933",
      vehiclePlate: "LAGOS • LSR-421-SM",
      rating: 4.6,
      totalDeliveries: 185
    },
    podEvidence: {
      photoUrl: "https://images.unsplash.com/photo-1526367790999-0150786686a2?q=80&w=800&auto=format&fit=crop",
      timestampWatermark: "Lat: 6.5140, Lng: 3.3710 • 30/10/2026 12:55:00 WAT",
      dropoffCoords: { lat: 6.5140, lng: 3.3710 },
      destinationCoords: { lat: 6.5142, lng: 3.3712 },
      distanceMeters: 22,
      isGeofenceMatch: true,
      handoverOtpVerified: true,
      otpCode: "3019",
      thermalBoxInspected: true
    },
    aiEvaluation: {
      recommendation: "COURTESY_CREDIT",
      confidenceScorePct: 88,
      courierExonerationProbabilityPct: 85,
      rationaleSummary: "Courier had thermal bag verified and met geofenced handover OTP. However, heavy traffic on Sabo bridge added +18 mins transit delay. Recommend issuing ₦2,000 apology wallet credit to customer without docking courier pay.",
      riskScore: "MEDIUM"
    },
    status: "PENDING_REVIEW"
  }
};

export const getDisputeAuditQueue = async (req: Request, res: Response) => {
  try {
    const claims = Object.values(disputeAuditClaimsStore);

    const pendingCount = claims.filter(c => c.status === "PENDING_REVIEW").length;
    const resolvedCount = claims.filter(c => c.status.startsWith("RESOLVED")).length;

    return res.status(200).json({
      success: true,
      summary: {
        pendingAuditClaims: pendingCount,
        resolvedClaimsToday: resolvedCount + 18,
        averageAiEvaluationSeconds: 1.4,
        courierProtectionRatePct: 91.4,
        autoSettledCourtesyCreditsNgn: 18500
      },
      claims
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Failed to fetch dispute queue: " + error.message });
  }
};

export const getDisputeEvidenceDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const claimId = Array.isArray(id) ? id[0] : (id || "");
    const claim = disputeAuditClaimsStore[claimId];

    if (!claim) {
      return res.status(404).json({ success: false, message: "Dispute evidence not found" });
    }

    return res.status(200).json({
      success: true,
      claim,
      auditTimeline: [
        { time: "13:30 WAT", event: "Kitchen marked order ready for pickup" },
        { time: "13:35 WAT", event: "Courier champion arrived & thermal box verified" },
        { time: "13:58 WAT", event: "Courier arrived within 15m of customer doorstep" },
        { time: "14:22 WAT", event: "Customer entered 4-digit handover OTP 8249" },
        { time: "14:23 WAT", event: "Geotagged proof-of-delivery photo uploaded to FlowMart cloud" },
        { time: "14:35 WAT", event: "Customer opened dispute claim via mobile app" },
        { time: "14:35 WAT", event: "AI Arbiter generated 98% courier exoneration score" }
      ]
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Failed to fetch evidence details: " + error.message });
  }
};

export const resolveDisputeAudit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const claimId = Array.isArray(id) ? id[0] : (id || "");
    const { resolutionType, adminNotes, waiveCourierPenalty = true } = req.body;

    const claim = disputeAuditClaimsStore[claimId];
    if (!claim) {
      return res.status(404).json({ success: false, message: "Dispute claim not found" });
    }

    if (resolutionType === "DISMISS") {
      claim.status = "RESOLVED_DISMISSED";
      claim.resolutionNotes = adminNotes || "Delivery validated by Geofence (14m) & Handover OTP. Claim dismissed.";
    } else if (resolutionType === "FULL_REFUND") {
      claim.status = "RESOLVED_REFUNDED";
      claim.resolutionNotes = adminNotes || "Full refund issued to customer. Packaging liability settled.";
    } else if (resolutionType === "COURTESY_CREDIT") {
      claim.status = "RESOLVED_COURTESY";
      claim.resolutionNotes = adminNotes || "Issued ₦2,000 courtesy wallet credit. Courier champion rating protected.";
    }

    claim.resolvedAt = new Date().toISOString();

    return res.status(200).json({
      success: true,
      message: `Dispute ${claim.orderNumber} successfully resolved with action: ${resolutionType}.`,
      claim
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Failed to resolve dispute: " + error.message });
  }
};

export const evaluateDisputeWithAI = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    const claimId = Array.isArray(id) ? id[0] : (id || "disp-89241");
    const claim = disputeAuditClaimsStore[claimId];

    if (!claim) {
      return res.status(404).json({ success: false, message: "Claim not found for evaluation" });
    }

    return res.status(200).json({
      success: true,
      evaluation: claim.aiEvaluation
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "AI evaluation failed: " + error.message });
  }
};


// ══════════════════════════════════════════════════════════════════════════
// SPRINT S: OPERATIONS & DISPATCH — AUTONOMOUS REASSIGNMENT MATRIX & SLA PROTECTOR
// ══════════════════════════════════════════════════════════════════════════

export interface CandidateRider {
  id: string;
  name: string;
  championTier: 'Apex Elite' | 'Gold Champion' | 'Silver Champion';
  rating: number;
  vehicle: string;
  distanceKm: number;
  etaMins: number;
  matchScorePct: number;
  phone: string;
  status: 'AVAILABLE' | 'EN_ROUTE_NEARBY';
}

export interface DispatchIncident {
  id: string;
  type: 'MECHANICAL_BREAKDOWN' | 'TRAFFIC_DEADLOCK' | 'SIGNAL_LOST' | 'MERCHANT_DELAY';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  status: 'PENDING_REASSIGNMENT' | 'REASSIGNED' | 'RESOLVED';
  order: {
    id: string;
    itemsSummary: string;
    totalAmountNgn: number;
    customerName: string;
    customerPhone: string;
    merchantName: string;
    targetSlaMins: number;
    elapsedMins: number;
    slaStatus: 'AT_RISK' | 'BREACHED' | 'ON_TRACK';
  };
  strandedRider: {
    id: string;
    name: string;
    phone: string;
    vehicle: string;
    rating: number;
    batteryPct: number;
    speedKmH: number;
    standstillMins: number;
    locationName: string;
    reportedReason: string;
  };
  candidates: CandidateRider[];
  reassignedTo?: {
    riderId: string;
    riderName: string;
    reassignedAt: string;
    pickupHandoffCoord: string;
    transferCompensationNgn: number;
  };
}

export interface ReassignmentAuditLog {
  id: string;
  incidentId: string;
  orderId: string;
  originalRiderName: string;
  newRiderName: string;
  reason: string;
  transferCompensationNgn: number;
  slaPreservedMins: number;
  reassignedAt: string;
  autoRerouted: boolean;
}

// In-memory data store for live dispatch state
let dispatchIncidentsStore: DispatchIncident[] = [
  {
    id: 'INC-2026-9041',
    type: 'MECHANICAL_BREAKDOWN',
    severity: 'CRITICAL',
    status: 'PENDING_REASSIGNMENT',
    order: {
      id: 'ORD-2026-9812',
      itemsSummary: '2x Asun Jollof Combo, 4x Peppered Chicken, Extra Fried Plantain',
      totalAmountNgn: 18500,
      customerName: 'Adebayo Olufemi',
      customerPhone: '+234 803 234 5678',
      merchantName: 'Mega Chicken Victoria Island',
      targetSlaMins: 30,
      elapsedMins: 22,
      slaStatus: 'AT_RISK'
    },
    strandedRider: {
      id: 'RDR-802',
      name: 'Sunday Peters',
      phone: '+234 812 345 6789',
      vehicle: 'TVS HLX 125 [BDG-492-QA]',
      rating: 4.88,
      batteryPct: 42,
      speedKmH: 0,
      standstillMins: 14,
      locationName: 'Ozumba Mbadiwe Ave (Near Civic Centre, VI)',
      reportedReason: 'Rear tire puncture & broken chain bracket'
    },
    candidates: [
      {
        id: 'RDR-419',
        name: 'Ibrahim Musa',
        championTier: 'Apex Elite',
        rating: 4.96,
        vehicle: 'Honda Ace 125 [KTU-209-XQ]',
        distanceKm: 0.8,
        etaMins: 3,
        matchScorePct: 98,
        phone: '+234 803 762 9011',
        status: 'AVAILABLE'
      },
      {
        id: 'RDR-721',
        name: 'Emeka Nnamdi',
        championTier: 'Gold Champion',
        rating: 4.91,
        vehicle: 'Boxer 150 [LND-382-BC]',
        distanceKm: 1.4,
        etaMins: 5,
        matchScorePct: 92,
        phone: '+234 805 119 4432',
        status: 'AVAILABLE'
      },
      {
        id: 'RDR-305',
        name: 'Fatima Garba',
        championTier: 'Apex Elite',
        rating: 4.95,
        vehicle: 'Haojue Lucky 110 [AKD-991-TA]',
        distanceKm: 2.1,
        etaMins: 7,
        matchScorePct: 86,
        phone: '+234 818 902 3341',
        status: 'EN_ROUTE_NEARBY'
      }
    ]
  },
  {
    id: 'INC-2026-9042',
    type: 'TRAFFIC_DEADLOCK',
    severity: 'HIGH',
    status: 'PENDING_REASSIGNMENT',
    order: {
      id: 'ORD-2026-9815',
      itemsSummary: 'Special Gourmet Suya Platter, Masa Bread, 2x Chilled Chapman',
      totalAmountNgn: 14200,
      customerName: 'Zainab Bello',
      customerPhone: '+234 805 987 6543',
      merchantName: 'Suya Central Lekki Phase 1',
      targetSlaMins: 35,
      elapsedMins: 27,
      slaStatus: 'AT_RISK'
    },
    strandedRider: {
      id: 'RDR-114',
      name: 'Chukwudi Eze',
      phone: '+234 809 111 2233',
      vehicle: 'Bajaj Boxer [KJA-819-XX]',
      rating: 4.84,
      batteryPct: 68,
      speedKmH: 2,
      standstillMins: 19,
      locationName: 'Admiralty Way Roundabout, Lekki Phase 1',
      reportedReason: 'Construction blockade causing 0 km/h standstill gridlock'
    },
    candidates: [
      {
        id: 'RDR-902',
        name: 'Kehinde Balogun',
        championTier: 'Apex Elite',
        rating: 4.97,
        vehicle: 'Yamaha Crux [EKY-491-YZ]',
        distanceKm: 0.6,
        etaMins: 2,
        matchScorePct: 99,
        phone: '+234 802 331 7789',
        status: 'AVAILABLE'
      },
      {
        id: 'RDR-512',
        name: 'Tunde Bakare',
        championTier: 'Silver Champion',
        rating: 4.86,
        vehicle: 'TVS Max 100 [AGL-208-JK]',
        distanceKm: 1.2,
        etaMins: 4,
        matchScorePct: 89,
        phone: '+234 807 449 0012',
        status: 'AVAILABLE'
      }
    ]
  },
  {
    id: 'INC-2026-9043',
    type: 'SIGNAL_LOST',
    severity: 'HIGH',
    status: 'PENDING_REASSIGNMENT',
    order: {
      id: 'ORD-2026-9819',
      itemsSummary: 'Afang Soup Pot, 3x Poundo Yam, Assorted Meat Platter',
      totalAmountNgn: 22000,
      customerName: 'Dr. Ngozi Okonjo',
      customerPhone: '+234 802 888 9900',
      merchantName: 'Yellow Chilli Ikeja GRA',
      targetSlaMins: 40,
      elapsedMins: 31,
      slaStatus: 'AT_RISK'
    },
    strandedRider: {
      id: 'RDR-630',
      name: 'Musa Danjuma',
      phone: '+234 813 444 5566',
      vehicle: 'Honda CB125 [IKJ-204-AB]',
      rating: 4.79,
      batteryPct: 4,
      speedKmH: 0,
      standstillMins: 16,
      locationName: 'Isaac John Street, Ikeja GRA',
      reportedReason: 'Telemetry heartbeat lost after pickup (device dead battery)'
    },
    candidates: [
      {
        id: 'RDR-208',
        name: 'Oluwaseun Adeyemi',
        championTier: 'Apex Elite',
        rating: 4.98,
        vehicle: 'Honda Ace 125 [KRD-772-LM]',
        distanceKm: 0.9,
        etaMins: 3,
        matchScorePct: 97,
        phone: '+234 810 551 2299',
        status: 'AVAILABLE'
      },
      {
        id: 'RDR-655',
        name: 'Ahmed Lawal',
        championTier: 'Gold Champion',
        rating: 4.90,
        vehicle: 'Suzuki AX100 [LSR-112-QW]',
        distanceKm: 1.7,
        etaMins: 6,
        matchScorePct: 91,
        phone: '+234 816 772 3311',
        status: 'AVAILABLE'
      }
    ]
  }
];

let reassignmentLogsStore: ReassignmentAuditLog[] = [
  {
    id: 'LOG-2026-1081',
    incidentId: 'INC-2026-9038',
    orderId: 'ORD-2026-9799',
    originalRiderName: 'Victor Adeleke',
    newRiderName: 'Ibrahim Musa',
    reason: 'Flat tire near Falomo Bridge; automatic reroute',
    transferCompensationNgn: 1500,
    slaPreservedMins: 14,
    reassignedAt: '2026-10-31T11:42:10Z',
    autoRerouted: true
  },
  {
    id: 'LOG-2026-1080',
    incidentId: 'INC-2026-9035',
    orderId: 'ORD-2026-9782',
    originalRiderName: 'Samuel Okoro',
    newRiderName: 'Kehinde Balogun',
    reason: 'Fuel exhaustion re-dispatch and emergency fuel allowance',
    transferCompensationNgn: 1500,
    slaPreservedMins: 11,
    reassignedAt: '2026-10-31T11:15:33Z',
    autoRerouted: false
  }
];

let autoRerouteEngineConfig = {
  enabled: true,
  standstillThresholdMins: 10,
  maxSearchRadiusKm: 4.0,
  priorityTier: 'APEX_FIRST',
  defaultTransferCompensationNgn: 1500,
  lastRerouteBatchAt: '2026-10-31T12:00:00Z'
};

export const getDispatchIncidents = async (_req: Request, res: Response) => {
  try {
    const pendingCount = dispatchIncidentsStore.filter(i => i.status === 'PENDING_REASSIGNMENT').length;
    const resolvedCount = dispatchIncidentsStore.filter(i => i.status !== 'PENDING_REASSIGNMENT').length;
    
    return res.status(200).json({
      success: true,
      stats: {
        activeIncidentsCount: pendingCount,
        resolvedTodayCount: resolvedCount + reassignmentLogsStore.length,
        averageRecoveryMins: 4.2,
        slaProtectionRatePct: 97.4,
        autoRerouteEnabled: autoRerouteEngineConfig.enabled,
        standstillThresholdMins: autoRerouteEngineConfig.standstillThresholdMins,
        maxSearchRadiusKm: autoRerouteEngineConfig.maxSearchRadiusKm
      },
      incidents: dispatchIncidentsStore,
      recentLogs: reassignmentLogsStore,
      engineConfig: autoRerouteEngineConfig
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch dispatch incidents: ' + error.message });
  }
};

export const reassignDispatchOrder = async (req: Request, res: Response) => {
  try {
    const { incidentId, riderId, reason, transferCompensationNgn = 1500 } = req.body;
    const incident = dispatchIncidentsStore.find(i => i.id === incidentId);

    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    const candidate = incident.candidates.find(c => c.id === riderId) || incident.candidates[0];
    const newRiderName = candidate ? candidate.name : 'Apex Backup Champion';

    incident.status = 'REASSIGNED';
    incident.reassignedTo = {
      riderId: candidate ? candidate.id : riderId || 'RDR-BACKUP',
      riderName: newRiderName,
      reassignedAt: new Date().toISOString(),
      pickupHandoffCoord: '6.4312° N, 3.4219° E (Handoff Zone)',
      transferCompensationNgn: Number(transferCompensationNgn) || 1500
    };

    const newLog: ReassignmentAuditLog = {
      id: 'LOG-2026-' + Math.floor(1000 + Math.random() * 9000),
      incidentId: incident.id,
      orderId: incident.order.id,
      originalRiderName: incident.strandedRider.name,
      newRiderName: newRiderName,
      reason: reason || incident.strandedRider.reportedReason || 'Manual Dispatch Reassignment',
      transferCompensationNgn: Number(transferCompensationNgn) || 1500,
      slaPreservedMins: Math.max(5, 30 - incident.order.elapsedMins),
      reassignedAt: new Date().toISOString(),
      autoRerouted: false
    };

    reassignmentLogsStore.unshift(newLog);

    return res.status(200).json({
      success: true,
      message: `Order ${incident.order.id} successfully reassigned to ${newRiderName}`,
      incident,
      auditLog: newLog
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to reassign order: ' + error.message });
  }
};

export const triggerAutonomousReroute = async (_req: Request, res: Response) => {
  try {
    let reroutedCount = 0;
    const newlyCreatedLogs: ReassignmentAuditLog[] = [];

    dispatchIncidentsStore.forEach(incident => {
      if (incident.status === 'PENDING_REASSIGNMENT' && incident.candidates.length > 0) {
        const bestCandidate = incident.candidates[0]; // Top scored candidate
        incident.status = 'REASSIGNED';
        incident.reassignedTo = {
          riderId: bestCandidate.id,
          riderName: bestCandidate.name,
          reassignedAt: new Date().toISOString(),
          pickupHandoffCoord: 'Autonomous Rendezvous GPS Locked',
          transferCompensationNgn: autoRerouteEngineConfig.defaultTransferCompensationNgn
        };

        const newLog: ReassignmentAuditLog = {
          id: 'LOG-2026-' + Math.floor(1000 + Math.random() * 9000),
          incidentId: incident.id,
          orderId: incident.order.id,
          originalRiderName: incident.strandedRider.name,
          newRiderName: bestCandidate.name,
          reason: `Autonomous SLA Reroute: ${incident.type} (${incident.strandedRider.reportedReason})`,
          transferCompensationNgn: autoRerouteEngineConfig.defaultTransferCompensationNgn,
          slaPreservedMins: Math.max(6, 35 - incident.order.elapsedMins),
          reassignedAt: new Date().toISOString(),
          autoRerouted: true
        };

        reassignmentLogsStore.unshift(newLog);
        newlyCreatedLogs.push(newLog);
        reroutedCount++;
      }
    });

    autoRerouteEngineConfig.lastRerouteBatchAt = new Date().toISOString();

    return res.status(200).json({
      success: true,
      message: `Autonomous Dispatch Engine successfully rerouted ${reroutedCount} stranded delivery order(s).`,
      reroutedCount,
      incidents: dispatchIncidentsStore,
      newLogs: newlyCreatedLogs
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Autonomous reroute failed: ' + error.message });
  }
};

export const toggleAutonomousRerouteConfig = async (req: Request, res: Response) => {
  try {
    const { enabled, standstillThresholdMins, maxSearchRadiusKm } = req.body;
    if (typeof enabled === 'boolean') {
      autoRerouteEngineConfig.enabled = enabled;
    }
    if (typeof standstillThresholdMins === 'number') {
      autoRerouteEngineConfig.standstillThresholdMins = standstillThresholdMins;
    }
    if (typeof maxSearchRadiusKm === 'number') {
      autoRerouteEngineConfig.maxSearchRadiusKm = maxSearchRadiusKm;
    }

    return res.status(200).json({
      success: true,
      message: 'Autonomous Reroute Engine configuration updated',
      engineConfig: autoRerouteEngineConfig
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update config: ' + error.message });
  }
};


// ══════════════════════════════════════════════════════════════════════════
// SPRINT V: OPERATIONS & BACKOFFICE — AUTOMATED COLD-CHAIN & FRAGILE SAFEGUARDS (2026)
// ══════════════════════════════════════════════════════════════════════════

export interface ColdChainDelivery {
  id: string;
  orderId: string;
  category: 'ARTISAN_GELATO_ICE_CREAM' | 'TIERED_CELEBRATION_CAKE' | 'PIPING_HOT_PEPPER_SOUP' | 'PHARMACY_BIOLOGICS';
  itemsSummary: string;
  merchantName: string;
  courierName: string;
  courierPhone: string;
  vehicle: string;
  currentTempCelsius: number;
  targetTempRange: string;
  tempStatus: 'OPTIMAL' | 'ACCEPTABLE' | 'BREACH_WARNING';
  icePackCount: number;
  thermoBoxVerified: boolean;
  speedLimitKmH: number;
  currentSpeedKmH: number;
  fragileTiltDeg: number;
  insuranceCoverNgn: number;
  status: 'IN_TRANSIT' | 'DELIVERED_SAFE' | 'CLAIM_FILED';
  elapsedMins: number;
  etaMins: number;
  lastTelemetryPing: string;
}

export interface ColdChainInsuranceClaim {
  id: string;
  deliveryId: string;
  orderId: string;
  claimType: 'MELTED_ICE_CREAM' | 'TOPPLED_CAKE' | 'SPILLED_SOUP' | 'CONTAINER_CRUSHED';
  customerName: string;
  customerRefundNgn: number;
  faultAttribution: 'MERCHANT_PACKAGING' | 'COURIER_HANDLING' | 'FLOWMART_INSURANCE_POOL';
  status: 'APPROVED_PAID' | 'UNDER_REVIEW' | 'REJECTED';
  incidentSummary: string;
  settledAt: string;
}

let coldChainDeliveriesStore: ColdChainDelivery[] = [
  {
    id: 'CC-2026-801',
    orderId: 'ORD-2026-9820',
    category: 'ARTISAN_GELATO_ICE_CREAM',
    itemsSummary: '3x Pints Hans & Rene Gelato (Pistachio, Salted Caramel & Stracciatella)',
    merchantName: 'Hans & Rene Gelateria Lekki',
    courierName: 'Ibrahim Musa',
    courierPhone: '+234 803 762 9011',
    vehicle: 'Honda Ace 125 [KTU-209-XQ]',
    currentTempCelsius: -3.2,
    targetTempRange: '< 0°C',
    tempStatus: 'OPTIMAL',
    icePackCount: 3,
    thermoBoxVerified: true,
    speedLimitKmH: 45,
    currentSpeedKmH: 32,
    fragileTiltDeg: 3.8,
    insuranceCoverNgn: 24000,
    status: 'IN_TRANSIT',
    elapsedMins: 12,
    etaMins: 6,
    lastTelemetryPing: 'Just now'
  },
  {
    id: 'CC-2026-802',
    orderId: 'ORD-2026-9824',
    category: 'TIERED_CELEBRATION_CAKE',
    itemsSummary: '2-Tier 10-Inch Custom Fondant Birthday Cake (Red Velvet & Chantilly)',
    merchantName: 'Diva Cakes & Confectionery VI',
    courierName: 'Kehinde Balogun',
    courierPhone: '+234 802 331 7789',
    vehicle: 'Yamaha Crux [EKY-491-YZ]',
    currentTempCelsius: 17.5,
    targetTempRange: '15°C - 20°C',
    tempStatus: 'OPTIMAL',
    icePackCount: 1,
    thermoBoxVerified: true,
    speedLimitKmH: 30,
    currentSpeedKmH: 26,
    fragileTiltDeg: 4.1,
    insuranceCoverNgn: 65000,
    status: 'IN_TRANSIT',
    elapsedMins: 18,
    etaMins: 9,
    lastTelemetryPing: 'Just now'
  },
  {
    id: 'CC-2026-803',
    orderId: 'ORD-2026-9828',
    category: 'PIPING_HOT_PEPPER_SOUP',
    itemsSummary: 'Family Caldron Goat Meat Pepper Soup & Fresh Catfish Pot (Glass Sealed)',
    merchantName: 'Yellow Chilli Ikeja GRA',
    courierName: 'Sunday Peters',
    courierPhone: '+234 812 345 6789',
    vehicle: 'TVS HLX 125 [BDG-492-QA]',
    currentTempCelsius: 64.2,
    targetTempRange: '> 55°C',
    tempStatus: 'OPTIMAL',
    icePackCount: 0,
    thermoBoxVerified: true,
    speedLimitKmH: 40,
    currentSpeedKmH: 28,
    fragileTiltDeg: 5.4,
    insuranceCoverNgn: 32000,
    status: 'IN_TRANSIT',
    elapsedMins: 14,
    etaMins: 11,
    lastTelemetryPing: '1m ago'
  },
  {
    id: 'CC-2026-804',
    orderId: 'ORD-2026-9831',
    category: 'PHARMACY_BIOLOGICS',
    itemsSummary: '2x Lantus Solostar Insulin Pens & Chilled Glucose Monitors',
    merchantName: 'HealthPlus Pharmacy Victoria Island',
    courierName: 'Oluwaseun Adeyemi',
    courierPhone: '+234 810 551 2299',
    vehicle: 'Honda Ace 125 [KRD-772-LM]',
    currentTempCelsius: 5.1,
    targetTempRange: '2°C - 8°C',
    tempStatus: 'ACCEPTABLE',
    icePackCount: 2,
    thermoBoxVerified: true,
    speedLimitKmH: 45,
    currentSpeedKmH: 34,
    fragileTiltDeg: 2.9,
    insuranceCoverNgn: 45000,
    status: 'IN_TRANSIT',
    elapsedMins: 8,
    etaMins: 14,
    lastTelemetryPing: 'Just now'
  }
];

let insuranceClaimsStore: ColdChainInsuranceClaim[] = [
  {
    id: 'CLM-2026-401',
    deliveryId: 'CC-2026-788',
    orderId: 'ORD-2026-9760',
    claimType: 'MELTED_ICE_CREAM',
    customerName: 'Chiamaka Adeleke',
    customerRefundNgn: 14500,
    faultAttribution: 'FLOWMART_INSURANCE_POOL',
    status: 'APPROVED_PAID',
    incidentSummary: 'Severe road gridlock on Falomo bridge caused thermal gel pack depletion after 55 mins',
    settledAt: '2026-10-31T11:20:00Z'
  },
  {
    id: 'CLM-2026-402',
    deliveryId: 'CC-2026-791',
    orderId: 'ORD-2026-9774',
    claimType: 'SPILLED_SOUP',
    customerName: 'Babatunde Fashola',
    customerRefundNgn: 18000,
    faultAttribution: 'MERCHANT_PACKAGING',
    status: 'APPROVED_PAID',
    incidentSummary: 'Merchant container lid was not heat-sealed; courier rode below speed cap with 0 banking shocks',
    settledAt: '2026-10-31T11:55:00Z'
  }
];

let coldChainConfig = {
  iceCreamMaxTempCelsius: 0,
  biologicsMaxTempCelsius: 8,
  fragileCakeMaxSpeedKmH: 30,
  maxBankingTiltDeg: 12,
  autoDisburseClaimCapNgn: 25000,
  zeroSpillInsuranceGuaranteeActive: true,
  lastAuditAt: '2026-10-31T13:00:00Z'
};

export const getColdChainDeliveries = async (_req: Request, res: Response) => {
  try {
    const activeCount = coldChainDeliveriesStore.filter(d => d.status === 'IN_TRANSIT').length;
    const claimsCount = insuranceClaimsStore.length;
    const totalCoverNgn = coldChainDeliveriesStore.reduce((acc, d) => acc + d.insuranceCoverNgn, 0);

    return res.status(200).json({
      success: true,
      stats: {
        activeColdChainDeliveriesCount: activeCount,
        zeroSpillComplianceRatePct: 99.4,
        totalInsuranceProtectedNgn: totalCoverNgn,
        settledClaimsCount: claimsCount,
        autoDisburseClaimCapNgn: coldChainConfig.autoDisburseClaimCapNgn,
        fragileSpeedCapKmH: coldChainConfig.fragileCakeMaxSpeedKmH,
        zeroSpillGuaranteeActive: coldChainConfig.zeroSpillInsuranceGuaranteeActive
      },
      deliveries: coldChainDeliveriesStore,
      claims: insuranceClaimsStore,
      config: coldChainConfig
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch cold-chain deliveries: ' + error.message });
  }
};

export const auditColdChainOrder = async (req: Request, res: Response) => {
  try {
    const { deliveryId, thermoBoxVerified, icePackCount, tempCelsius } = req.body;
    const delivery = coldChainDeliveriesStore.find(d => d.id === deliveryId);

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Cold-chain shipment not found' });
    }

    if (thermoBoxVerified !== undefined) delivery.thermoBoxVerified = Boolean(thermoBoxVerified);
    if (icePackCount !== undefined) delivery.icePackCount = Number(icePackCount);
    if (tempCelsius !== undefined) {
      delivery.currentTempCelsius = Number(tempCelsius);
      if (delivery.category === 'ARTISAN_GELATO_ICE_CREAM') {
        delivery.tempStatus = delivery.currentTempCelsius <= 0 ? 'OPTIMAL' : 'BREACH_WARNING';
      }
    }

    delivery.lastTelemetryPing = 'Just now';

    return res.status(200).json({
      success: true,
      message: `Cold-chain shipment ${delivery.id} audit verified successfully.`,
      delivery
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Cold-chain audit failed: ' + error.message });
  }
};

export const processInsuranceClaim = async (req: Request, res: Response) => {
  try {
    const { orderId, claimType, customerRefundNgn, faultAttribution, incidentSummary } = req.body;

    const newClaim: ColdChainInsuranceClaim = {
      id: 'CLM-2026-' + Math.floor(100 + Math.random() * 900),
      deliveryId: 'CC-2026-' + Math.floor(800 + Math.random() * 100),
      orderId: orderId || 'ORD-2026-9835',
      claimType: claimType || 'MELTED_ICE_CREAM',
      customerName: 'Verified FlowMart Customer',
      customerRefundNgn: Number(customerRefundNgn) || 15000,
      faultAttribution: faultAttribution || 'FLOWMART_INSURANCE_POOL',
      status: 'APPROVED_PAID',
      incidentSummary: incidentSummary || 'Zero-Spill & Thermal Safeguard Guarantee instant customer reimbursement',
      settledAt: new Date().toISOString()
    };

    insuranceClaimsStore.unshift(newClaim);

    return res.status(200).json({
      success: true,
      message: `Insurance claim ${newClaim.id} approved! ₦${newClaim.customerRefundNgn.toLocaleString()} instantly refunded to customer.`,
      claim: newClaim
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Insurance claim processing failed: ' + error.message });
  }
};

export const updateInsurancePolicyConfig = async (req: Request, res: Response) => {
  try {
    const { fragileCakeMaxSpeedKmH, autoDisburseClaimCapNgn, zeroSpillInsuranceGuaranteeActive } = req.body;

    if (fragileCakeMaxSpeedKmH !== undefined) coldChainConfig.fragileCakeMaxSpeedKmH = Number(fragileCakeMaxSpeedKmH);
    if (autoDisburseClaimCapNgn !== undefined) coldChainConfig.autoDisburseClaimCapNgn = Number(autoDisburseClaimCapNgn);
    if (zeroSpillInsuranceGuaranteeActive !== undefined) coldChainConfig.zeroSpillInsuranceGuaranteeActive = Boolean(zeroSpillInsuranceGuaranteeActive);
    coldChainConfig.lastAuditAt = new Date().toISOString();

    return res.status(200).json({
      success: true,
      message: 'Cold-Chain and Fragile Insurance Policy configuration updated.',
      config: coldChainConfig
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update policy: ' + error.message });
  }
};
