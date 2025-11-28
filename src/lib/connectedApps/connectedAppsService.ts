/**
 * Connected Apps Service
 *
 * High-level service for managing connected app connections.
 * Handles CRUD operations, token management, and connection status.
 */

import { getSupabaseServer } from '@/lib/supabase';
import { connectedAppsConfig } from '@config/connectedApps.config';
import { getOAuthService } from './oauthService';
import { getTokenVault } from './tokenVault';
import { getProviderRegistry } from './providerRegistry';
import {
  ConnectedAppsError,
  ErrorCodes,
  type OAuthProvider,
  type OAuthTokens,
  type ConnectedApp,
  type ConnectedAppWithServices,
  type CreateConnectedAppInput,
  type UpdateConnectedAppInput,
  type ProviderUserInfo,
} from './providerTypes';

// ============================================================================
// Connected Apps Service Class
// ============================================================================

class ConnectedAppsService {
  private oauthService = getOAuthService();
  private tokenVault = getTokenVault();
  private registry = getProviderRegistry();

  /**
   * Get all connected apps for a workspace
   */
  async getConnectedApps(workspaceId: string): Promise<ConnectedAppWithServices[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('connected_apps')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new ConnectedAppsError(
        `Failed to fetch connected apps: ${error.message}`,
        ErrorCodes.DATABASE_ERROR,
        undefined,
        { error }
      );
    }

    return (data || []).map((app) => this.mapToConnectedAppWithServices(app));
  }

  /**
   * Get a specific connected app by ID
   */
  async getConnectedApp(
    workspaceId: string,
    appId: string
  ): Promise<ConnectedAppWithServices | null> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('connected_apps')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('id', appId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new ConnectedAppsError(
        `Failed to fetch connected app: ${error.message}`,
        ErrorCodes.DATABASE_ERROR,
        undefined,
        { error }
      );
    }

    return this.mapToConnectedAppWithServices(data);
  }

  /**
   * Get connected app by provider for a workspace
   */
  async getConnectedAppByProvider(
    workspaceId: string,
    userId: string,
    provider: OAuthProvider
  ): Promise<ConnectedAppWithServices | null> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('connected_apps')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new ConnectedAppsError(
        `Failed to fetch connected app: ${error.message}`,
        ErrorCodes.DATABASE_ERROR,
        undefined,
        { error }
      );
    }

    return this.mapToConnectedAppWithServices(data);
  }

  /**
   * Create a new connected app
   */
  async createConnectedApp(
    input: CreateConnectedAppInput
  ): Promise<ConnectedAppWithServices> {
    const supabase = await getSupabaseServer();

    // Check if connection already exists
    const existing = await this.getConnectedAppByProvider(
      input.workspaceId,
      input.userId,
      input.provider
    );

    if (existing) {
      // Update existing connection instead
      return this.updateConnectionTokens(
        existing.id,
        input.tokens,
        input.grantedScopes
      );
    }

    // Store tokens in oauth_tokens table (encrypted)
    await this.storeTokens(
      input.workspaceId,
      input.userId,
      input.provider,
      input.tokens
    );

    // Create connected_apps record
    const { data, error } = await supabase
      .from('connected_apps')
      .insert({
        workspace_id: input.workspaceId,
        user_id: input.userId,
        provider: input.provider,
        provider_account_id: input.providerAccountId,
        provider_email: input.providerEmail,
        provider_name: input.providerName,
        provider_avatar_url: input.providerAvatarUrl,
        status: 'active',
        granted_scopes: input.grantedScopes,
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (error) {
      throw new ConnectedAppsError(
        `Failed to create connected app: ${error.message}`,
        ErrorCodes.DATABASE_ERROR,
        input.provider,
        { error }
      );
    }

    return this.mapToConnectedAppWithServices(data);
  }

  /**
   * Update a connected app
   */
  async updateConnectedApp(
    workspaceId: string,
    appId: string,
    update: UpdateConnectedAppInput
  ): Promise<ConnectedAppWithServices> {
    const supabase = await getSupabaseServer();

    const updateData: Record<string, unknown> = {};
    if (update.status !== undefined) updateData.status = update.status;
    if (update.lastSyncAt !== undefined) updateData.last_sync_at = update.lastSyncAt;
    if (update.lastError !== undefined) updateData.last_error = update.lastError;
    if (update.grantedScopes !== undefined) updateData.granted_scopes = update.grantedScopes;
    if (update.metadata !== undefined) updateData.metadata = update.metadata;

    const { data, error } = await supabase
      .from('connected_apps')
      .update(updateData)
      .eq('workspace_id', workspaceId)
      .eq('id', appId)
      .select()
      .single();

    if (error) {
      throw new ConnectedAppsError(
        `Failed to update connected app: ${error.message}`,
        ErrorCodes.DATABASE_ERROR,
        undefined,
        { error }
      );
    }

    return this.mapToConnectedAppWithServices(data);
  }

  /**
   * Delete/disconnect a connected app
   */
  async disconnectApp(
    workspaceId: string,
    appId: string
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    // Get app details first
    const app = await this.getConnectedApp(workspaceId, appId);
    if (!app) {
      throw new ConnectedAppsError(
        'Connected app not found',
        ErrorCodes.CONNECTION_NOT_FOUND
      );
    }

    // Try to revoke tokens with provider
    try {
      const tokens = await this.getValidTokens(workspaceId, app.userId, app.provider);
      if (tokens) {
        await this.oauthService.revokeTokens(app.provider, tokens.accessToken);
      }
    } catch (error) {
      console.warn(`[ConnectedAppsService] Failed to revoke tokens: ${error}`);
    }

    // Delete oauth_tokens
    await supabase
      .from('oauth_tokens')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', app.userId)
      .in('provider', [`${app.provider}_gmail`, `${app.provider}_workspace`, `${app.provider}_outlook`, `${app.provider}_office365`]);

    // Delete connected_apps record (cascades to email data)
    const { error } = await supabase
      .from('connected_apps')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('id', appId);

    if (error) {
      throw new ConnectedAppsError(
        `Failed to disconnect app: ${error.message}`,
        ErrorCodes.DATABASE_ERROR,
        app.provider,
        { error }
      );
    }
  }

  /**
   * Get valid (non-expired) tokens for a connection
   */
  async getValidTokens(
    workspaceId: string,
    userId: string,
    provider: OAuthProvider
  ): Promise<OAuthTokens | null> {
    const supabase = await getSupabaseServer();

    // Determine provider key based on provider type
    const providerKeys =
      provider === 'google'
        ? ['google_gmail', 'google_workspace']
        : ['microsoft_outlook', 'microsoft_office365'];

    const { data, error } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .in('provider', providerKeys)
      .single();

    if (error || !data) {
      return null;
    }

    // Check if token is encrypted
    if (data.encrypted_access_token && data.encryption_iv) {
      try {
        const tokens = this.tokenVault.decryptTokens({
          encryptedAccessToken: Buffer.from(data.encrypted_access_token, 'base64'),
          encryptedRefreshToken: Buffer.from(data.encrypted_refresh_token, 'base64'),
          iv: Buffer.from(data.encryption_iv, 'base64'),
          expiresAt: new Date(data.expires_at),
          scope: data.scopes || [],
        });

        // Check if token needs refresh
        if (this.tokenVault.isTokenExpired(tokens.expiresAt)) {
          return this.refreshAndStoreTokens(workspaceId, userId, provider, tokens);
        }

        return tokens;
      } catch (error) {
        console.error('[ConnectedAppsService] Failed to decrypt tokens:', error);
        return null;
      }
    }

    // Legacy: plain text tokens
    const tokens: OAuthTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(data.expires_at),
      scope: data.scopes || [],
      tokenType: 'Bearer',
    };

    // Check if token needs refresh
    if (this.tokenVault.isTokenExpired(tokens.expiresAt)) {
      return this.refreshAndStoreTokens(workspaceId, userId, provider, tokens);
    }

    return tokens;
  }

  /**
   * Refresh and store new tokens
   */
  private async refreshAndStoreTokens(
    workspaceId: string,
    userId: string,
    provider: OAuthProvider,
    currentTokens: OAuthTokens
  ): Promise<OAuthTokens> {
    try {
      const refreshed = await this.oauthService.refreshAccessToken({
        provider,
        refreshToken: currentTokens.refreshToken,
      });

      const newTokens: OAuthTokens = {
        ...currentTokens,
        accessToken: refreshed.accessToken,
        expiresAt: refreshed.expiresAt,
        scope: refreshed.scope.length > 0 ? refreshed.scope : currentTokens.scope,
      };

      // Store refreshed tokens
      await this.storeTokens(workspaceId, userId, provider, newTokens);

      return newTokens;
    } catch (error) {
      // Mark connection as expired
      const supabase = await getSupabaseServer();
      await supabase
        .from('connected_apps')
        .update({ status: 'expired', last_error: String(error) })
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .eq('provider', provider);

      throw new ConnectedAppsError(
        'Token refresh failed - please reconnect',
        ErrorCodes.CONNECTION_EXPIRED,
        provider
      );
    }
  }

  /**
   * Store tokens in database (encrypted)
   */
  private async storeTokens(
    workspaceId: string,
    userId: string,
    provider: OAuthProvider,
    tokens: OAuthTokens
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    // Determine provider key
    const providerKey =
      provider === 'google' ? 'google_gmail' : 'microsoft_outlook';

    if (this.tokenVault.isEncryptionEnabled()) {
      // Encrypt tokens
      const encrypted = this.tokenVault.encryptTokens(tokens);

      const { error } = await supabase.from('oauth_tokens').upsert(
        {
          workspace_id: workspaceId,
          user_id: userId,
          provider: providerKey,
          access_token: '', // Empty for encrypted storage
          refresh_token: '', // Empty for encrypted storage
          encrypted_access_token: encrypted.encryptedAccessToken.toString('base64'),
          encrypted_refresh_token: encrypted.encryptedRefreshToken.toString('base64'),
          encryption_iv: encrypted.iv.toString('base64'),
          expires_at: tokens.expiresAt.toISOString(),
          scopes: tokens.scope,
        },
        { onConflict: 'workspace_id,provider' }
      );

      if (error) {
        throw new ConnectedAppsError(
          `Failed to store tokens: ${error.message}`,
          ErrorCodes.DATABASE_ERROR,
          provider
        );
      }
    } else {
      // Store plain text (not recommended for production)
      console.warn('[ConnectedAppsService] Storing tokens without encryption');

      const { error } = await supabase.from('oauth_tokens').upsert(
        {
          workspace_id: workspaceId,
          user_id: userId,
          provider: providerKey,
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          expires_at: tokens.expiresAt.toISOString(),
          scopes: tokens.scope,
        },
        { onConflict: 'workspace_id,provider' }
      );

      if (error) {
        throw new ConnectedAppsError(
          `Failed to store tokens: ${error.message}`,
          ErrorCodes.DATABASE_ERROR,
          provider
        );
      }
    }
  }

  /**
   * Update connection tokens (for reconnection)
   */
  private async updateConnectionTokens(
    appId: string,
    tokens: OAuthTokens,
    grantedScopes: string[]
  ): Promise<ConnectedAppWithServices> {
    const supabase = await getSupabaseServer();

    // Get existing app
    const { data: app } = await supabase
      .from('connected_apps')
      .select('*')
      .eq('id', appId)
      .single();

    if (!app) {
      throw new ConnectedAppsError(
        'Connected app not found',
        ErrorCodes.CONNECTION_NOT_FOUND
      );
    }

    // Store new tokens
    await this.storeTokens(app.workspace_id, app.user_id, app.provider, tokens);

    // Update app status
    const { data, error } = await supabase
      .from('connected_apps')
      .update({
        status: 'active',
        granted_scopes: grantedScopes,
        last_error: null,
      })
      .eq('id', appId)
      .select()
      .single();

    if (error) {
      throw new ConnectedAppsError(
        `Failed to update connection: ${error.message}`,
        ErrorCodes.DATABASE_ERROR
      );
    }

    return this.mapToConnectedAppWithServices(data);
  }

  /**
   * Complete OAuth callback flow
   */
  async handleOAuthCallback(
    code: string,
    state: string
  ): Promise<{ app: ConnectedAppWithServices; returnUrl: string }> {
    // Validate state
    const oauthState = this.oauthService.validateState(state);

    // Exchange code for tokens
    const { tokens, userInfo } = await this.oauthService.exchangeCodeForTokens({
      provider: oauthState.provider,
      code,
      redirectUri: connectedAppsConfig.providers[oauthState.provider].redirectUri,
      codeVerifier: oauthState.codeVerifier,
    });

    // Create or update connected app
    const app = await this.createConnectedApp({
      workspaceId: oauthState.workspaceId,
      userId: oauthState.userId,
      provider: oauthState.provider,
      tokens,
      providerAccountId: this.oauthService.extractAccountId(userInfo),
      providerEmail: this.oauthService.extractEmail(userInfo),
      providerName: this.oauthService.extractDisplayName(userInfo),
      providerAvatarUrl: this.oauthService.extractAvatarUrl(userInfo),
      grantedScopes: tokens.scope,
    });

    return { app, returnUrl: oauthState.returnUrl };
  }

  /**
   * Map database record to ConnectedAppWithServices
   */
  private mapToConnectedAppWithServices(
    record: Record<string, unknown>
  ): ConnectedAppWithServices {
    const provider = record.provider as OAuthProvider;
    const grantedScopes = (record.granted_scopes as string[]) || [];

    return {
      id: record.id as string,
      workspaceId: record.workspace_id as string,
      userId: record.user_id as string,
      provider,
      providerAccountId: record.provider_account_id as string | null,
      providerEmail: record.provider_email as string | null,
      providerName: record.provider_name as string | null,
      providerAvatarUrl: record.provider_avatar_url as string | null,
      status: record.status as ConnectedApp['status'],
      connectedAt: new Date(record.connected_at as string),
      lastSyncAt: record.last_sync_at
        ? new Date(record.last_sync_at as string)
        : null,
      lastError: record.last_error as string | null,
      grantedScopes,
      metadata: (record.metadata as Record<string, unknown>) || {},
      createdAt: new Date(record.created_at as string),
      updatedAt: new Date(record.updated_at as string),
      availableServices: this.registry.getProviderServices(provider),
      activeServices: this.registry.getActiveServices(provider, grantedScopes),
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let serviceInstance: ConnectedAppsService | null = null;

export function getConnectedAppsService(): ConnectedAppsService {
  if (!serviceInstance) {
    serviceInstance = new ConnectedAppsService();
  }
  return serviceInstance;
}

export default ConnectedAppsService;
