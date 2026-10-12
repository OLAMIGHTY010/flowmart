/**
 * ============================================================================
 * INTEGRATION TESTS: ANALYTICS VISUALIZATION HTTP ROUTES
 * ============================================================================
 *
 * Validates endpoint mounting and access control:
 * 1. GET /api/v1/analytics/demand-trajectory
 * 2. GET /api/v1/analytics/pareto-matrix
 * 3. GET /api/v1/analytics/cohort-retention (requires admin/manager role)
 * 4. GET /api/v1/analytics/logistics-sla
 * 5. GET /api/v1/analytics/escrow-funnel (requires admin/finance role)
 * 6. POST /api/v1/analytics/ask-data
 */

import request from 'supertest';
import express from 'express';
import analyticsRouter from '../../routes/analytics.routes';

// Mock DB
jest.mock('../../../db', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([]),
  },
}));

// Mock auth middleware
jest.mock('../../middleware/auth.middleware', () => ({
  authenticateJWT: (req: any, res: any, next: any) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access token missing' });
    }
    const token = header.split(' ')[1];
    if (token === 'admin-token') {
      req.user = { id: 'admin-id', role: 'admin' };
    } else if (token === 'vendor-token') {
      req.user = { id: 'vendor-id', role: 'vendor' };
    } else if (token === 'customer-token') {
      req.user = { id: 'user-id', role: 'customer' };
    } else {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    next();
  },
  optionalAuthenticateJWT: (req: any, res: any, next: any) => {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      const token = header.split(' ')[1];
      if (token === 'vendor-token') req.user = { id: 'vendor-id', role: 'vendor' };
      if (token === 'admin-token') req.user = { id: 'admin-id', role: 'admin' };
    }
    next();
  },
  authorizeRoles: (...allowedRoles: string[]) => (req: any, res: any, next: any) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
  },
}));

// Mock Controllers
jest.mock('../../controllers/analytics.controller', () => ({
  getUserDashboardStats: (req: any, res: any) => res.status(200).json({ success: true }),
  getDemandTrajectoryAnalytics: (req: any, res: any) =>
    res.status(200).json({ success: true, data: { trajectory: [], elasticityPoints: [] } }),
  getParetoMatrixAnalytics: (req: any, res: any) =>
    res.status(200).json({ success: true, data: { paretoCurve: [], bcgSummary: {} } }),
  getCohortRetentionAnalytics: (req: any, res: any) =>
    res.status(200).json({ success: true, data: { cohorts: [], rfmSegments: [] } }),
  getLogisticsSlaAnalytics: (req: any, res: any) =>
    res.status(200).json({ success: true, data: { zones: [], summary: {} } }),
  getEscrowCashFlowAnalytics: (req: any, res: any) =>
    res.status(200).json({ success: true, data: { funnel: [], timeline: [] } }),
  handleAskYourDataCopilot: (req: any, res: any) =>
    res.status(200).json({ success: true, data: { answer: 'Analytics response', suggestedChartType: 'AREA_CHART' } }),
}));

jest.mock('../../controllers/admin.controller', () => ({
  getDashboardStats: (req: any, res: any) => res.status(200).json({ success: true }),
}));

const app = express();
app.use(express.json());
app.use('/api/v1/analytics', analyticsRouter);

describe('Analytics Visualization Routes Integration', () => {
  describe('GET /api/v1/analytics/demand-trajectory', () => {
    it('accessible without token or with optional auth', async () => {
      const res = await request(app).get('/api/v1/analytics/demand-trajectory');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.trajectory).toBeDefined();
    });

    it('passes authenticated vendor credentials', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/demand-trajectory')
        .set('Authorization', 'Bearer vendor-token');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/analytics/pareto-matrix', () => {
    it('returns Pareto and BCG matrix analysis', async () => {
      const res = await request(app).get('/api/v1/analytics/pareto-matrix');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.paretoCurve).toBeDefined();
    });
  });

  describe('GET /api/v1/analytics/cohort-retention', () => {
    it('blocks unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/analytics/cohort-retention');
      expect(res.status).toBe(401);
    });

    it('blocks regular customers with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/cohort-retention')
        .set('Authorization', 'Bearer customer-token');
      expect(res.status).toBe(403);
    });

    it('allows admin access with 200 OK', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/cohort-retention')
        .set('Authorization', 'Bearer admin-token');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/analytics/logistics-sla', () => {
    it('returns hyper-local logistics SLA data', async () => {
      const res = await request(app).get('/api/v1/analytics/logistics-sla');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.zones).toBeDefined();
    });
  });

  describe('GET /api/v1/analytics/escrow-funnel', () => {
    it('blocks unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/analytics/escrow-funnel');
      expect(res.status).toBe(401);
    });

    it('allows admin role with 200 OK', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/escrow-funnel')
        .set('Authorization', 'Bearer admin-token');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.funnel).toBeDefined();
    });
  });

  describe('POST /api/v1/analytics/ask-data', () => {
    it('successfully processes natural language analytics question', async () => {
      const res = await request(app)
        .post('/api/v1/analytics/ask-data')
        .send({ query: 'What was our best performing category this month?' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.answer).toBeDefined();
      expect(res.body.data.suggestedChartType).toBe('AREA_CHART');
    });
  });
});
