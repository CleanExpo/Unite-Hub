/**
 * Australian Pricing Configuration
 *
 * Phase 29: Stripe Activation + Australian Pricing
 * All prices in AUD, GST inclusive
 */

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
  currency: "AUD";
  interval: "month";
  gstIncluded: boolean;
  stripePriceId: string;
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
    currency: "AUD",
    interval: "month",
    gstIncluded: true,
    stripePriceId: "price_starter_aud_495",
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
    currency: "AUD",
    interval: "month",
    gstIncluded: true,
    stripePriceId: "price_pro_aud_895",
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
    currency: "AUD",
    interval: "month",
    gstIncluded: true,
    stripePriceId: "price_elite_aud_1295",
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
  if (!plan) return false;
  return plan.features.some(f => f.toLowerCase().includes(feature.toLowerCase()));
}

/**
 * Get limit value for plan
 */
export function getLimit(planId: string, limitType: keyof PlanLimit): number {
  const plan = getPlan(planId);
  if (!plan) return 0;
  return plan.limits[limitType];
}

/**
 * Calculate overage cost
 */
export function calculateOverage(
  planId: string,
  overageType: "aiTokens" | "audit",
  quantity: number
): number {
  const plan = getPlan(planId);
  if (!plan) return 0;

  if (overageType === "aiTokens") {
    return (quantity / 1000) * plan.overages.aiTokensPer1000;
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
