/**
 * ============================================================================
 * DATA ANALYSIS & VISUALIZATION CLIENT SERVICES
 * ============================================================================
 *
 * Types and API client functions for:
 * 1. Predictive Demand Trajectory & Price Elasticity
 * 2. 80/20 Pareto Matrix & BCG Growth-Share Quadrants
 * 3. Customer Cohort Retention Triangular Matrix & RFM Segments
 * 4. Hyper-Local Logistics & SLA Performance Heatmap
 * 5. Escrow Cash Flow Funnel & Liquidity Timeline
 * 6. "Ask Your Data" Conversational NLP Copilot
 *
 * @module frontend/src/services/DataVisualizationServices
 */

import { apiClient } from './api';

export interface DemandTrajectoryPoint {
  date: string;
  actualRevenue?: number;
  projectedRevenue?: number;
  lowerConfidenceBound?: number;
  upperConfidenceBound?: number;
  isProjected: boolean;
}

export interface PriceElasticityPoint {
  priceChangePercent: number;
  projectedUnits: number;
  projectedRevenue: number;
  projectedGrossMargin: number;
}

export interface DemandTrajectoryResponse {
  trajectory: DemandTrajectoryPoint[];
  elasticityPoints: PriceElasticityPoint[];
  summary: {
    projected30DayRevenue: number;
    demandGrowthRate: number;
    recommendedPriceAction: string;
  };
}

export interface ParetoProductItem {
  id: string;
  name: string;
  revenue: number;
  unitsSold: number;
  cumulativePercent: number;
  bcgQuadrant: 'STAR' | 'CASH_COW' | 'QUESTION_MARK' | 'STAGNANT';
  stockValue: number;
  marginPercent: number;
}

export interface ParetoMatrixResponse {
  paretoCurve: ParetoProductItem[];
  bcgSummary: {
    stars: number;
    cashCows: number;
    questionMarks: number;
    stagnant: number;
  };
  stats: {
    totalRevenue: number;
    totalUnits: number;
    vitalFewShareOfCatalog: number;
  };
}

export interface CohortRow {
  cohortMonth: string;
  newUsersCount: number;
  week1Retention: number;
  month1Retention: number;
  month2Retention: number;
  month3Retention: number;
}

export interface RfmSegmentItem {
  name: string;
  userCount: number;
  percentage: number;
  averageSpend: number;
  color: string;
}

export interface CohortRetentionResponse {
  cohorts: CohortRow[];
  rfmSegments: RfmSegmentItem[];
  platformStickinessRate: number;
}

export interface ZoneSlaItem {
  zone: string;
  avgDeliveryMinutes: number;
  avgMin: number;
  slaAdherencePercent: number;
  sla: number;
  deliveredOrders: number;
  delivered: number;
  cancelledOrders: number;
  cancelled: number;
  activeRiders: number;
  riders: number;
  status: 'OPTIMAL' | 'MODERATE' | 'CONGESTED';
}

export interface LogisticsSlaResponse {
  zones: ZoneSlaItem[];
  summary: {
    totalDelivered: number;
    avgPlatformSla: number;
    topPerformingZone: string;
    bottleneckZone: string;
  };
}

export interface EscrowFunnelStage {
  stage: string;
  count: number;
  volumeNgn: number;
  conversionPercent: number;
}

export interface EscrowTimelinePoint {
  day: string;
  lockedEscrowNgn: number;
  releasedDisbursedNgn: number;
}

export interface EscrowFunnelResponse {
  funnel: EscrowFunnelStage[];
  timeline: EscrowTimelinePoint[];
  currentLockedLiquidity: number;
  disputeEscalationRate: number;
}

export interface AskDataCopilotResponse {
  answer: string;
  suggestedChartType: 'AREA_CHART' | 'BAR_CHART' | 'HEATMAP' | 'KPI_METRIC';
  chartData: any[];
  keyMetrics: { label: string; value: string | number }[];
  followUpQuestions: string[];
}

export const DataVisualizationServices = {
  /**
   * 1. Fetch 30-day historical + 14-day Holt forecast & price elasticity
   */
  async getDemandTrajectory(vendorId?: string): Promise<DemandTrajectoryResponse> {
    const params = vendorId ? { vendorId } : {};
    const res = await apiClient.get<{ success: boolean; data: DemandTrajectoryResponse }>(
      '/analytics/demand-trajectory',
      { params }
    );
    return res.data;
  },

  /**
   * 2. Fetch 80/20 Pareto revenue distribution and BCG matrix
   */
  async getParetoMatrix(vendorId?: string): Promise<ParetoMatrixResponse> {
    const params = vendorId ? { vendorId } : {};
    const res = await apiClient.get<{ success: boolean; data: ParetoMatrixResponse }>(
      '/analytics/pareto-matrix',
      { params }
    );
    return res.data;
  },

  /**
   * 3. Fetch user cohort retention matrix and RFM customer segmentation
   */
  async getCohortRetention(): Promise<CohortRetentionResponse> {
    const res = await apiClient.get<{ success: boolean; data: CohortRetentionResponse }>(
      '/analytics/cohort-retention'
    );
    return res.data;
  },

  /**
   * 4. Fetch hyper-local logistics SLA turnaround heatmap
   */
  async getLogisticsSla(): Promise<LogisticsSlaResponse> {
    const res = await apiClient.get<{ success: boolean; data: LogisticsSlaResponse }>(
      '/analytics/logistics-sla'
    );
    return res.data;
  },

  /**
   * 5. Fetch escrow payment pipeline funnel and liquidity release timeline
   */
  async getEscrowFunnel(): Promise<EscrowFunnelResponse> {
    const res = await apiClient.get<{ success: boolean; data: EscrowFunnelResponse }>(
      '/analytics/escrow-funnel'
    );
    return res.data;
  },

  /**
   * 6. Query natural language conversational analytics copilot
   */
  async askDataCopilot(query: string): Promise<AskDataCopilotResponse> {
    const res = await apiClient.post<{ success: boolean; data: AskDataCopilotResponse }>(
      '/analytics/ask-data',
      { query }
    );
    return res.data;
  },
};
