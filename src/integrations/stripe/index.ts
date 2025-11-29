/**
 * Stripe Integration for Synthex Tier System
 *
 * Handles subscription lifecycle for three tiers:
 * - Starter: $29/mo
 * - Professional: $99/mo
 * - Elite: $299/mo
 *
 * Features:
 * - Checkout session creation
 * - Webhook processing with signature verification
 * - Subscription management (get, update, cancel)
 * - Database synchronization (workspace.current_tier)
 */

import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import type {
  SynthexTier,
  SubscriptionStatus,
  TierConfig,
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
  UpdateSubscriptionRequest,
  UpdateSubscriptionResponse,
  CancelSubscriptionRequest,
  CancelSubscriptionResponse,
  GetSubscriptionResponse,
  WebhookPayload,
  StripeError,
  ProrationCalculation,
} from "./types";

// ============================================================================
// STRIPE CLIENT INITIALIZATION
// ============================================================================

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is required for Stripe integration");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20.acacia",
  typescript: true,
});

// ============================================================================
// TIER CONFIGURATION
// ============================================================================

export const SYNTHEX_TIERS: Record<SynthexTier, TierConfig> = {
  starter: {
    tier: "starter",
    name: "Starter",
    priceId: process.env.STRIPE_PRICE_ID_SYNTHEX_STARTER || "",
    price: 2900, // $29.00/month in cents
    currency: "usd",
    interval: "month",
    features: {
      contacts_limit: 500,
      campaigns_limit: 3,
      emails_per_month: 2000,
      drip_campaigns_limit: 1,
      seo_reports: false,
      competitor_analysis: false,
      api_access: false,
      priority_support: false,
      white_label: false,
      custom_domain: false,
      ai_content_generation: true,
      ai_extended_thinking: false,
      ai_agent_access: false,
      storage_limit_mb: 500,
    },
  },
  professional: {
    tier: "professional",
    name: "Professional",
    priceId: process.env.STRIPE_PRICE_ID_SYNTHEX_PROFESSIONAL || "",
    price: 9900, // $99.00/month in cents
    currency: "usd",
    interval: "month",
    features: {
      contacts_limit: 5000,
      campaigns_limit: 15,
      emails_per_month: 15000,
      drip_campaigns_limit: 5,
      seo_reports: true,
      competitor_analysis: false,
      api_access: true,
      priority_support: false,
      white_label: false,
      custom_domain: false,
      ai_content_generation: true,
      ai_extended_thinking: true,
      ai_agent_access: false,
      storage_limit_mb: 2000,
    },
  },
  elite: {
    tier: "elite",
    name: "Elite",
    priceId: process.env.STRIPE_PRICE_ID_SYNTHEX_ELITE || "",
    price: 29900, // $299.00/month in cents
    currency: "usd",
    interval: "month",
    features: {
      contacts_limit: -1, // unlimited
      campaigns_limit: -1, // unlimited
      emails_per_month: -1, // unlimited
      drip_campaigns_limit: -1, // unlimited
      seo_reports: true,
      competitor_analysis: true,
      api_access: true,
      priority_support: true,
      white_label: true,
      custom_domain: true,
      ai_content_generation: true,
      ai_extended_thinking: true,
      ai_agent_access: true,
      storage_limit_mb: 10000,
    },
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get tier from Stripe price ID
 */
function getTierFromPriceId(priceId: string): SynthexTier | null {
  for (const [tier, config] of Object.entries(SYNTHEX_TIERS)) {
    if (config.priceId === priceId) {
      return tier as SynthexTier;
    }
  }
  return null;
}

/**
 * Map Stripe status to our subscription status
 */
function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
  switch (stripeStatus) {
    case "active":
      return "active";
    case "trialing":
      return "trial";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
    case "incomplete":
    case "incomplete_expired":
      return "cancelled";
    default:
      return "cancelled";
  }
}

// ============================================================================
// CHECKOUT SESSION CREATION
// ============================================================================

/**
 * Create a Stripe checkout session for subscription signup
 *
 * @param request - Checkout session configuration
 * @returns Checkout session with URL for redirect
 *
 * @example
 * const session = await createCheckoutSession({
 *   workspaceId: 'workspace-uuid',
 *   tier: 'professional',
 *   email: 'user@example.com',
 *   successUrl: 'https://app.example.com/success',
 *   cancelUrl: 'https://app.example.com/cancel',
 * });
 */
export async function createCheckoutSession(
  request: CreateCheckoutSessionRequest
): Promise<CreateCheckoutSessionResponse> {
  const { workspaceId, tier, email, successUrl, cancelUrl, trialDays, metadata = {} } = request;

  // Validate tier
  const tierConfig = SYNTHEX_TIERS[tier];
  if (!tierConfig) {
    throw new Error(`Invalid tier: ${tier}`);
  }

  if (!tierConfig.priceId) {
    throw new Error(`Price ID not configured for tier: ${tier}`);
  }

  try {
    // Get or create Stripe customer
    const customers = await stripe.customers.list({ email, limit: 1 });

    let customer: Stripe.Customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];

      // Update metadata if needed
      if (customer.metadata.workspaceId !== workspaceId) {
        customer = await stripe.customers.update(customer.id, {
          metadata: {
            ...customer.metadata,
            workspaceId,
            ...metadata,
          },
        });
      }
    } else {
      // Create new customer
      customer = await stripe.customers.create({
        email,
        metadata: {
          workspaceId,
          ...metadata,
        },
      });
    }

    // Create checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customer.id,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: tierConfig.priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        workspaceId,
        tier,
      },
      subscription_data: {
        metadata: {
          workspaceId,
          tier,
        },
      },
    };

    // Add trial if specified
    if (trialDays && trialDays > 0) {
      sessionParams.subscription_data = {
        ...sessionParams.subscription_data,
        trial_period_days: trialDays,
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return {
      sessionId: session.id,
      url: session.url || "",
      customerId: customer.id,
    };
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      throw {
        error: "stripe_error",
        message: error.message,
        code: error.code,
        statusCode: error.statusCode || 500,
      } as StripeError;
    }
    throw error;
  }
}

// ============================================================================
// SUBSCRIPTION RETRIEVAL
// ============================================================================

/**
 * Get subscription details for a workspace
 *
 * @param workspaceId - Workspace UUID
 * @returns Subscription details including tier and Stripe data
 *
 * @example
 * const subscription = await getSubscription('workspace-uuid');
 * console.log(subscription.subscription.currentTier); // 'professional'
 */
export async function getSubscription(workspaceId: string): Promise<GetSubscriptionResponse | null> {
  const supabase = await createClient();

  // Get workspace subscription data
  const { data: workspace, error } = await supabase
    .from("workspaces")
    .select("id, current_tier, subscription_status, stripe_customer_id, stripe_subscription_id, trial_ends_at")
    .eq("id", workspaceId)
    .single();

  if (error || !workspace) {
    return null;
  }

  const tier = workspace.current_tier as SynthexTier;
  const tierConfig = SYNTHEX_TIERS[tier];

  // If no Stripe subscription, return workspace data only
  if (!workspace.stripe_subscription_id) {
    return {
      subscription: {
        workspaceId: workspace.id,
        currentTier: tier,
        subscriptionStatus: workspace.subscription_status as SubscriptionStatus,
        stripeCustomerId: workspace.stripe_customer_id,
        stripeSubscriptionId: workspace.stripe_subscription_id,
        trialEndsAt: workspace.trial_ends_at ? new Date(workspace.trial_ends_at) : null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
      },
      tier: tierConfig,
      stripe: {
        status: workspace.subscription_status,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        trialEnd: workspace.trial_ends_at ? new Date(workspace.trial_ends_at).getTime() : null,
        defaultPaymentMethod: null,
      },
    };
  }

  try {
    // Retrieve Stripe subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(workspace.stripe_subscription_id, {
      expand: ["default_payment_method"],
    });

    return {
      subscription: {
        workspaceId: workspace.id,
        currentTier: tier,
        subscriptionStatus: mapStripeStatus(stripeSubscription.status),
        stripeCustomerId: workspace.stripe_customer_id,
        stripeSubscriptionId: workspace.stripe_subscription_id,
        trialEndsAt: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      },
      tier: tierConfig,
      stripe: {
        status: stripeSubscription.status,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        canceledAt: stripeSubscription.canceled_at,
        trialEnd: stripeSubscription.trial_end,
        defaultPaymentMethod: stripeSubscription.default_payment_method,
      },
    };
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      console.error("Stripe error retrieving subscription:", error);
    }
    return null;
  }
}

// ============================================================================
// SUBSCRIPTION UPDATE (UPGRADE/DOWNGRADE)
// ============================================================================

/**
 * Update subscription tier (upgrade or downgrade)
 *
 * @param request - Update configuration
 * @returns Updated subscription details
 *
 * @example
 * const result = await updateSubscription({
 *   workspaceId: 'workspace-uuid',
 *   newTier: 'elite',
 *   prorationBehavior: 'create_prorations',
 * });
 */
export async function updateSubscription(
  request: UpdateSubscriptionRequest
): Promise<UpdateSubscriptionResponse> {
  const { workspaceId, newTier, prorationBehavior = "create_prorations" } = request;

  const supabase = await createClient();

  // Get workspace
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id, current_tier, stripe_subscription_id")
    .eq("id", workspaceId)
    .single();

  if (workspaceError || !workspace) {
    throw {
      error: "workspace_not_found",
      message: "Workspace not found",
      statusCode: 404,
    } as StripeError;
  }

  if (!workspace.stripe_subscription_id) {
    throw {
      error: "no_subscription",
      message: "No active subscription found",
      statusCode: 400,
    } as StripeError;
  }

  const newTierConfig = SYNTHEX_TIERS[newTier];
  if (!newTierConfig || !newTierConfig.priceId) {
    throw {
      error: "invalid_tier",
      message: `Invalid tier: ${newTier}`,
      statusCode: 400,
    } as StripeError;
  }

  try {
    // Get current subscription
    const subscription = await stripe.subscriptions.retrieve(workspace.stripe_subscription_id);

    // Update subscription with new price
    const updatedSubscription = await stripe.subscriptions.update(workspace.stripe_subscription_id, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newTierConfig.priceId,
        },
      ],
      proration_behavior: prorationBehavior,
      metadata: {
        ...subscription.metadata,
        tier: newTier,
      },
    });

    // Update workspace tier in database
    await supabase
      .from("workspaces")
      .update({
        current_tier: newTier,
        subscription_status: mapStripeStatus(updatedSubscription.status),
      })
      .eq("id", workspaceId);

    // Calculate proration if applicable
    let proration: { amount: number; currency: string } | undefined;
    if (prorationBehavior === "create_prorations") {
      const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
        customer: subscription.customer as string,
      });

      proration = {
        amount: upcomingInvoice.amount_due,
        currency: upcomingInvoice.currency,
      };
    }

    return {
      success: true,
      subscription: {
        tier: newTier,
        status: mapStripeStatus(updatedSubscription.status),
        currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
      },
      proration,
    };
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      throw {
        error: "stripe_error",
        message: error.message,
        code: error.code,
        statusCode: error.statusCode || 500,
      } as StripeError;
    }
    throw error;
  }
}

// ============================================================================
// SUBSCRIPTION CANCELLATION
// ============================================================================

/**
 * Cancel subscription (immediately or at period end)
 *
 * @param request - Cancellation configuration
 * @returns Cancellation result
 *
 * @example
 * const result = await cancelSubscription({
 *   workspaceId: 'workspace-uuid',
 *   cancelImmediately: false, // cancel at period end
 *   reason: 'customer_request',
 * });
 */
export async function cancelSubscription(
  request: CancelSubscriptionRequest
): Promise<CancelSubscriptionResponse> {
  const { workspaceId, cancelImmediately = false, reason } = request;

  const supabase = await createClient();

  // Get workspace
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id, stripe_subscription_id")
    .eq("id", workspaceId)
    .single();

  if (workspaceError || !workspace) {
    throw {
      error: "workspace_not_found",
      message: "Workspace not found",
      statusCode: 404,
    } as StripeError;
  }

  if (!workspace.stripe_subscription_id) {
    throw {
      error: "no_subscription",
      message: "No active subscription found",
      statusCode: 400,
    } as StripeError;
  }

  try {
    let updatedSubscription: Stripe.Subscription;

    if (cancelImmediately) {
      // Cancel immediately
      updatedSubscription = await stripe.subscriptions.cancel(workspace.stripe_subscription_id, {
        cancellation_details: reason ? { comment: reason } : undefined,
      });

      // Update workspace status
      await supabase
        .from("workspaces")
        .update({
          subscription_status: "cancelled",
          stripe_subscription_id: null,
        })
        .eq("id", workspaceId);

      return {
        success: true,
        message: "Subscription cancelled immediately",
        subscription: {
          status: "cancelled",
          accessUntil: null,
        },
      };
    } else {
      // Cancel at period end
      updatedSubscription = await stripe.subscriptions.update(workspace.stripe_subscription_id, {
        cancel_at_period_end: true,
        cancellation_details: reason ? { comment: reason } : undefined,
      });

      // Update workspace status (still active until period end)
      await supabase
        .from("workspaces")
        .update({
          subscription_status: "active", // still active until period end
        })
        .eq("id", workspaceId);

      return {
        success: true,
        message: "Subscription will cancel at period end",
        subscription: {
          status: "active",
          accessUntil: new Date(updatedSubscription.current_period_end * 1000),
        },
      };
    }
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      throw {
        error: "stripe_error",
        message: error.message,
        code: error.code,
        statusCode: error.statusCode || 500,
      } as StripeError;
    }
    throw error;
  }
}

// ============================================================================
// WEBHOOK HANDLING
// ============================================================================

/**
 * Verify Stripe webhook signature
 *
 * @param payload - Raw webhook payload
 * @param signature - Stripe-Signature header
 * @returns Parsed Stripe event
 *
 * @throws Error if signature verification fails
 */
export function verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    throw new Error(`Webhook signature verification failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Process Stripe webhook event
 *
 * Handles subscription lifecycle events and updates database accordingly
 *
 * @param event - Verified Stripe event
 * @returns Processing result
 *
 * @example
 * const event = verifyWebhookSignature(payload, signature);
 * const result = await handleWebhook(event);
 */
export async function handleWebhook(event: Stripe.Event): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient();

  try {
    switch (event.type) {
      // ========================================================================
      // SUBSCRIPTION CREATED
      // ========================================================================
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        const workspaceId = subscription.metadata.workspaceId;
        const tier = subscription.metadata.tier as SynthexTier;

        if (!workspaceId || !tier) {
          return { success: false, message: "Missing workspace or tier metadata" };
        }

        // Get tier from first price item
        const priceId = subscription.items.data[0]?.price.id;
        const detectedTier = priceId ? getTierFromPriceId(priceId) : null;

        await supabase
          .from("workspaces")
          .update({
            current_tier: detectedTier || tier,
            subscription_status: mapStripeStatus(subscription.status),
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          })
          .eq("id", workspaceId);

        return { success: true, message: "Subscription created" };
      }

      // ========================================================================
      // SUBSCRIPTION UPDATED
      // ========================================================================
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const workspaceId = subscription.metadata.workspaceId;

        if (!workspaceId) {
          return { success: false, message: "Missing workspace metadata" };
        }

        // Get tier from first price item
        const priceId = subscription.items.data[0]?.price.id;
        const tier = priceId ? getTierFromPriceId(priceId) : null;

        if (!tier) {
          return { success: false, message: "Could not determine tier from price ID" };
        }

        await supabase
          .from("workspaces")
          .update({
            current_tier: tier,
            subscription_status: mapStripeStatus(subscription.status),
            trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          })
          .eq("id", workspaceId);

        return { success: true, message: "Subscription updated" };
      }

      // ========================================================================
      // SUBSCRIPTION DELETED
      // ========================================================================
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const workspaceId = subscription.metadata.workspaceId;

        if (!workspaceId) {
          return { success: false, message: "Missing workspace metadata" };
        }

        await supabase
          .from("workspaces")
          .update({
            subscription_status: "cancelled",
            stripe_subscription_id: null,
            current_tier: "starter", // Downgrade to starter on cancellation
          })
          .eq("id", workspaceId);

        return { success: true, message: "Subscription deleted" };
      }

      // ========================================================================
      // INVOICE PAID
      // ========================================================================
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) {
          return { success: true, message: "Not a subscription invoice" };
        }

        // Retrieve subscription to get workspace
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const workspaceId = subscription.metadata.workspaceId;

        if (!workspaceId) {
          return { success: false, message: "Missing workspace metadata" };
        }

        // Ensure subscription is active
        await supabase
          .from("workspaces")
          .update({
            subscription_status: "active",
          })
          .eq("id", workspaceId);

        return { success: true, message: "Invoice paid, subscription active" };
      }

      // ========================================================================
      // PAYMENT FAILED
      // ========================================================================
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) {
          return { success: true, message: "Not a subscription invoice" };
        }

        // Retrieve subscription to get workspace
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const workspaceId = subscription.metadata.workspaceId;

        if (!workspaceId) {
          return { success: false, message: "Missing workspace metadata" };
        }

        // Mark subscription as past_due
        await supabase
          .from("workspaces")
          .update({
            subscription_status: "past_due",
          })
          .eq("id", workspaceId);

        return { success: true, message: "Payment failed, subscription past_due" };
      }

      // ========================================================================
      // UNHANDLED EVENT
      // ========================================================================
      default:
        return { success: true, message: `Unhandled event type: ${event.type}` };
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export { SYNTHEX_TIERS, getTierFromPriceId, mapStripeStatus };

// Export types
export type * from "./types";
