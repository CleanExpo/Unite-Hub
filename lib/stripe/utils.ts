import { PlanTier, SubscriptionStatus, PLAN_LIMITS } from "./types";

/**
 * Utility Functions for Stripe Subscription Management
 */

/**
 * Check if subscription is active
 */
export function isSubscriptionActive(status: SubscriptionStatus): boolean {
  return status === "active" || status === "trialing";
}

/**
 * Check if subscription is canceled or expired
 */
export function isSubscriptionCanceled(status: SubscriptionStatus): boolean {
  return status === "canceled";
}

/**
 * Check if subscription is past due
 */
export function isSubscriptionPastDue(status: SubscriptionStatus): boolean {
  return status === "past_due";
}

/**
 * Check if subscription needs attention (past_due or canceled)
 */
export function needsAttention(status: SubscriptionStatus): boolean {
  return status === "past_due" || status === "canceled";
}

/**
 * Get days until subscription renewal
 */
export function getDaysUntilRenewal(currentPeriodEnd: number): number {
  const now = Date.now();
  const daysRemaining = Math.ceil(
    (currentPeriodEnd - now) / (1000 * 60 * 60 * 24)
  );
  return Math.max(0, daysRemaining);
}

/**
 * Get days since subscription started
 */
export function getDaysSinceStart(currentPeriodStart: number): number {
  const now = Date.now();
  return Math.floor((now - currentPeriodStart) / (1000 * 60 * 60 * 24));
}

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number,
  currency: string = "aud"
): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

/**
 * Format date
 */
export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(timestamp));
}

/**
 * Get subscription status badge color
 */
export function getStatusColor(
  status: SubscriptionStatus
): "green" | "yellow" | "red" | "blue" {
  switch (status) {
    case "active":
      return "green";
    case "trialing":
      return "blue";
    case "past_due":
      return "yellow";
    case "canceled":
      return "red";
    default:
      return "gray" as any;
  }
}

/**
 * Get subscription status display text
 */
export function getStatusText(status: SubscriptionStatus): string {
  switch (status) {
    case "active":
      return "Active";
    case "trialing":
      return "Trial";
    case "past_due":
      return "Past Due";
    case "canceled":
      return "Canceled";
    default:
      return "Unknown";
  }
}

/**
 * Check if upgrade is available
 */
export function canUpgrade(currentPlan: PlanTier): boolean {
  return currentPlan === "starter";
}

/**
 * Check if downgrade is available
 */
export function canDowngrade(currentPlan: PlanTier): boolean {
  return currentPlan === "professional";
}

/**
 * Get next plan tier for upgrade
 */
export function getUpgradePlan(currentPlan: PlanTier): PlanTier | null {
  if (currentPlan === "starter") {
return "professional";
}
  return null;
}

/**
 * Get previous plan tier for downgrade
 */
export function getDowngradePlan(currentPlan: PlanTier): PlanTier | null {
  if (currentPlan === "professional") {
return "starter";
}
  return null;
}

/**
 * Calculate proration preview text
 */
export function getProrationText(
  prorationAmount: number,
  currency: string
): string {
  if (prorationAmount > 0) {
    return `You'll be charged ${formatCurrency(prorationAmount, currency)} for the upgrade today`;
  } else if (prorationAmount < 0) {
    return `You'll receive a ${formatCurrency(Math.abs(prorationAmount), currency)} credit on your next invoice`;
  }
  return "No additional charge today";
}

/**
 * Check if feature is available in plan
 */
export function hasFeature(
  planTier: PlanTier,
  feature: keyof typeof PLAN_LIMITS.starter
): boolean {
  const limits = PLAN_LIMITS[planTier];
  return Boolean(limits[feature]);
}

/**
 * Get client account limit
 */
export function getClientAccountLimit(planTier: PlanTier): number {
  return PLAN_LIMITS[planTier].clientAccounts;
}

/**
 * Check if client account limit reached
 */
export function isClientLimitReached(
  currentCount: number,
  planTier: PlanTier
): boolean {
  return currentCount >= getClientAccountLimit(planTier);
}

/**
 * Get feature comparison between plans
 */
export function compareFeatures(
  fromPlan: PlanTier,
  toPlan: PlanTier
): {
  added: string[];
  removed: string[];
  unchanged: string[];
} {
  const fromLimits = PLAN_LIMITS[fromPlan];
  const toLimits = PLAN_LIMITS[toPlan];

  const added: string[] = [];
  const removed: string[] = [];
  const unchanged: string[] = [];

  // Compare each feature
  Object.keys(fromLimits).forEach((key) => {
    const fromValue = fromLimits[key as keyof typeof fromLimits];
    const toValue = toLimits[key as keyof typeof toLimits];

    if (JSON.stringify(fromValue) === JSON.stringify(toValue)) {
      unchanged.push(key);
    } else if (
      (typeof fromValue === "boolean" && !fromValue && toValue) ||
      (typeof fromValue === "number" && typeof toValue === "number" && toValue > fromValue)
    ) {
      added.push(key);
    } else {
      removed.push(key);
    }
  });

  return { added, removed, unchanged };
}

/**
 * Validate subscription for operation
 */
export function validateSubscriptionForOperation(
  status: SubscriptionStatus,
  operation: "upgrade" | "downgrade" | "cancel" | "reactivate"
): { valid: boolean; reason?: string } {
  switch (operation) {
    case "upgrade":
    case "downgrade":
      if (status !== "active" && status !== "trialing") {
        return {
          valid: false,
          reason: "Subscription must be active to change plans",
        };
      }
      return { valid: true };

    case "cancel":
      if (status === "canceled") {
        return { valid: false, reason: "Subscription is already canceled" };
      }
      return { valid: true };

    case "reactivate":
      if (status !== "canceled" && status !== "active") {
        return { valid: false, reason: "Only canceled subscriptions can be reactivated" };
      }
      return { valid: true };

    default:
      return { valid: false, reason: "Unknown operation" };
  }
}

/**
 * Get renewal reminder message based on days remaining
 */
export function getRenewalReminder(daysUntilRenewal: number): string | null {
  if (daysUntilRenewal <= 0) {
    return "Your subscription has expired";
  } else if (daysUntilRenewal === 1) {
    return "Your subscription renews tomorrow";
  } else if (daysUntilRenewal <= 7) {
    return `Your subscription renews in ${daysUntilRenewal} days`;
  } else if (daysUntilRenewal <= 14) {
    return `Your subscription renews in ${daysUntilRenewal} days`;
  }
  return null;
}

/**
 * Calculate subscription health score (0-100)
 */
export function calculateSubscriptionHealth(subscription: {
  status: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: number;
}): number {
  let score = 100;

  // Deduct points for status
  if (subscription.status === "past_due") {
    score -= 50;
  } else if (subscription.status === "canceled") {
    score = 0;
  } else if (subscription.status === "trialing") {
    score -= 10;
  }

  // Deduct points if scheduled for cancellation
  if (subscription.cancelAtPeriodEnd) {
    score -= 30;
  }

  // Deduct points based on time until renewal
  const daysUntilRenewal = getDaysUntilRenewal(subscription.currentPeriodEnd);
  if (daysUntilRenewal <= 3) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Get recommended action based on subscription status
 */
export function getRecommendedAction(subscription: {
  status: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  planTier: PlanTier;
}): { action: string; message: string; priority: "high" | "medium" | "low" } | null {
  if (subscription.status === "past_due") {
    return {
      action: "update_payment",
      message: "Update your payment method to continue service",
      priority: "high",
    };
  }

  if (subscription.status === "canceled") {
    return {
      action: "reactivate",
      message: "Reactivate your subscription to regain access",
      priority: "high",
    };
  }

  if (subscription.cancelAtPeriodEnd) {
    return {
      action: "reactivate",
      message: "Your subscription is scheduled to cancel. Reactivate to continue service",
      priority: "medium",
    };
  }

  if (subscription.planTier === "starter") {
    return {
      action: "upgrade",
      message: "Upgrade to Professional for advanced features",
      priority: "low",
    };
  }

  return null;
}

/**
 * Format invoice status for display
 */
export function formatInvoiceStatus(
  status: string | null
): { text: string; color: string } {
  switch (status) {
    case "paid":
      return { text: "Paid", color: "green" };
    case "open":
      return { text: "Open", color: "blue" };
    case "void":
      return { text: "Void", color: "gray" };
    case "uncollectible":
      return { text: "Uncollectible", color: "red" };
    case "draft":
      return { text: "Draft", color: "yellow" };
    default:
      return { text: "Unknown", color: "gray" };
  }
}

/**
 * Calculate percentage of billing period used
 */
export function getBillingPeriodProgress(
  currentPeriodStart: number,
  currentPeriodEnd: number
): number {
  const now = Date.now();
  const totalPeriod = currentPeriodEnd - currentPeriodStart;
  const elapsed = now - currentPeriodStart;
  return Math.min(100, Math.max(0, (elapsed / totalPeriod) * 100));
}
