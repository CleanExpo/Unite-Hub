/**
 * Tier Validation Utility
 * Validates feature access based on subscription tier
 */

export type SubscriptionPlan = "starter" | "professional" | "enterprise";

export interface TierLimits {
  clients: number;
  emailAddresses: number;
  assetStorage: number; // in MB
  personaCount: number;
  platformsAvailable: string[];
  hooksLimit: number;
  imagesPerConcept: number;
  exportFormats: string[];
  hasVideoSupport: boolean;
  hasWebsiteRecommendations: boolean;
  hasEmailSequences: boolean;
  hasCompetitorAnalysis: boolean;
  hasPerformanceRecs: boolean;
  hasAPIAccess: boolean;
}

const TIER_LIMITS: Record<SubscriptionPlan, TierLimits> = {
  starter: {
    clients: 1,
    emailAddresses: 5,
    assetStorage: 100, // 100MB
    personaCount: 1,
    platformsAvailable: ["facebook"],
    hooksLimit: 20,
    imagesPerConcept: 3,
    exportFormats: ["pdf"],
    hasVideoSupport: false,
    hasWebsiteRecommendations: false,
    hasEmailSequences: false,
    hasCompetitorAnalysis: false,
    hasPerformanceRecs: false,
    hasAPIAccess: false,
  },
  professional: {
    clients: 1,
    emailAddresses: -1, // unlimited
    assetStorage: -1, // unlimited
    personaCount: -1, // unlimited
    platformsAvailable: ["facebook", "instagram", "tiktok", "linkedin"],
    hooksLimit: -1, // unlimited
    imagesPerConcept: 5,
    exportFormats: ["pdf", "json", "docx"],
    hasVideoSupport: true,
    hasWebsiteRecommendations: true,
    hasEmailSequences: true,
    hasCompetitorAnalysis: true,
    hasPerformanceRecs: true,
    hasAPIAccess: true,
  },
  enterprise: {
    clients: -1, // unlimited
    emailAddresses: -1, // unlimited
    assetStorage: -1, // unlimited
    personaCount: -1, // unlimited
    platformsAvailable: ["facebook", "instagram", "tiktok", "linkedin"],
    hooksLimit: -1, // unlimited
    imagesPerConcept: 10,
    exportFormats: ["pdf", "json", "docx", "html"],
    hasVideoSupport: true,
    hasWebsiteRecommendations: true,
    hasEmailSequences: true,
    hasCompetitorAnalysis: true,
    hasPerformanceRecs: true,
    hasAPIAccess: true,
  },
};

export class TierValidator {
  private plan: SubscriptionPlan;
  private limits: TierLimits;

  constructor(plan: SubscriptionPlan = "starter") {
    this.plan = plan;
    this.limits = TIER_LIMITS[plan];
  }

  /**
   * Check if a feature is available in the current tier
   */
  hasFeature(feature: keyof TierLimits): boolean {
    const value = this.limits[feature];
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "number") {
      return value > 0 || value === -1; // -1 means unlimited
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return false;
  }

  /**
   * Check if a platform is available in the current tier
   */
  isPlatformAvailable(platform: string): boolean {
    return this.limits.platformsAvailable.includes(platform.toLowerCase());
  }

  /**
   * Check if an export format is available in the current tier
   */
  isExportFormatAvailable(format: string): boolean {
    return this.limits.exportFormats.includes(format.toLowerCase());
  }

  /**
   * Check if a limit has been reached
   */
  hasReachedLimit(
    feature: keyof TierLimits,
    currentCount: number
  ): { reached: boolean; limit: number; message?: string } {
    const limit = this.limits[feature];

    if (typeof limit !== "number") {
      return {
        reached: false,
        limit: 0,
        message: "Feature does not have a numeric limit",
      };
    }

    // -1 means unlimited
    if (limit === -1) {
      return { reached: false, limit: -1 };
    }

    const reached = currentCount >= limit;
    return {
      reached,
      limit,
      message: reached
        ? `You have reached the limit of ${limit} for this feature. Upgrade to Professional for unlimited access.`
        : undefined,
    };
  }

  /**
   * Get all limits for the current tier
   */
  getLimits(): TierLimits {
    return { ...this.limits };
  }

  /**
   * Get the current plan
   */
  getPlan(): SubscriptionPlan {
    return this.plan;
  }

  /**
   * Get upgrade message for a feature
   */
  getUpgradeMessage(feature: string): string {
    if (this.plan === "starter") {
      return `This feature requires Professional plan. Upgrade now to unlock ${feature}!`;
    }
    if (this.plan === "professional") {
      return `This feature is available in Enterprise plan. Contact us to upgrade.`;
    }
    return "Feature not available in current plan.";
  }

  /**
   * Validate multiple features at once
   */
  validateFeatures(features: string[]): {
    valid: boolean;
    missing: string[];
    message?: string;
  } {
    const missing: string[] = [];

    for (const feature of features) {
      if (feature === "video" && !this.limits.hasVideoSupport) {
        missing.push("Video support");
      }
      if (feature === "api" && !this.limits.hasAPIAccess) {
        missing.push("API access");
      }
      if (feature === "competitor_analysis" && !this.limits.hasCompetitorAnalysis) {
        missing.push("Competitor analysis");
      }
      if (feature === "email_sequences" && !this.limits.hasEmailSequences) {
        missing.push("Email sequences");
      }
    }

    return {
      valid: missing.length === 0,
      missing,
      message:
        missing.length > 0
          ? `The following features are not available in your plan: ${missing.join(", ")}`
          : undefined,
    };
  }
}

/**
 * Helper function to create a tier validator
 */
export function createTierValidator(plan: SubscriptionPlan): TierValidator {
  return new TierValidator(plan);
}

/**
 * Helper function to get tier limits
 */
export function getTierLimits(plan: SubscriptionPlan): TierLimits {
  return TIER_LIMITS[plan];
}
