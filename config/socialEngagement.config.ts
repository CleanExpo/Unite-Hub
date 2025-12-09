/**
 * Social Engagement Configuration
 *
 * Central configuration for social platforms, scopes, rate limits, and feature flags.
 */

export type SocialProvider =
  | 'facebook'
  | 'instagram'
  | 'youtube'
  | 'tiktok'
  | 'linkedin'
  | 'reddit'
  | 'x';

export interface SocialProviderConfig {
  enabled: boolean;
  clientIdEnv: string;
  clientSecretEnv: string;
  scopes: string[];
  rateLimits: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  features: {
    inbox: boolean;
    comments: boolean;
    directMessages: boolean;
    mentions: boolean;
    autoReply: boolean;
  };
  webhookSupported: boolean;
  oauthVersion: '1.0a' | '2.0';
}

export interface SocialEngagementConfig {
  enabled: boolean;
  defaultAutoReplyEnabled: boolean;
  triageSettings: {
    sentimentThresholds: {
      positive: number;
      negative: number;
    };
    spamScoreThreshold: number;
    importanceScoreThreshold: number;
  };
  replySettings: {
    requireApproval: boolean;
    maxAutoRepliesPerHour: number;
    cooldownMinutes: number;
    sensitiveContentKeywords: string[];
  };
  syncSettings: {
    pollIntervalMs: number;
    maxMessagesPerSync: number;
    lookbackDays: number;
  };
  providers: Record<SocialProvider, SocialProviderConfig>;
}

export const socialEngagementConfig: SocialEngagementConfig = {
  enabled: process.env.SOCIAL_ENGAGEMENT_ENABLED !== 'false',
  defaultAutoReplyEnabled: false, // Safety: off by default

  triageSettings: {
    sentimentThresholds: {
      positive: 0.6,
      negative: -0.3,
    },
    spamScoreThreshold: 0.7,
    importanceScoreThreshold: 0.5,
  },

  replySettings: {
    requireApproval: true, // Safety: always require approval by default
    maxAutoRepliesPerHour: 10,
    cooldownMinutes: 5,
    sensitiveContentKeywords: [
      'lawsuit',
      'legal',
      'attorney',
      'lawyer',
      'harassment',
      'threat',
      'suicide',
      'kill',
      'die',
      'hate',
      'racist',
      'discrimination',
    ],
  },

  syncSettings: {
    pollIntervalMs: 5 * 60 * 1000, // 5 minutes
    maxMessagesPerSync: 100,
    lookbackDays: 30,
  },

  providers: {
    facebook: {
      enabled: !!process.env.FACEBOOK_APP_ID,
      clientIdEnv: 'FACEBOOK_APP_ID',
      clientSecretEnv: 'FACEBOOK_APP_SECRET',
      scopes: [
        'pages_read_engagement',
        'pages_manage_engagement',
        'pages_read_user_content',
        'pages_messaging',
        'pages_manage_metadata',
      ],
      rateLimits: {
        requestsPerMinute: 200,
        requestsPerDay: 5000,
      },
      features: {
        inbox: true,
        comments: true,
        directMessages: true,
        mentions: true,
        autoReply: true,
      },
      webhookSupported: true,
      oauthVersion: '2.0',
    },

    instagram: {
      enabled: !!process.env.INSTAGRAM_APP_ID,
      clientIdEnv: 'INSTAGRAM_APP_ID',
      clientSecretEnv: 'INSTAGRAM_APP_SECRET',
      scopes: [
        'instagram_basic',
        'instagram_manage_comments',
        'instagram_manage_messages',
        'instagram_content_publish',
      ],
      rateLimits: {
        requestsPerMinute: 200,
        requestsPerDay: 5000,
      },
      features: {
        inbox: true,
        comments: true,
        directMessages: true,
        mentions: true,
        autoReply: true,
      },
      webhookSupported: true,
      oauthVersion: '2.0',
    },

    youtube: {
      enabled: !!process.env.YOUTUBE_API_KEY,
      clientIdEnv: 'GOOGLE_OAUTH_CLIENT_ID',
      clientSecretEnv: 'GOOGLE_OAUTH_CLIENT_SECRET',
      scopes: [
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/youtube.force-ssl',
      ],
      rateLimits: {
        requestsPerMinute: 100,
        requestsPerDay: 10000,
      },
      features: {
        inbox: false, // YouTube doesn't have traditional inbox
        comments: true,
        directMessages: false,
        mentions: true,
        autoReply: true,
      },
      webhookSupported: false, // Uses polling via YouTube Data API
      oauthVersion: '2.0',
    },

    tiktok: {
      enabled: !!process.env.TIKTOK_APP_ID,
      clientIdEnv: 'TIKTOK_APP_ID',
      clientSecretEnv: 'TIKTOK_APP_SECRET',
      scopes: ['user.info.basic', 'video.list', 'comment.list', 'comment.list.manage'],
      rateLimits: {
        requestsPerMinute: 100,
        requestsPerDay: 1000,
      },
      features: {
        inbox: false,
        comments: true,
        directMessages: false,
        mentions: true,
        autoReply: true,
      },
      webhookSupported: true,
      oauthVersion: '2.0',
    },

    linkedin: {
      enabled: !!process.env.LINKEDIN_CLIENT_ID,
      clientIdEnv: 'LINKEDIN_CLIENT_ID',
      clientSecretEnv: 'LINKEDIN_CLIENT_SECRET',
      scopes: [
        'r_liteprofile',
        'r_emailaddress',
        'w_member_social',
        'r_organization_social',
        'w_organization_social',
      ],
      rateLimits: {
        requestsPerMinute: 100,
        requestsPerDay: 500,
      },
      features: {
        inbox: true,
        comments: true,
        directMessages: true,
        mentions: true,
        autoReply: false, // LinkedIn restricts automated messaging
      },
      webhookSupported: true,
      oauthVersion: '2.0',
    },

    reddit: {
      enabled: !!process.env.REDDIT_CLIENT_ID,
      clientIdEnv: 'REDDIT_CLIENT_ID',
      clientSecretEnv: 'REDDIT_CLIENT_SECRET',
      scopes: ['identity', 'read', 'privatemessages', 'submit'],
      rateLimits: {
        requestsPerMinute: 60,
        requestsPerDay: 1000,
      },
      features: {
        inbox: true,
        comments: true,
        directMessages: true,
        mentions: true,
        autoReply: false, // Reddit has strict automation rules
      },
      webhookSupported: false,
      oauthVersion: '2.0',
    },

    x: {
      enabled: !!process.env.X_API_KEY,
      clientIdEnv: 'X_API_KEY',
      clientSecretEnv: 'X_API_SECRET',
      scopes: [
        'tweet.read',
        'tweet.write',
        'users.read',
        'dm.read',
        'dm.write',
        'offline.access',
      ],
      rateLimits: {
        requestsPerMinute: 50,
        requestsPerDay: 500,
      },
      features: {
        inbox: true,
        comments: true, // Replies
        directMessages: true,
        mentions: true,
        autoReply: true,
      },
      webhookSupported: true,
      oauthVersion: '2.0',
    },
  },
};

export function isProviderEnabled(provider: SocialProvider): boolean {
  return (
    socialEngagementConfig.enabled && socialEngagementConfig.providers[provider]?.enabled === true
  );
}

export function getProviderConfig(provider: SocialProvider): SocialProviderConfig | null {
  if (!isProviderEnabled(provider)) {
return null;
}
  return socialEngagementConfig.providers[provider];
}

export function getEnabledProviders(): SocialProvider[] {
  return (Object.keys(socialEngagementConfig.providers) as SocialProvider[]).filter(
    isProviderEnabled
  );
}
