/**
 * Connected Apps Configuration
 *
 * Central configuration for OAuth providers, scopes, redirect URIs,
 * and feature flags for the Connected Apps system.
 * All secrets are read from environment variables - never hardcode credentials.
 */

// ============================================================================
// TYPES
// ============================================================================

export type OAuthProvider = 'google' | 'microsoft' | 'meta' | 'linkedin' | 'reddit' | 'youtube';

export interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userInfoEndpoint: string;
  revokeEndpoint: string;
}

export interface TokenVaultConfig {
  encryptionKey: string;
  algorithm: string;
  keyLength: number;
  ivLength: number;
}

export interface ConnectedAppsConfig {
  enabled: boolean;
  providers: Record<string, OAuthProviderConfig>;
  tokenVault: TokenVaultConfig;
  tokenRefreshBufferMs: number;
  maxConnectionsPerUser: number;
  featureFlags: {
    googleWorkspace: boolean;
    microsoftOffice365: boolean;
    emailIngestion: boolean;
    calendarSync: boolean;
    driveAccess: boolean;
    socialPosting: boolean;
  };
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3008';

export const connectedAppsConfig: ConnectedAppsConfig = {
  // Master toggle for connected apps
  enabled: process.env.CONNECTED_APPS_ENABLED !== 'false',

  // OAuth Provider Configurations
  providers: {
    // Google OAuth Configuration
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: `${baseUrl}/api/connected-apps/callback/google`,
      scopes: [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.labels',
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/drive.readonly',
      ],
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      userInfoEndpoint: 'https://www.googleapis.com/oauth2/v2/userinfo',
      revokeEndpoint: 'https://oauth2.googleapis.com/revoke',
    },

    // Microsoft OAuth Configuration
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID || '',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
      redirectUri: `${baseUrl}/api/connected-apps/callback/microsoft`,
      scopes: [
        'openid',
        'email',
        'profile',
        'offline_access',
        'https://graph.microsoft.com/Mail.Read',
        'https://graph.microsoft.com/Mail.Send',
        'https://graph.microsoft.com/Calendars.Read',
        'https://graph.microsoft.com/Files.Read',
        'https://graph.microsoft.com/User.Read',
      ],
      authorizationEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      userInfoEndpoint: 'https://graph.microsoft.com/v1.0/me',
      revokeEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/logout',
    },

    // Meta (Facebook + Instagram) OAuth Configuration
    meta: {
      clientId: process.env.META_APP_ID || '',
      clientSecret: process.env.META_APP_SECRET || '',
      redirectUri: `${baseUrl}/api/connected-apps/callback/meta`,
      scopes: [
        'pages_show_list',
        'pages_read_engagement',
        'pages_manage_posts',
        'pages_messaging',
        'instagram_basic',
        'instagram_content_publish',
        'instagram_manage_comments',
      ],
      authorizationEndpoint: 'https://www.facebook.com/v19.0/dialog/oauth',
      tokenEndpoint: 'https://graph.facebook.com/v19.0/oauth/access_token',
      userInfoEndpoint: 'https://graph.facebook.com/v19.0/me',
      revokeEndpoint: 'https://graph.facebook.com/v19.0/me/permissions',
    },

    // LinkedIn OAuth Configuration
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      redirectUri: `${baseUrl}/api/connected-apps/callback/linkedin`,
      scopes: [
        'openid',
        'profile',
        'w_member_social',
        'r_organization_social',
        'w_organization_social',
        'rw_organization_admin',
      ],
      authorizationEndpoint: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenEndpoint: 'https://www.linkedin.com/oauth/v2/accessToken',
      userInfoEndpoint: 'https://api.linkedin.com/v2/userinfo',
      revokeEndpoint: 'https://www.linkedin.com/oauth/v2/revoke',
    },

    // Reddit OAuth Configuration
    reddit: {
      clientId: process.env.REDDIT_CLIENT_ID || '',
      clientSecret: process.env.REDDIT_CLIENT_SECRET || '',
      redirectUri: `${baseUrl}/api/connected-apps/callback/reddit`,
      scopes: [
        'identity',
        'read',
        'submit',
        'privatemessages',
        'history',
      ],
      authorizationEndpoint: 'https://www.reddit.com/api/v1/authorize',
      tokenEndpoint: 'https://www.reddit.com/api/v1/access_token',
      userInfoEndpoint: 'https://oauth.reddit.com/api/v1/me',
      revokeEndpoint: 'https://www.reddit.com/api/v1/revoke_token',
    },

    // YouTube OAuth (uses Google OAuth with YouTube scopes)
    youtube: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: `${baseUrl}/api/connected-apps/callback/youtube`,
      scopes: [
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/youtube.force-ssl',
        'https://www.googleapis.com/auth/youtube.upload',
      ],
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      userInfoEndpoint: 'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
      revokeEndpoint: 'https://oauth2.googleapis.com/revoke',
    },
  },

  // Token Vault Configuration (for encrypted storage)
  tokenVault: {
    encryptionKey: process.env.CONNECTED_APPS_ENCRYPTION_KEY || '',
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
  },

  // Token refresh buffer (refresh tokens 5 minutes before expiry)
  tokenRefreshBufferMs: parseInt(process.env.TOKEN_REFRESH_BUFFER_MS || '300000', 10),

  // Maximum connections per user
  maxConnectionsPerUser: parseInt(process.env.MAX_CONNECTIONS_PER_USER || '10', 10),

  // Feature Flags
  featureFlags: {
    googleWorkspace: process.env.FEATURE_GOOGLE_WORKSPACE !== 'false',
    microsoftOffice365: process.env.FEATURE_MICROSOFT_OFFICE365 !== 'false',
    emailIngestion: process.env.FEATURE_EMAIL_INGESTION !== 'false',
    calendarSync: process.env.FEATURE_CALENDAR_SYNC === 'true',
    driveAccess: process.env.FEATURE_DRIVE_ACCESS === 'true',
    socialPosting: process.env.FEATURE_SOCIAL_POSTING !== 'false',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if connected apps is properly configured
 */
export function isConnectedAppsConfigured(): boolean {
  return (
    connectedAppsConfig.enabled &&
    !!connectedAppsConfig.tokenVault.encryptionKey &&
    (isProviderConfigured('google') || isProviderConfigured('microsoft'))
  );
}

/**
 * Check if a specific provider is configured
 */
export function isProviderConfigured(provider: OAuthProvider): boolean {
  const config = connectedAppsConfig.providers[provider];
  return !!config?.clientId && !!config?.clientSecret;
}

/**
 * Check if a specific feature is enabled
 */
export function isFeatureEnabled(feature: keyof ConnectedAppsConfig['featureFlags']): boolean {
  return connectedAppsConfig.enabled && connectedAppsConfig.featureFlags[feature];
}

/**
 * Get OAuth scopes for a provider
 */
export function getScopesForProvider(provider: OAuthProvider): string[] {
  return connectedAppsConfig.providers[provider]?.scopes ?? [];
}

/**
 * Get filtered scopes based on enabled features
 */
export function getEnabledScopes(provider: OAuthProvider): string[] {
  const config = connectedAppsConfig.providers[provider];
  if (!config) return [];
  const allScopes = config.scopes;

  // Social providers return all scopes directly
  if (['meta', 'linkedin', 'reddit', 'youtube'].includes(provider)) {
    return allScopes;
  }

  const enabledScopes = ['openid', 'email', 'profile'];

  if (provider === 'microsoft') {
    enabledScopes.push('offline_access', 'https://graph.microsoft.com/User.Read');
  }

  if (connectedAppsConfig.featureFlags.emailIngestion) {
    if (provider === 'google') {
      enabledScopes.push(
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.labels'
      );
    } else if (provider === 'microsoft') {
      enabledScopes.push(
        'https://graph.microsoft.com/Mail.Read',
        'https://graph.microsoft.com/Mail.Send'
      );
    }
  }

  if (connectedAppsConfig.featureFlags.calendarSync) {
    if (provider === 'google') {
      enabledScopes.push('https://www.googleapis.com/auth/calendar.readonly');
    } else if (provider === 'microsoft') {
      enabledScopes.push('https://graph.microsoft.com/Calendars.Read');
    }
  }

  if (connectedAppsConfig.featureFlags.driveAccess) {
    if (provider === 'google') {
      enabledScopes.push('https://www.googleapis.com/auth/drive.readonly');
    } else if (provider === 'microsoft') {
      enabledScopes.push('https://graph.microsoft.com/Files.Read');
    }
  }

  return allScopes.filter((scope) => enabledScopes.includes(scope));
}

/**
 * Get authorization URL for a provider
 */
export function getAuthorizationUrl(
  provider: OAuthProvider,
  state: string,
  codeChallenge?: string
): string {
  const config = connectedAppsConfig.providers[provider];
  if (!config) throw new Error(`Provider ${provider} not configured`);
  const scopes = getEnabledScopes(provider);

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: scopes.join(provider === 'reddit' ? ' ' : ' '),
    state,
  });

  // Provider-specific parameters
  if (provider === 'reddit') {
    params.set('duration', 'permanent');
  } else {
    params.set('access_type', 'offline');
    params.set('prompt', 'consent');
  }

  // Add PKCE code challenge if provided
  if (codeChallenge) {
    params.set('code_challenge', codeChallenge);
    params.set('code_challenge_method', 'S256');
  }

  return `${config.authorizationEndpoint}?${params.toString()}`;
}

/**
 * Get configuration summary for logging (excludes secrets)
 */
export function getConfigSummary(): Record<string, unknown> {
  return {
    enabled: connectedAppsConfig.enabled,
    googleConfigured: isProviderConfigured('google'),
    microsoftConfigured: isProviderConfigured('microsoft'),
    metaConfigured: isProviderConfigured('meta'),
    linkedinConfigured: isProviderConfigured('linkedin'),
    redditConfigured: isProviderConfigured('reddit'),
    youtubeConfigured: isProviderConfigured('youtube'),
    encryptionConfigured: !!connectedAppsConfig.tokenVault.encryptionKey,
    maxConnectionsPerUser: connectedAppsConfig.maxConnectionsPerUser,
    featureFlags: connectedAppsConfig.featureFlags,
  };
}

export default connectedAppsConfig;
