/**
 * Founder Intelligence OS - Configuration Index
 * Central export point for all system configurations
 *
 * @module config
 * @version 1.0.0
 */

// Founder OS Core Configuration
export {
  type GovernanceMode,
  type FounderOSRegion,
  type FounderOSConfig,
  FOUNDER_OS_CONFIG,
  validateFounderOSConfig,
  getFounderOSConfig,
} from './founderOS.config';

// AI Phill Configuration
export {
  type AiPhillGovernanceMode,
  type AiPhillIntent,
  type AiPhillPersona,
  type AiPhillConfig,
  AI_PHILL_CONFIG,
  validateAiPhillConfig,
  isAiPhillIntentAllowed,
} from './aiPhill.config';

// SEO Leak Engine Configuration
export {
  type RecommendationIntensity,
  type SeoFactor,
  type SeoLeakEngineConfig,
  SEO_LEAK_ENGINE_CONFIG,
  DEFAULT_SEO_FACTORS,
  validateSeoLeakEngineConfig,
  getSeoFactorWeights,
} from './seoLeakEngine.config';

// Boost Bump Configuration
export {
  type BoostBumpGovernanceMode,
  type GeoTarget,
  type BoostBumpConfig,
  BOOST_BUMP_CONFIG,
  BOOST_BUMP_OPTIMIZATION_AREAS,
  validateBoostBumpConfig,
  getBoostBumpOptimizationWeights,
} from './boostBump.config';

// Social Engagement Configuration
export {
  type SocialPlatform,
  type MessageType,
  type SentimentScore,
  type SocialEngagementConfig,
  SOCIAL_ENGAGEMENT_CONFIG,
  validateSocialEngagementConfig,
  getEnabledPlatforms,
  getPlatformConfig,
} from './socialEngagement.config';

// Ads Automation Configuration
export {
  type AdsPlatform,
  type OptimizationStrategy,
  type BudgetStrategy,
  type AdsAutomationConfig,
  ADS_AUTOMATION_CONFIG,
  validateAdsAutomationConfig,
  getEnabledAdsPlatforms,
  getAdsPlatformCount,
} from './adsAutomation.config';

// Search Suite Configuration
export {
  type SearchEngine,
  type TrackingStrategy,
  type SerpFeature,
  type SearchSuiteConfig,
  SEARCH_SUITE_CONFIG,
  validateSearchSuiteConfig,
  getEnabledSearchEngines,
  isSearchEngineEnabled,
  getTrackedSerpFeatures,
} from './searchSuite.config';

// Browser Automation Configuration
export {
  type Browser,
  type ExecutionMode,
  type PatternType,
  type ActionType,
  type AutomationPattern,
  type BrowserAutomationBoostConfig,
  BROWSER_AUTOMATION_BOOST_CONFIG,
  DEFAULT_AUTOMATION_PATTERNS,
  validateBrowserAutomationBoostConfig,
  getSupportedBrowsers,
  isBrowserSupported,
  getDefaultPatterns,
} from './browserAutomationBoost.config';

// Email Ingestion Configuration
export {
  type EmailProvider,
  type ThreadClusteringStrategy,
  type IngestionStatus,
  type OpportunityType,
  type EmailMetadata,
  type EmailIngestionConfig,
  EMAIL_INGESTION_CONFIG,
  OPPORTUNITY_PATTERNS,
  validateEmailIngestionConfig,
  getOpportunityPatterns,
  detectOpportunityType,
  getOpportunityPriority,
} from './emailIngestion.config';

// Connected Apps Configuration
export {
  type OAuthProvider,
  type OAuthScope,
  type OAuthProviderConfig,
  type ConnectedApp,
  type ConnectedAppsConfig,
  CONNECTED_APPS_CONFIG,
  DEFAULT_OAUTH_PROVIDERS,
  validateConnectedAppsConfig,
  getEnabledOAuthProviders,
  getOAuthProviderConfig,
} from './connectedApps.config';

/**
 * Master configuration object containing all system configurations
 */
export const MASTER_CONFIG = {
  founderOS: FOUNDER_OS_CONFIG,
  aiPhill: AI_PHILL_CONFIG,
  seoLeakEngine: SEO_LEAK_ENGINE_CONFIG,
  boostBump: BOOST_BUMP_CONFIG,
  socialEngagement: SOCIAL_ENGAGEMENT_CONFIG,
  adsAutomation: ADS_AUTOMATION_CONFIG,
  searchSuite: SEARCH_SUITE_CONFIG,
  browserAutomation: BROWSER_AUTOMATION_BOOST_CONFIG,
  emailIngestion: EMAIL_INGESTION_CONFIG,
  connectedApps: CONNECTED_APPS_CONFIG,
} as const;

/**
 * Validate all configurations at startup
 */
export function validateAllConfigs(): {
  valid: boolean;
  results: Record<string, { valid: boolean; errors: string[] }>;
} {
  const results: Record<string, { valid: boolean; errors: string[] }> = {
    founderOS: validateFounderOSConfig(),
    aiPhill: validateAiPhillConfig(),
    seoLeakEngine: validateSeoLeakEngineConfig(),
    boostBump: validateBoostBumpConfig(),
    socialEngagement: validateSocialEngagementConfig(),
    adsAutomation: validateAdsAutomationConfig(),
    searchSuite: validateSearchSuiteConfig(),
    browserAutomation: validateBrowserAutomationBoostConfig(),
    emailIngestion: validateEmailIngestionConfig(),
    connectedApps: validateConnectedAppsConfig(),
  };

  const allValid = Object.values(results).every((r) => r.valid);

  return {
    valid: allValid,
    results,
  };
}

/**
 * Log configuration validation results
 */
export function logConfigValidationResults(): void {
  const validation = validateAllConfigs();

  console.log('\n=== FOUNDER INTELLIGENCE OS - CONFIGURATION VALIDATION ===\n');

  if (validation.valid) {
    console.log(
      '✅ All configurations validated successfully\n'
    );
  } else {
    console.error(
      '❌ Configuration validation found errors:\n'
    );
  }

  for (const [name, result] of Object.entries(validation.results)) {
    if (result.valid) {
      console.log(`✅ ${name}`);
    } else {
      console.error(`❌ ${name}`);
      result.errors.forEach((error) => {
        console.error(`   - ${error}`);
      });
    }
  }

  console.log('\n=== END VALIDATION ===\n');
}

/**
 * Get configuration summary
 */
export function getConfigurationSummary(): {
  modulesEnabled: string[];
  modulesDisabled: string[];
  criticalSettings: Record<string, unknown>;
} {
  return {
    modulesEnabled: [
      FOUNDER_OS_CONFIG.FOUNDER_OS_ENABLED && 'Founder OS',
      AI_PHILL_CONFIG.AI_PHILL_ENABLED && 'AI Phill',
      SEO_LEAK_ENGINE_CONFIG.SEO_LEAK_ENGINE_ENABLED && 'SEO Leak Engine',
      BOOST_BUMP_CONFIG.BOOST_BUMP_ENABLED && 'Boost Bump',
      SOCIAL_ENGAGEMENT_CONFIG.SOCIAL_ENGAGEMENT_ENABLED && 'Social Engagement',
      ADS_AUTOMATION_CONFIG.ADS_AUTOMATION_ENABLED && 'Ads Automation',
      SEARCH_SUITE_CONFIG.SEARCH_SUITE_ENABLED && 'Search Suite',
      BROWSER_AUTOMATION_BOOST_CONFIG.BROWSER_AUTOMATION_ENABLED &&
        'Browser Automation',
      EMAIL_INGESTION_CONFIG.EMAIL_INGESTION_ENABLED && 'Email Ingestion',
      CONNECTED_APPS_CONFIG.CONNECTED_APPS_ENABLED && 'Connected Apps',
    ].filter(Boolean) as string[],
    modulesDisabled: [
      !FOUNDER_OS_CONFIG.FOUNDER_OS_ENABLED && 'Founder OS',
      !AI_PHILL_CONFIG.AI_PHILL_ENABLED && 'AI Phill',
      !SEO_LEAK_ENGINE_CONFIG.SEO_LEAK_ENGINE_ENABLED && 'SEO Leak Engine',
      !BOOST_BUMP_CONFIG.BOOST_BUMP_ENABLED && 'Boost Bump',
      !SOCIAL_ENGAGEMENT_CONFIG.SOCIAL_ENGAGEMENT_ENABLED && 'Social Engagement',
      !ADS_AUTOMATION_CONFIG.ADS_AUTOMATION_ENABLED && 'Ads Automation',
      !SEARCH_SUITE_CONFIG.SEARCH_SUITE_ENABLED && 'Search Suite',
      !BROWSER_AUTOMATION_BOOST_CONFIG.BROWSER_AUTOMATION_ENABLED &&
        'Browser Automation',
      !EMAIL_INGESTION_CONFIG.EMAIL_INGESTION_ENABLED && 'Email Ingestion',
      !CONNECTED_APPS_CONFIG.CONNECTED_APPS_ENABLED && 'Connected Apps',
    ].filter(Boolean) as string[],
    criticalSettings: {
      governance: FOUNDER_OS_CONFIG.FOUNDER_OS_GOVERNANCE_MODE,
      aiPhillModel: AI_PHILL_CONFIG.AI_PHILL_MODEL,
      maxConcurrentJobs: FOUNDER_OS_CONFIG.FOUNDER_OS_MAX_CONCURRENT_JOBS,
      signalAggregationHours:
        FOUNDER_OS_CONFIG.FOUNDER_OS_SIGNAL_AGGREGATION_INTERVAL_HOURS,
      emailSyncIntervalMinutes:
        EMAIL_INGESTION_CONFIG.EMAIL_SYNC_INTERVAL_MINUTES,
      autoOptimizationEnabled:
        ADS_AUTOMATION_CONFIG.AUTO_OPTIMIZATION_ENABLED,
    },
  };
}
