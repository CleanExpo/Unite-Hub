import Stripe from "stripe";

/**
 * Stripe Client for Unite-Hub CRM
 *
 * Handles all Stripe operations:
 * - Customer management
 * - Subscription lifecycle (create, update, cancel)
 * - Product and price retrieval
 * - Invoice management
 * - Payment methods
 */

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is required");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20.acacia",
  typescript: true,
});

// Plan configurations
export const PLAN_TIERS = {
  starter: {
    name: "Starter",
    priceId: process.env.STRIPE_PRICE_ID_STARTER!,
    price: 24900, // $249 AUD/month
    currency: "aud",
    interval: "month",
    features: [
      "1 Client Account",
      "Basic email processing",
      "Single persona generation",
      "Basic mind mapping",
      "Standard marketing strategy",
      "Single platform campaigns",
    ],
  },
  professional: {
    name: "Professional",
    priceId: process.env.STRIPE_PRICE_ID_PROFESSIONAL!,
    price: 54900, // $549 AUD/month
    currency: "aud",
    interval: "month",
    features: [
      "5 Client Accounts",
      "Advanced email processing",
      "Multi-persona generation",
      "Advanced mind mapping with auto-expansion",
      "Comprehensive marketing strategies with competitor analysis",
      "Multi-platform campaigns",
      "Hooks & scripts library",
      "DALL-E image generation",
      "Priority support",
    ],
  },
} as const;

export type PlanTier = keyof typeof PLAN_TIERS;

/**
 * Get or create a Stripe customer
 */
export async function getOrCreateCustomer(params: {
  email: string;
  name?: string;
  organizationId: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Customer> {
  const { email, name, organizationId, metadata = {} } = params;

  // Search for existing customer by email
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    const customer = existingCustomers.data[0];

    // Update metadata if needed
    if (customer.metadata.organizationId !== organizationId) {
      return await stripe.customers.update(customer.id, {
        metadata: {
          ...customer.metadata,
          organizationId,
          ...metadata,
        },
      });
    }

    return customer;
  }

  // Create new customer
  return await stripe.customers.create({
    email,
    name,
    metadata: {
      organizationId,
      ...metadata,
    },
  });
}

/**
 * Create a new subscription
 */
export async function createSubscription(params: {
  customerId: string;
  priceId: string;
  trialDays?: number;
  metadata?: Record<string, string>;
}): Promise<Stripe.Subscription> {
  const { customerId, priceId, trialDays, metadata = {} } = params;

  const subscriptionParams: Stripe.SubscriptionCreateParams = {
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: "default_incomplete",
    payment_settings: {
      save_default_payment_method: "on_subscription",
    },
    expand: ["latest_invoice.payment_intent", "customer"],
    metadata,
  };

  if (trialDays && trialDays > 0) {
    subscriptionParams.trial_period_days = trialDays;
  }

  return await stripe.subscriptions.create(subscriptionParams);
}

/**
 * Update subscription (upgrade/downgrade)
 */
export async function updateSubscription(params: {
  subscriptionId: string;
  newPriceId: string;
  prorationBehavior?: "create_prorations" | "none" | "always_invoice";
}): Promise<Stripe.Subscription> {
  const { subscriptionId, newPriceId, prorationBehavior = "create_prorations" } = params;

  // Get current subscription
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Update the subscription with new price
  return await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    proration_behavior: prorationBehavior,
    expand: ["latest_invoice.payment_intent"],
  });
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelImmediately: boolean = false
): Promise<Stripe.Subscription> {
  if (cancelImmediately) {
    return await stripe.subscriptions.cancel(subscriptionId);
  }

  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Reactivate a canceled subscription
 */
export async function reactivateSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Get subscription details
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["customer", "default_payment_method", "latest_invoice"],
    });
  } catch (error) {
    if ((error as Stripe.StripeError).code === "resource_missing") {
      return null;
    }
    throw error;
  }
}

/**
 * Get customer's active subscriptions
 */
export async function getCustomerSubscriptions(
  customerId: string
): Promise<Stripe.Subscription[]> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    expand: ["data.default_payment_method"],
  });

  return subscriptions.data;
}

/**
 * Get all products and prices
 */
export async function getProducts(): Promise<{
  products: Stripe.Product[];
  prices: Stripe.Price[];
}> {
  const [products, prices] = await Promise.all([
    stripe.products.list({ active: true }),
    stripe.prices.list({ active: true, expand: ["data.product"] }),
  ]);

  return {
    products: products.data,
    prices: prices.data,
  };
}

/**
 * Get price details
 */
export async function getPrice(priceId: string): Promise<Stripe.Price | null> {
  try {
    return await stripe.prices.retrieve(priceId, {
      expand: ["product"],
    });
  } catch (error) {
    if ((error as Stripe.StripeError).code === "resource_missing") {
      return null;
    }
    throw error;
  }
}

/**
 * Get customer invoices
 */
export async function getCustomerInvoices(
  customerId: string,
  limit: number = 12
): Promise<Stripe.Invoice[]> {
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit,
    expand: ["data.charge", "data.payment_intent"],
  });

  return invoices.data;
}

/**
 * Get invoice by ID
 */
export async function getInvoice(invoiceId: string): Promise<Stripe.Invoice | null> {
  try {
    return await stripe.invoices.retrieve(invoiceId, {
      expand: ["charge", "payment_intent", "subscription"],
    });
  } catch (error) {
    if ((error as Stripe.StripeError).code === "resource_missing") {
      return null;
    }
    throw error;
  }
}

/**
 * Create a checkout session
 */
export async function createCheckoutSession(params: {
  customerId?: string;
  customerEmail?: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
  metadata?: Record<string, string>;
}): Promise<Stripe.Checkout.Session> {
  const {
    customerId,
    customerEmail,
    priceId,
    successUrl,
    cancelUrl,
    trialDays,
    metadata = {},
  } = params;

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    subscription_data: {
      metadata,
    },
  };

  if (customerId) {
    sessionParams.customer = customerId;
  } else if (customerEmail) {
    sessionParams.customer_email = customerEmail;
  }

  if (trialDays && trialDays > 0) {
    sessionParams.subscription_data = {
      ...sessionParams.subscription_data,
      trial_period_days: trialDays,
    };
  }

  return await stripe.checkout.sessions.create(sessionParams);
}

/**
 * Create a billing portal session
 */
export async function createBillingPortalSession(params: {
  customerId: string;
  returnUrl: string;
}): Promise<Stripe.BillingPortal.Session> {
  const { customerId, returnUrl } = params;

  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

/**
 * Get customer payment methods
 */
export async function getCustomerPaymentMethods(
  customerId: string
): Promise<Stripe.PaymentMethod[]> {
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: "card",
  });

  return paymentMethods.data;
}

/**
 * Get plan tier from price ID
 */
export function getPlanTierFromPriceId(priceId: string): PlanTier | null {
  if (priceId === PLAN_TIERS.starter.priceId) return "starter";
  if (priceId === PLAN_TIERS.professional.priceId) return "professional";
  return null;
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

/**
 * Get upcoming invoice for a customer
 */
export async function getUpcomingInvoice(
  customerId: string,
  subscriptionId?: string
): Promise<Stripe.UpcomingInvoice | null> {
  try {
    const params: Stripe.InvoiceRetrieveUpcomingParams = {
      customer: customerId,
    };

    if (subscriptionId) {
      params.subscription = subscriptionId;
    }

    return await stripe.invoices.retrieveUpcoming(params);
  } catch (error) {
    if ((error as Stripe.StripeError).code === "invoice_upcoming_none") {
      return null;
    }
    throw error;
  }
}

/**
 * Calculate proration amount for plan change
 */
export async function calculateProration(params: {
  subscriptionId: string;
  newPriceId: string;
}): Promise<{
  prorationAmount: number;
  currency: string;
  prorationDate: number;
}> {
  const { subscriptionId, newPriceId } = params;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const currentPeriodEnd = subscription.current_period_end;

  const invoice = await stripe.invoices.retrieveUpcoming({
    customer: subscription.customer as string,
    subscription: subscriptionId,
    subscription_items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    subscription_proration_date: Math.floor(Date.now() / 1000),
  });

  const prorationAmount = invoice.lines.data
    .filter((line) => line.proration)
    .reduce((sum, line) => sum + line.amount, 0);

  return {
    prorationAmount,
    currency: invoice.currency,
    prorationDate: invoice.period_start,
  };
}

/**
 * Retry failed payment
 */
export async function retryFailedPayment(
  invoiceId: string
): Promise<Stripe.Invoice> {
  return await stripe.invoices.pay(invoiceId);
}

/**
 * Update customer payment method
 */
export async function updateCustomerPaymentMethod(
  customerId: string,
  paymentMethodId: string
): Promise<Stripe.Customer> {
  return await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });
}
