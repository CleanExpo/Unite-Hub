/**
 * Client Payment Service
 * Phase 3 Step 6 - Stripe Payment Integration
 *
 * Service layer for client-side payment operations.
 * Provides type-safe functions for creating checkout sessions and confirming payments.
 *
 * Following CLAUDE.md patterns:
 * - Client-side operations
 * - Bearer token authentication
 * - Full error handling
 * - Typed responses
 *
 * Usage:
 * ```typescript
 * import { createCheckoutSession } from '@/lib/services/client/paymentService';
 *
 * const result = await createCheckoutSession({
 *   ideaId: 'uuid',
 *   tier: 'better',
 *   packageId: 'pkg-uuid'
 * });
 *
 * if (result.success) {
 *   window.location.href = result.sessionUrl;
 * }
 * ```
 */

import { supabase } from '@/lib/supabase';

// Service response types
export interface CreateCheckoutSessionResult {
  success: boolean;
  sessionId?: string;
  sessionUrl?: string;
  error?: string;
  message?: string;
}

export interface VerifyPaymentResult {
  success: boolean;
  payment?: {
    sessionId: string;
    paymentIntentId: string;
    status: string;
    amount: number;
    currency: string;
    paidAt: string;
  };
  error?: string;
  message?: string;
}

// Service function input types
export interface CreateCheckoutSessionParams {
  ideaId: string;
  tier: 'good' | 'better' | 'best';
  packageId: string;
}

/**
 * Create a Stripe Checkout Session
 *
 * This function:
 * 1. Authenticates the request using Supabase session
 * 2. Calls POST /api/payments/create-checkout-session with Bearer token
 * 3. Returns the session ID and URL for redirect to Stripe
 *
 * @param params - Checkout session parameters
 * @returns Result with sessionId and sessionUrl or error
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<CreateCheckoutSessionResult> {
  try {
    const { ideaId, tier, packageId } = params;

    // Validate parameters
    if (!ideaId || !tier || !packageId) {
      return {
        success: false,
        error: 'Missing required parameters',
      };
    }

    if (!['good', 'better', 'best'].includes(tier)) {
      return {
        success: false,
        error: 'Invalid tier. Must be good, better, or best',
      };
    }

    // Get Supabase session for authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return {
        success: false,
        error: 'Authentication required. Please log in.',
      };
    }

    // Call API endpoint with Bearer token
    const response = await fetch('/api/payments/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        ideaId,
        tier,
        packageId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        error: errorData.error || `API error: ${response.status}`,
      };
    }

    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Failed to create checkout session',
      };
    }

    return {
      success: true,
      sessionId: data.sessionId,
      sessionUrl: data.sessionUrl,
      message: data.message || 'Checkout session created successfully',
    };
  } catch (error) {
    console.error('Create checkout session service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to create checkout session. Please try again.',
    };
  }
}

/**
 * Verify payment completion
 *
 * This function:
 * 1. Fetches payment details from database
 * 2. Verifies payment status
 * 3. Returns payment confirmation
 *
 * @param sessionId - Stripe session ID
 * @returns Result with payment details or error
 */
export async function verifyPayment(
  sessionId: string
): Promise<VerifyPaymentResult> {
  try {
    // Get Supabase session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return {
        success: false,
        error: 'Authentication required. Please log in.',
      };
    }

    // Fetch payment from database
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching payment:', error);
      return {
        success: false,
        error: 'Payment not found',
      };
    }

    if (!data) {
      return {
        success: false,
        error: 'Payment not found',
      };
    }

    return {
      success: true,
      payment: {
        sessionId: data.session_id,
        paymentIntentId: data.payment_intent_id,
        status: data.status,
        amount: data.amount,
        currency: data.currency,
        paidAt: data.paid_at,
      },
      message: 'Payment verified successfully',
    };
  } catch (error) {
    console.error('Verify payment service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to verify payment. Please try again.',
    };
  }
}

/**
 * Get all payments for the current client
 *
 * @returns Result with payments array or error
 */
export async function getClientPayments(): Promise<{
  success: boolean;
  payments?: Array<{
    id: string;
    sessionId: string;
    ideaId: string;
    tier: string;
    amount: number;
    currency: string;
    status: string;
    paidAt: string;
  }>;
  error?: string;
}> {
  try {
    // Get Supabase session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return {
        success: false,
        error: 'Authentication required. Please log in.',
      };
    }

    // Fetch client's payments
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('client_id', session.user.id)
      .order('paid_at', { ascending: false });

    if (error) {
      console.error('Error fetching client payments:', error);
      return {
        success: false,
        error: 'Failed to fetch payments',
      };
    }

    // Transform data
    const payments = data.map((payment: any) => ({
      id: payment.id,
      sessionId: payment.session_id,
      ideaId: payment.idea_id,
      tier: payment.tier,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      paidAt: payment.paid_at,
    }));

    return {
      success: true,
      payments,
    };
  } catch (error) {
    console.error('Get client payments service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
