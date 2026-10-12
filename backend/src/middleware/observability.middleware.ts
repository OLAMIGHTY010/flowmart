/**
 * ============================================================================
 * OBSERVABILITY, APM TELEMETRY & LATENCY PROFILING MIDDLEWARE
 * ============================================================================
 *
 * Provides:
 * 1. High-precision request latency profiling (X-Response-Time header)
 * 2. Correlation tracking (X-Request-Id header)
 * 3. Error telemetry capture & structured logging
 *
 * @module backend/src/middleware/observability.middleware
 */

import { Request, Response, NextFunction } from 'express';

export interface TelemetryMetrics {
  totalRequests: number;
  averageLatencyMs: number;
  statusCodes: Record<string, number>;
  slowQueriesCount: number;
}

const metrics: TelemetryMetrics = {
  totalRequests: 0,
  averageLatencyMs: 0,
  statusCodes: {},
  slowQueriesCount: 0,
};

let totalDurationAccumulated = 0;

export const observabilityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startHr = process.hrtime();
  const requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  res.setHeader('X-Request-Id', requestId as string);

  // Hook writeHead to inject X-Response-Time header before headers are committed
  const originalWriteHead = res.writeHead;
  res.writeHead = function (...args: any[]) {
    const diff = process.hrtime(startHr);
    const latencyMs = Number(((diff[0] * 1e3) + (diff[1] * 1e-6)).toFixed(2));
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${latencyMs}ms`);
    }
    return originalWriteHead.apply(res, args as any);
  };

  res.on('finish', () => {
    const diff = process.hrtime(startHr);
    const latencyMs = Number(((diff[0] * 1e3) + (diff[1] * 1e-6)).toFixed(2));

    metrics.totalRequests++;
    totalDurationAccumulated += latencyMs;
    metrics.averageLatencyMs = Number((totalDurationAccumulated / metrics.totalRequests).toFixed(2));

    const codeBucket = `${Math.floor(res.statusCode / 100)}xx`;
    metrics.statusCodes[codeBucket] = (metrics.statusCodes[codeBucket] || 0) + 1;

    if (latencyMs > 500) {
      metrics.slowQueriesCount++;
    }
  });

  next();
};

export const getTelemetryMetrics = (): TelemetryMetrics => ({ ...metrics });
