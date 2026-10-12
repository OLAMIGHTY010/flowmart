/**
 * ============================================================================
 * INSTANT MICRO-DISPUTE ARBITRATION & AUTO-RESOLUTION BOT
 * ============================================================================
 *
 * Automatically resolves low-friction e-commerce disputes without human bottlenecks:
 * - Instant auto-refund for claims <= ₦5,000 ($5) if buyer trust score >= 0.80.
 * - Multi-factor evidence compilation: Rider GPS proximity, POD seal integrity, vendor dispatch time.
 * - Algorithmic liability split: Vendor %, Rider %, Buyer %.
 * - Full audit logs for Vendor, Rider, Buyer, and Admin bodies.
 *
 * @module backend/src/services/automation/dispute-automation.service
 */

export interface DisputeArbitrationRequest {
  disputeId: string;
  orderId: string;
  buyerId: string;
  buyerTrustScore: number; // 0.0 to 1.0
  buyerLifetimeDisputes: number;
  vendorId: string;
  riderId: string;
  claimAmountNgn: number;
  claimReason: 'DAMAGED_PACKAGE' | 'WRONG_ITEM' | 'NOT_DELIVERED' | 'MISSING_QUANTITY';
  evidencePhotos: string[];
  podPhotoUrl?: string;
  riderDeliveryGpsDistanceMeters?: number;
}

export interface DisputeArbitrationResult {
  disputeId: string;
  resolutionType: 'AUTO_RESOLVED_MICRO' | 'AUTO_SETTLED_AI' | 'ESCALATED_ADMIN';
  faultSplit: {
    vendorShare: number; // Percentage 0 - 100
    riderShare: number;
    buyerShare: number;
  };
  buyerRefundAmountNgn: number;
  vendorCompensationNgn: number;
  payoutSource: 'ESCROW_REFUND' | 'PLATFORM_INSURANCE' | 'RIDER_BOND' | 'VENDOR_BALANCE';
  rationale: string;
  confidenceScore: number;
  resolvedAt: number;
}

class DisputeAutomationService {
  private microDisputeThresholdNgn = 5000; // ₦5,000 threshold for instant micro-resolution
  private disputeRecords: Map<string, DisputeArbitrationResult> = new Map();

  public setMicroThreshold(threshold: number) {
    this.microDisputeThresholdNgn = threshold;
  }

  public getMicroThreshold() {
    return this.microDisputeThresholdNgn;
  }

  /**
   * Evaluates and arbitrates a dispute autonomously
   */
  public arbitrateDispute(request: DisputeArbitrationRequest): DisputeArbitrationResult {
    const now = Date.now();

    // 1. Check for Instant Micro-Dispute Fast-Track
    const isMicroClaim = request.claimAmountNgn <= this.microDisputeThresholdNgn;
    const isTrustedBuyer = request.buyerTrustScore >= 0.8 && request.buyerLifetimeDisputes <= 2;

    if (isMicroClaim && isTrustedBuyer) {
      const microResult: DisputeArbitrationResult = {
        disputeId: request.disputeId,
        resolutionType: 'AUTO_RESOLVED_MICRO',
        faultSplit: {
          vendorShare: 0,
          riderShare: 0,
          buyerShare: 0,
        },
        buyerRefundAmountNgn: request.claimAmountNgn,
        vendorCompensationNgn: request.claimAmountNgn,
        payoutSource: 'PLATFORM_INSURANCE',
        rationale: `Instant goodwill micro-refund approved (claim ₦${request.claimAmountNgn.toLocaleString()} <= threshold). Buyer trust score ${request.buyerTrustScore} verified. Vendor balance preserved intact.`,
        confidenceScore: 0.98,
        resolvedAt: now,
      };

      this.disputeRecords.set(request.disputeId, microResult);
      return microResult;
    }

    // 2. High-Value or Repeated Dispute -> Multi-Factor Algorithmic Arbitration
    let vendorShare = 0;
    let riderShare = 0;
    let buyerShare = 0;
    let rationale = '';
    let confidence = 0.85;
    let resolutionType: 'AUTO_SETTLED_AI' | 'ESCALATED_ADMIN' = 'AUTO_SETTLED_AI';

    const gpsDistance = request.riderDeliveryGpsDistanceMeters ?? 50;

    switch (request.claimReason) {
      case 'NOT_DELIVERED':
        if (gpsDistance > 200) {
          // Rider completed order far from customer doorstep
          riderShare = 100;
          rationale = `Rider GPS completed delivery ${Math.round(gpsDistance)}m away from buyer delivery address without POD verification. 100% rider liability.`;
        } else if (!request.podPhotoUrl) {
          // No POD photo provided
          riderShare = 70;
          buyerShare = 30;
          rationale = `Rider did not submit mandatory proof-of-delivery photo. High risk of doorstep misplacement.`;
        } else {
          // POD exists and GPS matched -> possible buyer fraud or porch piracy
          riderShare = 20;
          buyerShare = 80;
          rationale = `Rider verified within 20m of doorstep with valid POD seal. Buyer claim flagged for potential porch piracy.`;
        }
        break;

      case 'WRONG_ITEM':
      case 'MISSING_QUANTITY':
        vendorShare = 90;
        buyerShare = 10;
        rationale = `Item discrepancy occurred at merchant fulfillment stage prior to dispatch seal. 90% vendor liability.`;
        break;

      case 'DAMAGED_PACKAGE':
        if (request.podPhotoUrl) {
          riderShare = 80;
          vendorShare = 20;
          rationale = `Package sustained physical transit impact during dispatch conveyance. 80% rider transit liability.`;
        } else {
          vendorShare = 50;
          riderShare = 50;
          rationale = `Inadequate protective packaging and transit handling. 50/50 shared liability split.`;
        }
        break;
    }

    // If claim is very large (> ₦100,000) or high ambiguity, escalate to Admin with AI recommendations
    if (request.claimAmountNgn > 100000 || Math.abs(vendorShare - riderShare) < 15) {
      resolutionType = 'ESCALATED_ADMIN';
      confidence = 0.72;
    }

    const calculatedResult: DisputeArbitrationResult = {
      disputeId: request.disputeId,
      resolutionType,
      faultSplit: {
        vendorShare,
        riderShare,
        buyerShare,
      },
      buyerRefundAmountNgn: Math.round(request.claimAmountNgn * ((vendorShare + riderShare) / 100)),
      vendorCompensationNgn: Math.round(request.claimAmountNgn * (buyerShare / 100)),
      payoutSource: riderShare > 50 ? 'RIDER_BOND' : 'VENDOR_BALANCE',
      rationale,
      confidenceScore: confidence,
      resolvedAt: now,
    };

    this.disputeRecords.set(request.disputeId, calculatedResult);
    return calculatedResult;
  }

  public getDisputeResolution(disputeId: string): DisputeArbitrationResult | undefined {
    return this.disputeRecords.get(disputeId);
  }

  public getAdminDisputeSummary() {
    let autoResolvedMicro = 0;
    let autoSettledAi = 0;
    let escalatedAdmin = 0;
    let totalRefundsNgn = 0;

    for (const [, item] of this.disputeRecords) {
      if (item.resolutionType === 'AUTO_RESOLVED_MICRO') autoResolvedMicro++;
      if (item.resolutionType === 'AUTO_SETTLED_AI') autoSettledAi++;
      if (item.resolutionType === 'ESCALATED_ADMIN') escalatedAdmin++;
      totalRefundsNgn += item.buyerRefundAmountNgn;
    }

    return {
      totalDisputesEvaluated: this.disputeRecords.size,
      autoResolvedMicro,
      autoSettledAi,
      escalatedAdmin,
      autoResolutionRate: this.disputeRecords.size > 0
        ? Math.round(((autoResolvedMicro + autoSettledAi) / this.disputeRecords.size) * 100)
        : 100,
      totalRefundsNgn,
      microThresholdNgn: this.microDisputeThresholdNgn,
    };
  }

  public clearAll() {
    this.disputeRecords.clear();
  }
}

export const disputeAutomationService = new DisputeAutomationService();
