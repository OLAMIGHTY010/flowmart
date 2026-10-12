/**
 * ============================================================================
 * UNIT TESTS: ANALYTICS VISUALIZATION CONTROLLER
 * ============================================================================
 *
 * Covers:
 * - getDemandTrajectoryAnalytics
 * - getParetoMatrixAnalytics
 * - getCohortRetentionAnalytics
 * - getLogisticsSlaAnalytics
 * - getEscrowCashFlowAnalytics
 * - handleAskYourDataCopilot
 */

import {
  getDemandTrajectoryAnalytics,
  getParetoMatrixAnalytics,
  getCohortRetentionAnalytics,
  getLogisticsSlaAnalytics,
  getEscrowCashFlowAnalytics,
  handleAskYourDataCopilot,
} from '../../controllers/analytics.controller';

// Mock DB to avoid unhandled DB calls if any are invoked directly
jest.mock('../../../db', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([]),
  },
}));

// Mock the visualization service functions
jest.mock('../../services/analytics/data-visualization.service', () => ({
  getPredictiveDemandTrajectory: jest.fn().mockResolvedValue({
    trajectory: [{ date: '2026-10-12', actualRevenue: 45000, isProjected: false }],
    elasticityPoints: [{ priceChangePercent: 0, projectedUnits: 100, projectedRevenue: 500000, projectedGrossMargin: 20 }],
    summary: { projected30DayRevenue: 1500000, demandGrowthRate: 4.5, recommendedPriceAction: 'Optimal pricing' },
  }),
  getParetoCategoryAnalysis: jest.fn().mockResolvedValue({
    paretoCurve: [{ id: 'p1', name: 'Product A', revenue: 100000, unitsSold: 10, cumulativePercent: 50, bcgQuadrant: 'STAR', stockValue: 50000, marginPercent: 25 }],
    bcgSummary: { stars: 1, cashCows: 0, questionMarks: 0, stagnant: 0 },
    stats: { totalRevenue: 100000, totalUnits: 10, vitalFewShareOfCatalog: 20 },
  }),
  getCohortRetentionAnalysis: jest.fn().mockResolvedValue({
    cohorts: [{ cohortMonth: 'May 2026', newUsersCount: 1420, week1Retention: 72, month1Retention: 54, month2Retention: 42, month3Retention: 38 }],
    rfmSegments: [{ name: 'Champions', userCount: 2000, percentage: 20, averageSpend: 150000, color: '#16a34a' }],
    platformStickinessRate: 46.5,
  }),
  getLogisticsSlaHeatmap: jest.fn().mockResolvedValue({
    zones: [{ zone: 'Lekki', avgDeliveryMinutes: 18, avgMin: 18, slaAdherencePercent: 96, sla: 96, deliveredOrders: 4000, delivered: 4000, cancelledOrders: 50, cancelled: 50, activeRiders: 40, riders: 40, status: 'OPTIMAL' }],
    summary: { totalDelivered: 4000, avgPlatformSla: 96, topPerformingZone: 'Lekki', bottleneckZone: 'PH' },
  }),
  getEscrowCashFlowFunnel: jest.fn().mockResolvedValue({
    funnel: [{ stage: 'Checkout Initiated', count: 1000, volumeNgn: 5000000, conversionPercent: 100 }],
    timeline: [{ day: 'Mon', lockedEscrowNgn: 45000000, releasedDisbursedNgn: 38000000 }],
    currentLockedLiquidity: 45000000,
    disputeEscalationRate: 1.2,
  }),
  askYourDataCopilot: jest.fn().mockResolvedValue({
    answer: 'Next month demand is projected to increase by 4.5%.',
    suggestedChartType: 'AREA_CHART',
    chartData: [{ date: '2026-10-12', value: 50000 }],
    keyMetrics: [{ label: 'Growth', value: '+4.5%' }],
    followUpQuestions: ['Which category drives this?'],
  }),
}));

describe('Analytics Visualization Controller', () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    mockReq = {
      user: undefined,
      query: {},
      body: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('getDemandTrajectoryAnalytics', () => {
    it('returns demand trajectory data successfully for platform admin', async () => {
      mockReq.user = { id: 'admin-1', role: 'admin' };
      await getDemandTrajectoryAnalytics(mockReq, resOrMock(mockRes));

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            trajectory: expect.any(Array),
            elasticityPoints: expect.any(Array),
          }),
        })
      );
    });

    it('scopes by vendorId when authenticated user is vendor', async () => {
      mockReq.user = { id: 'vendor-99', role: 'vendor' };
      const { getPredictiveDemandTrajectory } = require('../../services/analytics/data-visualization.service');

      await getDemandTrajectoryAnalytics(mockReq, resOrMock(mockRes));
      expect(getPredictiveDemandTrajectory).toHaveBeenCalledWith('vendor-99');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getParetoMatrixAnalytics', () => {
    it('returns 80/20 Pareto curve & BCG quadrants', async () => {
      await getParetoMatrixAnalytics(mockReq, resOrMock(mockRes));

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            paretoCurve: expect.any(Array),
            bcgSummary: expect.any(Object),
          }),
        })
      );
    });
  });

  describe('getCohortRetentionAnalytics', () => {
    it('returns cohort triangular matrix and RFM segments', async () => {
      await getCohortRetentionAnalytics(mockReq, resOrMock(mockRes));

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            cohorts: expect.any(Array),
            rfmSegments: expect.any(Array),
          }),
        })
      );
    });
  });

  describe('getLogisticsSlaAnalytics', () => {
    it('returns zone delivery turnaround and platform SLA', async () => {
      await getLogisticsSlaAnalytics(mockReq, resOrMock(mockRes));

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            zones: expect.any(Array),
            summary: expect.any(Object),
          }),
        })
      );
    });
  });

  describe('getEscrowCashFlowAnalytics', () => {
    it('returns escrow flow funnel and liquidity timeline', async () => {
      await getEscrowCashFlowAnalytics(mockReq, resOrMock(mockRes));

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            funnel: expect.any(Array),
            timeline: expect.any(Array),
          }),
        })
      );
    });
  });

  describe('handleAskYourDataCopilot', () => {
    it('returns structured natural language response and charts for valid query', async () => {
      mockReq.body = { query: 'What is our 14-day demand forecast?' };
      await handleAskYourDataCopilot(mockReq, resOrMock(mockRes));

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            answer: expect.any(String),
            suggestedChartType: 'AREA_CHART',
            chartData: expect.any(Array),
          }),
        })
      );
    });

    it('returns 400 bad request when query is missing or empty', async () => {
      mockReq.body = {};
      await handleAskYourDataCopilot(mockReq, resOrMock(mockRes));

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/query is required/i),
        })
      );
    });
  });
});

function resOrMock(res: any) {
  return res;
}
