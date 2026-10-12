/**
 * ============================================================================
 * FRAUD & ANOMALY DETECTION ML SERVICE
 * ============================================================================
 *
 * Implements statistical anomaly scoring:
 * 1. Z-Score Order Value Outlier Analysis (X - Mean) / StdDev
 * 2. Temporal Velocity Spike Detection (multiple rapid orders)
 * 3. Account Maturity, Verification & KYC Risk Factors
 * 4. High-Ticket Escrow & Pay-on-Delivery Default Risk Modeling
 *
 * @module backend/src/services/ai/fraud-detection.service
 */

import { db } from '../../../db';
import { orders, users, disputes } from '../../../db/schema';
import { eq, and, sql, gte, desc } from 'drizzle-orm';

export interface OrderRiskAssessmentInput {
  userId: string;
  totalAmount: number;
  paymentMethod: string;
  deliveryZone?: string;
  userIp?: string;
  deviceFingerprint?: string;
}

export interface RiskAssessmentResult {
  riskScore: number; // 0 - 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFactors: string[];
  zScore: number;
  velocityCountLastHour: number;
  recommendedAction: 'APPROVE' | 'REQUIRE_2FA' | 'MANUAL_REVIEW' | 'HOLD_ESCROW' | 'REJECT';
  evaluatedAt: string;
}

/**
 * Evaluates transactional risk score and anomaly signals
 */
export async function assessOrderRisk(
  input: OrderRiskAssessmentInput
): Promise<RiskAssessmentResult> {
  const { userId, totalAmount, paymentMethod } = input;
  const riskFactors: string[] = [];
  let score = 5; // Base minimal score

  // 1. Fetch User Profile & Verification Status
  const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = userRows[0];

  if (!user) {
    return {
      riskScore: 90,
      riskLevel: 'CRITICAL',
      riskFactors: ['Unregistered user transaction'],
      zScore: 0,
      velocityCountLastHour: 0,
      recommendedAction: 'REJECT',
      evaluatedAt: new Date().toISOString(),
    };
  }

  // Factor: Account Age & Verification
  const accountAgeDays = user.createdAt
    ? Math.max(0, (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 10;

  if (accountAgeDays < 1) {
    score += 15;
    riskFactors.push('Brand new account created today (< 24 hrs)');
  }
  if (!user.isVerified) {
    score += 12;
    riskFactors.push('Unverified user account (email/phone not confirmed)');
  }

  // 2. Fetch User's Order History for Z-Score Computation
  const pastOrders = await db
    .select({ totalAmount: orders.totalAmount, createdAt: orders.createdAt })
    .from(orders)
    .where(eq(orders.userId, userId))
    .limit(50);

  const pastAmounts = pastOrders
    .map((o) => parseFloat(o.totalAmount))
    .filter((a) => !isNaN(a) && a > 0);

  let zScore = 0;
  if (pastAmounts.length >= 3) {
    const mean = pastAmounts.reduce((a, b) => a + b, 0) / pastAmounts.length;
    const variance =
      pastAmounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / pastAmounts.length;
    const stdDev = Math.max(100, Math.sqrt(variance));

    zScore = Number(((totalAmount - mean) / stdDev).toFixed(2));

    if (zScore > 3.0) {
      score += 35;
      riskFactors.push(`Extreme order value anomaly (Z-score: ${zScore}, 3x+ above user's normal average)`);
    } else if (zScore > 2.0) {
      score += 20;
      riskFactors.push(`High order value deviation (Z-score: ${zScore})`);
    }
  } else {
    // For users with < 3 past orders, evaluate absolute basket size
    if (totalAmount > 250000) {
      score += 28;
      riskFactors.push(`High-ticket first order (> ₦250,000) without established credit history`);
    } else if (totalAmount > 100000) {
      score += 14;
      riskFactors.push(`Substantial first-time basket (> ₦100,000)`);
    }
  }

  // 3. Velocity Check (Orders within last 60 minutes)
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  const recentOrders = pastOrders.filter(
    (o) => o.createdAt && new Date(o.createdAt) >= oneHourAgo
  );
  const velocityCountLastHour = recentOrders.length;

  if (velocityCountLastHour >= 4) {
    score += 35;
    riskFactors.push(`Rapid order velocity: ${velocityCountLastHour} orders placed within the last hour`);
  } else if (velocityCountLastHour >= 2) {
    score += 15;
    riskFactors.push(`Multiple orders (${velocityCountLastHour}) in short timeframe`);
  }

  // 4. Payment Method & Escrow Vulnerability Check
  if (paymentMethod === 'pay_on_delivery' && totalAmount > 75000) {
    score += 18;
    riskFactors.push('Pay-on-Delivery requested for high-value cart (elevated refusal risk)');
  }

  // 5. User Dispute History Check
  const userDisputes = await db
    .select({ id: disputes.id })
    .from(disputes)
    .where(eq(disputes.raisedById, userId))
    .limit(5);

  if (userDisputes.length >= 2) {
    score += 25;
    riskFactors.push(`Frequent dispute history (${userDisputes.length} disputes on record)`);
  }

  // Normalize final score
  const finalScore = Math.min(100, Math.max(0, score));

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  let recommendedAction: RiskAssessmentResult['recommendedAction'] = 'APPROVE';

  if (finalScore >= 80) {
    riskLevel = 'CRITICAL';
    recommendedAction = 'MANUAL_REVIEW';
  } else if (finalScore >= 55) {
    riskLevel = 'HIGH';
    recommendedAction = 'HOLD_ESCROW';
  } else if (finalScore >= 35) {
    riskLevel = 'MEDIUM';
    recommendedAction = 'REQUIRE_2FA';
  }

  return {
    riskScore: finalScore,
    riskLevel,
    riskFactors: riskFactors.length > 0 ? riskFactors : ['Normal transaction profile'],
    zScore,
    velocityCountLastHour,
    recommendedAction,
    evaluatedAt: new Date().toISOString(),
  };
}

/**
 * Returns recent high-risk transactions for Admin Risk & Security Review
 */
export async function getAuditRiskOrders(limit: number = 10) {
  const recentOrders = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(limit * 2);

  const audits = [];
  for (const o of recentOrders) {
    const assessment = await assessOrderRisk({
      userId: o.userId,
      totalAmount: parseFloat(o.totalAmount) || 0,
      paymentMethod: o.paymentMethod,
      deliveryZone: o.deliveryZone,
    });

    if (assessment.riskScore >= 30) {
      audits.push({
        orderId: o.id,
        orderRef: o.orderRef,
        userId: o.userId,
        totalAmount: o.totalAmount,
        status: o.status,
        paymentMethod: o.paymentMethod,
        assessment,
        createdAt: o.createdAt,
      });
    }

    if (audits.length >= limit) break;
  }

  return audits;
}
