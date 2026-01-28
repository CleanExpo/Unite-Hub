/**
 * Connected Apps Provider Types
 *
 * Type definitions for OAuth providers and connected app data structures.
 */

// ============================================================================
// Provider Types
// ============================================================================

export type OAuthProvider = 'google' | 'microsoft';

export type ProviderService =
  | 'gmail'
  | 'google_calendar'
  | 'google_drive'
  | 'outlook'
  | 'microsoft_calendar'
  | 'onedrive';

export type ConnectionStatus = 'active' | 'expired' | 'revoked' | 'error';

// ============================================================================
// Provider Metadata
// ============================================================================

export interface ProviderMetadata {
  id: OAuthProvider;
  name: string;
  displayName: string;
  icon: string;
  color: string;
  services: ProviderService[];
  description: string;
}

// ============================================================================
// OAuth Token Types
// ============================================================================

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string; // Optional - not all providers issue refresh tokens
  expiresAt: Date;
  scope: string[];
  tokenType: string;
}

export interface EncryptedTokens {
  encryptedAccessToken: Buffer;
  encryptedRefreshToken?: Buffer; // Optional - only present if refreshToken exists
  iv: Buffer;
  expiresAt: Date;
  scope: string[];
}

// ============================================================================
// Connected App Types
// ============================================================================

export interface ConnectedApp {
  id: string;
  workspaceId: string;
  userId: string;
  provider: OAuthProvider;
  providerAccountId: string | null;
  providerEmail: string | null;
  providerName: string | null;
  providerAvatarUrl: string | null;
  status: ConnectionStatus;
  connectedAt: Date;
  lastSyncAt: Date | null;
  lastError: string | null;
  grantedScopes: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateConnectedAppInput {
  workspaceId: string;
  userId: string;
  provider: OAuthProvider;
  tokens: OAuthTokens;
  providerAccountId?: string;
  providerEmail?: string;
  providerName?: string;
  providerAvatarUrl?: string;
  grantedScopes: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateConnectedAppInput {
  status?: ConnectionStatus;
  lastSyncAt?: Date;
  lastError?: string | null;
  grantedScopes?: string[];
  metadata?: Record<string, unknown>;
}

// ============================================================================
// OAuth State Types
// ============================================================================

export interface OAuthState {
  provider: OAuthProvider;
  workspaceId: string;
  userId: string;
  returnUrl: string;
  codeVerifier?: string; // For PKCE
  nonce: string;
  createdAt: Date;
  expiresAt: Date;
}

// ============================================================================
// Provider User Info Types
// ============================================================================

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export interface MicrosoftUserInfo {
  id: string;
  displayName: string;
  givenName: string;
  surname: string;
  mail: string;
  userPrincipalName: string;
  jobTitle?: string;
  officeLocation?: string;
}

export type ProviderUserInfo = GoogleUserInfo | MicrosoftUserInfo;

// ============================================================================
// Token Exchange Types
// ============================================================================

export interface TokenExchangeRequest {
  provider: OAuthProvider;
  code: string;
  redirectUri: string;
  codeVerifier?: string;
}

export interface TokenExchangeResponse {
  tokens: OAuthTokens;
  userInfo: ProviderUserInfo;
}

// ============================================================================
// Token Refresh Types
// ============================================================================

export interface TokenRefreshRequest {
  provider: OAuthProvider;
  refreshToken: string;
}

export interface TokenRefreshResponse {
  accessToken: string;
  expiresAt: Date;
  scope: string[];
}

// ============================================================================
// Connected App List Response
// ============================================================================

export interface ConnectedAppWithServices extends ConnectedApp {
  availableServices: ProviderService[];
  activeServices: ProviderService[];
}

// ============================================================================
// Error Types
// ============================================================================

export class ConnectedAppsError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider?: OAuthProvider,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ConnectedAppsError';
  }
}

export const ErrorCodes = {
  PROVIDER_NOT_CONFIGURED: 'PROVIDER_NOT_CONFIGURED',
  INVALID_STATE: 'INVALID_STATE',
  STATE_EXPIRED: 'STATE_EXPIRED',
  TOKEN_EXCHANGE_FAILED: 'TOKEN_EXCHANGE_FAILED',
  TOKEN_REFRESH_FAILED: 'TOKEN_REFRESH_FAILED',
  TOKEN_DECRYPTION_FAILED: 'TOKEN_DECRYPTION_FAILED',
  USER_INFO_FAILED: 'USER_INFO_FAILED',
  CONNECTION_NOT_FOUND: 'CONNECTION_NOT_FOUND',
  CONNECTION_EXPIRED: 'CONNECTION_EXPIRED',
  ENCRYPTION_KEY_MISSING: 'ENCRYPTION_KEY_MISSING',
  DATABASE_ERROR: 'DATABASE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
