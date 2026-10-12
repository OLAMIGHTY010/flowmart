/**
 * ============================================================================
 * UNIT TESTS: DYNAMIC SURGE & WEATHER-ADAPTIVE LOGISTICS PRICING
 * ============================================================================
 */

import { dynamicSurgeService } from '../../services/logistics/dynamic-surge.service';

describe('DynamicSurgeService (Weather & Congestion Regressor)', () => {
  describe('1. Baseline Standard Pricing', () => {
    it('applies baseline 1.0x multiplier during calm midday conditions', () => {
      const res = dynamicSurgeService.calculateDynamicFee({
        baseFeeNgn: 1200,
        deliveryZone: 'Ikeja',
        weatherCondition: 'CLEAR',
        hourOfDay: 14, // 2:00 PM (Off-peak)
        activeRidersCount: 15,
        pendingOrdersCount: 8,
      });

      expect(res.surgeMultiplier).toBe(1.0);
      expect(res.finalDeliveryFeeNgn).toBe(1200);
      expect(res.isSurgeActive).toBe(false);
      expect(res.surgeSurchargeNgn).toBe(0);
      expect(res.riderPayoutNgn).toBeGreaterThan(0);
    });
  });

  describe('2. Adverse Weather & Rush-Hour Multipliers', () => {
    it('applies weather and rush-hour surge during thunderstorm commute', () => {
      const res = dynamicSurgeService.calculateDynamicFee({
        baseFeeNgn: 1500,
        deliveryZone: 'Lekki / Victoria Island',
        weatherCondition: 'THUNDERSTORM',
        hourOfDay: 18, // 6:00 PM (Evening Rush)
        activeRidersCount: 5,
        pendingOrdersCount: 20, // Severe scarcity
      });

      expect(res.isSurgeActive).toBe(true);
      expect(res.surgeMultiplier).toBeGreaterThan(1.4);
      // Multiplier should never breach hard safety ceiling of 2.2x
      expect(res.surgeMultiplier).toBeLessThanOrEqual(2.2);
      expect(res.surgeSurchargeNgn).toBeGreaterThan(0);
      expect(res.riderPayoutNgn).toBeGreaterThan(res.baseFeeNgn);
      expect(res.surgeReason).toContain('THUNDERSTORM');
    });
  });

  describe('3. Fair Rider Incentive Allocation', () => {
    it('allocates 80% of the dynamic surcharge directly to rider bonus payout', () => {
      const res = dynamicSurgeService.calculateDynamicFee({
        baseFeeNgn: 1000,
        deliveryZone: 'Yaba',
        weatherCondition: 'RAIN',
        hourOfDay: 9,
      });

      expect(res.isSurgeActive).toBe(true);
      // Rider payout must exceed standard base rider fee
      expect(res.riderPayoutNgn).toBeGreaterThan(750);
      expect(res.platformCommissionNgn).toBeGreaterThan(0);
    });
  });
});
