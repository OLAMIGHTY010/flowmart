import { z } from 'zod';

export const openDisputeSchema = z.object({
  escrowId: z.string().min(1, 'Escrow ID is required'),
  reason: z.string().min(5, 'Dispute reason must be at least 5 characters'),
  evidenceUrls: z.array(z.string().url('Invalid evidence URL')).optional(),
});

export const resolveDisputeSchema = z.object({
  resolution: z.enum(['refund_buyer', 'pay_vendor']),
  notes: z.string().optional(),
});
