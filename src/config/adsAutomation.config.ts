/**
 * Ads Automation Configuration
 * Multi-platform advertising automation and optimization
 *
 * @module adsAutomation.config
 * @version 1.0.0
 */

/**
 * Supported advertising platforms
 */
export type AdsPlatform =
  | 'google_ads'
  | 'facebook_ads'
  | 'instagram_ads'
  | 'linkedin_ads'
  | 'tiktok_ads'
  | 'amazon_ads'
  | 'microsoft_ads'
  | 'pinterest_ads';

/**
 * Ad optimization strategies
 */
export type OptimizationStrategy =
  | 'cost_per_acquisition'
  | 'return_on_ad_spend'
  | 'click_through_rate'
  | 'impressions'
  | 'conversions'
  | 'engagement';

/**
 * Budget allocation strategies
 */
export type BudgetStrategy =
  | 'equal_distribution'
  | 'performance_based'
  | 'seasonal'
  | 'manual';

/**
 * Ad platform configuration
 */
export interface AdPlatformConfig {
  name: string;
  enabled: boolean;
  apiType: 'rest' | 'graphql';
  authType: 'oauth2' | 'api_key';
  minDailyBudget: number;
  maxDailyBudget: number;
  supportsConversions: boolean;
  supportsAttributionModeling: boolean;
}

/**
 * Ads Automation configuration interface
 */
export interface AdsAutomationConfig {
  /** Enable/disable ads automation system */
  ADS_AUTOMATION_ENABLED: boolean;

  /** Platform-specific configurations */
  PLATFORMS: Record<AdsPlatform, AdPlatformConfig>;

  /** Enable auto-optimization (AI suggestions only - human approved) */
  AUTO_OPTIMIZATION_ENABLED: boolean;

  /** Primary optimization strategy */
  PRIMARY_OPTIMIZATION_STRATEGY: OptimizationStrategy;

  /** Budget allocation strategy */
  BUDGET_ALLOCATION_STRATEGY: BudgetStrategy;

  /** Enable budget reallocation across platforms */
  DYNAMIC_BUDGET_REALLOCATION_ENABLED: boolean;

  /** Enable opportunity detection for underperforming ads */
  OPPORTUNITY_DETECTION_ENABLED: boolean;

  /** Enable A/B testing recommendations */
  AB_TESTING_ENABLED: boolean;

  /** Lower budget alert threshold (percentage of daily budget) */
  BUDGET_ALERT_THRESHOLD_PERCENT: number;

  /** Maximum daily spend across all ads */
  MAX_DAILY_SPEND_ACROSS_PLATFORMS: number;

  /** Enable spend pace monitoring */
  SPEND_PACE_MONITORING_ENABLED: boolean;

  /** Enable competitor ad tracking */
  COMPETITOR_AD_TRACKING_ENABLED: boolean;

  /** Enable keyword bid management */
  KEYWORD_BID_MANAGEMENT_ENABLED: boolean;

  /** Enable audience targeting optimization */
  AUDIENCE_TARGETING_ENABLED: boolean;

  /** Cache ads data for this many hours */
  ADS_CACHE_HOURS: number;

  /** Enable creative performance analysis */
  CREATIVE_ANALYSIS_ENABLED: boolean;

  /** Enable landing page optimization suggestions */
  LANDING_PAGE_OPTIMIZATION_ENABLED: boolean;

  /** Minimum ROAS threshold to consider ad profitable */
  MIN_ROAS_THRESHOLD: number;

  /** Maximum cost-per-acquisition threshold (if set) */
  MAX_CPA_THRESHOLD: number | null;
}

/**
 * Default platform configurations
 */
export const DEFAULT_PLATFORM_CONFIGS: Record<AdsPlatform, AdPlatformConfig> =
  {
    google_ads: {
      name: 'Google Ads',
      enabled: true,
      apiType: 'rest',
      authType: 'oauth2',
      minDailyBudget: 5,
      maxDailyBudget: 100000,
      supportsConversions: true,
      supportsAttributionModeling: true,
    },
    facebook_ads: {
      name: 'Facebook Ads',
      enabled: true,
      apiType: 'graphql',
      authType: 'oauth2',
      minDailyBudget: 1,
      maxDailyBudget: 50000,
      supportsConversions: true,
      supportsAttributionModeling: true,
    },
    instagram_ads: {
      name: 'Instagram Ads',
      enabled: true,
      apiType: 'graphql',
      authType: 'oauth2',
      minDailyBudget: 1,
      maxDailyBudget: 50000,
      supportsConversions: true,
      supportsAttributionModeling: true,
    },
    linkedin_ads: {
      name: 'LinkedIn Ads',
      enabled: true,
      apiType: 'rest',
      authType: 'oauth2',
      minDailyBudget: 10,
      maxDailyBudget: 20000,
      supportsConversions: true,
      supportsAttributionModeling: false,
    },
    tiktok_ads: {
      name: 'TikTok Ads',
      enabled: true,
      apiType: 'rest',
      authType: 'oauth2',
      minDailyBudget: 5,
      maxDailyBudget: 10000,
      supportsConversions: true,
      supportsAttributionModeling: false,
    },
    amazon_ads: {
      name: 'Amazon Ads',
      enabled: true,
      apiType: 'rest',
      authType: 'api_key',
      minDailyBudget: 10,
      maxDailyBudget: 50000,
      supportsConversions: true,
      supportsAttributionModeling: true,
    },
    microsoft_ads: {
      name: 'Microsoft Ads',
      enabled: true,
      apiType: 'rest',
      authType: 'oauth2',
      minDailyBudget: 5,
      maxDailyBudget: 30000,
      supportsConversions: true,
      supportsAttributionModeling: true,
    },
    pinterest_ads: {
      name: 'Pinterest Ads',
      enabled: true,
      apiType: 'rest',
      authType: 'oauth2',
      minDailyBudget: 5,
      maxDailyBudget: 10000,
      supportsConversions: true,
      supportsAttributionModeling: true,
    },
  };

/**
 * Ads Automation runtime configuration
 */
export const ADS_AUTOMATION_CONFIG: AdsAutomationConfig = {
  ADS_AUTOMATION_ENABLED: process.env.ADS_AUTOMATION_ENABLED !== 'false',

  PLATFORMS: Object.entries(DEFAULT_PLATFORM_CONFIGS).reduce(
    (acc, [key, value]) => {
      const platformKey = key as AdsPlatform;
      const envKey = `ADS_${key.toUpperCase()}_ENABLED`;
      acc[platformKey] = {
        ...value,
        enabled:
          process.env[envKey] !== undefined
            ? process.env[envKey] !== 'false'
            : value.enabled,
      };
      return acc;
    },
    {} as Record<AdsPlatform, AdPlatformConfig>
  ),

  AUTO_OPTIMIZATION_ENABLED:
    process.env.AUTO_OPTIMIZATION_ENABLED === 'true', // Default false

  PRIMARY_OPTIMIZATION_STRATEGY:
    (process.env.PRIMARY_OPTIMIZATION_STRATEGY as OptimizationStrategy) ||
    'return_on_ad_spend',

  BUDGET_ALLOCATION_STRATEGY:
    (process.env.BUDGET_ALLOCATION_STRATEGY as BudgetStrategy) ||
    'performance_based',

  DYNAMIC_BUDGET_REALLOCATION_ENABLED:
    process.env.DYNAMIC_BUDGET_REALLOCATION_ENABLED === 'true',

  OPPORTUNITY_DETECTION_ENABLED:
    process.env.OPPORTUNITY_DETECTION_ENABLED !== 'false',

  AB_TESTING_ENABLED: process.env.AB_TESTING_ENABLED !== 'false',

  BUDGET_ALERT_THRESHOLD_PERCENT: parseFloat(
    process.env.BUDGET_ALERT_THRESHOLD_PERCENT || '80'
  ),

  MAX_DAILY_SPEND_ACROSS_PLATFORMS: parseFloat(
    process.env.MAX_DAILY_SPEND_ACROSS_PLATFORMS || '10000'
  ),

  SPEND_PACE_MONITORING_ENABLED:
    process.env.SPEND_PACE_MONITORING_ENABLED !== 'false',

  COMPETITOR_AD_TRACKING_ENABLED:
    process.env.COMPETITOR_AD_TRACKING_ENABLED !== 'false',

  KEYWORD_BID_MANAGEMENT_ENABLED:
    process.env.KEYWORD_BID_MANAGEMENT_ENABLED !== 'false',

  AUDIENCE_TARGETING_ENABLED:
    process.env.AUDIENCE_TARGETING_ENABLED !== 'false',

  ADS_CACHE_HOURS: parseInt(process.env.ADS_CACHE_HOURS || '4', 10),

  CREATIVE_ANALYSIS_ENABLED:
    process.env.CREATIVE_ANALYSIS_ENABLED !== 'false',

  LANDING_PAGE_OPTIMIZATION_ENABLED:
    process.env.LANDING_PAGE_OPTIMIZATION_ENABLED !== 'false',

  MIN_ROAS_THRESHOLD: parseFloat(
    process.env.MIN_ROAS_THRESHOLD || '2.0'
  ),

  MAX_CPA_THRESHOLD: process.env.MAX_CPA_THRESHOLD
    ? parseFloat(process.env.MAX_CPA_THRESHOLD)
    : null,
};

/**
 * Validate Ads Automation configuration
 */
export function validateAdsAutomationConfig(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (ADS_AUTOMATION_CONFIG.BUDGET_ALERT_THRESHOLD_PERCENT < 0 ||
      ADS_AUTOMATION_CONFIG.BUDGET_ALERT_THRESHOLD_PERCENT > 100) {
    errors.push(
      'BUDGET_ALERT_THRESHOLD_PERCENT must be between 0 and 100'
    );
  }

  if (ADS_AUTOMATION_CONFIG.MAX_DAILY_SPEND_ACROSS_PLATFORMS < 0) {
    errors.push(
      'MAX_DAILY_SPEND_ACROSS_PLATFORMS must be greater than or equal to 0'
    );
  }

  if (ADS_AUTOMATION_CONFIG.MIN_ROAS_THRESHOLD < 0) {
    errors.push('MIN_ROAS_THRESHOLD must be greater than or equal to 0');
  }

  if (
    ADS_AUTOMATION_CONFIG.MAX_CPA_THRESHOLD !== null &&
    ADS_AUTOMATION_CONFIG.MAX_CPA_THRESHOLD < 0
  ) {
    errors.push('MAX_CPA_THRESHOLD must be greater than or equal to 0');
  }

  const enabledPlatforms = Object.values(
    ADS_AUTOMATION_CONFIG.PLATFORMS
  ).filter((p) => p.enabled);
  if (ADS_AUTOMATION_CONFIG.ADS_AUTOMATION_ENABLED && enabledPlatforms.length === 0) {
    errors.push('At least one platform must be enabled');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get enabled ad platforms
 */
export function getEnabledAdsPlatforms(): AdsPlatform[] {
  return Object.entries(ADS_AUTOMATION_CONFIG.PLATFORMS)
    .filter(([, config]) => config.enabled)
    .map(([platform]) => platform as AdsPlatform);
}

/**
 * Get total platform count
 */
export function getAdsPlatformCount(): { total: number; enabled: number } {
  const all = Object.keys(ADS_AUTOMATION_CONFIG.PLATFORMS).length;
  const enabled = getEnabledAdsPlatforms().length;
  return { total: all, enabled };
}
