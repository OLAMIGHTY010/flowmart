/**
 * ============================================================================
 * ADVANCED DATA ANALYSIS & VISUALIZATION ROUTES
 * ============================================================================
 *
 * Base Path: /api/v1/analytics
 *
 * Exposes:
 * - Predictive Demand Trajectory & Price Elasticity
 * - 80/20 Pareto Matrix & BCG Quadrants
 * - Customer Cohort Retention & RFM Segments
 * - Hyper-Local Logistics & SLA Performance
 * - Escrow Cash Flow Funnel & Locked Liquidity
 * - "Ask Your Data" Conversational NLP Copilot
 *
 * @module backend/src/routes/analytics.routes
 */

import { Router } from 'express';
import { getDashboardStats } from '../controllers/admin.controller';
import {
  getUserDashboardStats,
  getDemandTrajectoryAnalytics,
  getParetoMatrixAnalytics,
  getCohortRetentionAnalytics,
  getLogisticsSlaAnalytics,
  getEscrowCashFlowAnalytics,
  handleAskYourDataCopilot,
} from '../controllers/analytics.controller';
import { authenticateJWT, authorizeRoles, optionalAuthenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// Base Dashboard Statistics
router.get('/', authenticateJWT, authorizeRoles('super_admin', 'admin'), getDashboardStats);
router.get('/me', authenticateJWT, getUserDashboardStats);

// 1. Predictive Demand Trajectory & Elasticity
router.get('/demand-trajectory', optionalAuthenticateJWT, getDemandTrajectoryAnalytics);

// 2. 80/20 Pareto Matrix & BCG Growth-Share Quadrants
router.get('/pareto-matrix', optionalAuthenticateJWT, getParetoMatrixAnalytics);

// 3. Customer Cohort Retention & RFM Segmentation
router.get('/cohort-retention', authenticateJWT, authorizeRoles('admin', 'super_admin', 'regional_manager'), getCohortRetentionAnalytics);

// 4. Hyper-Local Logistics & SLA Heatmap
router.get('/logistics-sla', optionalAuthenticateJWT, getLogisticsSlaAnalytics);

// 5. Escrow Cash Flow Funnel & Liquidity Timeline
router.get('/escrow-funnel', authenticateJWT, authorizeRoles('admin', 'super_admin', 'finance', 'auditor'), getEscrowCashFlowAnalytics);

// 6. "Ask Your Data" Conversational Analytics Copilot
router.post('/ask-data', optionalAuthenticateJWT, handleAskYourDataCopilot);

export default router;
