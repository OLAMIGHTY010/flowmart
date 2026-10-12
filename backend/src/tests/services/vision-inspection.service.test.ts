/**
 * ============================================================================
 * UNIT TESTS: MULTIMODAL AI VISION FOR PROOF-OF-DELIVERY & DISPUTES
 * ============================================================================
 */

import { visionInspectionService } from '../../services/ai/vision-inspection.service';

describe('VisionInspectionService (Multimodal POD & Dispute Arbitration)', () => {
  describe('1. verifyProofOfDelivery', () => {
    it('successfully inspects valid delivery photo and verifies parcel condition', async () => {
      const result = await visionInspectionService.verifyProofOfDelivery(
        'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
        'order-12345',
        'Emeka Obi'
      );

      expect(result.verified).toBe(true);
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0.8);
      expect(result.parcelCondition).toBe('INTACT');
      expect(result.sealIntact).toBe(true);
      expect(result.doorstepDetected).toBe(true);
      expect(result.fraudAlertFlags.length).toBe(0);
    });

    it('flags missing delivery image with fraud alert and verified=false', async () => {
      const result = await visionInspectionService.verifyProofOfDelivery('', 'order-12345');

      expect(result.verified).toBe(false);
      expect(result.confidenceScore).toBe(0);
      expect(result.fraudAlertFlags).toContain('MISSING_IMAGE');
    });
  });

  describe('2. arbitrateDispute', () => {
    it('compares outbound packing vs delivery photo and arbitrates liability', async () => {
      const result = await visionInspectionService.arbitrateDispute(
        'https://flowmart.com/vendor-packing.jpg',
        'https://flowmart.com/buyer-damage.jpg',
        'Screen cracked on arrival'
      );

      expect(result.arbitrationVerdict).toBeDefined();
      expect(result.damageSeverity).toBeDefined();
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0.7);
      expect(result.arbitrationExplanation).toBeTruthy();
      expect(result.recommendedAction).toBeTruthy();
      // Total liabilities should equal 100%
      const totalLiability =
        result.vendorLiabilityPercent + result.riderLiabilityPercent + result.buyerLiabilityPercent;
      expect(totalLiability).toBeGreaterThanOrEqual(95);
    });
  });
});
