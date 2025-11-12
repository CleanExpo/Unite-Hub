import { Doc } from "../_generated/dataModel";

/**
 * Tier-Based Access Control for Unite-Hub CRM
 * Enforces feature access based on subscription tier
 */

export type PlanTier = "starter" | "professional";

// Feature limits per tier
export const TIER_LIMITS = {
  starter: {
    emailsAnalyzed: 50,
    personasGenerated: 1, // Single persona only
    campaignsCreated: 10,
    imagesGenerated: 20,
    hooksGenerated: 50,
    strategiesGenerated: 5,
    clientAssets: 50, // Max assets per client
    multiPersona: false, // Cannot create multiple personas
    competitorAnalysis: false,
    advancedTargeting: false,
  },
  professional: {
    emailsAnalyzed: null, // Unlimited
    personasGenerated: null, // Unlimited
    campaignsCreated: null, // Unlimited
    imagesGenerated: 100,
    hooksGenerated: null, // Unlimited
    strategiesGenerated: null, // Unlimited
    clientAssets: 200,
    multiPersona: true,
    competitorAnalysis: true,
    advancedTargeting: true,
  },
} as const;

// Feature access checks
export function canAccessFeature(
  tier: PlanTier,
  feature: keyof typeof TIER_LIMITS.starter
): boolean {
  const limit = TIER_LIMITS[tier][feature];
  if (typeof limit === "boolean") {
    return limit;
  }
  return limit === null || limit > 0;
}

export function canCreateMultiplePersonas(tier: PlanTier): boolean {
  return TIER_LIMITS[tier].multiPersona;
}

export function canAccessCompetitorAnalysis(tier: PlanTier): boolean {
  return TIER_LIMITS[tier].competitorAnalysis;
}

export function canUseAdvancedTargeting(tier: PlanTier): boolean {
  return TIER_LIMITS[tier].advancedTargeting;
}

// Usage limit checks
export function getUsageLimit(
  tier: PlanTier,
  metricType: keyof typeof TIER_LIMITS.starter
): number | null {
  return TIER_LIMITS[tier][metricType] as number | null;
}

export function hasReachedLimit(
  currentCount: number,
  tier: PlanTier,
  metricType: keyof typeof TIER_LIMITS.starter
): boolean {
  const limit = getUsageLimit(tier, metricType);
  if (limit === null) {
    return false; // Unlimited
  }
  return currentCount >= limit;
}

export function getRemainingUsage(
  currentCount: number,
  tier: PlanTier,
  metricType: keyof typeof TIER_LIMITS.starter
): number | null {
  const limit = getUsageLimit(tier, metricType);
  if (limit === null) {
    return null; // Unlimited
  }
  return Math.max(0, limit - currentCount);
}

// Subscription status checks
export function isActiveSubscription(
  subscription: Doc<"subscriptions">
): boolean {
  return (
    subscription.status === "active" || subscription.status === "trialing"
  );
}

export function isSubscriptionExpired(
  subscription: Doc<"subscriptions">
): boolean {
  const now = Date.now();
  return now > subscription.currentPeriodEnd && subscription.cancelAtPeriodEnd;
}

export function canAccessPaidFeatures(
  subscription: Doc<"subscriptions">
): boolean {
  return isActiveSubscription(subscription) && !isSubscriptionExpired(subscription);
}

// Tier upgrade prompts
export function getUpgradeMessage(feature: string): string {
  return `This feature requires a Professional plan. Upgrade to unlock ${feature}.`;
}

export function getUsageLimitMessage(
  metricType: string,
  tier: PlanTier
): string {
  const limit = getUsageLimit(tier, metricType as keyof typeof TIER_LIMITS.starter);
  if (limit === null) {
    return "";
  }
  return `You've reached your ${tier} plan limit of ${limit} ${metricType}. Upgrade to Professional for unlimited access.`;
}

// Client package tier checks
export function getClientTierLimits(packageTier: PlanTier) {
  return TIER_LIMITS[packageTier];
}

export function validateClientTier(
  clientTier: string
): clientTier is PlanTier {
  return clientTier === "starter" || clientTier === "professional";
}

// Resource ownership validation
export function validateOrgOwnership(
  resourceOrgId: string,
  requestingOrgId: string
): boolean {
  return resourceOrgId === requestingOrgId;
}

export function validateClientOwnership(
  resourceClientId: string,
  requestingClientId: string
): boolean {
  return resourceClientId === requestingClientId;
}

// Feature gate errors
export class FeatureGateError extends Error {
  constructor(
    public feature: string,
    public tier: PlanTier,
    public requiredTier: PlanTier = "professional"
  ) {
    super(
      `Feature "${feature}" is not available on ${tier} plan. ${getUpgradeMessage(feature)}`
    );
    this.name = "FeatureGateError";
  }
}

export class UsageLimitError extends Error {
  constructor(
    public metricType: string,
    public currentCount: number,
    public limit: number,
    public tier: PlanTier
  ) {
    super(getUsageLimitMessage(metricType, tier));
    this.name = "UsageLimitError";
  }
}

// Helper to check and enforce limits
export function enforceUsageLimit(
  currentCount: number,
  tier: PlanTier,
  metricType: keyof typeof TIER_LIMITS.starter
): void {
  const limit = getUsageLimit(tier, metricType);
  if (limit !== null && currentCount >= limit) {
    throw new UsageLimitError(metricType, currentCount, limit, tier);
  }
}

export function enforceFeatureAccess(
  tier: PlanTier,
  feature: keyof typeof TIER_LIMITS.starter,
  requiredTier: PlanTier = "professional"
): void {
  if (!canAccessFeature(tier, feature)) {
    throw new FeatureGateError(feature, tier, requiredTier);
  }
}
