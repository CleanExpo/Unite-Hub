/**
 * Synthex Integration Hub Service
 *
 * Manages external integrations and channel connectors:
 * - Integration lifecycle (list, connect, disconnect)
 * - Auth configuration (OAuth2, API keys)
 * - Event tracking
 *
 * Phase: B20 - Integration Hub
 */

import { supabaseAdmin } from '@/lib/supabase/admin';

// =============================================================================
// Types
// =============================================================================

export interface SynthexIntegration {
  id: string;
  tenantId: string;
  provider: string;
  channel: string;
  displayName: string | null;
  status: 'disconnected' | 'connected' | 'error';
  lastConnectedAt: string | null;
  lastError: string | null;
  errorCount: number;
  config: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationAuthConfig {
  authType: 'oauth2' | 'api_key' | 'basic_auth';
  // OAuth2 fields
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  tokenType?: string;
  scopes?: string[];
  // API Key fields
  apiKey?: string;
  apiSecret?: string;
  // Basic Auth fields
  username?: string;
  password?: string;
}

export interface IntegrationEvent {
  id: string;
  tenantId: string;
  integrationId: string;
  eventType: string;
  eventStatus: 'success' | 'failure' | 'warning' | null;
  payload: Record<string, unknown>;
  errorMessage: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface UpsertIntegrationInput {
  provider: string;
  channel: string;
  displayName?: string;
  status?: 'disconnected' | 'connected' | 'error';
  lastError?: string;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface UpsertAuthConfigInput {
  authType: 'oauth2' | 'api_key' | 'basic_auth';
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  tokenType?: string;
  scopes?: string[];
  apiKey?: string;
  apiSecret?: string;
  username?: string;
  password?: string;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================================================
// Integration Management
// =============================================================================

/**
 * List all integrations for a tenant
 */
export async function listIntegrations(
  tenantId: string,
  filters?: { provider?: string; channel?: string; status?: string }
): Promise<ServiceResult<SynthexIntegration[]>> {
  try {
    let query = supabaseAdmin
      .from('synthex_integrations')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (filters?.provider) {
      query = query.eq('provider', filters.provider);
    }
    if (filters?.channel) {
      query = query.eq('channel', filters.channel);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[IntegrationHub] listIntegrations error:', error);
      return { success: false, error: error.message };
    }

    const integrations = (data || []).map(mapDbToIntegration);
    return { success: true, data: integrations };
  } catch (error) {
    console.error('[IntegrationHub] listIntegrations error:', error);
    return { success: false, error: 'Failed to list integrations' };
  }
}

/**
 * Get a single integration by ID
 */
export async function getIntegration(
  tenantId: string,
  integrationId: string
): Promise<ServiceResult<SynthexIntegration | null>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_integrations')
      .select('*')
      .eq('id', integrationId)
      .eq('tenant_id', tenantId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[IntegrationHub] getIntegration error:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: true, data: null };
    }

    return { success: true, data: mapDbToIntegration(data) };
  } catch (error) {
    console.error('[IntegrationHub] getIntegration error:', error);
    return { success: false, error: 'Failed to get integration' };
  }
}

/**
 * Get integration by provider
 */
export async function getIntegrationByProvider(
  tenantId: string,
  provider: string
): Promise<ServiceResult<SynthexIntegration | null>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_integrations')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('provider', provider)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[IntegrationHub] getIntegrationByProvider error:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: true, data: null };
    }

    return { success: true, data: mapDbToIntegration(data) };
  } catch (error) {
    console.error('[IntegrationHub] getIntegrationByProvider error:', error);
    return { success: false, error: 'Failed to get integration' };
  }
}

/**
 * Create or update an integration
 */
export async function upsertIntegration(
  tenantId: string,
  input: UpsertIntegrationInput
): Promise<ServiceResult<SynthexIntegration>> {
  try {
    // Check if integration exists
    const existing = await getIntegrationByProvider(tenantId, input.provider);

    if (existing.data) {
      // Update existing
      const { data, error } = await supabaseAdmin
        .from('synthex_integrations')
        .update({
          channel: input.channel,
          display_name: input.displayName,
          status: input.status ?? existing.data.status,
          last_connected_at: input.status === 'connected' ? new Date().toISOString() : existing.data.lastConnectedAt,
          last_error: input.lastError ?? null,
          error_count: input.status === 'error' ? existing.data.errorCount + 1 : existing.data.errorCount,
          config: input.config ?? existing.data.config,
          metadata: input.metadata ?? existing.data.metadata,
        })
        .eq('id', existing.data.id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) {
        console.error('[IntegrationHub] upsertIntegration update error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: mapDbToIntegration(data) };
    } else {
      // Create new
      const { data, error } = await supabaseAdmin
        .from('synthex_integrations')
        .insert({
          tenant_id: tenantId,
          provider: input.provider,
          channel: input.channel,
          display_name: input.displayName,
          status: input.status ?? 'disconnected',
          last_connected_at: input.status === 'connected' ? new Date().toISOString() : null,
          last_error: input.lastError ?? null,
          error_count: input.status === 'error' ? 1 : 0,
          config: input.config ?? {},
          metadata: input.metadata ?? {},
        })
        .select()
        .single();

      if (error) {
        console.error('[IntegrationHub] upsertIntegration insert error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: mapDbToIntegration(data) };
    }
  } catch (error) {
    console.error('[IntegrationHub] upsertIntegration error:', error);
    return { success: false, error: 'Failed to upsert integration' };
  }
}

/**
 * Delete an integration
 */
export async function deleteIntegration(
  tenantId: string,
  integrationId: string
): Promise<ServiceResult<void>> {
  try {
    const { error } = await supabaseAdmin
      .from('synthex_integrations')
      .delete()
      .eq('id', integrationId)
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('[IntegrationHub] deleteIntegration error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[IntegrationHub] deleteIntegration error:', error);
    return { success: false, error: 'Failed to delete integration' };
  }
}

// =============================================================================
// Auth Configuration (Secrets)
// =============================================================================

/**
 * Get integration auth config (without exposing full tokens in logs)
 */
export async function getIntegrationAuthConfig(
  tenantId: string,
  integrationId: string
): Promise<ServiceResult<IntegrationAuthConfig | null>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_integration_secrets')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('integration_id', integrationId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[IntegrationHub] getIntegrationAuthConfig error:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: true, data: null };
    }

    // Map db to auth config
    const authConfig: IntegrationAuthConfig = {
      authType: data.auth_type as 'oauth2' | 'api_key' | 'basic_auth',
    };

    if (data.auth_type === 'oauth2') {
      authConfig.accessToken = data.access_token;
      authConfig.refreshToken = data.refresh_token;
      authConfig.expiresAt = data.expires_at;
      authConfig.tokenType = data.token_type;
      authConfig.scopes = data.scopes || [];
    } else if (data.auth_type === 'api_key') {
      authConfig.apiKey = data.api_key;
      authConfig.apiSecret = data.api_secret;
    } else if (data.auth_type === 'basic_auth') {
      authConfig.username = data.username;
      authConfig.password = data.password;
    }

    return { success: true, data: authConfig };
  } catch (error) {
    console.error('[IntegrationHub] getIntegrationAuthConfig error:', error);
    return { success: false, error: 'Failed to get auth config' };
  }
}

/**
 * Upsert integration auth config (for OAuth callbacks, API key setup)
 */
export async function upsertIntegrationAuthConfig(
  tenantId: string,
  integrationId: string,
  authConfig: UpsertAuthConfigInput
): Promise<ServiceResult<void>> {
  try {
    // Check if auth config exists
    const { data: existing } = await supabaseAdmin
      .from('synthex_integration_secrets')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('integration_id', integrationId)
      .single();

    const payload: Record<string, unknown> = {
      tenant_id: tenantId,
      integration_id: integrationId,
      auth_type: authConfig.authType,
    };

    if (authConfig.authType === 'oauth2') {
      payload.access_token = authConfig.accessToken;
      payload.refresh_token = authConfig.refreshToken;
      payload.expires_at = authConfig.expiresAt;
      payload.token_type = authConfig.tokenType;
      payload.scopes = authConfig.scopes || [];
    } else if (authConfig.authType === 'api_key') {
      payload.api_key = authConfig.apiKey;
      payload.api_secret = authConfig.apiSecret;
    } else if (authConfig.authType === 'basic_auth') {
      payload.username = authConfig.username;
      payload.password = authConfig.password;
    }

    if (existing) {
      // Update
      const { error } = await supabaseAdmin
        .from('synthex_integration_secrets')
        .update(payload)
        .eq('id', existing.id);

      if (error) {
        console.error('[IntegrationHub] upsertIntegrationAuthConfig update error:', error);
        return { success: false, error: error.message };
      }
    } else {
      // Insert
      const { error } = await supabaseAdmin
        .from('synthex_integration_secrets')
        .insert(payload);

      if (error) {
        console.error('[IntegrationHub] upsertIntegrationAuthConfig insert error:', error);
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('[IntegrationHub] upsertIntegrationAuthConfig error:', error);
    return { success: false, error: 'Failed to upsert auth config' };
  }
}

// =============================================================================
// Event Logging
// =============================================================================

/**
 * Record an integration event
 */
export async function recordIntegrationEvent(
  tenantId: string,
  integrationId: string,
  eventType: string,
  options?: {
    eventStatus?: 'success' | 'failure' | 'warning';
    payload?: Record<string, unknown>;
    errorMessage?: string;
    userAgent?: string;
    ipAddress?: string;
  }
): Promise<ServiceResult<void>> {
  try {
    const { error } = await supabaseAdmin
      .from('synthex_integration_events')
      .insert({
        tenant_id: tenantId,
        integration_id: integrationId,
        event_type: eventType,
        event_status: options?.eventStatus ?? null,
        payload: options?.payload ?? {},
        error_message: options?.errorMessage ?? null,
        user_agent: options?.userAgent ?? null,
        ip_address: options?.ipAddress ?? null,
      });

    if (error) {
      console.error('[IntegrationHub] recordIntegrationEvent error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[IntegrationHub] recordIntegrationEvent error:', error);
    return { success: false, error: 'Failed to record event' };
  }
}

/**
 * Get integration events (for debugging and monitoring)
 */
export async function getIntegrationEvents(
  tenantId: string,
  integrationId: string,
  limit = 50
): Promise<ServiceResult<IntegrationEvent[]>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_integration_events')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('integration_id', integrationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[IntegrationHub] getIntegrationEvents error:', error);
      return { success: false, error: error.message };
    }

    const events = (data || []).map(mapDbToEvent);
    return { success: true, data: events };
  } catch (error) {
    console.error('[IntegrationHub] getIntegrationEvents error:', error);
    return { success: false, error: 'Failed to get events' };
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function mapDbToIntegration(row: Record<string, unknown>): SynthexIntegration {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    provider: row.provider as string,
    channel: row.channel as string,
    displayName: row.display_name as string | null,
    status: row.status as 'disconnected' | 'connected' | 'error',
    lastConnectedAt: row.last_connected_at as string | null,
    lastError: row.last_error as string | null,
    errorCount: row.error_count as number,
    config: row.config as Record<string, unknown>,
    metadata: row.metadata as Record<string, unknown>,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapDbToEvent(row: Record<string, unknown>): IntegrationEvent {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    integrationId: row.integration_id as string,
    eventType: row.event_type as string,
    eventStatus: row.event_status as 'success' | 'failure' | 'warning' | null,
    payload: row.payload as Record<string, unknown>,
    errorMessage: row.error_message as string | null,
    userAgent: row.user_agent as string | null,
    ipAddress: row.ip_address as string | null,
    createdAt: row.created_at as string,
  };
}
