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

export type OAuthProvider = 'google' | 'microsoft';

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
  providers: {
    google: OAuthProviderConfig;
    microsoft: OAuthProviderConfig;
  };
  tokenVault: TokenVaultConfig;
  tokenRefreshBufferMs: number;
  maxConnectionsPerUser: number;
  featureFlags: {
    googleWorkspace: boolean;
    microsoftOffice365: boolean;
    emailIngestion: boolean;
    calendarSync: boolean;
    driveAccess: boolean;
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
  return !!config.clientId && !!config.clientSecret;
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
  return connectedAppsConfig.providers[provider].scopes;
}

/**
 * Get filtered scopes based on enabled features
 */
export function getEnabledScopes(provider: OAuthProvider): string[] {
  const allScopes = connectedAppsConfig.providers[provider].scopes;
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
  const scopes = getEnabledScopes(provider);

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    state,
    access_type: 'offline',
    prompt: 'consent',
  });

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
    encryptionConfigured: !!connectedAppsConfig.tokenVault.encryptionKey,
    maxConnectionsPerUser: connectedAppsConfig.maxConnectionsPerUser,
    featureFlags: connectedAppsConfig.featureFlags,
  };
}

export default connectedAppsConfig;
