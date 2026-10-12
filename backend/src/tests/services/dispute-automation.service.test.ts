import { disputeAutomationService } from '../../services/automation/dispute-automation.service';

describe('DisputeAutomationService', () => {
  beforeEach(() => {
    disputeAutomationService.clearAll();
  });

  it('should auto-approve micro-dispute under 5000 NGN for trusted buyer', () => {
    const result = disputeAutomationService.arbitrateDispute({
      disputeId: 'disp-001',
      orderId: 'order-001',
      buyerId: 'buyer-01',
      buyerTrustScore: 0.95,
      buyerLifetimeDisputes: 1,
      vendorId: 'vendor-01',
      riderId: 'rider-01',
      claimAmountNgn: 3500,
      claimReason: 'MISSING_QUANTITY',
      evidencePhotos: [],
    });

    expect(result.resolutionType).toBe('AUTO_RESOLVED_MICRO');
    expect(result.buyerRefundAmountNgn).toBe(3500);
    expect(result.vendorCompensationNgn).toBe(3500);
    expect(result.payoutSource).toBe('PLATFORM_INSURANCE');
    expect(result.confidenceScore).toBeGreaterThanOrEqual(0.95);
  });

  it('should allocate 100% rider liability if delivery completed far from doorstep without POD', () => {
    const result = disputeAutomationService.arbitrateDispute({
      disputeId: 'disp-002',
      orderId: 'order-002',
      buyerId: 'buyer-02',
      buyerTrustScore: 0.7,
      buyerLifetimeDisputes: 4,
      vendorId: 'vendor-02',
      riderId: 'rider-02',
      claimAmountNgn: 18000,
      claimReason: 'NOT_DELIVERED',
      evidencePhotos: [],
      riderDeliveryGpsDistanceMeters: 450, // 450m away from destination
    });

    expect(result.resolutionType).toBe('AUTO_SETTLED_AI');
    expect(result.faultSplit.riderShare).toBe(100);
    expect(result.buyerRefundAmountNgn).toBe(18000);
  });

  it('should allocate 90% vendor liability for wrong item claim', () => {
    const result = disputeAutomationService.arbitrateDispute({
      disputeId: 'disp-003',
      orderId: 'order-003',
      buyerId: 'buyer-03',
      buyerTrustScore: 0.75,
      buyerLifetimeDisputes: 3,
      vendorId: 'vendor-03',
      riderId: 'rider-03',
      claimAmountNgn: 25000,
      claimReason: 'WRONG_ITEM',
      evidencePhotos: ['https://example.com/wrong-item.jpg'],
    });

    expect(result.resolutionType).toBe('AUTO_SETTLED_AI');
    expect(result.faultSplit.vendorShare).toBe(90);
  });

  it('should escalate to admin if claim is very large', () => {
    const result = disputeAutomationService.arbitrateDispute({
      disputeId: 'disp-004',
      orderId: 'order-004',
      buyerId: 'buyer-04',
      buyerTrustScore: 0.65,
      buyerLifetimeDisputes: 2,
      vendorId: 'vendor-04',
      riderId: 'rider-04',
      claimAmountNgn: 250000, // ₦250k
      claimReason: 'DAMAGED_PACKAGE',
      evidencePhotos: ['https://example.com/damaged.jpg'],
      podPhotoUrl: 'https://example.com/pod.jpg',
    });

    expect(result.resolutionType).toBe('ESCALATED_ADMIN');
  });

  it('should return admin summary metrics', () => {
    disputeAutomationService.arbitrateDispute({
      disputeId: 'disp-005',
      orderId: 'order-005',
      buyerId: 'buyer-05',
      buyerTrustScore: 0.9,
      buyerLifetimeDisputes: 0,
      vendorId: 'vendor-05',
      riderId: 'rider-05',
      claimAmountNgn: 2000,
      claimReason: 'DAMAGED_PACKAGE',
      evidencePhotos: [],
    });

    const summary = disputeAutomationService.getAdminDisputeSummary();
    expect(summary.totalDisputesEvaluated).toBe(1);
    expect(summary.autoResolvedMicro).toBe(1);
    expect(summary.totalRefundsNgn).toBe(2000);
  });
});
