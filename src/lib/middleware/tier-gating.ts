/**
 * Tier Gating Middleware
 * Phase 89C: Enforces subscription tier access to Phase 89 features
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { isFeatureAvailable, SubscriptionTier } from '@/lib/config/tier-config';
import logger from '@/lib/logger';

export interface TierGatingContext {
  userId: string;
  tier: SubscriptionTier;
  organizationId?: string;
  workspaceId?: string;
}

export class TierGatingError extends Error {
  constructor(
    public feature: string,
    public requiredTier: SubscriptionTier,
    public userTier: SubscriptionTier
  ) {
    super(`Feature '${feature}' requires ${requiredTier} tier (you have ${userTier})`);
    this.name = 'TierGatingError';
  }
}

/**
 * Check if a feature is available for a tier
 */
export function checkFeatureAccess(tier: SubscriptionTier, feature: keyof ReturnType<typeof getTierFeatures>): boolean {
  return isFeatureAvailable(tier, feature);
}

/**
 * Guard function - throws if feature not available
 */
export function requireFeature(tier: SubscriptionTier, feature: keyof ReturnType<typeof getTierFeatures>): void {
  if (!isFeatureAvailable(tier, feature)) {
    // Determine which tier is the minimum required
    const tiers: SubscriptionTier[] = ['starter', 'pro', 'enterprise'];
    const requiredTier = tiers.find((t) => isFeatureAvailable(t, feature)) || 'enterprise';

    logger.warn('[TierGating] Feature access denied', {
      feature,
      userTier: tier,
      requiredTier,
    });

    throw new TierGatingError(feature, requiredTier, tier);
  }
}

/**
 * Decorator for API route handlers
 */
export function withTierGating(feature: keyof ReturnType<typeof getTierFeatures>) {
  return function decorator(handler: Function) {
    return async function gatedHandler(request: Request, context?: any) {
      try {
        // Extract user tier from request
        // This should be fetched from database using auth context
        const tier: SubscriptionTier = (context?.userTier || 'starter') as SubscriptionTier;

        // Check access
        requireFeature(tier, feature);

        // Call original handler
        return await handler(request, context);
      } catch (error) {
        if (error instanceof TierGatingError) {
          logger.warn('[TierGating] Access denied', {
            error: error.message,
            feature: error.feature,
          });

          return new Response(
            JSON.stringify({
              success: false,
              error: error.message,
              feature: error.feature,
              requiredTier: error.requiredTier,
              currentTier: error.userTier,
            }),
            {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        throw error;
      }
    };
  };
}

/**
 * Get tier-specific configuration
 */
export interface TierSpecificConfig {
  reportSections: number;
  refreshFrequency: 'daily' | 'weekly' | 'monthly';
  cacheTTL: number; // minutes
  dataRetention: number; // days
  maxConcurrentAnalyses: number;
}

export function getTierConfig(tier: SubscriptionTier): TierSpecificConfig {
  const _features = getTierFeatures(tier);

  const tierConfigs: Record<SubscriptionTier, TierSpecificConfig> = {
    starter: {
      reportSections: 3,
      refreshFrequency: 'monthly',
      cacheTTL: 24 * 60, // 24 hours
      dataRetention: 30,
      maxConcurrentAnalyses: 2,
    },
    pro: {
      reportSections: 8,
      refreshFrequency: 'weekly',
      cacheTTL: 12 * 60, // 12 hours
      dataRetention: 90,
      maxConcurrentAnalyses: 10,
    },
    enterprise: {
      reportSections: 12,
      refreshFrequency: 'daily',
      cacheTTL: 4 * 60, // 4 hours
      dataRetention: 365,
      maxConcurrentAnalyses: 50,
    },
  };

  return tierConfigs[tier];
}

/**
 * Middleware to extract and validate tier from request
 */
export async function extractTierFromRequest(request: Request): Promise<SubscriptionTier> {
  try {
    // Try to get from header first (for API calls)
    const tierHeader = request.headers.get('X-User-Tier');
    if (tierHeader && ['starter', 'pro', 'enterprise'].includes(tierHeader)) {
      return tierHeader as SubscriptionTier;
    }

    // Try to get from query parameter
    const url = new URL(request.url);
    const tierParam = url.searchParams.get('tier');
    if (tierParam && ['starter', 'pro', 'enterprise'].includes(tierParam)) {
      return tierParam as SubscriptionTier;
    }

    // Default to starter if not specified
    return 'starter';
  } catch (error) {
    logger.warn('[TierGating] Error extracting tier from request', { error });
    return 'starter';
  }
}

/**
 * Create a tier-aware API response
 */
export function createTierAwareResponse<T>(data: T, tier: SubscriptionTier, feature: keyof ReturnType<typeof getTierFeatures>) {
  const canAccess = checkFeatureAccess(tier, feature);

  return {
    success: canAccess,
    data: canAccess ? data : null,
    tier,
    feature,
    requiresUpgrade: !canAccess,
    message: canAccess ? undefined : `This feature requires a higher tier subscription`,
  };
}
