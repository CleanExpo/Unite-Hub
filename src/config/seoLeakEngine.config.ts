/**
 * SEO Leak Engine Configuration
 * Real-time SEO opportunity detection and analysis
 *
 * @module seoLeakEngine.config
 * @version 1.0.0
 */

/**
 * SEO Leak Engine recommendation intensity levels
 */
export type RecommendationIntensity =
  | 'minimal'
  | 'standard'
  | 'aggressive'
  | 'expert';

/**
 * SEO ranking factor with weight
 */
export interface SeoFactor {
  name: string;
  weight: number; // 0-100
  enabled: boolean;
  description: string;
}

/**
 * SEO Leak Engine configuration interface
 */
export interface SeoLeakEngineConfig {
  /** Enable/disable SEO Leak Engine */
  SEO_LEAK_ENGINE_ENABLED: boolean;

  /** Refresh interval for SEO analysis (hours) */
  SEO_LEAK_REFRESH_INTERVAL_HOURS: number;

  /** Maximum domains to track per business */
  SEO_LEAK_MAX_DOMAINS_PER_BUSINESS: number;

  /** Recommendation intensity: minimal, standard, aggressive, expert */
  SEO_LEAK_RECOMMENDATION_INTENSITY: RecommendationIntensity;

  /** Enable safe mode (validates changes before suggesting) */
  SEO_LEAK_SAFE_MODE: boolean;

  /** Query Intent factor weight (0-100) */
  SEO_LEAK_Q_STAR_WEIGHT: number;

  /** Page Quality factor weight (0-100) */
  SEO_LEAK_P_STAR_WEIGHT: number;

  /** Topic Quality factor weight (0-100) */
  SEO_LEAK_T_STAR_WEIGHT: number;

  /** NavBoost factor weight (0-100) */
  SEO_LEAK_NAVBOOST_WEIGHT: number;

  /** E-E-A-T (Experience, Expertise, Authority, Trustworthiness) weight (0-100) */
  SEO_LEAK_EEAT_WEIGHT: number;

  /** Sandbox (new domain penalty) factor weight (0-100) */
  SEO_LEAK_SANDBOX_WEIGHT: number;

  /** Spam detection factor weight (0-100) */
  SEO_LEAK_SPAM_WEIGHT: number;

  /** Topicality (content relevance) factor weight (0-100) */
  SEO_LEAK_TOPICALITY_WEIGHT: number;

  /** Enable backlink analysis */
  SEO_LEAK_BACKLINK_ANALYSIS_ENABLED: boolean;

  /** Enable content gap analysis */
  SEO_LEAK_CONTENT_GAP_ANALYSIS_ENABLED: boolean;

  /** Enable competitor tracking */
  SEO_LEAK_COMPETITOR_TRACKING_ENABLED: boolean;

  /** Minimum SEO score improvement to report (percentage) */
  SEO_LEAK_MIN_IMPROVEMENT_THRESHOLD: number;

  /** Cache analysis results for this many hours */
  SEO_LEAK_CACHE_HOURS: number;
}

/**
 * Default SEO Leak Engine factors
 */
export const DEFAULT_SEO_FACTORS: Record<string, SeoFactor> = {
  q_star: {
    name: 'Query Intent Match (Q*)',
    weight: 18,
    enabled: true,
    description: 'How well content matches user search intent',
  },
  p_star: {
    name: 'Page Quality (P*)',
    weight: 16,
    enabled: true,
    description: 'Overall quality metrics of the page',
  },
  t_star: {
    name: 'Topic Quality (T*)',
    weight: 14,
    enabled: true,
    description: 'Relevance and depth of topic coverage',
  },
  navboost: {
    name: 'NavBoost',
    weight: 15,
    enabled: true,
    description: 'Behavioral signals from Google Chrome data',
  },
  eeat: {
    name: 'E-E-A-T (Google Quality)',
    weight: 14,
    enabled: true,
    description: 'Experience, Expertise, Authority, Trustworthiness',
  },
  sandbox: {
    name: 'Sandbox (New Domain Penalty)',
    weight: 8,
    enabled: true,
    description: 'Trust penalty for new or low-authority domains',
  },
  spam: {
    name: 'Anti-Spam Signals',
    weight: 10,
    enabled: true,
    description: 'Detection of spam patterns and violations',
  },
  topicality: {
    name: 'Topicality',
    weight: 5,
    enabled: true,
    description: 'Semantic relevance to search queries',
  },
};

/**
 * SEO Leak Engine runtime configuration
 */
export const SEO_LEAK_ENGINE_CONFIG: SeoLeakEngineConfig = {
  SEO_LEAK_ENGINE_ENABLED:
    process.env.SEO_LEAK_ENGINE_ENABLED !== 'false',

  SEO_LEAK_REFRESH_INTERVAL_HOURS: parseInt(
    process.env.SEO_LEAK_REFRESH_INTERVAL_HOURS || '24',
    10
  ),

  SEO_LEAK_MAX_DOMAINS_PER_BUSINESS: parseInt(
    process.env.SEO_LEAK_MAX_DOMAINS_PER_BUSINESS || '10',
    10
  ),

  SEO_LEAK_RECOMMENDATION_INTENSITY:
    (process.env.SEO_LEAK_RECOMMENDATION_INTENSITY as RecommendationIntensity) ||
    'standard',

  SEO_LEAK_SAFE_MODE:
    process.env.SEO_LEAK_SAFE_MODE !== 'false',

  SEO_LEAK_Q_STAR_WEIGHT: parseInt(
    process.env.SEO_LEAK_Q_STAR_WEIGHT ||
      DEFAULT_SEO_FACTORS.q_star.weight.toString(),
    10
  ),

  SEO_LEAK_P_STAR_WEIGHT: parseInt(
    process.env.SEO_LEAK_P_STAR_WEIGHT ||
      DEFAULT_SEO_FACTORS.p_star.weight.toString(),
    10
  ),

  SEO_LEAK_T_STAR_WEIGHT: parseInt(
    process.env.SEO_LEAK_T_STAR_WEIGHT ||
      DEFAULT_SEO_FACTORS.t_star.weight.toString(),
    10
  ),

  SEO_LEAK_NAVBOOST_WEIGHT: parseInt(
    process.env.SEO_LEAK_NAVBOOST_WEIGHT ||
      DEFAULT_SEO_FACTORS.navboost.weight.toString(),
    10
  ),

  SEO_LEAK_EEAT_WEIGHT: parseInt(
    process.env.SEO_LEAK_EEAT_WEIGHT ||
      DEFAULT_SEO_FACTORS.eeat.weight.toString(),
    10
  ),

  SEO_LEAK_SANDBOX_WEIGHT: parseInt(
    process.env.SEO_LEAK_SANDBOX_WEIGHT ||
      DEFAULT_SEO_FACTORS.sandbox.weight.toString(),
    10
  ),

  SEO_LEAK_SPAM_WEIGHT: parseInt(
    process.env.SEO_LEAK_SPAM_WEIGHT ||
      DEFAULT_SEO_FACTORS.spam.weight.toString(),
    10
  ),

  SEO_LEAK_TOPICALITY_WEIGHT: parseInt(
    process.env.SEO_LEAK_TOPICALITY_WEIGHT ||
      DEFAULT_SEO_FACTORS.topicality.weight.toString(),
    10
  ),

  SEO_LEAK_BACKLINK_ANALYSIS_ENABLED:
    process.env.SEO_LEAK_BACKLINK_ANALYSIS_ENABLED !== 'false',

  SEO_LEAK_CONTENT_GAP_ANALYSIS_ENABLED:
    process.env.SEO_LEAK_CONTENT_GAP_ANALYSIS_ENABLED !== 'false',

  SEO_LEAK_COMPETITOR_TRACKING_ENABLED:
    process.env.SEO_LEAK_COMPETITOR_TRACKING_ENABLED !== 'false',

  SEO_LEAK_MIN_IMPROVEMENT_THRESHOLD: parseFloat(
    process.env.SEO_LEAK_MIN_IMPROVEMENT_THRESHOLD || '5'
  ),

  SEO_LEAK_CACHE_HOURS: parseInt(
    process.env.SEO_LEAK_CACHE_HOURS || '12',
    10
  ),
};

/**
 * Validate SEO Leak Engine configuration
 */
export function validateSeoLeakEngineConfig(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (SEO_LEAK_ENGINE_CONFIG.SEO_LEAK_REFRESH_INTERVAL_HOURS < 1) {
    errors.push('SEO_LEAK_REFRESH_INTERVAL_HOURS must be at least 1');
  }

  if (SEO_LEAK_ENGINE_CONFIG.SEO_LEAK_MAX_DOMAINS_PER_BUSINESS < 1) {
    errors.push('SEO_LEAK_MAX_DOMAINS_PER_BUSINESS must be at least 1');
  }

  const totalWeight =
    SEO_LEAK_ENGINE_CONFIG.SEO_LEAK_Q_STAR_WEIGHT +
    SEO_LEAK_ENGINE_CONFIG.SEO_LEAK_P_STAR_WEIGHT +
    SEO_LEAK_ENGINE_CONFIG.SEO_LEAK_T_STAR_WEIGHT +
    SEO_LEAK_ENGINE_CONFIG.SEO_LEAK_NAVBOOST_WEIGHT +
    SEO_LEAK_ENGINE_CONFIG.SEO_LEAK_EEAT_WEIGHT +
    SEO_LEAK_ENGINE_CONFIG.SEO_LEAK_SANDBOX_WEIGHT +
    SEO_LEAK_ENGINE_CONFIG.SEO_LEAK_SPAM_WEIGHT +
    SEO_LEAK_ENGINE_CONFIG.SEO_LEAK_TOPICALITY_WEIGHT;

  if (totalWeight !== 100) {
    errors.push(
      `SEO factor weights must sum to 100, got ${totalWeight}`
    );
  }

  if (
    SEO_LEAK_ENGINE_CONFIG.SEO_LEAK_MIN_IMPROVEMENT_THRESHOLD < 0 ||
    SEO_LEAK_ENGINE_CONFIG.SEO_LEAK_MIN_IMPROVEMENT_THRESHOLD > 100
  ) {
    errors.push(
      'SEO_LEAK_MIN_IMPROVEMENT_THRESHOLD must be between 0 and 100'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get all SEO factors as a weighted map
 */
export function getSeoFactorWeights(): Record<string, number> {
  return {
    q_star: SEO_LEAK_ENGINE_CONFIG.SEO_LEAK_Q_STAR_WEIGHT,
    p_star: SEO_LEAK_ENGINE_CONFIG.SEO_LEAK_P_STAR_WEIGHT,
    t_star: SEO_LEAK_ENGINE_CONFIG.SEO_LEAK_T_STAR_WEIGHT,
    navboost: SEO_LEAK_ENGINE_CONFIG.SEO_LEAK_NAVBOOST_WEIGHT,
    eeat: SEO_LEAK_ENGINE_CONFIG.SEO_LEAK_EEAT_WEIGHT,
    sandbox: SEO_LEAK_ENGINE_CONFIG.SEO_LEAK_SANDBOX_WEIGHT,
    spam: SEO_LEAK_ENGINE_CONFIG.SEO_LEAK_SPAM_WEIGHT,
    topicality: SEO_LEAK_ENGINE_CONFIG.SEO_LEAK_TOPICALITY_WEIGHT,
  };
}
