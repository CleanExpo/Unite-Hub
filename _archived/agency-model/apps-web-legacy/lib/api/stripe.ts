/**
 * Stripe API Interface Service
 *
 * Wraps the Stripe SDK to provide typed access to payment
 * processing, subscriptions, and billing operations.
 *
 * Uses the STRIPE_SECRET_KEY environment variable for
 * server-side authentication and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
 * for client-side Stripe.js initialisation.
 *
 * This file is server-side only — never import in client components.
 */

import Stripe from 'stripe';

// ---------------------------------------------------------------------------
// Client Singleton
// ---------------------------------------------------------------------------

let _stripe: Stripe | null = null;

function getSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY || '';

  if (!key || key === 'sk_test_xxx' || key === 'your-stripe-secret-key') {
    throw new Error('Stripe secret key not configured. Set STRIPE_SECRET_KEY in .env');
  }

  return key;
}

/**
 * Returns a singleton Stripe client.
 * Server-side only — do NOT use in client components.
 */
export function getStripeClient(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(getSecretKey(), {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });
  }
  return _stripe;
}

// ---------------------------------------------------------------------------
// Customer Helpers
// ---------------------------------------------------------------------------

export async function createCustomer(params: {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}) {
  const stripe = getStripeClient();
  return stripe.customers.create(params);
}

export async function getCustomer(customerId: string) {
  const stripe = getStripeClient();
  return stripe.customers.retrieve(customerId);
}

export async function listCustomers(limit = 10) {
  const stripe = getStripeClient();
  return stripe.customers.list({ limit });
}

// ---------------------------------------------------------------------------
// Product & Price Helpers
// ---------------------------------------------------------------------------

export async function createProduct(params: {
  name: string;
  description?: string;
  metadata?: Record<string, string>;
}) {
  const stripe = getStripeClient();
  return stripe.products.create(params);
}

export async function listProducts(limit = 10, active = true) {
  const stripe = getStripeClient();
  return stripe.products.list({ limit, active });
}

export async function createPrice(params: {
  product: string;
  unit_amount: number;
  currency: string;
  recurring?: { interval: 'day' | 'week' | 'month' | 'year' };
}) {
  const stripe = getStripeClient();
  return stripe.prices.create(params);
}

export async function listPrices(productId?: string, limit = 10) {
  const stripe = getStripeClient();
  return stripe.prices.list({
    limit,
    ...(productId ? { product: productId } : {}),
  });
}

// ---------------------------------------------------------------------------
// Checkout Session Helpers
// ---------------------------------------------------------------------------

export async function createCheckoutSession(params: {
  customer?: string;
  line_items: Array<{
    price: string;
    quantity: number;
  }>;
  mode: 'payment' | 'subscription' | 'setup';
  success_url: string;
  cancel_url: string;
  metadata?: Record<string, string>;
}) {
  const stripe = getStripeClient();
  return stripe.checkout.sessions.create(params);
}

export async function getCheckoutSession(sessionId: string) {
  const stripe = getStripeClient();
  return stripe.checkout.sessions.retrieve(sessionId);
}

// ---------------------------------------------------------------------------
// Subscription Helpers
// ---------------------------------------------------------------------------

export async function createSubscription(params: {
  customer: string;
  items: Array<{ price: string }>;
  metadata?: Record<string, string>;
}) {
  const stripe = getStripeClient();
  return stripe.subscriptions.create(params);
}

export async function getSubscription(subscriptionId: string) {
  const stripe = getStripeClient();
  return stripe.subscriptions.retrieve(subscriptionId);
}

export async function cancelSubscription(subscriptionId: string) {
  const stripe = getStripeClient();
  return stripe.subscriptions.cancel(subscriptionId);
}

export async function listSubscriptions(customerId: string, limit = 10) {
  const stripe = getStripeClient();
  return stripe.subscriptions.list({ customer: customerId, limit });
}

// ---------------------------------------------------------------------------
// Payment Intent Helpers
// ---------------------------------------------------------------------------

export async function createPaymentIntent(params: {
  amount: number;
  currency: string;
  customer?: string;
  metadata?: Record<string, string>;
}) {
  const stripe = getStripeClient();
  return stripe.paymentIntents.create(params);
}

export async function getPaymentIntent(paymentIntentId: string) {
  const stripe = getStripeClient();
  return stripe.paymentIntents.retrieve(paymentIntentId);
}

// ---------------------------------------------------------------------------
// Webhook Helpers
// ---------------------------------------------------------------------------

/**
 * Verify and construct a Stripe webhook event from the raw body.
 * Use in API routes that receive Stripe webhooks.
 */
export function constructWebhookEvent(rawBody: string | Buffer, signature: string): Stripe.Event {
  const stripe = getStripeClient();
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  if (!endpointSecret) {
    throw new Error('Stripe webhook secret not configured. Set STRIPE_WEBHOOK_SECRET in .env');
  }

  return stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
}

// ---------------------------------------------------------------------------
// Portal Session (Customer self-service)
// ---------------------------------------------------------------------------

export async function createPortalSession(params: { customer: string; return_url: string }) {
  const stripe = getStripeClient();
  return stripe.billingPortal.sessions.create(params);
}

// ---------------------------------------------------------------------------
// Re-export for direct SDK access
// ---------------------------------------------------------------------------

export { Stripe };
