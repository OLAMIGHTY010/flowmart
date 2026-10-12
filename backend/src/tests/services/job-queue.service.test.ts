/**
 * ============================================================================
 * UNIT TESTS: BACKGROUND JOB QUEUE & ASYNC TASK SCHEDULER
 * ============================================================================
 */

import { jobQueueService } from '../../services/infrastructure/job-queue.service';

describe('Background Job Queue Service', () => {
  afterAll(() => {
    jobQueueService.stopWorker();
  });

  describe('1. Escrow Auto-Release Scheduling', () => {
    it('schedules escrow release task with payload and delayed timestamp', () => {
      const job = jobQueueService.scheduleEscrowAutoRelease('ord-999', 'vend-123', 75000, 3600);

      expect(job.id).toContain('escrow-ord-999');
      expect(job.type).toBe('ESCROW_RELEASE');
      expect(job.payload.amount).toBe(75000);
      expect(job.status).toBe('QUEUED');
      expect(job.scheduledFor).toBeGreaterThan(Date.now());
    });
  });

  describe('2. Notification Retry Queue', () => {
    it('enqueues notification with exponential backoff delay', () => {
      const job = jobQueueService.enqueueNotificationRetry('SMS', '2348012345678', 'Test Alert', 2);

      expect(job.type).toBe('NOTIFICATION_RETRY');
      expect(job.attempts).toBe(2);
      expect(job.status).toBe('QUEUED');
      expect(job.scheduledFor).toBeGreaterThan(Date.now());
    });
  });

  describe('3. Worker Execution & Stats', () => {
    it('tracks queue statistics accurately', () => {
      const stats = jobQueueService.getStats();
      expect(stats.totalJobs).toBeGreaterThan(0);
      expect(stats.queued).toBeGreaterThanOrEqual(1);
    });

    it('processes due jobs immediately when scheduled timestamp is reached', async () => {
      // Create a job scheduled for past/now
      const batchJob = jobQueueService.enqueueNightlyBatch('HOLT_DEMAND');
      expect(batchJob.status).toBe('QUEUED');

      const processed = await jobQueueService.processDueJobs();
      expect(processed).toBeGreaterThanOrEqual(1);

      const updated = jobQueueService.getJob(batchJob.id);
      expect(updated?.status).toBe('COMPLETED');
    });
  });
});
