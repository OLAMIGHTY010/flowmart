/**
 * ============================================================================
 * UNIT TESTS: MULTI-STOP ROUTE OPTIMIZER (VEHICLE ROUTING PROBLEM - VRP)
 * ============================================================================
 */

import { routeOptimizerService, LocationWaypoint } from '../../services/logistics/route-optimizer.service';

describe('RouteOptimizerService (TSP Multi-Drop VRP)', () => {
  // Lagos Hub: Victoria Island Mega Plaza (6.4281, 3.4219)
  const hub: LocationWaypoint = {
    id: 'hub-vi',
    name: 'Mega Plaza Hub, VI',
    latitude: 6.4281,
    longitude: 3.4219,
  };

  // 4 Delivery Drop-offs in Lagos:
  // Stop A: Oniru (very close to VI) -> (6.4350, 3.4410)
  // Stop B: Lekki Phase 1 -> (6.4474, 3.4723)
  // Stop C: Ikoyi (adjacent to VI) -> (6.4520, 3.4350)
  // Stop D: Ajah (further down expressway) -> (6.4674, 3.5623)
  const stops: LocationWaypoint[] = [
    { id: 'stop-d', name: 'Ajah Dropoff', latitude: 6.4674, longitude: 3.5623 },
    { id: 'stop-a', name: 'Oniru Dropoff', latitude: 6.4350, longitude: 3.4410 },
    { id: 'stop-c', name: 'Ikoyi Dropoff', latitude: 6.4520, longitude: 3.4350 },
    { id: 'stop-b', name: 'Lekki 1 Dropoff', latitude: 6.4474, longitude: 3.4723 },
  ];

  it('optimizes delivery sequence to minimize total distance traveled', () => {
    const res = routeOptimizerService.optimizeMultiStopRoute(hub, stops);

    expect(res.optimizedStops.length).toBe(4);
    expect(res.totalDistanceKm).toBeGreaterThan(0);
    // Optimized path should be less than or equal to unoptimized erratic order
    expect(res.totalDistanceKm).toBeLessThanOrEqual(res.unoptimizedDistanceKm);
    expect(res.estimatedTransitMinutes).toBeGreaterThan(0);
    expect(res.estimatedTotalTurnaroundMinutes).toBeGreaterThan(res.estimatedTransitMinutes);
    expect(res.legDistancesKm.length).toBe(4);
  });

  it('handles empty stops list gracefully', () => {
    const res = routeOptimizerService.optimizeMultiStopRoute(hub, []);
    expect(res.totalDistanceKm).toBe(0);
    expect(res.optimizedStops.length).toBe(0);
  });

  it('handles single stop directly without permutation', () => {
    const res = routeOptimizerService.optimizeMultiStopRoute(hub, [stops[0]]);
    expect(res.optimizedStops.length).toBe(1);
    expect(res.totalDistanceKm).toBeGreaterThan(0);
    expect(res.percentSavings).toBe(0);
  });
});
