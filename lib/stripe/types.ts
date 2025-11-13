import { Id } from "@/convex/_generated/dataModel";

/**
 * Stripe Integration Types for Unite-Hub CRM
 */

// Plan Tiers
export type PlanTier = "starter" | "professional";

// Subscription Status
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing";

// Plan Configuration
export interface PlanConfig {
  name: string;
  priceId: string;
  price: number;
  currency: string;
  interval: "month" | "year";
  features: string[];
}

// Subscription Data
export interface Subscription {
  id: Id<"subscriptions">;
  orgId: Id<"organizations">;
  planTier: PlanTier;
  status: SubscriptionStatus;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  createdAt: number;
  updatedAt: number;
}

// API Request Types
export interface CreateCheckoutRequest {
  plan: PlanTier;
  email: string;
  name?: string;
  orgId: string;
}

export interface CreateCheckoutResponse {
  sessionId: string;
  url: string;
  customerId: string;
}

export interface GetSubscriptionResponse {
  subscription: {
    id: string;
    orgId: string;
    planTier: PlanTier;
    status: SubscriptionStatus;
    cancelAtPeriodEnd: boolean;
    currentPeriodStart: number;
    currentPeriodEnd: number;
    daysUntilRenewal: number;
    stripeSubscriptionId: string;
    stripeCustomerId: string;
  };
  plan: {
    name: string;
    price: number;
    currency: string;
    interval: string;
    features: string[];
  };
  stripe: {
    status: string;
    cancelAtPeriodEnd: boolean;
    canceledAt: number | null;
    trialEnd: number | null;
    defaultPaymentMethod: any;
  };
}

export interface UpgradeSubscriptionRequest {
  orgId: string;
  targetPlan: PlanTier;
}

export interface UpgradeSubscriptionResponse {
  success: boolean;
  message: string;
  subscription: {
    planTier: PlanTier;
    status: string;
    currentPeriodEnd: number;
  };
  proration: {
    amount: number;
    currency: string;
  };
}

export interface DowngradeSubscriptionRequest {
  orgId: string;
  targetPlan: PlanTier;
}

export interface DowngradeSubscriptionResponse {
  success: boolean;
  message: string;
  subscription: {
    planTier: PlanTier;
    status: string;
    currentPeriodEnd: number;
  };
  proration: {
    amount: number;
    currency: string;
    note: string;
  };
}

export interface CancelSubscriptionRequest {
  orgId: string;
  cancelImmediately?: boolean;
  reason?: string;
}

export interface CancelSubscriptionResponse {
  success: boolean;
  message: string;
  subscription: {
    status: SubscriptionStatus;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: number;
  };
  daysRemaining?: number;
  accessUntil?: string;
}

export interface ReactivateSubscriptionRequest {
  orgId: string;
}

export interface ReactivateSubscriptionResponse {
  success: boolean;
  message: string;
  subscription: {
    status: SubscriptionStatus;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: number;
    planTier: PlanTier;
  };
}

export interface Invoice {
  id: string;
  number: string | null;
  status: string | null;
  amount: number;
  amountPaid: number;
  currency: string;
  created: number;
  dueDate: number | null;
  periodStart: number | null;
  periodEnd: number | null;
  invoicePdf: string | null;
  hostedInvoiceUrl: string | null;
  paid: boolean;
  attempted: boolean;
  description: string | null;
}

export interface UpcomingInvoice {
  amount: number;
  currency: string;
  periodStart: number;
  periodEnd: number;
  subtotal: number;
  tax: number | null;
  total: number;
  nextPaymentAttempt: number | null;
  lines: Array<{
    description: string | null;
    amount: number;
    quantity: number | null;
    period: {
      start: number;
      end: number;
    };
  }>;
}

export interface GetInvoicesResponse {
  invoices: Invoice[];
  upcomingInvoice: UpcomingInvoice | null;
  subscription: {
    planTier: PlanTier;
    status: SubscriptionStatus;
    currentPeriodEnd: number;
  };
}

export interface CreatePortalSessionRequest {
  orgId: string;
  returnUrl: string;
}

export interface CreatePortalSessionResponse {
  url: string;
}

// Error Response
export interface ErrorResponse {
  error: string;
  message?: string;
  code?: string;
}

// Webhook Event Types
export type StripeWebhookEvent =
  | "customer.subscription.created"
  | "customer.subscription.updated"
  | "customer.subscription.deleted"
  | "invoice.paid"
  | "invoice.payment_failed"
  | "invoice.payment_action_required"
  | "customer.created"
  | "customer.updated"
  | "payment_intent.succeeded"
  | "payment_intent.payment_failed";

// Customer Data
export interface StripeCustomer {
  id: string;
  email: string | null;
  name: string | null;
  metadata: {
    organizationId: string;
    [key: string]: string;
  };
}

// Proration Calculation
export interface ProrationCalculation {
  prorationAmount: number;
  currency: string;
  prorationDate: number;
}

// Usage Limits (for future implementation)
export interface UsageLimits {
  clientAccounts: number;
  emailProcessing: "basic" | "advanced";
  personaGeneration: "single" | "multi";
  mindMapping: "basic" | "advanced";
  marketingStrategy: "standard" | "comprehensive";
  campaignPlatforms: "single" | "multi";
  hooksLibrary: boolean;
  imageGeneration: boolean;
  prioritySupport: boolean;
}

// Plan Limits Mapping
export const PLAN_LIMITS: Record<PlanTier, UsageLimits> = {
  starter: {
    clientAccounts: 1,
    emailProcessing: "basic",
    personaGeneration: "single",
    mindMapping: "basic",
    marketingStrategy: "standard",
    campaignPlatforms: "single",
    hooksLibrary: false,
    imageGeneration: false,
    prioritySupport: false,
  },
  professional: {
    clientAccounts: 5,
    emailProcessing: "advanced",
    personaGeneration: "multi",
    mindMapping: "advanced",
    marketingStrategy: "comprehensive",
    campaignPlatforms: "multi",
    hooksLibrary: true,
    imageGeneration: true,
    prioritySupport: true,
  },
};
