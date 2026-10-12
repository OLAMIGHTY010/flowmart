/**
 * ============================================================================
 * INTEGRATION TESTS: AUTOMATION ROUTES (ALL 4 BODIES)
 * ============================================================================
 */

import request from 'supertest';
import express from 'express';
import automationRouter from '../../routes/automation.routes';

const app = express();
app.use(express.json());
app.use('/api/v1/automation', automationRouter);

describe('Automation API Routes Integration', () => {
  describe('Vendor Routes', () => {
    it('GET /api/v1/automation/vendor/inventory-alerts returns 200 with alerts', async () => {
      const res = await request(app).get('/api/v1/automation/vendor/inventory-alerts?vendorId=v-test');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.alerts)).toBe(true);
    });

    it('GET /api/v1/automation/vendor/payouts returns 200 with statement', async () => {
      const res = await request(app).get('/api/v1/automation/vendor/payouts?vendorId=v-test');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.statement).toBeDefined();
    });

    it('GET /api/v1/automation/vendor/cart-recovery returns 200 with metrics', async () => {
      const res = await request(app).get('/api/v1/automation/vendor/cart-recovery?vendorId=v-test');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.metrics).toBeDefined();
    });
  });

  describe('Rider Routes', () => {
    it('GET /api/v1/automation/rider/active-offer returns 200 with offer object', async () => {
      const res = await request(app).get('/api/v1/automation/rider/active-offer?riderId=rider-lagos-01');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.offer).toBeDefined();
    });

    it('POST /api/v1/automation/rider/respond returns 400 when missing fields', async () => {
      const res = await request(app)
        .post('/api/v1/automation/rider/respond')
        .send({ dispatchId: 'invalid' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('User / Buyer Routes', () => {
    it('POST /api/v1/automation/user/dispute/arbitrate auto-settles valid dispute', async () => {
      const res = await request(app)
        .post('/api/v1/automation/user/dispute/arbitrate')
        .send({
          disputeId: 'disp-route-01',
          orderId: 'order-route-01',
          claimAmountNgn: 4500,
          claimReason: 'DAMAGED_PACKAGE',
          buyerTrustScore: 0.95,
          buyerLifetimeDisputes: 0,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.resolution.resolutionType).toBe('AUTO_RESOLVED_MICRO');
    });

    it('POST /api/v1/automation/user/currency/convert returns converted amount', async () => {
      const res = await request(app)
        .post('/api/v1/automation/user/currency/convert')
        .send({
          amount: 50000,
          from: 'NGN',
          to: 'USD',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.conversion.convertedAmount).toBeGreaterThan(0);
    });

    it('POST /api/v1/automation/user/diaspora/quote returns quote with custom message', async () => {
      const res = await request(app)
        .post('/api/v1/automation/user/diaspora/quote')
        .send({
          cartTotalNgn: 75000,
          buyerCurrency: 'USD',
          recipientCity: 'Lagos',
          giftMessage: 'From Uncle Tunde',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.quote.giftMessage).toBe('From Uncle Tunde');
    });
  });

  describe('Admin Control Plane Routes', () => {
    it('GET /api/v1/automation/admin/dashboard returns 200 with platform metrics', async () => {
      const res = await request(app).get('/api/v1/automation/admin/dashboard');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.metrics.logistics).toBeDefined();
      expect(res.body.metrics.payouts).toBeDefined();
    });

    it('POST /api/v1/automation/admin/heartbeat triggers autonomous cycle', async () => {
      const res = await request(app).post('/api/v1/automation/admin/heartbeat');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.heartbeat.heartbeatAt).toBeDefined();
    });

    it('POST /api/v1/automation/admin/dispute/threshold updates micro-threshold', async () => {
      const res = await request(app)
        .post('/api/v1/automation/admin/dispute/threshold')
        .send({ thresholdNgn: 6000 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.newThresholdNgn).toBe(6000);
    });
  });
});
