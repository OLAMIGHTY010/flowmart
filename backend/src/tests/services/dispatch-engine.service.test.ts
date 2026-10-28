/**
 * ============================================================================
 * UNIT TESTS: CHOWDECK-GRADE DISPATCH & SPATIAL MATCHING ENGINE
 * ============================================================================
 */

import { dispatchEngineService } from '../../services/logistics/dispatch-engine.service';
import { redisCacheService } from '../../services/infrastructure/redis-cache.service';

describe('DispatchEngineService (Chowdeck-Grade On-Demand Dispatch)', () => {
  beforeEach(async () => {
    // Clear locks and offers before each test
    await redisCacheService.releaseLock('order:accept:test-order-1');
    await redisCacheService.releaseLock('order:accept:test-order-2');
  });

  describe('1. Geospatial Proximity Matching (3km radius)', () => {
    it('indexes nearby couriers and sorts by distance', async () => {
      // Lagos Center (Ikeja Hub: 6.6018, 3.3515)
      const hubLat = 6.6018;
      const hubLng = 3.3515;

      // Rider A: ~1.2 km away
      await dispatchEngineService.updateRiderLocation('rider-alpha', 6.6080, 3.3580);
      // Rider B: ~2.4 km away
      await dispatchEngineService.updateRiderLocation('rider-beta', 6.6150, 3.3650);
      // Rider C: ~15 km away (outside 3km initial stage)
      await dispatchEngineService.updateRiderLocation('rider-gamma', 6.4500, 3.4000);

      const nearby3km = await redisCacheService.getNearestRiders(hubLat, hubLng, 3.0, 5);
      const riderIds = nearby3km.map((r) => r.riderId);

      expect(riderIds).toContain('rider-alpha');
      expect(riderIds).toContain('rider-beta');
      expect(riderIds).not.toContain('rider-gamma');

      // Verify closest rider is ordered first
      expect(nearby3km[0].riderId).toBe('rider-alpha');
      expect(nearby3km[0].distanceKm).toBeLessThan(nearby3km[1].distanceKm!);
    });

    it('expands to 6km and discovers couriers in Stage 2 perimeter', async () => {
      const hubLat = 6.6018;
      const hubLng = 3.3515;

      // Rider Delta: ~4.5 km away
      await dispatchEngineService.updateRiderLocation('rider-delta', 6.6350, 3.3750);

      const within3km = await redisCacheService.getNearestRiders(hubLat, hubLng, 3.0, 10);
      expect(within3km.map((r) => r.riderId)).not.toContain('rider-delta');

      const within6km = await redisCacheService.getNearestRiders(hubLat, hubLng, 6.0, 10);
      expect(within6km.map((r) => r.riderId)).toContain('rider-delta');
    });
  });

  describe('2. Distributed Concurrency Lock (Double-Assignment Prevention)', () => {
    it('grants lock to first courier and denies simultaneous competitor', async () => {
      const lockKey = 'order:accept:test-order-1';

      // Courier 1 clicks Accept
      const firstClaim = await redisCacheService.acquireLock(lockKey, 3000);
      expect(firstClaim).toBe(true);

      // Courier 2 clicks Accept 10ms later
      const secondClaim = await redisCacheService.acquireLock(lockKey, 3000);
      expect(secondClaim).toBe(false);

      // Courier 1 completes or aborts
      await redisCacheService.releaseLock(lockKey);

      // Now lock is freed
      const thirdClaim = await redisCacheService.acquireLock(lockKey, 3000);
      expect(thirdClaim).toBe(true);
      await redisCacheService.releaseLock(lockKey);
    });
  });

  describe('3. Dispatch Queue Metrics & State Tracking', () => {
    it('returns structured dispatch metrics', () => {
      const stats = dispatchEngineService.getDispatchStats();
      expect(stats).toHaveProperty('activeOffersCount');
      expect(stats).toHaveProperty('pendingCount');
      expect(stats).toHaveProperty('dlqCount');
      expect(Array.isArray(stats.offers)).toBe(true);
    });

    it('clears order timers safely on assignment without errors', () => {
      expect(() => {
        dispatchEngineService.clearOrderTimer('non-existent-order');
      }).not.toThrow();
    });
  });
});
