/**
 * Australian Pricing Configuration
 *
 * Phase 29: Stripe Activation + Australian Pricing
 * Phase 32: Annual Plans (12 months for price of 10)
 * All prices in AUD, GST inclusive
 */

export type BillingInterval = "month" | "year";

export interface PlanLimit {
  aiTokens: number;
  audits: number;
  contacts: number;
  seats: number;
  campaigns: number;
  content: number;
}

export interface OveragePricing {
  aiTokensPer1000: number;
  audit: number;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  annualPrice: number;
  currency: "AUD";
  interval: BillingInterval;
  gstIncluded: boolean;
  stripePriceIdMonthly: string;
  stripePriceIdAnnual: string;
  limits: PlanLimit;
  overages: OveragePricing;
  features: string[];
  popular?: boolean;
}

export const PRICING_PLANS: Record<string, PricingPlan> = {
  starter: {
    id: "starter",
    name: "Starter",
    price: 495,
    annualPrice: 4950, // 12 months for price of 10
    currency: "AUD",
    interval: "month",
    gstIncluded: true,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_ID_STARTER || "price_starter_monthly",
    stripePriceIdAnnual: process.env.STRIPE_PRICE_ID_STARTER_ANNUAL || "price_starter_annual",
    limits: {
      aiTokens: 20000,
      audits: 2,
      contacts: 500,
      seats: 1,
      campaigns: 5,
      content: 10,
    },
    overages: {
      aiTokensPer1000: 0.015,
      audit: 5,
    },
    features: [
      "20,000 AI tokens/month",
      "2 website audits/month",
      "500 contacts",
      "1 team seat",
      "5 email campaigns",
      "Basic AI workspace",
      "Email support",
      "Core dashboard",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 895,
    annualPrice: 8950, // 12 months for price of 10
    currency: "AUD",
    interval: "month",
    gstIncluded: true,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_ID_PROFESSIONAL || "price_pro_monthly",
    stripePriceIdAnnual: process.env.STRIPE_PRICE_ID_PROFESSIONAL_ANNUAL || "price_pro_annual",
    limits: {
      aiTokens: 250000,
      audits: 20,
      contacts: 5000,
      seats: 3,
      campaigns: -1, // Unlimited
      content: -1,
    },
    overages: {
      aiTokensPer1000: 0.012,
      audit: 3,
    },
    features: [
      "250,000 AI tokens/month",
      "20 website audits/month",
      "5,000 contacts",
      "3 team seats",
      "Unlimited campaigns",
      "Full NEXUS AI workspace",
      "Drip campaigns",
      "Priority support",
      "API access",
    ],
    popular: true,
  },
  elite: {
    id: "elite",
    name: "Elite",
    price: 1295,
    annualPrice: 12950, // 12 months for price of 10
    currency: "AUD",
    interval: "month",
    gstIncluded: true,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_ID_ELITE || "price_elite_monthly",
    stripePriceIdAnnual: process.env.STRIPE_PRICE_ID_ELITE_ANNUAL || "price_elite_annual",
    limits: {
      aiTokens: 2000000,
      audits: 100,
      contacts: -1, // Unlimited
      seats: 10,
      campaigns: -1,
      content: -1,
    },
    overages: {
      aiTokensPer1000: 0.010,
      audit: 1,
    },
    features: [
      "2,000,000 AI tokens/month",
      "100 website audits/month",
      "Unlimited contacts",
      "10 team seats",
      "Everything in Pro",
      "Dedicated AI agent",
      "Custom brand model",
      "A/B testing",
      "White label options",
      "Agency integration",
    ],
  },
};

export const TRIAL_CONFIG = {
  durationDays: 14,
  features: "pro", // Full Pro features during trial
  requireCard: false,
  reminderDays: [7, 3, 1],
  gracePeriodDays: 3,
};

export const BILLING_CONFIG = {
  currency: "AUD",
  taxRate: 0.10, // 10% GST
  gstIncluded: true,
  trialDays: 14,
  annualDiscount: 2, // 2 months free on annual
  webhookEvents: [
    "invoice.payment_succeeded",
    "invoice.payment_failed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "customer.subscription.trial_will_end",
  ],
};

/**
 * Get plan by ID
 */
export function getPlan(planId: string): PricingPlan | undefined {
  return PRICING_PLANS[planId];
}

/**
 * Check if feature is available in plan
 */
export function hasFeature(planId: string, feature: string): boolean {
  const plan = getPlan(planId);
  if (!plan) {
return false;
}
  return plan.features.some(f => f.toLowerCase().includes(feature.toLowerCase()));
}

/**
 * Get limit value for plan
 */
export function getLimit(planId: string, limitType: keyof PlanLimit): number {
  const plan = getPlan(planId);
  if (!plan) {
return 0;
}
  return plan.limits[limitType];
}

/**
 * Calculate overage cost
 */
export function calculateOverage(
  planId: string,
  overageType: "aiTokensPer1000" | "audit",
  quantity: number
): number {
  const plan = getPlan(planId);
  if (!plan) {
return 0;
}

  if (overageType === "aiTokensPer1000") {
    return quantity * plan.overages.aiTokensPer1000;
  }
  return quantity * plan.overages.audit;
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Get all plans as array
 */
export function getAllPlans(): PricingPlan[] {
  return Object.values(PRICING_PLANS);
}

/**
 * Get price for billing interval
 */
export function getPriceForInterval(
  planId: string,
  interval: BillingInterval
): number {
  const plan = getPlan(planId);
  if (!plan) {
return 0;
}
  return interval === "year" ? plan.annualPrice : plan.price;
}

/**
 * Get monthly equivalent for annual plans
 */
export function getMonthlyEquivalent(planId: string): number {
  const plan = getPlan(planId);
  if (!plan) {
return 0;
}
  return Math.round(plan.annualPrice / 12);
}

/**
 * Get savings percentage for annual billing
 */
export function getAnnualSavingsPercent(): number {
  return Math.round((2 / 12) * 100); // 2 months free = ~17%
}

/**
 * Get Stripe price ID for plan and interval
 */
export function getStripePriceId(
  planId: string,
  interval: BillingInterval
): string | undefined {
  const plan = getPlan(planId);
  if (!plan) {
return undefined;
}
  return interval === "year" ? plan.stripePriceIdAnnual : plan.stripePriceIdMonthly;
}

/**
 * Format interval for display
 */
export function formatInterval(interval: BillingInterval): string {
  return interval === "year" ? "annually" : "monthly";
}
