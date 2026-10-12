/**
 * ============================================================================
 * AUTOMATED ANTI-FRAUD VELOCITY & SYBIL REFERRAL QUARANTINE ENGINE
 * ============================================================================
 *
 * Provides automated defense against financial fraud and voucher farming:
 * - Real-time transaction velocity monitoring by IP & Device Fingerprint.
 * - Automated quarantine / 2FA step-up on rapid order bursts or repeated card declines.
 * - Sybil referral defense: detects IP / device collision between referrer & referee.
 * - Risk posture transparency for Buyers, Vendors, Riders, and Platform Admins.
 *
 * @module backend/src/services/automation/fraud-automation.service
 */

export interface TransactionAttempt {
  transactionId: string;
  userId: string;
  ipAddress: string;
  deviceFingerprint: string;
  amountNgn: number;
  paymentStatus: 'SUCCESS' | 'DECLINED' | 'FAILED';
  timestamp: number;
}

export interface VelocityAuditResult {
  allowed: boolean;
  action: 'ALLOW' | 'STEP_UP_2FA' | 'QUARANTINE_FREEZE';
  riskScore: number; // 0.00 to 1.00
  reason: string;
}

export interface SybilReferralCheck {
  referrerId: string;
  refereeId: string;
  referrerIp: string;
  refereeIp: string;
  referrerDevice: string;
  refereeDevice: string;
  isSybilFraud: boolean;
  revocationReason?: string;
}

class FraudAutomationService {
  private recentTransactions: TransactionAttempt[] = [];
  private quarantinedEntities: Set<string> = new Set(); // IPs or userIds in quarantine

  /**
   * Evaluates an incoming transaction attempt against velocity thresholds
   */
  public evaluateTransactionVelocity(attempt: TransactionAttempt): VelocityAuditResult {
    this.recentTransactions.push(attempt);

    // Check if IP or user is already under quarantine
    if (
      this.quarantinedEntities.has(attempt.ipAddress) ||
      this.quarantinedEntities.has(attempt.userId)
    ) {
      return {
        allowed: false,
        action: 'QUARANTINE_FREEZE',
        riskScore: 0.99,
        reason: 'Entity is currently under automated quarantine due to previous velocity violations.',
      };
    }

    const twoMinutesAgo = attempt.timestamp - 2 * 60 * 1000;
    const windowTransactions = this.recentTransactions.filter(
      (t) =>
        (t.ipAddress === attempt.ipAddress || t.userId === attempt.userId || t.deviceFingerprint === attempt.deviceFingerprint) &&
        t.timestamp >= twoMinutesAgo
    );

    const burstCount = windowTransactions.length;
    const declinedCount = windowTransactions.filter((t) => t.paymentStatus === 'DECLINED').length;

    // Rule 1: High velocity burst (> 3 attempts in 2 minutes)
    if (burstCount > 3) {
      this.quarantinedEntities.add(attempt.ipAddress);
      this.quarantinedEntities.add(attempt.userId);
      return {
        allowed: false,
        action: 'QUARANTINE_FREEZE',
        riskScore: 0.92,
        reason: `Excessive rapid transaction velocity (${burstCount} orders in 2 minutes). Entity quarantined.`,
      };
    }

    // Rule 2: Repeated payment failures (> 2 declines)
    if (declinedCount >= 2) {
      return {
        allowed: false,
        action: 'STEP_UP_2FA',
        riskScore: 0.78,
        reason: `Multiple consecutive card declines (${declinedCount}). Step-up OTP/2FA challenge required.`,
      };
    }

    // Normal safe transaction
    return {
      allowed: true,
      action: 'ALLOW',
      riskScore: 0.12,
      reason: 'Transaction is within normal velocity parameters.',
    };
  }

  /**
   * Evaluates referral relationship for Sybil / self-referral voucher farming
   */
  public evaluateReferralSybil(
    referrerId: string,
    refereeId: string,
    referrerIp: string,
    refereeIp: string,
    referrerDevice: string,
    refereeDevice: string
  ): SybilReferralCheck {
    const isIpMatch = referrerIp === refereeIp && referrerIp !== '127.0.0.1';
    const isDeviceMatch = referrerDevice === refereeDevice && referrerDevice !== 'unknown';

    if (isDeviceMatch) {
      return {
        referrerId,
        refereeId,
        referrerIp,
        refereeIp,
        referrerDevice,
        refereeDevice,
        isSybilFraud: true,
        revocationReason: 'Exact device hardware fingerprint collision between referrer and referee.',
      };
    }

    if (isIpMatch) {
      return {
        referrerId,
        refereeId,
        referrerIp,
        refereeIp,
        referrerDevice,
        refereeDevice,
        isSybilFraud: true,
        revocationReason: 'Identical network IP address collision detected. Referral voucher blocked.',
      };
    }

    return {
      referrerId,
      refereeId,
      referrerIp,
      refereeIp,
      referrerDevice,
      refereeDevice,
      isSybilFraud: false,
    };
  }

  /**
   * Release an entity from quarantine (Admin action)
   */
  public liftQuarantine(entity: string): boolean {
    return this.quarantinedEntities.delete(entity);
  }

  /**
   * Admin fraud metrics overview
   */
  public getAdminFraudMetrics() {
    return {
      totalEvaluatedAttempts: this.recentTransactions.length,
      currentlyQuarantinedCount: this.quarantinedEntities.size,
      quarantinedEntities: Array.from(this.quarantinedEntities),
      overallRiskPosture: this.quarantinedEntities.size > 5 ? 'ELEVATED' : 'STABLE',
    };
  }

  public clearAll() {
    this.recentTransactions = [];
    this.quarantinedEntities.clear();
  }
}

export const fraudAutomationService = new FraudAutomationService();
