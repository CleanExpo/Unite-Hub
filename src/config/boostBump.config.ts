/**
 * Boost Bump Engine Configuration
 * Google Business Profile, Maps, and local search optimization
 *
 * @module boostBump.config
 * @version 1.0.0
 */

/**
 * Boost Bump governance modes
 */
export type BoostBumpGovernanceMode =
  | 'HUMAN_GOVERNED'
  | 'AI_ASSISTED'
  | 'AUTONOMOUS';

/**
 * Geo-targeting levels
 */
export type GeoTarget = 'CITY' | 'REGION' | 'STATE' | 'COUNTRY' | 'NATIONAL';

/**
 * Boost Bump configuration interface
 */
export interface BoostBumpConfig {
  /** Enable/disable Boost Bump engine */
  BOOST_BUMP_ENABLED: boolean;

  /** Governance mode for Boost Bump decision-making */
  BOOST_BUMP_GOVERNANCE_MODE: BoostBumpGovernanceMode;

  /** Maximum daily boosts per business */
  BOOST_BUMP_MAX_DAILY_BOOSTS: number;

  /** Default geo-targeting level */
  BOOST_BUMP_DEFAULT_GEO_TARGET: GeoTarget;

  /** Enable CTR (Click-Through Rate) simulation */
  BOOST_BUMP_CTR_SIMULATION_ENABLED: boolean;

  /** Enable video retention optimization */
  BOOST_BUMP_VIDEO_RETENTION_ENABLED: boolean;

  /** Enable Maps persona-based optimization */
  BOOST_BUMP_MAPS_PERSONA_ENABLED: boolean;

  /** Enable safe mode (validates changes before applying) */
  BOOST_BUMP_SAFE_MODE: boolean;

  /** Enable Google Business Profile optimization */
  BOOST_BUMP_GBP_OPTIMIZATION_ENABLED: boolean;

  /** Enable local pack optimization (top 3 maps results) */
  BOOST_BUMP_LOCAL_PACK_OPTIMIZATION_ENABLED: boolean;

  /** Maximum number of active boosts per business */
  BOOST_BUMP_MAX_ACTIVE_BOOSTS: number;

  /** Boost duration in days before re-evaluation */
  BOOST_BUMP_DEFAULT_BOOST_DURATION_DAYS: number;

  /** Minimum boost impact threshold (0-100) to recommend */
  BOOST_BUMP_MIN_IMPACT_THRESHOLD: number;

  /** Enable competitor Maps tracking */
  BOOST_BUMP_COMPETITOR_TRACKING_ENABLED: boolean;

  /** Enable review sentiment analysis */
  BOOST_BUMP_REVIEW_SENTIMENT_ENABLED: boolean;

  /** Cache boost analysis for this many hours */
  BOOST_BUMP_CACHE_HOURS: number;
}

/**
 * Boost Bump runtime configuration
 */
export const BOOST_BUMP_CONFIG: BoostBumpConfig = {
  BOOST_BUMP_ENABLED: process.env.BOOST_BUMP_ENABLED !== 'false',

  BOOST_BUMP_GOVERNANCE_MODE:
    (process.env.BOOST_BUMP_GOVERNANCE_MODE as BoostBumpGovernanceMode) ||
    'HUMAN_GOVERNED',

  BOOST_BUMP_MAX_DAILY_BOOSTS: parseInt(
    process.env.BOOST_BUMP_MAX_DAILY_BOOSTS || '10',
    10
  ),

  BOOST_BUMP_DEFAULT_GEO_TARGET:
    (process.env.BOOST_BUMP_DEFAULT_GEO_TARGET as GeoTarget) || 'CITY',

  BOOST_BUMP_CTR_SIMULATION_ENABLED:
    process.env.BOOST_BUMP_CTR_SIMULATION_ENABLED !== 'false',

  BOOST_BUMP_VIDEO_RETENTION_ENABLED:
    process.env.BOOST_BUMP_VIDEO_RETENTION_ENABLED !== 'false',

  BOOST_BUMP_MAPS_PERSONA_ENABLED:
    process.env.BOOST_BUMP_MAPS_PERSONA_ENABLED !== 'false',

  BOOST_BUMP_SAFE_MODE:
    process.env.BOOST_BUMP_SAFE_MODE !== 'false',

  BOOST_BUMP_GBP_OPTIMIZATION_ENABLED:
    process.env.BOOST_BUMP_GBP_OPTIMIZATION_ENABLED !== 'false',

  BOOST_BUMP_LOCAL_PACK_OPTIMIZATION_ENABLED:
    process.env.BOOST_BUMP_LOCAL_PACK_OPTIMIZATION_ENABLED !== 'false',

  BOOST_BUMP_MAX_ACTIVE_BOOSTS: parseInt(
    process.env.BOOST_BUMP_MAX_ACTIVE_BOOSTS || '5',
    10
  ),

  BOOST_BUMP_DEFAULT_BOOST_DURATION_DAYS: parseInt(
    process.env.BOOST_BUMP_DEFAULT_BOOST_DURATION_DAYS || '30',
    10
  ),

  BOOST_BUMP_MIN_IMPACT_THRESHOLD: parseFloat(
    process.env.BOOST_BUMP_MIN_IMPACT_THRESHOLD || '15'
  ),

  BOOST_BUMP_COMPETITOR_TRACKING_ENABLED:
    process.env.BOOST_BUMP_COMPETITOR_TRACKING_ENABLED !== 'false',

  BOOST_BUMP_REVIEW_SENTIMENT_ENABLED:
    process.env.BOOST_BUMP_REVIEW_SENTIMENT_ENABLED !== 'false',

  BOOST_BUMP_CACHE_HOURS: parseInt(
    process.env.BOOST_BUMP_CACHE_HOURS || '6',
    10
  ),
};

/**
 * Boost Bump optimization areas
 */
export const BOOST_BUMP_OPTIMIZATION_AREAS = {
  GBP_PROFILE_COMPLETION: {
    name: 'Google Business Profile Completion',
    weight: 25,
    description: 'Fill in all GBP fields for maximum visibility',
  },
  REVIEW_GENERATION: {
    name: 'Review Generation & Sentiment',
    weight: 20,
    description: 'Encourage customer reviews and monitor sentiment',
  },
  LOCAL_CITATIONS: {
    name: 'Local Citations & Consistency',
    weight: 15,
    description: 'Ensure NAP (Name, Address, Phone) consistency',
  },
  MAPS_KEYWORDS: {
    name: 'Maps Keyword Optimization',
    weight: 15,
    description: 'Optimize GBP attributes for local search keywords',
  },
  POST_CADENCE: {
    name: 'GBP Posts & Cadence',
    weight: 15,
    description: 'Regular posts improve local visibility',
  },
  PHOTOS_VIDEOS: {
    name: 'Photos & Video Content',
    weight: 10,
    description: 'Rich media content boosts engagement and CTR',
  },
} as const;

/**
 * Validate Boost Bump configuration
 */
export function validateBoostBumpConfig(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (BOOST_BUMP_CONFIG.BOOST_BUMP_MAX_DAILY_BOOSTS < 1) {
    errors.push('BOOST_BUMP_MAX_DAILY_BOOSTS must be at least 1');
  }

  if (BOOST_BUMP_CONFIG.BOOST_BUMP_MAX_ACTIVE_BOOSTS < 1) {
    errors.push('BOOST_BUMP_MAX_ACTIVE_BOOSTS must be at least 1');
  }

  if (BOOST_BUMP_CONFIG.BOOST_BUMP_DEFAULT_BOOST_DURATION_DAYS < 1) {
    errors.push('BOOST_BUMP_DEFAULT_BOOST_DURATION_DAYS must be at least 1');
  }

  if (
    BOOST_BUMP_CONFIG.BOOST_BUMP_MIN_IMPACT_THRESHOLD < 0 ||
    BOOST_BUMP_CONFIG.BOOST_BUMP_MIN_IMPACT_THRESHOLD > 100
  ) {
    errors.push(
      'BOOST_BUMP_MIN_IMPACT_THRESHOLD must be between 0 and 100'
    );
  }

  const validGeoTargets = ['CITY', 'REGION', 'STATE', 'COUNTRY', 'NATIONAL'];
  if (!validGeoTargets.includes(BOOST_BUMP_CONFIG.BOOST_BUMP_DEFAULT_GEO_TARGET)) {
    errors.push(
      `BOOST_BUMP_DEFAULT_GEO_TARGET must be one of: ${validGeoTargets.join(
        ', '
      )}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get Boost Bump optimization areas weighted
 */
export function getBoostBumpOptimizationWeights(): Record<string, number> {
  return Object.entries(BOOST_BUMP_OPTIMIZATION_AREAS).reduce(
    (acc, [key, value]) => {
      acc[key] = value.weight;
      return acc;
    },
    {} as Record<string, number>
  );
}
