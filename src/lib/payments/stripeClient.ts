/**
 * Stripe Client Wrapper
 * Phase 3 Step 6 - Payment Integration
 *
 * Type-safe Stripe API wrapper for checkout sessions and webhook verification.
 * Handles environment configuration, error handling, and security best practices.
 *
 * Usage:
 * ```typescript
 * import { createCheckoutSession, verifyWebhookSignature } from '@/lib/payments/stripeClient';
 *
 * const session = await createCheckoutSession({
 *   priceAmount: 5000,
 *   currency: 'usd',
 *   metadata: { ideaId: 'uuid', tier: 'better' }
 * });
 * ```
 */

import Stripe from 'stripe';

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Webhook signing secret
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * Checkout Session Configuration
 */
export interface CheckoutSessionConfig {
  priceAmount: number; // Amount in cents (e.g., 5000 = $50.00)
  currency: string; // ISO currency code (e.g., 'usd')
  productName: string; // Product description
  productDescription?: string; // Optional detailed description
  metadata: {
    ideaId: string;
    tier: 'good' | 'better' | 'best';
    packageId: string;
    clientId: string;
    organizationId: string;
  };
  successUrl?: string; // Custom success URL (defaults to /client/proposals/success)
  cancelUrl?: string; // Custom cancel URL (defaults to /client/proposals/cancelled)
}

/**
 * Create a Stripe Checkout Session
 *
 * This function:
 * 1. Validates the price amount and currency
 * 2. Creates a Stripe checkout session with the provided configuration
 * 3. Returns the session ID and URL for redirect
 *
 * @param config - Checkout session configuration
 * @returns Promise<{ sessionId: string, sessionUrl: string }>
 * @throws Error if Stripe API call fails
 */
export async function createCheckoutSession(
  config: CheckoutSessionConfig
): Promise<{ sessionId: string; sessionUrl: string }> {
  try {
    const {
      priceAmount,
      currency,
      productName,
      productDescription,
      metadata,
      successUrl,
      cancelUrl,
    } = config;

    // Validate price amount
    if (priceAmount <= 0) {
      throw new Error('Price amount must be greater than 0');
    }

    // Validate currency
    if (!currency || currency.length !== 3) {
      throw new Error('Invalid currency code');
    }

    // Get base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3008';

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', // One-time payment
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: productName,
              description: productDescription,
            },
            unit_amount: priceAmount, // Amount in cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        ...metadata,
        // Add timestamp for tracking
        createdAt: new Date().toISOString(),
      },
      success_url: successUrl || `${baseUrl}/client/proposals/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${baseUrl}/client/proposals/cancelled?idea_id=${metadata.ideaId}`,
      // Enable customer email collection
      customer_email: undefined, // Will be collected in Stripe checkout
      // Set session expiration (24 hours)
      expires_at: Math.floor(Date.now() / 1000) + 86400,
    });

    if (!session.url) {
      throw new Error('Stripe session URL not generated');
    }

    return {
      sessionId: session.id,
      sessionUrl: session.url,
    };
  } catch (error) {
    console.error('Stripe createCheckoutSession error:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to create checkout session'
    );
  }
}

/**
 * Retrieve a Checkout Session by ID
 *
 * @param sessionId - Stripe session ID
 * @returns Promise<Stripe.Checkout.Session>
 */
export async function getCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session;
  } catch (error) {
    console.error('Stripe getCheckoutSession error:', error);
    throw new Error('Failed to retrieve checkout session');
  }
}

/**
 * Verify Stripe Webhook Signature
 *
 * This function verifies that the webhook event came from Stripe
 * and not from a malicious third party.
 *
 * @param payload - Raw request body (as string or buffer)
 * @param signature - Stripe signature from request headers
 * @returns Stripe.Event object if signature is valid
 * @throws Error if signature verification fails
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  try {
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );

    return event;
  } catch (error) {
    console.error('Stripe webhook verification failed:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Webhook signature verification failed'
    );
  }
}

/**
 * Create a refund for a payment
 *
 * @param paymentIntentId - Stripe payment intent ID
 * @param amount - Amount to refund in cents (optional, defaults to full refund)
 * @param reason - Reason for refund (optional)
 * @returns Promise<Stripe.Refund>
 */
export async function createRefund(
  paymentIntentId: string,
  amount?: number,
  reason?: string
): Promise<Stripe.Refund> {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount, // If undefined, refunds the full amount
      reason: reason as Stripe.RefundCreateParams.Reason,
    });

    return refund;
  } catch (error) {
    console.error('Stripe createRefund error:', error);
    throw new Error('Failed to create refund');
  }
}

/**
 * Get payment intent details
 *
 * @param paymentIntentId - Stripe payment intent ID
 * @returns Promise<Stripe.PaymentIntent>
 */
export async function getPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Stripe getPaymentIntent error:', error);
    throw new Error('Failed to retrieve payment intent');
  }
}

/**
 * Format currency amount for display
 *
 * @param amountInCents - Amount in cents
 * @param currency - ISO currency code
 * @returns Formatted currency string (e.g., "$50.00")
 */
export function formatCurrency(amountInCents: number, currency: string = 'usd'): string {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

/**
 * Convert dollars to cents
 *
 * @param dollars - Amount in dollars
 * @returns Amount in cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to dollars
 *
 * @param cents - Amount in cents
 * @returns Amount in dollars
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Validate Stripe configuration
 *
 * @returns { valid: boolean, errors: string[] }
 */
export function validateStripeConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!process.env.STRIPE_SECRET_KEY) {
    errors.push('STRIPE_SECRET_KEY is not configured');
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    errors.push('STRIPE_WEBHOOK_SECRET is not configured');
  }

  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    errors.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Export Stripe client for advanced usage
export { stripe };
