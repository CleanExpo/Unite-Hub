/**
 * Stripe Integration - Main Export
 *
 * Complete Stripe subscription system for Unite-Hub CRM
 */

// Client functions
export {
  stripe,
  PLAN_TIERS,
  getOrCreateCustomer,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  reactivateSubscription,
  getSubscription,
  getCustomerSubscriptions,
  getProducts,
  getPrice,
  getCustomerInvoices,
  getInvoice,
  createCheckoutSession,
  createBillingPortalSession,
  getCustomerPaymentMethods,
  getPlanTierFromPriceId,
  verifyWebhookSignature,
  getUpcomingInvoice,
  calculateProration,
  retryFailedPayment,
  updateCustomerPaymentMethod,
} from "./client";

// Types
export type {
  PlanTier,
  SubscriptionStatus,
  PlanConfig,
  Subscription,
  CreateCheckoutRequest,
  CreateCheckoutResponse,
  GetSubscriptionResponse,
  UpgradeSubscriptionRequest,
  UpgradeSubscriptionResponse,
  DowngradeSubscriptionRequest,
  DowngradeSubscriptionResponse,
  CancelSubscriptionRequest,
  CancelSubscriptionResponse,
  ReactivateSubscriptionRequest,
  ReactivateSubscriptionResponse,
  Invoice,
  UpcomingInvoice,
  GetInvoicesResponse,
  CreatePortalSessionRequest,
  CreatePortalSessionResponse,
  ErrorResponse,
  StripeWebhookEvent,
  StripeCustomer,
  ProrationCalculation,
  UsageLimits,
} from "./types";

export { PLAN_LIMITS } from "./types";

// Utilities
export {
  isSubscriptionActive,
  isSubscriptionCanceled,
  isSubscriptionPastDue,
  needsAttention,
  getDaysUntilRenewal,
  getDaysSinceStart,
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusText,
  canUpgrade,
  canDowngrade,
  getUpgradePlan,
  getDowngradePlan,
  getProrationText,
  hasFeature,
  getClientAccountLimit,
  isClientLimitReached,
  compareFeatures,
  validateSubscriptionForOperation,
  getRenewalReminder,
  calculateSubscriptionHealth,
  getRecommendedAction,
  formatInvoiceStatus,
  getBillingPeriodProgress,
} from "./utils";
