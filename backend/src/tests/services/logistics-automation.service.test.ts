import { logisticsAutomationService } from '../../services/automation/logistics-automation.service';

describe('LogisticsAutomationService', () => {
  beforeEach(() => {
    logisticsAutomationService.clearAll();
  });

  afterAll(() => {
    logisticsAutomationService.stopCascadeMonitor();
  });

  it('should find nearby candidates sorted by distance', () => {
    const candidates = logisticsAutomationService.findNearbyCandidates(6.5244, 3.3792, 10);
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].distanceKm).toBeLessThanOrEqual(candidates[1]?.distanceKm ?? 99);
  });

  it('should initiate dispatch cascade and offer to nearest rider', () => {
    const session = logisticsAutomationService.initiateRiderDispatch(
      'order-101',
      { lat: 6.5244, lng: 3.3792 },
      { lat: 6.6018, lng: 3.3515 },
      30000,
      1.1
    );

    expect(session.dispatchId).toBeDefined();
    expect(session.status).toBe('PENDING');
    expect(session.currentCandidateIndex).toBe(0);
    expect(session.history.length).toBe(1);
    expect(session.history[0].action).toBe('OFFERED');

    const rider1 = session.candidates[0].riderId;
    const activeOffer = logisticsAutomationService.getActiveOfferForRider(rider1);
    expect(activeOffer.hasOffer).toBe(true);
    expect(activeOffer.dispatchId).toBe(session.dispatchId);
  });

  it('should assign order when offered rider accepts', () => {
    const session = logisticsAutomationService.initiateRiderDispatch(
      'order-102',
      { lat: 6.5244, lng: 3.3792 },
      { lat: 6.6018, lng: 3.3515 }
    );

    const rider1 = session.candidates[0].riderId;
    const result = logisticsAutomationService.handleRiderResponse(
      session.dispatchId,
      rider1,
      'ACCEPT'
    );

    expect(result.success).toBe(true);
    expect(result.session.status).toBe('ACCEPTED');
    expect(result.session.assignedRiderId).toBe(rider1);
  });

  it('should cascade to next candidate when rider declines', () => {
    const session = logisticsAutomationService.initiateRiderDispatch(
      'order-103',
      { lat: 6.5244, lng: 3.3792 },
      { lat: 6.6018, lng: 3.3515 }
    );

    const rider1 = session.candidates[0].riderId;
    const result = logisticsAutomationService.handleRiderResponse(
      session.dispatchId,
      rider1,
      'DECLINE'
    );

    expect(result.success).toBe(true);
    expect(result.session.currentCandidateIndex).toBe(1);
    expect(result.session.status).toBe('PENDING');
  });

  it('should auto-cascade on tick if offer timeout elapsed', () => {
    const session = logisticsAutomationService.initiateRiderDispatch(
      'order-104',
      { lat: 6.5244, lng: 3.3792 },
      { lat: 6.6018, lng: 3.3515 }
    );

    // Artificially age the offer started timestamp
    session.currentOfferStartedAt = Date.now() - 50 * 1000; // 50s ago (> 45s)

    const cascaded = logisticsAutomationService.tickCascadeEvaluator();
    expect(cascaded).toBe(1);
    expect(session.currentCandidateIndex).toBe(1);
  });

  it('should provide aggregate admin metrics', () => {
    logisticsAutomationService.initiateRiderDispatch(
      'order-105',
      { lat: 6.5244, lng: 3.3792 },
      { lat: 6.6018, lng: 3.3515 }
    );

    const metrics = logisticsAutomationService.getAdminLogisticsMetrics();
    expect(metrics.activeSessions).toBe(1);
    expect(metrics.pendingCount).toBe(1);
  });
});
