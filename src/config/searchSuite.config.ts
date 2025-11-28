/**
 * Search Suite Configuration
 * Multi-engine search monitoring, keyword tracking, and SERP analysis
 *
 * @module searchSuite.config
 * @version 1.0.0
 */

/**
 * Supported search engines
 */
export type SearchEngine = 'google' | 'bing' | 'brave' | 'duckduckgo';

/**
 * Keyword tracking strategies
 */
export type TrackingStrategy =
  | 'daily'
  | 'weekly'
  | 'bi_weekly'
  | 'monthly'
  | 'realtime';

/**
 * SERP feature types
 */
export type SerpFeature =
  | 'organic'
  | 'featured_snippet'
  | 'knowledge_panel'
  | 'news_box'
  | 'image_pack'
  | 'video_block'
  | 'shopping'
  | 'local_pack'
  | 'people_also_ask'
  | 'related_searches'
  | 'ads'
  | 'answer_box';

/**
 * Search engine configuration
 */
export interface SearchEngineConfig {
  name: string;
  enabled: boolean;
  apiType: 'rest' | 'scraping' | 'official_api';
  updateFrequencyHours: number;
  supportsLocalResults: boolean;
  supportsAutoComplete: boolean;
}

/**
 * Search Suite configuration interface
 */
export interface SearchSuiteConfig {
  /** Enable/disable search suite */
  SEARCH_SUITE_ENABLED: boolean;

  /** Search engine configurations */
  SEARCH_ENGINES: Record<SearchEngine, SearchEngineConfig>;

  /** Primary search engine for tracking */
  PRIMARY_SEARCH_ENGINE: SearchEngine;

  /** Keyword tracking strategy */
  KEYWORD_TRACKING_STRATEGY: TrackingStrategy;

  /** Interval for keyword tracking (hours) */
  KEYWORD_TRACKING_INTERVAL_HOURS: number;

  /** Enable SERP volatility detection */
  VOLATILITY_DETECTION_ENABLED: boolean;

  /** SERP feature tracking - which features to track */
  SERP_FEATURES_TO_TRACK: SerpFeature[];

  /** Maximum keywords to track per business */
  MAX_KEYWORDS_PER_BUSINESS: number;

  /** Enable position tracking history */
  POSITION_HISTORY_ENABLED: boolean;

  /** Days to retain position history */
  POSITION_HISTORY_RETENTION_DAYS: number;

  /** Enable rank change alerts */
  RANK_CHANGE_ALERT_ENABLED: boolean;

  /** Threshold for rank drop alerts (positions) */
  RANK_DROP_ALERT_THRESHOLD: number;

  /** Threshold for rank rise celebration (positions) */
  RANK_RISE_THRESHOLD: number;

  /** Enable keyword suggestions from SERP analysis */
  KEYWORD_SUGGESTIONS_ENABLED: boolean;

  /** Enable competitor keyword tracking */
  COMPETITOR_KEYWORD_TRACKING_ENABLED: boolean;

  /** Enable search intent classification */
  SEARCH_INTENT_CLASSIFICATION_ENABLED: boolean;

  /** Cache SERP data for this many hours */
  SERP_CACHE_HOURS: number;

  /** Enable mobile vs desktop tracking */
  MOBILE_DESKTOP_COMPARISON_ENABLED: boolean;

  /** Enable local vs national comparison */
  LOCAL_NATIONAL_COMPARISON_ENABLED: boolean;

  /** Enable SERP feature CTR estimation */
  CTR_ESTIMATION_ENABLED: boolean;

  /** Enable backlink ranking factor analysis */
  BACKLINK_ANALYSIS_ENABLED: boolean;

  /** Maximum SERP pages to analyze per keyword */
  MAX_SERP_PAGES: number;
}

/**
 * Default search engine configurations
 */
export const DEFAULT_SEARCH_ENGINE_CONFIGS: Record<
  SearchEngine,
  SearchEngineConfig
> = {
  google: {
    name: 'Google Search',
    enabled: true,
    apiType: 'official_api',
    updateFrequencyHours: 24,
    supportsLocalResults: true,
    supportsAutoComplete: true,
  },
  bing: {
    name: 'Bing Search',
    enabled: true,
    apiType: 'official_api',
    updateFrequencyHours: 24,
    supportsLocalResults: true,
    supportsAutoComplete: true,
  },
  brave: {
    name: 'Brave Search',
    enabled: true,
    apiType: 'official_api',
    updateFrequencyHours: 48,
    supportsLocalResults: false,
    supportsAutoComplete: false,
  },
  duckduckgo: {
    name: 'DuckDuckGo',
    enabled: true,
    apiType: 'scraping',
    updateFrequencyHours: 48,
    supportsLocalResults: false,
    supportsAutoComplete: false,
  },
};

/**
 * Search Suite runtime configuration
 */
export const SEARCH_SUITE_CONFIG: SearchSuiteConfig = {
  SEARCH_SUITE_ENABLED: process.env.SEARCH_SUITE_ENABLED !== 'false',

  SEARCH_ENGINES: Object.entries(DEFAULT_SEARCH_ENGINE_CONFIGS).reduce(
    (acc, [key, value]) => {
      const engineKey = key as SearchEngine;
      const envKey = `SEARCH_${key.toUpperCase()}_ENABLED`;
      acc[engineKey] = {
        ...value,
        enabled:
          process.env[envKey] !== undefined
            ? process.env[envKey] !== 'false'
            : value.enabled,
      };
      return acc;
    },
    {} as Record<SearchEngine, SearchEngineConfig>
  ),

  PRIMARY_SEARCH_ENGINE:
    (process.env.PRIMARY_SEARCH_ENGINE as SearchEngine) || 'google',

  KEYWORD_TRACKING_STRATEGY:
    (process.env.KEYWORD_TRACKING_STRATEGY as TrackingStrategy) || 'daily',

  KEYWORD_TRACKING_INTERVAL_HOURS: parseInt(
    process.env.KEYWORD_TRACKING_INTERVAL_HOURS || '24',
    10
  ),

  VOLATILITY_DETECTION_ENABLED:
    process.env.VOLATILITY_DETECTION_ENABLED !== 'false',

  SERP_FEATURES_TO_TRACK: (
    process.env.SERP_FEATURES_TO_TRACK
      ? process.env.SERP_FEATURES_TO_TRACK.split(',')
      : [
          'organic',
          'featured_snippet',
          'knowledge_panel',
          'local_pack',
          'people_also_ask',
        ]
  ) as SerpFeature[],

  MAX_KEYWORDS_PER_BUSINESS: parseInt(
    process.env.MAX_KEYWORDS_PER_BUSINESS || '500',
    10
  ),

  POSITION_HISTORY_ENABLED:
    process.env.POSITION_HISTORY_ENABLED !== 'false',

  POSITION_HISTORY_RETENTION_DAYS: parseInt(
    process.env.POSITION_HISTORY_RETENTION_DAYS || '365',
    10
  ),

  RANK_CHANGE_ALERT_ENABLED:
    process.env.RANK_CHANGE_ALERT_ENABLED !== 'false',

  RANK_DROP_ALERT_THRESHOLD: parseInt(
    process.env.RANK_DROP_ALERT_THRESHOLD || '5',
    10
  ),

  RANK_RISE_THRESHOLD: parseInt(
    process.env.RANK_RISE_THRESHOLD || '3',
    10
  ),

  KEYWORD_SUGGESTIONS_ENABLED:
    process.env.KEYWORD_SUGGESTIONS_ENABLED !== 'false',

  COMPETITOR_KEYWORD_TRACKING_ENABLED:
    process.env.COMPETITOR_KEYWORD_TRACKING_ENABLED !== 'false',

  SEARCH_INTENT_CLASSIFICATION_ENABLED:
    process.env.SEARCH_INTENT_CLASSIFICATION_ENABLED !== 'false',

  SERP_CACHE_HOURS: parseInt(process.env.SERP_CACHE_HOURS || '12', 10),

  MOBILE_DESKTOP_COMPARISON_ENABLED:
    process.env.MOBILE_DESKTOP_COMPARISON_ENABLED !== 'false',

  LOCAL_NATIONAL_COMPARISON_ENABLED:
    process.env.LOCAL_NATIONAL_COMPARISON_ENABLED !== 'false',

  CTR_ESTIMATION_ENABLED:
    process.env.CTR_ESTIMATION_ENABLED !== 'false',

  BACKLINK_ANALYSIS_ENABLED:
    process.env.BACKLINK_ANALYSIS_ENABLED !== 'false',

  MAX_SERP_PAGES: parseInt(
    process.env.MAX_SERP_PAGES || '10',
    10
  ),
};

/**
 * Validate Search Suite configuration
 */
export function validateSearchSuiteConfig(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (SEARCH_SUITE_CONFIG.KEYWORD_TRACKING_INTERVAL_HOURS < 1) {
    errors.push('KEYWORD_TRACKING_INTERVAL_HOURS must be at least 1');
  }

  if (SEARCH_SUITE_CONFIG.MAX_KEYWORDS_PER_BUSINESS < 1) {
    errors.push('MAX_KEYWORDS_PER_BUSINESS must be at least 1');
  }

  if (SEARCH_SUITE_CONFIG.POSITION_HISTORY_RETENTION_DAYS < 7) {
    errors.push(
      'POSITION_HISTORY_RETENTION_DAYS should be at least 7 for meaningful trends'
    );
  }

  if (SEARCH_SUITE_CONFIG.RANK_DROP_ALERT_THRESHOLD < 1) {
    errors.push('RANK_DROP_ALERT_THRESHOLD must be at least 1');
  }

  if (SEARCH_SUITE_CONFIG.MAX_SERP_PAGES < 1 || SEARCH_SUITE_CONFIG.MAX_SERP_PAGES > 100) {
    errors.push('MAX_SERP_PAGES must be between 1 and 100');
  }

  const enabledEngines = Object.values(SEARCH_SUITE_CONFIG.SEARCH_ENGINES).filter(
    (e) => e.enabled
  );
  if (SEARCH_SUITE_CONFIG.SEARCH_SUITE_ENABLED && enabledEngines.length === 0) {
    errors.push('At least one search engine must be enabled');
  }

  if (SEARCH_SUITE_CONFIG.SERP_FEATURES_TO_TRACK.length === 0) {
    errors.push('At least one SERP feature must be tracked');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get enabled search engines
 */
export function getEnabledSearchEngines(): SearchEngine[] {
  return Object.entries(SEARCH_SUITE_CONFIG.SEARCH_ENGINES)
    .filter(([, config]) => config.enabled)
    .map(([engine]) => engine as SearchEngine);
}

/**
 * Check if search engine is available
 */
export function isSearchEngineEnabled(engine: SearchEngine): boolean {
  return SEARCH_SUITE_CONFIG.SEARCH_ENGINES[engine]?.enabled || false;
}

/**
 * Get SERP feature tracking list
 */
export function getTrackedSerpFeatures(): SerpFeature[] {
  return SEARCH_SUITE_CONFIG.SERP_FEATURES_TO_TRACK;
}
