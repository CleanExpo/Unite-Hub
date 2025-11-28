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

// Staff Sandbox Registry - Specific emails that always use TEST mode
// Phase 29.2: Register approved staff accounts
const SANDBOX_STAFF_REGISTRY = [
  // Founders & Executives
  { email: "phill.mcgurk@gmail.com", name: "Phill McGurk", role: "founder" },
  // Staff Admins
  { email: "support@carsi.com.au", name: "Claire Brooks", role: "staff_admin" },
  // Engineering Team
  { email: "ranamuzamil1199@gmail.com", name: "Rana Muzamil", role: "engineering" },
  // Internal Unite-Group accounts
  { email: "admin@unite-group.in", name: "Admin", role: "admin" },
  { email: "contact@unite-group.in", name: "Contact", role: "admin" },
  { email: "dev@unite-group.in", name: "Developer", role: "engineering" },
];

// Extract just emails for quick lookup
const TEST_MODE_EMAILS = SANDBOX_STAFF_REGISTRY.map(s => s.email.toLowerCase());

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
 * Falls back to STRIPE_SECRET_KEY if dual-mode keys aren't configured
 */
export function getStripeClient(mode: BillingMode): Stripe {
  // Try mode-specific key first
  let secretKey =
    mode === "test"
      ? process.env.STRIPE_TEST_SECRET_KEY
      : process.env.STRIPE_LIVE_SECRET_KEY;

  // Fallback to single STRIPE_SECRET_KEY if dual-mode not configured
  if (!secretKey) {
    secretKey = process.env.STRIPE_SECRET_KEY;
    if (secretKey) {
      console.warn(
        `[Stripe] Using fallback STRIPE_SECRET_KEY for ${mode} mode. ` +
          `Configure ${mode === "test" ? "STRIPE_TEST_SECRET_KEY" : "STRIPE_LIVE_SECRET_KEY"} for dual-mode billing.`
      );
    }
  }

  if (!secretKey) {
    throw new Error(
      `Stripe secret key not configured. ` +
        `Set STRIPE_SECRET_KEY or ${mode === "test" ? "STRIPE_TEST_SECRET_KEY" : "STRIPE_LIVE_SECRET_KEY"}`
    );
  }

  return new Stripe(secretKey, {
    apiVersion: "2024-11-20.acacia",
    typescript: true,
  });
}

/**
 * Get publishable key for client-side
 * Falls back to NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY if dual-mode not configured
 */
export function getPublishableKey(mode: BillingMode): string {
  const modeKey = mode === "test"
    ? process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY
    : process.env.NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY;

  // Fallback to single key
  return modeKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
}

/**
 * Get webhook secret by mode
 * Falls back to STRIPE_WEBHOOK_SECRET if dual-mode not configured
 */
export function getWebhookSecret(mode: BillingMode): string {
  const modeSecret = mode === "test"
    ? process.env.STRIPE_TEST_WEBHOOK_SECRET
    : process.env.STRIPE_LIVE_WEBHOOK_SECRET;

  // Fallback to single secret
  return modeSecret || process.env.STRIPE_WEBHOOK_SECRET || "";
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
 * Falls back to STRIPE_PRICE_ID_* if dual-mode not configured
 */
export function getPriceIds(mode: BillingMode) {
  // Fallback price IDs from single-mode configuration
  const fallbackStarter = process.env.STRIPE_PRICE_ID_STARTER || "";
  const fallbackPro = process.env.STRIPE_PRICE_ID_PROFESSIONAL || "";
  const fallbackElite = process.env.STRIPE_PRICE_ID_ELITE || "";

  if (mode === "test") {
    return {
      starter: process.env.STRIPE_TEST_PRICE_STARTER || fallbackStarter || "price_test_starter",
      pro: process.env.STRIPE_TEST_PRICE_PRO || fallbackPro || "price_test_pro",
      elite: process.env.STRIPE_TEST_PRICE_ELITE || fallbackElite || "price_test_elite",
    };
  }

  return {
    starter: process.env.STRIPE_LIVE_PRICE_STARTER || fallbackStarter || "price_live_starter",
    pro: process.env.STRIPE_LIVE_PRICE_PRO || fallbackPro || "price_live_pro",
    elite: process.env.STRIPE_LIVE_PRICE_ELITE || fallbackElite || "price_live_elite",
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

/**
 * Get staff member info from sandbox registry
 */
export function getSandboxStaffInfo(email: string) {
  return SANDBOX_STAFF_REGISTRY.find(
    s => s.email.toLowerCase() === email.toLowerCase()
  );
}

/**
 * Check if email is in sandbox registry
 */
export function isRegisteredSandboxStaff(email: string): boolean {
  return TEST_MODE_EMAILS.includes(email.toLowerCase());
}

/**
 * Get all sandbox staff members
 */
export function getSandboxRegistry() {
  return SANDBOX_STAFF_REGISTRY;
}
