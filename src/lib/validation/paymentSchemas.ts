/**
 * Payment Validation Schemas - Phase 3 Step 6
 * Zod schemas for validating payment-related data structures.
 */

import { z } from 'zod';

export const createCheckoutSessionSchema = z.object({
  ideaId: z.string().uuid('Invalid idea ID format'),
  tier: z.enum(['good', 'better', 'best'], {
    errorMap: () => ({ message: 'Tier must be good, better, or best' }),
  }),
  packageId: z.string().min(1, 'Package ID is required'),
});

export const stripeWebhookEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.any(),
  }),
});

export const paymentSessionSchema = z.object({
  session_id: z.string(),
  idea_id: z.string().uuid(),
  proposal_scope_id: z.string().uuid(),
  client_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  tier: z.enum(['good', 'better', 'best']),
  package_id: z.string(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  status: z.enum(['pending', 'completed', 'failed']),
});

export const paymentRecordSchema = z.object({
  session_id: z.string(),
  payment_intent_id: z.string(),
  idea_id: z.string().uuid(),
  client_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  tier: z.enum(['good', 'better', 'best']),
  package_id: z.string(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  status: z.enum(['succeeded', 'failed', 'refunded']),
  customer_email: z.string().email().optional(),
  paid_at: z.string().datetime(),
});

export function validateCheckoutSession(data: unknown) {
  return createCheckoutSessionSchema.safeParse(data);
}

export function validatePaymentRecord(data: unknown) {
  return paymentRecordSchema.safeParse(data);
}

export type CreateCheckoutSessionRequest = z.infer<typeof createCheckoutSessionSchema>;
export type PaymentSession = z.infer<typeof paymentSessionSchema>;
export type PaymentRecord = z.infer<typeof paymentRecordSchema>;
