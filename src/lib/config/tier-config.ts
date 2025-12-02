/**
 * Tier Configuration
 * Phase 89C: Defines subscription tier access to Phase 89 intelligence features
 */

export type SubscriptionTier = 'starter' | 'pro' | 'enterprise';

export interface TierFeatures {
  // Phase 89A - Basic Intelligence Services
  keywordGapAnalysis: boolean;
  competitiveBenchmark: boolean;
  socialMediaMetrics: boolean;
  youtubeAnalytics: boolean;
  opportunityScoring: boolean;

  // Phase 89B - Geo Intelligence
  geoGridRanking: boolean;
  geoGridVisualization: boolean;
  localRankTracking: boolean;

  // Phase 89C - Advanced Features
  redisCaching: boolean;
  advancedReporting: boolean;
  monthlyIntelligenceReport: boolean;
  pdfExport: boolean;

  // Report features
  reportSections: number; // Max number of sections
  refreshFrequency: 'monthly' | 'weekly' | 'daily'; // Default refresh interval
  dataRetention: number; // Days to retain historical data
}

const TIER_FEATURES: Record<SubscriptionTier, TierFeatures> = {
  starter: {
    // Phase 89A - Basic Intelligence
    keywordGapAnalysis: true,
    competitiveBenchmark: false,
    socialMediaMetrics: true,
    youtubeAnalytics: false,
    opportunityScoring: false,

    // Phase 89B - Geo Intelligence
    geoGridRanking: false,
    geoGridVisualization: false,
    localRankTracking: false,

    // Phase 89C - Advanced Features
    redisCaching: false,
    advancedReporting: false,
    monthlyIntelligenceReport: false,
    pdfExport: false,

    // Report features
    reportSections: 3, // Only 3 sections for starter
    refreshFrequency: 'monthly',
    dataRetention: 30, // 30 days
  },
  pro: {
    // Phase 89A - All basic services
    keywordGapAnalysis: true,
    competitiveBenchmark: true,
    socialMediaMetrics: true,
    youtubeAnalytics: true,
    opportunityScoring: true,

    // Phase 89B - Geo Intelligence
    geoGridRanking: true,
    geoGridVisualization: true,
    localRankTracking: false,

    // Phase 89C - Advanced Features
    redisCaching: true,
    advancedReporting: true,
    monthlyIntelligenceReport: true,
    pdfExport: true,

    // Report features
    reportSections: 8, // 8 sections for pro (7-10 minimum)
    refreshFrequency: 'weekly',
    dataRetention: 90, // 90 days
  },
  enterprise: {
    // Phase 89A - All basic services
    keywordGapAnalysis: true,
    competitiveBenchmark: true,
    socialMediaMetrics: true,
    youtubeAnalytics: true,
    opportunityScoring: true,

    // Phase 89B - Geo Intelligence
    geoGridRanking: true,
    geoGridVisualization: true,
    localRankTracking: true,

    // Phase 89C - Advanced Features
    redisCaching: true,
    advancedReporting: true,
    monthlyIntelligenceReport: true,
    pdfExport: true,

    // Report features
    reportSections: 12, // Full 12 sections for enterprise (7-10 base + 2-5 custom)
    refreshFrequency: 'daily',
    dataRetention: 365, // 365 days (1 year)
  },
};

/**
 * Get tier features
 */
export function getTierFeatures(tier: SubscriptionTier): TierFeatures {
  return TIER_FEATURES[tier] || TIER_FEATURES.starter;
}

/**
 * Check if a feature is available for a tier
 */
export function isFeatureAvailable(tier: SubscriptionTier, feature: keyof TierFeatures): boolean {
  const features = getTierFeatures(tier);
  const value = features[feature];

  // Boolean features
  if (typeof value === 'boolean') {
    return value;
  }

  // Numeric features (always available, value represents limit)
  if (typeof value === 'number') {
    return true;
  }

  // String features (frequency, retention)
  return !!value;
}

/**
 * Get the number value for a tier feature
 */
export function getTierFeatureValue(tier: SubscriptionTier, feature: 'reportSections' | 'dataRetention'): number {
  const features = getTierFeatures(tier);
  return features[feature] as number;
}

/**
 * Get the refresh frequency for a tier
 */
export function getTierRefreshFrequency(tier: SubscriptionTier): 'monthly' | 'weekly' | 'daily' {
  const features = getTierFeatures(tier);
  return features.refreshFrequency;
}

/**
 * Check if a tier can access multiple report sections
 */
export function canAccessAdvancedReporting(tier: SubscriptionTier): boolean {
  const features = getTierFeatures(tier);
  return features.advancedReporting && features.reportSections >= 8;
}
