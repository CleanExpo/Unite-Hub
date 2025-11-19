/**
 * Tests for paymentService (Phase 3 Step 6)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createCheckoutSession,
  verifyPayment,
  type CreateCheckoutSessionParams,
} from '../services/client/paymentService';

global.fetch = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'mock-token-123',
            user: { id: 'user-123', email: 'test@example.com' },
          },
        },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            session_id: 'cs_123',
            payment_intent_id: 'pi_123',
            status: 'succeeded',
            amount: 5000,
            currency: 'usd',
            paid_at: new Date().toISOString(),
          },
          error: null,
        }),
      }),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    }),
  },
}));

describe('paymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCheckoutSession', () => {
    const mockParams: CreateCheckoutSessionParams = {
      ideaId: 'idea-uuid-123',
      tier: 'better',
      packageId: 'pkg-better',
    };

    it('should create checkout session successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          sessionId: 'cs_test_123',
          sessionUrl: 'https://checkout.stripe.com/pay/cs_test_123',
          message: 'Checkout session created successfully',
        }),
      });

      const result = await createCheckoutSession(mockParams);

      expect(result.success).toBe(true);
      expect(result.sessionId).toBe('cs_test_123');
      expect(result.sessionUrl).toContain('stripe.com');
    });

    it('should validate parameters', async () => {
      const invalidParams = {
        ideaId: '',
        tier: 'better' as const,
        packageId: 'pkg-better',
      };

      const result = await createCheckoutSession(invalidParams);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required parameters');
    });

    it('should include Authorization header', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, sessionId: 'cs_123', sessionUrl: 'url' }),
      });

      await createCheckoutSession(mockParams);

      const fetchCall = (global.fetch as any).mock.calls[0];
      const headers = fetchCall[1].headers;

      expect(headers['Authorization']).toBe('Bearer mock-token-123');
    });
  });

  describe('verifyPayment', () => {
    it('should verify payment successfully', async () => {
      const result = await verifyPayment('cs_test_123');

      expect(result.success).toBe(true);
      expect(result.payment?.sessionId).toBe('cs_123');
      expect(result.payment?.status).toBe('succeeded');
    });
  });
});
