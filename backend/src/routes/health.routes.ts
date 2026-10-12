/**
 * ============================================================================
 * SYSTEM HEALTH & TELEMETRY ROUTE
 * ============================================================================
 *
 * Base Path: /api/v1/health
 *
 * Reports:
 * - PostgreSQL Database connectivity and ping
 * - Redis / In-Memory cache engine status
 * - Background Job Queue backlog and stats
 * - Memory allocation (RSS, Heap in MB)
 * - Platform uptime and request latency metrics
 *
 * @module backend/src/routes/health.routes
 */

import { Router, Request, Response } from 'express';
import { db } from '../../db';
import { sql } from 'drizzle-orm';
import { redisCacheService } from '../services/infrastructure/redis-cache.service';
import { jobQueueService } from '../services/infrastructure/job-queue.service';
import { getTelemetryMetrics } from '../middleware/observability.middleware';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const startTime = Date.now();
  let dbStatus = 'HEALTHY';
  let dbLatencyMs = 0;

  try {
    const dbPingStart = Date.now();
    await db.execute(sql`SELECT 1`);
    dbLatencyMs = Date.now() - dbPingStart;
  } catch (err) {
    dbStatus = 'DEGRADED';
  }

  const mem = process.memoryUsage();
  const redisInfo = redisCacheService.getStatus();
  const queueStats = jobQueueService.getStats();
  const telemetry = getTelemetryMetrics();

  const healthReport = {
    status: dbStatus === 'HEALTHY' ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
    },
    cache: redisInfo,
    jobQueue: queueStats,
    telemetry,
    memory: {
      rssMb: Number((mem.rss / 1024 / 1024).toFixed(1)),
      heapUsedMb: Number((mem.heapUsed / 1024 / 1024).toFixed(1)),
      heapTotalMb: Number((mem.heapTotal / 1024 / 1024).toFixed(1)),
    },
    responseTimeMs: Date.now() - startTime,
  };

  const statusCode = dbStatus === 'HEALTHY' ? 200 : 503;
  return res.status(statusCode).json(healthReport);
});

export default router;
