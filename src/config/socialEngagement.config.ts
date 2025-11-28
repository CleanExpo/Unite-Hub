/**
 * Social Engagement Configuration
 * Multi-platform social media monitoring and engagement
 *
 * @module socialEngagement.config
 * @version 1.0.0
 */

/**
 * Supported social media platforms
 */
export type SocialPlatform =
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'twitter'
  | 'tiktok'
  | 'youtube'
  | 'threads'
  | 'bluesky';

/**
 * Message types across platforms
 */
export type MessageType =
  | 'comment'
  | 'direct_message'
  | 'mention'
  | 'reply'
  | 'tag'
  | 'review'
  | 'question';

/**
 * Sentiment analysis results
 */
export type SentimentScore = 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';

/**
 * Social platform configuration
 */
export interface PlatformConfig {
  name: string;
  enabled: boolean;
  apiType: 'graph' | 'rest' | 'graphql';
  authType: 'oauth2' | 'api_key' | 'bearer_token';
  rateLimit: number; // requests per minute
  messagePollingIntervalSeconds: number;
}

/**
 * Social Engagement configuration interface
 */
export interface SocialEngagementConfig {
  /** Enable/disable social engagement system */
  SOCIAL_ENGAGEMENT_ENABLED: boolean;

  /** Platform-specific configurations */
  PLATFORMS: Record<SocialPlatform, PlatformConfig>;

  /** Enable auto-responses (always false - human governed) */
  AUTO_RESPONSE_ENABLED: boolean;

  /** Enable sentiment analysis on messages */
  SENTIMENT_ANALYSIS_ENABLED: boolean;

  /** Message polling interval in seconds */
  MESSAGE_POLLING_INTERVAL_SECONDS: number;

  /** Maximum messages to process per polling cycle */
  MAX_MESSAGES_PER_CYCLE: number;

  /** Enable mention detection */
  MENTION_DETECTION_ENABLED: boolean;

  /** Enable review monitoring (Google Reviews, Yelp, etc.) */
  REVIEW_MONITORING_ENABLED: boolean;

  /** Enable competitor social tracking */
  COMPETITOR_TRACKING_ENABLED: boolean;

  /** Enable engagement opportunity detection */
  OPPORTUNITY_DETECTION_ENABLED: boolean;

  /** Sentiment score threshold for negative alerts (0-1) */
  NEGATIVE_SENTIMENT_ALERT_THRESHOLD: number;

  /** Cache social data for this many hours */
  SOCIAL_CACHE_HOURS: number;

  /** Enable hashtag tracking */
  HASHTAG_TRACKING_ENABLED: boolean;

  /** Maximum hashtags to track per business */
  MAX_TRACKED_HASHTAGS: number;

  /** Enable viral trend detection */
  VIRAL_TREND_DETECTION_ENABLED: boolean;

  /** Enable competitor mention tracking */
  COMPETITOR_MENTION_TRACKING_ENABLED: boolean;
}

/**
 * Default platform configurations
 */
export const DEFAULT_PLATFORM_CONFIGS: Record<SocialPlatform, PlatformConfig> =
  {
    facebook: {
      name: 'Facebook',
      enabled: true,
      apiType: 'graph',
      authType: 'oauth2',
      rateLimit: 200,
      messagePollingIntervalSeconds: 300,
    },
    instagram: {
      name: 'Instagram',
      enabled: true,
      apiType: 'graph',
      authType: 'oauth2',
      rateLimit: 200,
      messagePollingIntervalSeconds: 300,
    },
    linkedin: {
      name: 'LinkedIn',
      enabled: true,
      apiType: 'rest',
      authType: 'oauth2',
      rateLimit: 100,
      messagePollingIntervalSeconds: 600,
    },
    twitter: {
      name: 'Twitter/X',
      enabled: true,
      apiType: 'rest',
      authType: 'bearer_token',
      rateLimit: 300,
      messagePollingIntervalSeconds: 180,
    },
    tiktok: {
      name: 'TikTok',
      enabled: true,
      apiType: 'rest',
      authType: 'oauth2',
      rateLimit: 100,
      messagePollingIntervalSeconds: 600,
    },
    youtube: {
      name: 'YouTube',
      enabled: true,
      apiType: 'rest',
      authType: 'oauth2',
      rateLimit: 100,
      messagePollingIntervalSeconds: 900,
    },
    threads: {
      name: 'Threads',
      enabled: true,
      apiType: 'graph',
      authType: 'oauth2',
      rateLimit: 150,
      messagePollingIntervalSeconds: 300,
    },
    bluesky: {
      name: 'BlueSky',
      enabled: true,
      apiType: 'graphql',
      authType: 'bearer_token',
      rateLimit: 100,
      messagePollingIntervalSeconds: 300,
    },
  };

/**
 * Social Engagement runtime configuration
 */
export const SOCIAL_ENGAGEMENT_CONFIG: SocialEngagementConfig = {
  SOCIAL_ENGAGEMENT_ENABLED:
    process.env.SOCIAL_ENGAGEMENT_ENABLED !== 'false',

  PLATFORMS: Object.entries(DEFAULT_PLATFORM_CONFIGS).reduce(
    (acc, [key, value]) => {
      const platformKey = key as SocialPlatform;
      const envKey = `SOCIAL_${key.toUpperCase()}_ENABLED`;
      acc[platformKey] = {
        ...value,
        enabled:
          process.env[envKey] !== undefined
            ? process.env[envKey] !== 'false'
            : value.enabled,
      };
      return acc;
    },
    {} as Record<SocialPlatform, PlatformConfig>
  ),

  AUTO_RESPONSE_ENABLED: false, // Always false - human governed

  SENTIMENT_ANALYSIS_ENABLED:
    process.env.SENTIMENT_ANALYSIS_ENABLED !== 'false',

  MESSAGE_POLLING_INTERVAL_SECONDS: parseInt(
    process.env.MESSAGE_POLLING_INTERVAL_SECONDS || '300',
    10
  ),

  MAX_MESSAGES_PER_CYCLE: parseInt(
    process.env.MAX_MESSAGES_PER_CYCLE || '100',
    10
  ),

  MENTION_DETECTION_ENABLED:
    process.env.MENTION_DETECTION_ENABLED !== 'false',

  REVIEW_MONITORING_ENABLED:
    process.env.REVIEW_MONITORING_ENABLED !== 'false',

  COMPETITOR_TRACKING_ENABLED:
    process.env.COMPETITOR_TRACKING_ENABLED !== 'false',

  OPPORTUNITY_DETECTION_ENABLED:
    process.env.OPPORTUNITY_DETECTION_ENABLED !== 'false',

  NEGATIVE_SENTIMENT_ALERT_THRESHOLD: parseFloat(
    process.env.NEGATIVE_SENTIMENT_ALERT_THRESHOLD || '0.6'
  ),

  SOCIAL_CACHE_HOURS: parseInt(
    process.env.SOCIAL_CACHE_HOURS || '2',
    10
  ),

  HASHTAG_TRACKING_ENABLED:
    process.env.HASHTAG_TRACKING_ENABLED !== 'false',

  MAX_TRACKED_HASHTAGS: parseInt(
    process.env.MAX_TRACKED_HASHTAGS || '50',
    10
  ),

  VIRAL_TREND_DETECTION_ENABLED:
    process.env.VIRAL_TREND_DETECTION_ENABLED !== 'false',

  COMPETITOR_MENTION_TRACKING_ENABLED:
    process.env.COMPETITOR_MENTION_TRACKING_ENABLED !== 'false',
};

/**
 * Validate Social Engagement configuration
 */
export function validateSocialEngagementConfig(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (SOCIAL_ENGAGEMENT_CONFIG.MESSAGE_POLLING_INTERVAL_SECONDS < 30) {
    errors.push(
      'MESSAGE_POLLING_INTERVAL_SECONDS should be at least 30 seconds'
    );
  }

  if (SOCIAL_ENGAGEMENT_CONFIG.MAX_MESSAGES_PER_CYCLE < 1) {
    errors.push('MAX_MESSAGES_PER_CYCLE must be at least 1');
  }

  if (
    SOCIAL_ENGAGEMENT_CONFIG.NEGATIVE_SENTIMENT_ALERT_THRESHOLD < 0 ||
    SOCIAL_ENGAGEMENT_CONFIG.NEGATIVE_SENTIMENT_ALERT_THRESHOLD > 1
  ) {
    errors.push(
      'NEGATIVE_SENTIMENT_ALERT_THRESHOLD must be between 0 and 1'
    );
  }

  if (SOCIAL_ENGAGEMENT_CONFIG.MAX_TRACKED_HASHTAGS < 1) {
    errors.push('MAX_TRACKED_HASHTAGS must be at least 1');
  }

  const enabledPlatforms = Object.values(
    SOCIAL_ENGAGEMENT_CONFIG.PLATFORMS
  ).filter((p) => p.enabled);
  if (SOCIAL_ENGAGEMENT_CONFIG.SOCIAL_ENGAGEMENT_ENABLED && enabledPlatforms.length === 0) {
    errors.push('At least one platform must be enabled');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get enabled platforms
 */
export function getEnabledPlatforms(): SocialPlatform[] {
  return Object.entries(SOCIAL_ENGAGEMENT_CONFIG.PLATFORMS)
    .filter(([, config]) => config.enabled)
    .map(([platform]) => platform as SocialPlatform);
}

/**
 * Get platform configuration
 */
export function getPlatformConfig(platform: SocialPlatform): PlatformConfig | null {
  return SOCIAL_ENGAGEMENT_CONFIG.PLATFORMS[platform] || null;
}
