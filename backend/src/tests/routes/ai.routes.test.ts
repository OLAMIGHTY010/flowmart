/**
 * ============================================================================
 * INTEGRATION TESTS: AI & MACHINE LEARNING HTTP ROUTES
 * ============================================================================
 */

import request from 'supertest';
import express from 'express';
import aiRouter from '../../routes/ai.routes';

// Mock DB
jest.mock('../../../db', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockResolvedValue([]),
  },
}));

// Mock auth middleware for testing RBAC and JWT guards
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
    } else if (token === 'user-token') {
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
      if (token === 'user-token') req.user = { id: 'user-id', role: 'customer' };
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

// Mock AI Controller responses
jest.mock('../../controllers/ai.controller', () => ({
  processShoppingQuery: (req: any, res: any) =>
    res.status(200).json({ success: true, data: { reply: 'Welcome to FlowMart' } }),
  getPersonalizedFeed: (req: any, res: any) =>
    res.status(200).json({ success: true, data: [] }),
  getFrequentlyBought: (req: any, res: any) =>
    res.status(200).json({ success: true, data: { primaryProduct: { id: req.params.productId } } }),
  getRelated: (req: any, res: any) =>
    res.status(200).json({ success: true, data: [] }),
  handleSemanticSearch: (req: any, res: any) =>
    res.status(200).json({ success: true, data: { query: req.query.q, matches: [] } }),
  handleMerchantGenerateListing: (req: any, res: any) =>
    res.status(200).json({ success: true, data: { optimizedTitle: 'Smart Listing' } }),
  handleMerchantPricingAdvisor: (req: any, res: any) =>
    res.status(200).json({ success: true, data: { optimalPrice: 8500 } }),
  handleProductDemandForecast: (req: any, res: any) =>
    res.status(200).json({ success: true, data: { productId: req.params.productId } }),
  handleInventoryHealth: (req: any, res: any) =>
    res.status(200).json({ success: true, data: { healthyCount: 10 } }),
  handleAnalyzeReviewSentiment: (req: any, res: any) =>
    res.status(200).json({ success: true, data: { label: 'POSITIVE' } }),
  handleProductReviewSummary: (req: any, res: any) =>
    res.status(200).json({ success: true, data: { verdict: 'Excellent' } }),
  handleAssessOrderRisk: (req: any, res: any) =>
    res.status(200).json({ success: true, data: { riskScore: 10 } }),
  handleGetFraudAuditList: (req: any, res: any) =>
    res.status(200).json({ success: true, data: [] }),
}));

const app = express();
app.use(express.json());
app.use('/api/v1/ai', aiRouter);

describe('AI Routing & HTTP Security Layer', () => {
  it('POST /api/v1/ai/chat is accessible by guest users', async () => {
    const res = await request(app)
      .post('/api/v1/ai/chat')
      .send({ messages: [{ role: 'user', content: 'Hi' }] });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/v1/ai/search/semantic is publicly accessible', async () => {
    const res = await request(app).get('/api/v1/ai/search/semantic?q=shoes');
    expect(res.status).toBe(200);
  });

  it('GET /api/v1/ai/recommendations/frequently-bought-together/:productId is publicly accessible', async () => {
    const res = await request(app).get('/api/v1/ai/recommendations/frequently-bought-together/prod-123');
    expect(res.status).toBe(200);
  });

  it('POST /api/v1/ai/merchant/generate-listing rejects unauthenticated users (401)', async () => {
    const res = await request(app)
      .post('/api/v1/ai/merchant/generate-listing')
      .send({ title: 'New Shoes' });
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/ai/merchant/generate-listing rejects non-vendor roles (403)', async () => {
    const res = await request(app)
      .post('/api/v1/ai/merchant/generate-listing')
      .set('Authorization', 'Bearer user-token') // role: customer
      .send({ title: 'New Shoes' });
    expect(res.status).toBe(403);
  });

  it('POST /api/v1/ai/merchant/generate-listing succeeds for vendor role (200)', async () => {
    const res = await request(app)
      .post('/api/v1/ai/merchant/generate-listing')
      .set('Authorization', 'Bearer vendor-token') // role: vendor
      .send({ title: 'New Shoes' });
    expect(res.status).toBe(200);
    expect(res.body.data.optimizedTitle).toBe('Smart Listing');
  });

  it('GET /api/v1/ai/fraud/flagged-orders forbids regular users (403)', async () => {
    const res = await request(app)
      .get('/api/v1/ai/fraud/flagged-orders')
      .set('Authorization', 'Bearer user-token');
    expect(res.status).toBe(403);
  });

  it('GET /api/v1/ai/fraud/flagged-orders allows admin access (200)', async () => {
    const res = await request(app)
      .get('/api/v1/ai/fraud/flagged-orders')
      .set('Authorization', 'Bearer admin-token');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
