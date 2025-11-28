/**
 * OAuth Service
 *
 * Handles OAuth authorization code flow for Google and Microsoft providers.
 * Manages token exchange, refresh, and user info retrieval.
 */

import { connectedAppsConfig, getAuthorizationUrl } from '@config/connectedApps.config';
import { getTokenVault } from './tokenVault';
import { getProviderRegistry } from './providerRegistry';
import {
  ConnectedAppsError,
  ErrorCodes,
  type OAuthProvider,
  type OAuthTokens,
  type OAuthState,
  type TokenExchangeRequest,
  type TokenExchangeResponse,
  type TokenRefreshRequest,
  type TokenRefreshResponse,
  type GoogleUserInfo,
  type MicrosoftUserInfo,
  type ProviderUserInfo,
} from './providerTypes';

// ============================================================================
// State Store (in-memory for simplicity, use Redis in production)
// ============================================================================

const stateStore = new Map<string, OAuthState>();
const STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

// ============================================================================
// OAuth Service Class
// ============================================================================

class OAuthService {
  private tokenVault = getTokenVault();
  private registry = getProviderRegistry();

  /**
   * Generate authorization URL for a provider
   */
  async generateAuthUrl(
    provider: OAuthProvider,
    workspaceId: string,
    userId: string,
    returnUrl: string
  ): Promise<{ authUrl: string; state: string }> {
    // Validate provider is configured
    const providerConfig = connectedAppsConfig.providers[provider];
    if (!providerConfig.clientId || !providerConfig.clientSecret) {
      throw new ConnectedAppsError(
        `Provider ${provider} is not configured`,
        ErrorCodes.PROVIDER_NOT_CONFIGURED,
        provider
      );
    }

    // Generate state and PKCE
    const state = this.tokenVault.generateStateToken();
    const codeVerifier = this.tokenVault.generateCodeVerifier();
    const codeChallenge = this.tokenVault.generateCodeChallenge(codeVerifier);
    const nonce = this.tokenVault.generateStateToken();

    // Store state for validation
    const oauthState: OAuthState = {
      provider,
      workspaceId,
      userId,
      returnUrl,
      codeVerifier,
      nonce,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + STATE_EXPIRY_MS),
    };
    stateStore.set(state, oauthState);

    // Generate auth URL using config helper
    const authUrl = getAuthorizationUrl(provider, state, codeChallenge);

    return { authUrl, state };
  }

  /**
   * Validate OAuth state parameter
   */
  validateState(state: string): OAuthState {
    const oauthState = stateStore.get(state);

    if (!oauthState) {
      throw new ConnectedAppsError(
        'Invalid OAuth state',
        ErrorCodes.INVALID_STATE
      );
    }

    if (new Date() > oauthState.expiresAt) {
      stateStore.delete(state);
      throw new ConnectedAppsError(
        'OAuth state has expired',
        ErrorCodes.STATE_EXPIRED
      );
    }

    // Remove used state
    stateStore.delete(state);

    return oauthState;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(
    request: TokenExchangeRequest
  ): Promise<TokenExchangeResponse> {
    const { provider, code, redirectUri, codeVerifier } = request;
    const providerConfig = connectedAppsConfig.providers[provider];

    try {
      // Prepare token request body
      const body = new URLSearchParams({
        client_id: providerConfig.clientId,
        client_secret: providerConfig.clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });

      // Add PKCE code verifier if present
      if (codeVerifier) {
        body.append('code_verifier', codeVerifier);
      }

      // Exchange code for tokens
      const tokenResponse = await fetch(providerConfig.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        throw new Error(`Token exchange failed: ${errorData}`);
      }

      const tokenData = await tokenResponse.json();

      // Parse tokens
      const tokens: OAuthTokens = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        scope: tokenData.scope?.split(' ') || [],
        tokenType: tokenData.token_type || 'Bearer',
      };

      // Fetch user info
      const userInfo = await this.fetchUserInfo(provider, tokens.accessToken);

      return { tokens, userInfo };
    } catch (error) {
      throw new ConnectedAppsError(
        `Failed to exchange code for tokens: ${error}`,
        ErrorCodes.TOKEN_EXCHANGE_FAILED,
        provider,
        { error: String(error) }
      );
    }
  }

  /**
   * Refresh an expired access token
   */
  async refreshAccessToken(
    request: TokenRefreshRequest
  ): Promise<TokenRefreshResponse> {
    const { provider, refreshToken } = request;
    const providerConfig = connectedAppsConfig.providers[provider];

    try {
      const body = new URLSearchParams({
        client_id: providerConfig.clientId,
        client_secret: providerConfig.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      });

      const response = await fetch(providerConfig.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Token refresh failed: ${errorData}`);
      }

      const data = await response.json();

      return {
        accessToken: data.access_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
        scope: data.scope?.split(' ') || [],
      };
    } catch (error) {
      throw new ConnectedAppsError(
        `Failed to refresh token: ${error}`,
        ErrorCodes.TOKEN_REFRESH_FAILED,
        provider,
        { error: String(error) }
      );
    }
  }

  /**
   * Fetch user info from provider
   */
  async fetchUserInfo(
    provider: OAuthProvider,
    accessToken: string
  ): Promise<ProviderUserInfo> {
    const providerConfig = connectedAppsConfig.providers[provider];

    try {
      const response = await fetch(providerConfig.userInfoEndpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.statusText}`);
      }

      const data = await response.json();

      if (provider === 'google') {
        return data as GoogleUserInfo;
      } else {
        return data as MicrosoftUserInfo;
      }
    } catch (error) {
      throw new ConnectedAppsError(
        `Failed to fetch user info: ${error}`,
        ErrorCodes.USER_INFO_FAILED,
        provider,
        { error: String(error) }
      );
    }
  }

  /**
   * Revoke OAuth tokens
   */
  async revokeTokens(
    provider: OAuthProvider,
    accessToken: string
  ): Promise<void> {
    const providerConfig = connectedAppsConfig.providers[provider];

    try {
      if (provider === 'google') {
        // Google uses POST with token parameter
        await fetch(`${providerConfig.revokeEndpoint}?token=${accessToken}`, {
          method: 'POST',
        });
      } else if (provider === 'microsoft') {
        // Microsoft logout is typically handled client-side
        // Just clear tokens locally
      }
    } catch (error) {
      // Log but don't throw - revocation failure shouldn't block disconnect
      console.error(`[OAuthService] Failed to revoke tokens: ${error}`);
    }
  }

  /**
   * Extract email from provider user info
   */
  extractEmail(userInfo: ProviderUserInfo): string {
    if ('email' in userInfo) {
      return userInfo.email;
    }
    if ('mail' in userInfo && userInfo.mail) {
      return userInfo.mail;
    }
    if ('userPrincipalName' in userInfo) {
      return userInfo.userPrincipalName;
    }
    return '';
  }

  /**
   * Extract display name from provider user info
   */
  extractDisplayName(userInfo: ProviderUserInfo): string {
    if ('name' in userInfo) {
      return userInfo.name;
    }
    if ('displayName' in userInfo) {
      return userInfo.displayName;
    }
    return '';
  }

  /**
   * Extract avatar URL from provider user info
   */
  extractAvatarUrl(userInfo: ProviderUserInfo): string | null {
    if ('picture' in userInfo) {
      return userInfo.picture;
    }
    // Microsoft requires separate Graph API call for photo
    return null;
  }

  /**
   * Extract provider account ID from user info
   */
  extractAccountId(userInfo: ProviderUserInfo): string {
    return userInfo.id;
  }

  /**
   * Clean up expired states (call periodically)
   */
  cleanupExpiredStates(): number {
    const now = new Date();
    let cleaned = 0;

    for (const [state, oauthState] of stateStore) {
      if (now > oauthState.expiresAt) {
        stateStore.delete(state);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let serviceInstance: OAuthService | null = null;

export function getOAuthService(): OAuthService {
  if (!serviceInstance) {
    serviceInstance = new OAuthService();
  }
  return serviceInstance;
}

export default OAuthService;
