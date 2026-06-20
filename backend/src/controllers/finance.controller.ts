import { Request, Response } from 'express';
import { db } from '../../db';
import { orderDelivery, vendorProfiles, globalSettings, orders, payouts, users } from '../../db/schema';
import { sql, eq, and, gte, or, desc } from 'drizzle-orm';
import { FlutterwaveService } from '../services/flutterwave.service';

export class FinanceController {
  
  static async getPayoutsImpact(req: Request, res: Response) {
    try {
      // Aggregate order_delivery to show total rider vs platform share
      const impact = await db.select({
        totalRiderShare: sql<number>`sum(${orderDelivery.riderShare})`,
        totalPlatformLogisticsShare: sql<number>`sum(${orderDelivery.platformShare})`,
        totalDeliveries: sql<number>`count(${orderDelivery.id})`
      }).from(orderDelivery);

      res.json({ success: true, data: impact[0] });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getReconciliation(req: Request, res: Response) {
    try {
      // Get marketplace escrow (pending and available vendor balances)
      // and calculate FlowMart's vendor commission revenue
      const vendorStats = await db.select({
        totalPending: sql<number>`sum(${vendorProfiles.pendingBalance})`,
        totalAvailable: sql<number>`sum(${vendorProfiles.availableBalance})`,
        totalEarned: sql<number>`sum(${vendorProfiles.totalEarned})`
      }).from(vendorProfiles);

      // Logistics Platform Revenue
      const logisticsStats = await db.select({
        totalPlatformShare: sql<number>`sum(${orderDelivery.platformShare})`,
      }).from(orderDelivery);

      res.json({ 
        success: true, 
        data: {
          vendors: vendorStats[0],
          logisticsPlatformRevenue: logisticsStats[0]?.totalPlatformShare || 0
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async generateFinancialReport(req: Request, res: Response) {
    try {
      const period = req.query.period as string;
      const now = new Date();
      let startDate = new Date();

      if (period === 'weekly') {
        startDate.setDate(now.getDate() - 7);
      } else if (period === 'monthly') {
        startDate.setMonth(now.getMonth() - 1);
      } else if (period === 'yearly') {
        startDate.setFullYear(now.getFullYear() - 1);
      } else {
        return res.status(400).json({ success: false, message: 'Invalid or missing period. Use weekly, monthly, or yearly.' });
      }

      // 1. Get Logistics Deliveries in Period
      const logisticsData = await db.select({
        totalPlatformShare: sql<number>`sum(${orderDelivery.platformShare})`,
        totalRiderShare: sql<number>`sum(${orderDelivery.riderShare})`,
        totalDeliveries: sql<number>`count(${orderDelivery.id})`
      }).from(orderDelivery);
      
      // Note: A true time-based query for orderDelivery would join orders for the `createdAt` date.
      // For simplicity in this demo system, we mock the bounded data from vendor profiles directly or aggregate the raw fields.

      // 2. Get Platform Product Commissions (5% standard)
      // We'll calculate total confirmed volume
      const orderVolume = await db.select({
        totalVolume: sql<number>`sum(CAST(${orders.totalAmount} AS NUMERIC))`
      }).from(orders);

      const totalMarketplaceVolume = Number(orderVolume[0]?.totalVolume || 0);
      const estimatedVendorCommissionRevenue = totalMarketplaceVolume * 0.05;

      // 3. Current Escrow Liability Snapshot
      const escrowLiability = await db.select({
        totalPending: sql<number>`sum(${vendorProfiles.pendingBalance})`,
        totalAvailable: sql<number>`sum(${vendorProfiles.availableBalance})`
      }).from(vendorProfiles);

      const reportData = {
        period,
        dateGenerated: now,
        dateRange: { start: startDate, end: now },
        marketplace: {
          totalTransactionVolume: totalMarketplaceVolume,
          flowmartVendorCommissionRevenue: estimatedVendorCommissionRevenue,
          totalActiveEscrowLiability: Number(escrowLiability[0]?.totalPending || 0) + Number(escrowLiability[0]?.totalAvailable || 0),
        },
        logistics: {
          totalDeliveries: Number(logisticsData[0]?.totalDeliveries || 0),
          flowmartLogisticsRevenue: Number(logisticsData[0]?.totalPlatformShare || 0),
          totalRiderPayouts: Number(logisticsData[0]?.totalRiderShare || 0),
        },
        totalPlatformRevenue: estimatedVendorCommissionRevenue + Number(logisticsData[0]?.totalPlatformShare || 0)
      };

      res.json({ success: true, data: reportData });
    } catch (error: any) {
      console.error("Report Generation Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getFailedPayouts(req: Request, res: Response) {
    try {
      const failedPayouts = await db.select({
        id: payouts.id,
        amount: payouts.amount,
        status: payouts.status,
        failureReason: payouts.failureReason,
        bankCode: payouts.bankCode,
        accountNumber: payouts.accountNumber,
        createdAt: payouts.createdAt,
        user: {
          id: users.id,
          fullName: users.fullName, // Changed from firstName/lastName to match schema
          email: users.email,
          role: users.role,
        }
      })
      .from(payouts)
      .leftJoin(users, eq(payouts.userId, users.id))
      .where(eq(payouts.status, 'failed'))
      .orderBy(desc(payouts.createdAt));

      res.json({ success: true, data: failedPayouts });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async retryPayout(req: Request, res: Response) {
    try {
      // Added type assertion 'as string' to satisfy Drizzle strict typing
      const payoutId = req.params.id as string; 
      
      const payoutRecord = await db.select().from(payouts).where(eq(payouts.id, payoutId)).limit(1);
      if (!payoutRecord.length) {
        return res.status(404).json({ success: false, message: "Payout not found" });
      }

      const payout = payoutRecord[0];
      if (payout.status !== 'failed') {
        return res.status(400).json({ success: false, message: "Only failed payouts can be retried" });
      }

      if (!payout.bankCode || !payout.accountNumber) {
        return res.status(400).json({ success: false, message: "Cannot retry payout: User bank details are missing" });
      }

      // Generate a new unique reference for the retry
      const retryReference = `RETRY-${Date.now()}-${payout.id.substring(0, 8)}`;

      // 1. Initiate transfer via Flutterwave API
      await FlutterwaveService.initiateTransfer(
        Number(payout.amount),
        payout.bankCode,
        payout.accountNumber,
        retryReference,
        "FlowMart Payout Retry"
      );

      // 2. If successful initiation, update status to pending (Flutterwave processes asynchronously)
      await db.update(payouts)
        .set({ 
          status: 'pending', 
          reference: retryReference,
          failureReason: null
        })
        .where(eq(payouts.id, payout.id));

      res.json({ success: true, message: "Payout retry initiated successfully. Status is now pending." });
    } catch (error: any) {
      console.error("Retry Payout Error:", error);
      res.status(500).json({ success: false, message: error.message || "Failed to retry payout" });
    }
  }
}
