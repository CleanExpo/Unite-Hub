/**
 * Stripe Integration Types for Synthex Tier System
 *
 * Aligned with migration 401_synthex_tier_management.sql
 * Tiers: starter ($29), professional ($99), elite ($299)
 */

import Stripe from "stripe";

// Synthex Tier Types (from migration 401)
export type SynthexTier = "starter" | "professional" | "elite";

// Subscription Status (aligned with workspaces.subscription_status)
export type SubscriptionStatus = "active" | "trial" | "past_due" | "cancelled";

// Tier Configuration with Stripe Price IDs
export interface TierConfig {
  tier: SynthexTier;
  name: string;
  priceId: string;
  price: number; // Price in cents (USD)
  currency: string;
  interval: "month";
  features: {
    // Contact & Campaign limits
    contacts_limit: number;
    campaigns_limit: number;
    emails_per_month: number;
    drip_campaigns_limit: number;

    // Feature flags
    seo_reports: boolean;
    competitor_analysis: boolean;
    api_access: boolean;
    priority_support: boolean;
    white_label: boolean;
    custom_domain: boolean;

    // AI Features
    ai_content_generation: boolean;
    ai_extended_thinking: boolean;
    ai_agent_access: boolean;

    // Storage limits (MB)
    storage_limit_mb: number;
  };
}

// Workspace Subscription Data
export interface WorkspaceSubscription {
  workspaceId: string;
  currentTier: SynthexTier;
  subscriptionStatus: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  trialEndsAt: Date | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
}

// Checkout Session Request
export interface CreateCheckoutSessionRequest {
  workspaceId: string;
  tier: SynthexTier;
  email: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
  metadata?: Record<string, string>;
}

// Checkout Session Response
export interface CreateCheckoutSessionResponse {
  sessionId: string;
  url: string;
  customerId: string;
}

// Subscription Management
export interface UpdateSubscriptionRequest {
  workspaceId: string;
  newTier: SynthexTier;
  prorationBehavior?: "create_prorations" | "none" | "always_invoice";
}

export interface UpdateSubscriptionResponse {
  success: boolean;
  subscription: {
    tier: SynthexTier;
    status: SubscriptionStatus;
    currentPeriodEnd: Date;
  };
  proration?: {
    amount: number;
    currency: string;
  };
}

export interface CancelSubscriptionRequest {
  workspaceId: string;
  cancelImmediately?: boolean;
  reason?: string;
}

export interface CancelSubscriptionResponse {
  success: boolean;
  message: string;
  subscription: {
    status: SubscriptionStatus;
    accessUntil: Date | null;
  };
}

// Webhook Event Types
export type SynthexWebhookEvent =
  | "customer.subscription.created"
  | "customer.subscription.updated"
  | "customer.subscription.deleted"
  | "customer.subscription.trial_will_end"
  | "invoice.paid"
  | "invoice.payment_failed"
  | "invoice.payment_action_required"
  | "customer.created"
  | "customer.updated"
  | "payment_intent.succeeded"
  | "payment_intent.payment_failed";

// Webhook Payload
export interface WebhookPayload {
  event: Stripe.Event;
  workspaceId?: string;
  tier?: SynthexTier;
  subscriptionStatus?: SubscriptionStatus;
}

// Error Response
export interface StripeError {
  error: string;
  message: string;
  code?: string;
  statusCode: number;
}

// Proration Calculation
export interface ProrationCalculation {
  amount: number;
  currency: string;
  prorationDate: number;
  description: string;
}

// Invoice Data
export interface InvoiceData {
  id: string;
  number: string | null;
  status: string;
  amount: number;
  amountPaid: number;
  currency: string;
  created: number;
  dueDate: number | null;
  periodStart: number;
  periodEnd: number;
  invoicePdf: string | null;
  hostedInvoiceUrl: string | null;
  paid: boolean;
}

// Customer Data
export interface CustomerData {
  id: string;
  email: string | null;
  name: string | null;
  metadata: {
    workspaceId: string;
    [key: string]: string;
  };
}

// Subscription Retrieval Response
export interface GetSubscriptionResponse {
  subscription: WorkspaceSubscription;
  tier: TierConfig;
  stripe: {
    status: string;
    cancelAtPeriodEnd: boolean;
    canceledAt: number | null;
    trialEnd: number | null;
    defaultPaymentMethod: any;
  };
}
