/**
 * ============================================================================
 * UNIT TESTS: DATA VISUALIZATION SERVICE
 * ============================================================================
 *
 * Covers:
 * 1. Predictive Demand Trajectory & Elasticity Simulator
 * 2. 80/20 Pareto Matrix & BCG Growth-Share Quadrants
 * 3. Customer Cohort Retention Triangular Matrix & RFM Segmentation
 * 4. Hyper-Local Logistics & SLA Performance Heatmap
 * 5. Escrow Cash Flow Funnel & Liquidity Timeline
 * 6. "Ask Your Data" Conversational NLP Copilot
 */

import {
  getPredictiveDemandTrajectory,
  getParetoCategoryAnalysis,
  getCohortRetentionAnalysis,
  getLogisticsSlaHeatmap,
  getEscrowCashFlowFunnel,
  askYourDataCopilot,
} from '../../services/analytics/data-visualization.service';

// Mock DB module with fluent queue mock
jest.mock('../../../db', () => {
  let queue: any[] = [];
  const chain: any = {
    select: jest.fn(() => chain),
    from: jest.fn(() => chain),
    where: jest.fn(() => chain),
    innerJoin: jest.fn(() => chain),
    orderBy: jest.fn(() => chain),
    limit: jest.fn(() => chain),
    then: (resolve: any) => {
      const result = queue.length > 0 ? queue.shift() : [];
      return Promise.resolve(resolve(result));
    },
    __setQueue: (...items: any[]) => {
      queue = [...items];
    },
    __clearQueue: () => {
      queue = [];
    },
  };
  return { db: chain };
});

import { db } from '../../../db';
const mockDb = db as any;

describe('Data Visualization & Analytics Service', () => {
  beforeEach(() => {
    mockDb.__clearQueue();
  });

  describe('1. getPredictiveDemandTrajectory', () => {
    it('generates 30 historical days + 14 forecast days with upper/lower bounds', async () => {
      // Mock past orders
      mockDb.__setQueue([
        { totalAmount: '50000.00', createdAt: new Date() },
        { totalAmount: '75000.00', createdAt: new Date() },
      ]);

      const result = await getPredictiveDemandTrajectory('vendor-1');
      expect(result.trajectory.length).toBe(44); // 30 past + 14 future
      expect(result.priceElasticity.length).toBeGreaterThan(0);
      expect(result.metrics.projectedNext14DaysGmv).toBeGreaterThan(0);

      // Verify future points have confidence intervals
      const projectedPoints = result.trajectory.filter((p) => p.isProjected);
      expect(projectedPoints.length).toBe(14);
      expect(projectedPoints[0].upperConfidence).toBeGreaterThanOrEqual(projectedPoints[0].forecastRevenue!);
      expect(projectedPoints[0].lowerConfidence).toBeLessThanOrEqual(projectedPoints[0].forecastRevenue!);
    });
  });

  describe('2. getParetoCategoryAnalysis', () => {
    it('correctly calculates cumulative percentage curve and BCG quadrants', async () => {
      mockDb.__setQueue([
        { id: 'p1', name: 'Product A', price: '10000.00', stockQuantity: 20 },
        { id: 'p2', name: 'Product B', price: '5000.00', stockQuantity: 15 },
        { id: 'p3', name: 'Product C', price: '2000.00', stockQuantity: 10 },
      ]);

      const result = await getParetoCategoryAnalysis('vendor-1');
      expect(result.paretoProducts.length).toBe(3);
      // Sorted descending by revenue
      expect(result.paretoProducts[0].revenue).toBeGreaterThanOrEqual(result.paretoProducts[1].revenue);
      expect(result.paretoProducts[2].cumulativePercent).toBe(100);
      expect(['STAR', 'CASH_COW', 'QUESTION_MARK', 'STAGNANT']).toContain(result.paretoProducts[0].bcgQuadrant);
    });

    it('handles empty product catalog gracefully', async () => {
      mockDb.__setQueue([]);

      const result = await getParetoCategoryAnalysis('vendor-empty');
      expect(result.paretoProducts).toEqual([]);
      expect(result.paretoStats.vitalFewCount).toBe(0);
    });
  });

  describe('3. getCohortRetentionAnalysis', () => {
    it('returns cohort triangular retention matrix and RFM segments', async () => {
      mockDb.__setQueue([{ count: 8500 }]); // Total users

      const result = await getCohortRetentionAnalysis();
      expect(result.cohorts.length).toBeGreaterThan(0);
      expect(result.rfmSegments.length).toBe(4);
      expect(result.platformStickinessRate).toBeGreaterThan(0);

      // Verify RFM segment structure
      const champions = result.rfmSegments.find((s) => s.name.includes('Champions'));
      expect(champions).toBeDefined();
      expect(champions?.userCount).toBeGreaterThan(0);
    });
  });

  describe('4. getLogisticsSlaHeatmap', () => {
    it('returns zone delivery turnaround and platform SLA summary', async () => {
      const result = await getLogisticsSlaHeatmap();
      expect(result.zones.length).toBeGreaterThan(0);
      expect(result.summary.avgPlatformSla).toBeGreaterThan(70);
      expect(result.summary.topPerformingZone).toBeTruthy();

      const lekki = result.zones.find((z) => z.zone.includes('Lekki'));
      expect(lekki).toBeDefined();
      expect(lekki?.avgDeliveryMinutes).toBeLessThan(30);
    });
  });

  describe('5. getEscrowCashFlowFunnel', () => {
    it('returns transaction pipeline funnel and 7-day liquidity timeline', async () => {
      mockDb.__setQueue([{ count: 2100, sum: 65000000 }]);

      const result = await getEscrowCashFlowFunnel();
      expect(result.funnel.length).toBe(6);
      expect(result.funnel[0].stage).toContain('Checkout Initiated');
      expect(result.timeline.length).toBe(7);
      expect(result.currentLockedLiquidity).toBeGreaterThan(0);
      expect(result.disputeEscalationRate).toBeLessThan(10);
    });
  });

  describe('6. askYourDataCopilot', () => {
    it('answers forecasting inquiries with predictive chart data', async () => {
      mockDb.__setQueue([
        { totalAmount: '50000.00', createdAt: new Date() },
      ]);

      const res = await askYourDataCopilot('What is our projected GMV next month?');
      expect(res.headlineAnswer).toContain('predicts');
      expect(res.chartType).toBe('line');
      expect(res.chartData.length).toBeGreaterThan(0);
      expect(res.kpis.length).toBeGreaterThan(0);
    });

    it('answers Pareto and top-product queries with bar chart data', async () => {
      mockDb.__setQueue([
        { id: 'p1', name: 'Item 1', price: '10000.00', stockQuantity: 20 },
      ]);

      const res = await askYourDataCopilot('Show me our 80/20 pareto stars');
      expect(res.headlineAnswer).toContain('revenue');
      expect(res.chartType).toBe('bar');
      expect(res.recommendedAction).toBeTruthy();
    });

    it('answers logistics SLA inquiries with zone turnaround statistics', async () => {
      const res = await askYourDataCopilot('Which delivery zone has the fastest turnaround?');
      expect(res.headlineAnswer).toContain('SLA');
      expect(res.chartType).toBe('bar');
      expect(res.kpis.some((k) => k.label.includes('SLA'))).toBe(true);
    });

    it('answers escrow cash flow inquiries with liquidity and dispute metrics', async () => {
      mockDb.__setQueue([{ count: 100, sum: 5000000 }]);

      const res = await askYourDataCopilot('How much money is locked in escrow?');
      expect(res.headlineAnswer).toContain('escrow');
      expect(res.chartType).toBe('funnel');
      expect(res.kpis.some((k) => k.label.includes('Liquidity'))).toBe(true);
    });
  });
});
