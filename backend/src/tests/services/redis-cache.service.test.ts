/**
 * ============================================================================
 * UNIT TESTS: REDIS CACHE, GEOSPATIAL DISPATCH & DISTRIBUTED LOCKS
 * ============================================================================
 */

import { redisCacheService } from '../../services/infrastructure/redis-cache.service';

describe('Redis Cache & Geospatial Dispatch Service', () => {
  beforeEach(async () => {
    await redisCacheService.delete('test:sample');
    await redisCacheService.releaseLock('test-product');
  });

  describe('1. Key-Value Caching with TTL', () => {
    it('sets and retrieves values correctly', async () => {
      await redisCacheService.set('test:sample', { name: 'FlowMart', rate: 4.8 }, 60);
      const val = await redisCacheService.get('test:sample');
      expect(val).toEqual({ name: 'FlowMart', rate: 4.8 });
    });

    it('returns null for nonexistent or deleted keys', async () => {
      await redisCacheService.set('test:to-delete', 'temp', 60);
      await redisCacheService.delete('test:to-delete');
      const val = await redisCacheService.get('test:to-delete');
      expect(val).toBeNull();
    });
  });

  describe('2. Geospatial Rider Dispatch Indexing', () => {
    it('indexes rider locations and finds nearest riders within radius', async () => {
      // Lagos Coordinates: Victoria Island (6.4281, 3.4219)
      // Rider 1: Lekki Phase 1 (~2.5km) -> (6.4474, 3.4723)
      // Rider 2: Ikeja (~18km) -> (6.6018, 3.3515)
      await redisCacheService.updateRiderLocation('rider-lekki', 6.4474, 3.4723);
      await redisCacheService.updateRiderLocation('rider-ikeja', 6.6018, 3.3515);

      const viLat = 6.4281;
      const viLng = 3.4219;

      // Search within 5km of VI
      const nearby = await redisCacheService.getNearestRiders(viLat, viLng, 6, 5);

      expect(nearby.length).toBeGreaterThanOrEqual(1);
      expect(nearby[0].riderId).toBe('rider-lekki');
      expect(nearby[0].distanceKm).toBeLessThan(6);

      // Verify that Ikeja rider is NOT within 6km
      const ikejaFound = nearby.find((r) => r.riderId === 'rider-ikeja');
      expect(ikejaFound).toBeUndefined();
    });
  });

  describe('3. Distributed Concurrency Locks (Redlock pattern)', () => {
    it('acquires lock exclusively and prevents duplicate claims', async () => {
      const lock1 = await redisCacheService.acquireLock('flash-sale-ps5', 3000);
      expect(lock1).toBe(true);

      // Simultaneous attempt must be rejected
      const lock2 = await redisCacheService.acquireLock('flash-sale-ps5', 3000);
      expect(lock2).toBe(false);

      // Release lock and re-attempt
      await redisCacheService.releaseLock('flash-sale-ps5');
      const lock3 = await redisCacheService.acquireLock('flash-sale-ps5', 3000);
      expect(lock3).toBe(true);
      await redisCacheService.releaseLock('flash-sale-ps5');
    });
  });
});
