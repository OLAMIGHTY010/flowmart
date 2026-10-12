/**
 * ============================================================================
 * INTEGRATION TESTS: HEALTH & APM TELEMETRY ROUTE
 * ============================================================================
 */

import request from 'supertest';
import express from 'express';
import healthRouter from '../../routes/health.routes';
import { observabilityMiddleware } from '../../middleware/observability.middleware';

// Mock DB execute
jest.mock('../../../db', () => ({
  db: {
    execute: jest.fn().mockResolvedValue([{ 1: 1 }]),
  },
}));

const app = express();
app.use(observabilityMiddleware);
app.use('/api/v1/health', healthRouter);

describe('GET /api/v1/health (System Vitals & Telemetry)', () => {
  it('returns comprehensive platform vitals, DB latency, memory and cache status', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body.database).toBeDefined();
    expect(res.body.database.status).toBe('HEALTHY');
    expect(res.body.cache).toBeDefined();
    expect(res.body.jobQueue).toBeDefined();
    expect(res.body.memory.heapUsedMb).toBeGreaterThan(0);
    expect(res.headers['x-request-id']).toBeDefined();
  });
});
