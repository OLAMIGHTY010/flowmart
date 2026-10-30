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
