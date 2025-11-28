/**
 * Connected Apps Configuration
 * OAuth integrations and third-party app management
 *
 * @module connectedApps.config
 * @version 1.0.0
 */

/**
 * Supported OAuth providers
 */
export type OAuthProvider =
  | 'gmail'
  | 'outlook'
  | 'google_calendar'
  | 'microsoft_calendar'
  | 'slack'
  | 'teams'
  | 'salesforce'
  | 'hubspot'
  | 'pipedrive'
  | 'zapier'
  | 'make'
  | 'n8n';

/**
 * OAuth permission scopes
 */
export interface OAuthScope {
  scope: string;
  description: string;
  required: boolean;
  category: 'email' | 'calendar' | 'contacts' | 'messaging' | 'crm' | 'automation';
}

/**
 * OAuth provider configuration
 */
export interface OAuthProviderConfig {
  name: string;
  enabled: boolean;
  clientId?: string;
  clientSecret?: string;
  authUrl: string;
  tokenUrl: string;
  scopes: OAuthScope[];
  supportsRefreshToken: boolean;
  supportsWebhooks: boolean;
  tokenExpiryMinutes: number;
}

/**
 * Connected app configuration
 */
export interface ConnectedApp {
  id: string;
  provider: OAuthProvider;
  name: string;
  description: string;
  icon?: string;
  enabled: boolean;
  priority: number; // Lower = higher priority
  category: 'email' | 'calendar' | 'messaging' | 'crm' | 'automation';
}

/**
 * Connected Apps configuration interface
 */
export interface ConnectedAppsConfig {
  /** Enable/disable connected apps system */
  CONNECTED_APPS_ENABLED: boolean;

  /** OAuth provider configurations */
  OAUTH_PROVIDERS: Record<OAuthProvider, OAuthProviderConfig>;

  /** Sync interval in minutes */
  SYNC_INTERVAL_MINUTES: number;

  /** Enable data encryption for stored credentials */
  ENCRYPTION_ENABLED: boolean;

  /** Encryption algorithm to use */
  ENCRYPTION_ALGORITHM: 'AES-256' | 'AES-128';

  /** Enable automatic data sync from connected apps */
  AUTO_SYNC_ENABLED: boolean;

  /** Enable webhook-based real-time sync */
  WEBHOOK_SYNC_ENABLED: boolean;

  /** Maximum retries for sync operations */
  MAX_SYNC_RETRIES: number;

  /** Enable error notifications for sync failures */
  SYNC_ERROR_NOTIFICATIONS_ENABLED: boolean;

  /** Days to retain sync logs */
  SYNC_LOG_RETENTION_DAYS: number;

  /** Enable audit logging for all API calls */
  AUDIT_LOGGING_ENABLED: boolean;

  /** Enable rate limit handling */
  RATE_LIMIT_HANDLING_ENABLED: boolean;

  /** Enable token refresh automation */
  AUTO_TOKEN_REFRESH_ENABLED: boolean;

  /** Minutes before token expiry to trigger refresh */
  TOKEN_REFRESH_BUFFER_MINUTES: number;

  /** Enable deduplication of synced data */
  DEDUPLICATION_ENABLED: boolean;

  /** Maximum concurrent sync operations */
  MAX_CONCURRENT_SYNCS: number;

  /** Enable conflict resolution for duplicate data */
  CONFLICT_RESOLUTION_ENABLED: boolean;

  /** Cache connected app data for this many hours */
  APPS_CACHE_HOURS: number;

  /** Enable app usage analytics */
  USAGE_ANALYTICS_ENABLED: boolean;

  /** Enable app health monitoring */
  HEALTH_MONITORING_ENABLED: boolean;
}

/**
 * Default OAuth provider configurations
 */
export const DEFAULT_OAUTH_PROVIDERS: Record<
  OAuthProvider,
  OAuthProviderConfig
> = {
  gmail: {
    name: 'Gmail',
    enabled: true,
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: [
      {
        scope: 'https://www.googleapis.com/auth/gmail.readonly',
        description: 'Read emails',
        required: true,
        category: 'email',
      },
      {
        scope: 'https://www.googleapis.com/auth/gmail.send',
        description: 'Send emails',
        required: false,
        category: 'email',
      },
      {
        scope: 'https://www.googleapis.com/auth/gmail.modify',
        description: 'Modify emails',
        required: false,
        category: 'email',
      },
    ],
    supportsRefreshToken: true,
    supportsWebhooks: true,
    tokenExpiryMinutes: 60,
  },
  outlook: {
    name: 'Outlook',
    enabled: true,
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: [
      {
        scope: 'Mail.Read',
        description: 'Read emails',
        required: true,
        category: 'email',
      },
      {
        scope: 'Mail.Send',
        description: 'Send emails',
        required: false,
        category: 'email',
      },
    ],
    supportsRefreshToken: true,
    supportsWebhooks: true,
    tokenExpiryMinutes: 60,
  },
  google_calendar: {
    name: 'Google Calendar',
    enabled: true,
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: [
      {
        scope: 'https://www.googleapis.com/auth/calendar.readonly',
        description: 'Read calendar events',
        required: true,
        category: 'calendar',
      },
      {
        scope: 'https://www.googleapis.com/auth/calendar.events',
        description: 'Create/modify calendar events',
        required: false,
        category: 'calendar',
      },
    ],
    supportsRefreshToken: true,
    supportsWebhooks: true,
    tokenExpiryMinutes: 60,
  },
  microsoft_calendar: {
    name: 'Microsoft Calendar',
    enabled: true,
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: [
      {
        scope: 'Calendars.Read',
        description: 'Read calendar events',
        required: true,
        category: 'calendar',
      },
    ],
    supportsRefreshToken: true,
    supportsWebhooks: true,
    tokenExpiryMinutes: 60,
  },
  slack: {
    name: 'Slack',
    enabled: true,
    authUrl: 'https://slack.com/oauth_authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    scopes: [
      {
        scope: 'chat:read',
        description: 'Read messages',
        required: true,
        category: 'messaging',
      },
      {
        scope: 'chat:write',
        description: 'Send messages',
        required: false,
        category: 'messaging',
      },
    ],
    supportsRefreshToken: true,
    supportsWebhooks: true,
    tokenExpiryMinutes: 43200, // 30 days for Slack
  },
  teams: {
    name: 'Microsoft Teams',
    enabled: true,
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: [
      {
        scope: 'Chat.Read',
        description: 'Read messages',
        required: true,
        category: 'messaging',
      },
    ],
    supportsRefreshToken: true,
    supportsWebhooks: true,
    tokenExpiryMinutes: 60,
  },
  salesforce: {
    name: 'Salesforce',
    enabled: true,
    authUrl: 'https://login.salesforce.com/services/oauth2/authorize',
    tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
    scopes: [
      {
        scope: 'api',
        description: 'Access API',
        required: true,
        category: 'crm',
      },
      {
        scope: 'full',
        description: 'Full access',
        required: false,
        category: 'crm',
      },
    ],
    supportsRefreshToken: true,
    supportsWebhooks: true,
    tokenExpiryMinutes: 120,
  },
  hubspot: {
    name: 'HubSpot',
    enabled: true,
    authUrl: 'https://app.hubspot.com/oauth/authorize',
    tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
    scopes: [
      {
        scope: 'contacts',
        description: 'Manage contacts',
        required: true,
        category: 'crm',
      },
      {
        scope: 'deals',
        description: 'Manage deals',
        required: false,
        category: 'crm',
      },
    ],
    supportsRefreshToken: true,
    supportsWebhooks: true,
    tokenExpiryMinutes: 1800, // 30 minutes
  },
  pipedrive: {
    name: 'Pipedrive',
    enabled: true,
    authUrl: 'https://oauth.pipedrive.com/oauth/authorize',
    tokenUrl: 'https://oauth.pipedrive.com/oauth/token',
    scopes: [
      {
        scope: 'deals:read',
        description: 'Read deals',
        required: true,
        category: 'crm',
      },
      {
        scope: 'deals:write',
        description: 'Write deals',
        required: false,
        category: 'crm',
      },
    ],
    supportsRefreshToken: true,
    supportsWebhooks: true,
    tokenExpiryMinutes: 43200, // 30 days
  },
  zapier: {
    name: 'Zapier',
    enabled: true,
    authUrl: 'https://zapier.com/oauth/authorize',
    tokenUrl: 'https://zapier.com/oauth/token',
    scopes: [
      {
        scope: 'read',
        description: 'Read access',
        required: true,
        category: 'automation',
      },
      {
        scope: 'write',
        description: 'Write access',
        required: false,
        category: 'automation',
      },
    ],
    supportsRefreshToken: true,
    supportsWebhooks: true,
    tokenExpiryMinutes: 3600, // 1 hour
  },
  make: {
    name: 'Make (formerly Integromat)',
    enabled: true,
    authUrl: 'https://app.make.com/oauth/authorize',
    tokenUrl: 'https://app.make.com/oauth/token',
    scopes: [
      {
        scope: 'read',
        description: 'Read access',
        required: true,
        category: 'automation',
      },
    ],
    supportsRefreshToken: true,
    supportsWebhooks: true,
    tokenExpiryMinutes: 3600,
  },
  n8n: {
    name: 'n8n',
    enabled: true,
    authUrl: 'https://n8n.io/oauth/authorize',
    tokenUrl: 'https://n8n.io/oauth/token',
    scopes: [
      {
        scope: 'workflow:read',
        description: 'Read workflows',
        required: true,
        category: 'automation',
      },
    ],
    supportsRefreshToken: true,
    supportsWebhooks: true,
    tokenExpiryMinutes: 3600,
  },
};

/**
 * Connected Apps runtime configuration
 */
export const CONNECTED_APPS_CONFIG: ConnectedAppsConfig = {
  CONNECTED_APPS_ENABLED: process.env.CONNECTED_APPS_ENABLED !== 'false',

  OAUTH_PROVIDERS: Object.entries(DEFAULT_OAUTH_PROVIDERS).reduce(
    (acc, [key, value]) => {
      const providerKey = key as OAuthProvider;
      const envKey = `OAUTH_${key.toUpperCase()}_ENABLED`;
      acc[providerKey] = {
        ...value,
        enabled:
          process.env[envKey] !== undefined
            ? process.env[envKey] !== 'false'
            : value.enabled,
        clientId: process.env[`OAUTH_${key.toUpperCase()}_CLIENT_ID`],
        clientSecret: process.env[`OAUTH_${key.toUpperCase()}_CLIENT_SECRET`],
      };
      return acc;
    },
    {} as Record<OAuthProvider, OAuthProviderConfig>
  ),

  SYNC_INTERVAL_MINUTES: parseInt(
    process.env.SYNC_INTERVAL_MINUTES || '15',
    10
  ),

  ENCRYPTION_ENABLED: process.env.ENCRYPTION_ENABLED !== 'false',

  ENCRYPTION_ALGORITHM:
    (process.env.ENCRYPTION_ALGORITHM as 'AES-256' | 'AES-128') ||
    'AES-256',

  AUTO_SYNC_ENABLED: process.env.AUTO_SYNC_ENABLED !== 'false',

  WEBHOOK_SYNC_ENABLED: process.env.WEBHOOK_SYNC_ENABLED !== 'false',

  MAX_SYNC_RETRIES: parseInt(
    process.env.MAX_SYNC_RETRIES || '3',
    10
  ),

  SYNC_ERROR_NOTIFICATIONS_ENABLED:
    process.env.SYNC_ERROR_NOTIFICATIONS_ENABLED !== 'false',

  SYNC_LOG_RETENTION_DAYS: parseInt(
    process.env.SYNC_LOG_RETENTION_DAYS || '30',
    10
  ),

  AUDIT_LOGGING_ENABLED: process.env.AUDIT_LOGGING_ENABLED !== 'false',

  RATE_LIMIT_HANDLING_ENABLED:
    process.env.RATE_LIMIT_HANDLING_ENABLED !== 'false',

  AUTO_TOKEN_REFRESH_ENABLED:
    process.env.AUTO_TOKEN_REFRESH_ENABLED !== 'false',

  TOKEN_REFRESH_BUFFER_MINUTES: parseInt(
    process.env.TOKEN_REFRESH_BUFFER_MINUTES || '5',
    10
  ),

  DEDUPLICATION_ENABLED: process.env.DEDUPLICATION_ENABLED !== 'false',

  MAX_CONCURRENT_SYNCS: parseInt(
    process.env.MAX_CONCURRENT_SYNCS || '5',
    10
  ),

  CONFLICT_RESOLUTION_ENABLED:
    process.env.CONFLICT_RESOLUTION_ENABLED !== 'false',

  APPS_CACHE_HOURS: parseInt(process.env.APPS_CACHE_HOURS || '4', 10),

  USAGE_ANALYTICS_ENABLED:
    process.env.USAGE_ANALYTICS_ENABLED !== 'false',

  HEALTH_MONITORING_ENABLED:
    process.env.HEALTH_MONITORING_ENABLED !== 'false',
};

/**
 * Validate Connected Apps configuration
 */
export function validateConnectedAppsConfig(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (CONNECTED_APPS_CONFIG.SYNC_INTERVAL_MINUTES < 1) {
    errors.push('SYNC_INTERVAL_MINUTES must be at least 1');
  }

  if (CONNECTED_APPS_CONFIG.MAX_SYNC_RETRIES < 0) {
    errors.push('MAX_SYNC_RETRIES must be 0 or greater');
  }

  if (CONNECTED_APPS_CONFIG.SYNC_LOG_RETENTION_DAYS < 1) {
    errors.push('SYNC_LOG_RETENTION_DAYS must be at least 1');
  }

  if (CONNECTED_APPS_CONFIG.TOKEN_REFRESH_BUFFER_MINUTES < 1) {
    errors.push('TOKEN_REFRESH_BUFFER_MINUTES must be at least 1');
  }

  if (CONNECTED_APPS_CONFIG.MAX_CONCURRENT_SYNCS < 1) {
    errors.push('MAX_CONCURRENT_SYNCS must be at least 1');
  }

  const enabledProviders = Object.values(
    CONNECTED_APPS_CONFIG.OAUTH_PROVIDERS
  ).filter((p) => p.enabled && p.clientId);

  if (CONNECTED_APPS_CONFIG.CONNECTED_APPS_ENABLED && enabledProviders.length === 0) {
    // Warning only, not an error
    console.warn(
      'No OAuth providers configured with client credentials'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get enabled OAuth providers
 */
export function getEnabledOAuthProviders(): OAuthProvider[] {
  return Object.entries(CONNECTED_APPS_CONFIG.OAUTH_PROVIDERS)
    .filter(([, config]) => config.enabled && config.clientId)
    .map(([provider]) => provider as OAuthProvider);
}

/**
 * Get OAuth provider configuration
 */
export function getOAuthProviderConfig(provider: OAuthProvider): OAuthProviderConfig | null {
  return CONNECTED_APPS_CONFIG.OAUTH_PROVIDERS[provider] || null;
}
