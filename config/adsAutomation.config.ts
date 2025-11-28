/**
 * Ads Automation Configuration
 *
 * Configuration for Google Ads, Meta Ads, and TikTok Ads integration.
 */

export type AdProvider = 'google' | 'meta' | 'tiktok';

export interface AdProviderConfig {
  enabled: boolean;
  credentials: {
    clientIdEnv: string;
    clientSecretEnv: string;
    developerTokenEnv?: string;
    accessTokenEnv?: string;
  };
  apiVersion: string;
  rateLimits: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  features: {
    campaignRead: boolean;
    campaignWrite: boolean;
    budgetSuggestions: boolean;
    audienceSuggestions: boolean;
    creativeSuggestions: boolean;
  };
}

export interface OptimizationThresholds {
  // Performance thresholds
  ctrLow: number; // Click-through rate below this is concerning
  ctrHigh: number; // CTR above this is excellent
  conversionRateLow: number;
  conversionRateHigh: number;
  costPerConversionHigh: number; // Flag if CPC exceeds this multiplier of average
  roasLow: number; // Return on ad spend below this needs attention
  roasHigh: number; // ROAS above this is excellent

  // Budget thresholds
  budgetUtilizationLow: number; // Underspending threshold
  budgetUtilizationHigh: number; // Overspending threshold

  // Trend thresholds
  performanceDropPercentage: number; // Alert if performance drops by this %
  improvementOpportunityPercentage: number; // Suggest scaling if improvement by this %
}

export interface AdsAutomationConfig {
  enabled: boolean;
  defaultMode: 'suggestions_only' | 'auto_apply_safe' | 'full_auto';
  syncSettings: {
    pollIntervalMs: number;
    snapshotRetentionDays: number;
    metricsGranularity: 'daily' | 'hourly';
  };
  optimizationSettings: {
    enabled: boolean;
    runIntervalMs: number;
    maxSuggestionsPerCampaign: number;
    thresholds: OptimizationThresholds;
  };
  safetySettings: {
    maxBudgetIncreasePercentage: number;
    requireApprovalForBudgetChanges: boolean;
    requireApprovalForStatusChanges: boolean;
    requireApprovalForCreativeChanges: boolean;
    blockCampaignCreation: boolean;
    blockCampaignDeletion: boolean;
  };
  providers: Record<AdProvider, AdProviderConfig>;
}

export const adsAutomationConfig: AdsAutomationConfig = {
  enabled: process.env.ADS_AUTOMATION_ENABLED !== 'false',
  defaultMode: 'suggestions_only', // Safety: suggestions only by default

  syncSettings: {
    pollIntervalMs: 15 * 60 * 1000, // 15 minutes
    snapshotRetentionDays: 90,
    metricsGranularity: 'daily',
  },

  optimizationSettings: {
    enabled: true,
    runIntervalMs: 60 * 60 * 1000, // 1 hour
    maxSuggestionsPerCampaign: 5,
    thresholds: {
      ctrLow: 0.5, // 0.5% CTR is low
      ctrHigh: 3.0, // 3% CTR is excellent
      conversionRateLow: 1.0, // 1% conversion rate is low
      conversionRateHigh: 5.0, // 5% conversion rate is excellent
      costPerConversionHigh: 2.0, // 2x average CPC is concerning
      roasLow: 2.0, // ROAS below 2x needs attention
      roasHigh: 5.0, // ROAS above 5x is excellent
      budgetUtilizationLow: 0.6, // Under 60% utilization
      budgetUtilizationHigh: 0.95, // Over 95% utilization
      performanceDropPercentage: 20, // 20% drop triggers alert
      improvementOpportunityPercentage: 30, // 30% improvement suggests scaling
    },
  },

  safetySettings: {
    maxBudgetIncreasePercentage: 20, // Max 20% budget increase at a time
    requireApprovalForBudgetChanges: true,
    requireApprovalForStatusChanges: true,
    requireApprovalForCreativeChanges: true,
    blockCampaignCreation: true, // Never auto-create campaigns
    blockCampaignDeletion: true, // Never auto-delete campaigns
  },

  providers: {
    google: {
      enabled: !!process.env.GOOGLE_ADS_CLIENT_ID,
      credentials: {
        clientIdEnv: 'GOOGLE_ADS_CLIENT_ID',
        clientSecretEnv: 'GOOGLE_ADS_CLIENT_SECRET',
        developerTokenEnv: 'GOOGLE_ADS_DEVELOPER_TOKEN',
      },
      apiVersion: 'v16',
      rateLimits: {
        requestsPerMinute: 1500,
        requestsPerDay: 15000,
      },
      features: {
        campaignRead: true,
        campaignWrite: false, // Disabled by default for safety
        budgetSuggestions: true,
        audienceSuggestions: true,
        creativeSuggestions: true,
      },
    },

    meta: {
      enabled: !!process.env.META_ADS_APP_ID,
      credentials: {
        clientIdEnv: 'META_ADS_APP_ID',
        clientSecretEnv: 'META_ADS_APP_SECRET',
      },
      apiVersion: 'v19.0',
      rateLimits: {
        requestsPerMinute: 200,
        requestsPerDay: 5000,
      },
      features: {
        campaignRead: true,
        campaignWrite: false,
        budgetSuggestions: true,
        audienceSuggestions: true,
        creativeSuggestions: true,
      },
    },

    tiktok: {
      enabled: !!process.env.TIKTOK_ADS_ACCESS_TOKEN,
      credentials: {
        clientIdEnv: 'TIKTOK_APP_ID',
        clientSecretEnv: 'TIKTOK_APP_SECRET',
        accessTokenEnv: 'TIKTOK_ADS_ACCESS_TOKEN',
      },
      apiVersion: 'v1.3',
      rateLimits: {
        requestsPerMinute: 100,
        requestsPerDay: 1000,
      },
      features: {
        campaignRead: true,
        campaignWrite: false,
        budgetSuggestions: true,
        audienceSuggestions: true,
        creativeSuggestions: false, // TikTok creative is more complex
      },
    },
  },
};

export function isAdProviderEnabled(provider: AdProvider): boolean {
  return adsAutomationConfig.enabled && adsAutomationConfig.providers[provider]?.enabled === true;
}

export function getAdProviderConfig(provider: AdProvider): AdProviderConfig | null {
  if (!isAdProviderEnabled(provider)) return null;
  return adsAutomationConfig.providers[provider];
}

export function getEnabledAdProviders(): AdProvider[] {
  return (Object.keys(adsAutomationConfig.providers) as AdProvider[]).filter(isAdProviderEnabled);
}

export function canModifyCampaigns(provider: AdProvider): boolean {
  const config = getAdProviderConfig(provider);
  return config?.features.campaignWrite === true && !adsAutomationConfig.safetySettings.blockCampaignCreation;
}
