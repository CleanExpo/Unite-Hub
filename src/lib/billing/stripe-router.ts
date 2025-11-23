/**
 * Stripe Dual Mode Router
 *
 * Phase 29.1: Dual Stripe Mode Billing Activation
 * Routes billing to TEST or LIVE based on user role/email
 */

import Stripe from "stripe";

export type BillingMode = "test" | "live";

// Internal domains that use TEST mode
const TEST_MODE_DOMAINS = [
  "unite-group.in",
  "disasterrecoveryqld.au",
  "carsi.com.au",
];

// Admin emails that always use TEST mode
const TEST_MODE_EMAILS = [
  "admin@unite-group.in",
  "contact@unite-group.in",
  "dev@unite-group.in",
];

// Roles that use TEST mode
const TEST_MODE_ROLES = ["founder", "staff_admin", "internal_team", "super_admin"];

/**
 * Determine billing mode for a user
 */
export function getBillingModeForUser(
  email?: string,
  role?: string
): BillingMode {
  // Check role first
  if (role && TEST_MODE_ROLES.includes(role)) {
    return "test";
  }

  // Check specific emails
  if (email && TEST_MODE_EMAILS.includes(email.toLowerCase())) {
    return "test";
  }

  // Check domain
  if (email) {
    const domain = email.split("@")[1]?.toLowerCase();
    if (domain && TEST_MODE_DOMAINS.includes(domain)) {
      return "test";
    }
  }

  // Default to live for real clients
  return "live";
}

/**
 * Get Stripe client for user's billing mode
 */
export function getStripeClientForUser(
  email?: string,
  role?: string
): Stripe {
  const mode = getBillingModeForUser(email, role);
  return getStripeClient(mode);
}

/**
 * Get Stripe client by mode
 */
export function getStripeClient(mode: BillingMode): Stripe {
  const secretKey =
    mode === "test"
      ? process.env.STRIPE_TEST_SECRET_KEY
      : process.env.STRIPE_LIVE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      `Stripe ${mode.toUpperCase()} secret key not configured. ` +
        `Set ${mode === "test" ? "STRIPE_TEST_SECRET_KEY" : "STRIPE_LIVE_SECRET_KEY"}`
    );
  }

  return new Stripe(secretKey, {
    apiVersion: "2023-10-16",
    typescript: true,
  });
}

/**
 * Get publishable key for client-side
 */
export function getPublishableKey(mode: BillingMode): string {
  return mode === "test"
    ? process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY || ""
    : process.env.NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY || "";
}

/**
 * Get webhook secret by mode
 */
export function getWebhookSecret(mode: BillingMode): string {
  return mode === "test"
    ? process.env.STRIPE_TEST_WEBHOOK_SECRET || ""
    : process.env.STRIPE_LIVE_WEBHOOK_SECRET || "";
}

/**
 * Route webhook event by mode
 */
export function routeWebhookEventByMode(
  payload: string,
  signature: string,
  mode: BillingMode
): Stripe.Event {
  const stripe = getStripeClient(mode);
  const webhookSecret = getWebhookSecret(mode);

  if (!webhookSecret) {
    throw new Error(`Webhook secret not configured for ${mode} mode`);
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Detect mode from webhook endpoint path
 */
export function detectModeFromEndpoint(path: string): BillingMode {
  if (path.includes("/test")) {
    return "test";
  }
  if (path.includes("/live")) {
    return "live";
  }
  // Default to live for safety
  return "live";
}

/**
 * Check if user is in sandbox mode
 */
export function isInSandboxMode(email?: string, role?: string): boolean {
  return getBillingModeForUser(email, role) === "test";
}

/**
 * Get price IDs for a mode
 */
export function getPriceIds(mode: BillingMode) {
  if (mode === "test") {
    return {
      starter: process.env.STRIPE_TEST_PRICE_STARTER || "price_test_starter",
      pro: process.env.STRIPE_TEST_PRICE_PRO || "price_test_pro",
      elite: process.env.STRIPE_TEST_PRICE_ELITE || "price_test_elite",
    };
  }

  return {
    starter: process.env.STRIPE_LIVE_PRICE_STARTER || "price_live_starter",
    pro: process.env.STRIPE_LIVE_PRICE_PRO || "price_live_pro",
    elite: process.env.STRIPE_LIVE_PRICE_ELITE || "price_live_elite",
  };
}

/**
 * Get billing mode display info
 */
export function getBillingModeInfo(mode: BillingMode) {
  return {
    mode,
    isTest: mode === "test",
    isLive: mode === "live",
    label: mode === "test" ? "Sandbox Mode" : "Live Billing",
    badge: mode === "test" ? "TEST" : "LIVE",
    color: mode === "test" ? "yellow" : "green",
    description:
      mode === "test"
        ? "No real charges will be made"
        : "Real payments will be processed",
  };
}

/**
 * Environment variable configuration reference
 */
export const STRIPE_ENV_VARS = {
  test: {
    secretKey: "STRIPE_TEST_SECRET_KEY",
    publishableKey: "NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY",
    webhookSecret: "STRIPE_TEST_WEBHOOK_SECRET",
    priceStarter: "STRIPE_TEST_PRICE_STARTER",
    pricePro: "STRIPE_TEST_PRICE_PRO",
    priceElite: "STRIPE_TEST_PRICE_ELITE",
  },
  live: {
    secretKey: "STRIPE_LIVE_SECRET_KEY",
    publishableKey: "NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY",
    webhookSecret: "STRIPE_LIVE_WEBHOOK_SECRET",
    priceStarter: "STRIPE_LIVE_PRICE_STARTER",
    pricePro: "STRIPE_LIVE_PRICE_PRO",
    priceElite: "STRIPE_LIVE_PRICE_ELITE",
  },
};
