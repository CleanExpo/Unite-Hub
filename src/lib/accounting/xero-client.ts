/**
 * Xero Accounting API Client
 *
 * Implements OAuth 2.0 integration with Xero for:
 * - Automated invoice creation
 * - Expense tracking via bills
 * - Real-time P&L reporting
 *
 * Following CLAUDE.md patterns:
 * - Uses getSupabaseServer() for server-side operations
 * - Workspace isolation on all queries
 * - Error handling with graceful degradation
 *
 * @see docs/XERO_INTEGRATION_FINANCIAL_OPS.md
 */

import { XeroClient, TokenSet, Tenant } from 'xero-node';
import { getSupabaseServer } from '@/lib/supabase';

export interface XeroTokenData {
  organization_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  id_token?: string;
  scope: string;
  tenant_id?: string;
}

export class XeroService {
  private client: XeroClient;
  private tenantId?: string;

  constructor() {
    if (!process.env.XERO_CLIENT_ID || !process.env.XERO_CLIENT_SECRET) {
      throw new Error('Xero credentials not configured. Set XERO_CLIENT_ID and XERO_CLIENT_SECRET in .env');
    }

    this.client = new XeroClient({
      clientId: process.env.XERO_CLIENT_ID,
      clientSecret: process.env.XERO_CLIENT_SECRET,
      redirectUris: [process.env.XERO_REDIRECT_URI || 'http://localhost:3008/api/integrations/xero/callback'],
      scopes: [
        'accounting.transactions',
        'accounting.contacts',
        'accounting.settings',
        'accounting.reports.read'
      ].join(' ')
    });
  }

  /**
   * Get authorization URL for OAuth flow
   */
  getAuthorizationUrl(state?: string): string {
    return this.client.buildConsentUrl(state);
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForToken(code: string): Promise<TokenSet> {
    const tokenSet = await this.client.apiCallback(`http://localhost:3008/api/integrations/xero/callback?code=${code}`);
    return tokenSet;
  }

  /**
   * Initialize client with stored token for an organization
   * Automatically refreshes if expired
   *
   * @param organizationId - Organization ID
   * @param tenantId - Optional specific Xero tenant ID (for multi-account support)
   *                   If not provided, uses primary account
   */
  async initialize(organizationId: string, tenantId?: string): Promise<void> {
    const supabase = await getSupabaseServer();

    // Build query
    let query = supabase
      .from('xero_tokens')
      .select('*')
      .eq('organization_id', organizationId);

    if (tenantId) {
      // Get specific account by tenant ID
      query = query.eq('tenant_id', tenantId);
    } else {
      // Get primary account (or first account if no primary set)
      query = query.or('is_primary.eq.true,is_primary.is.null').limit(1);
    }

    const { data: tokens, error } = await supabase
      .from('xero_tokens')
      .select('*')
      .eq('organization_id', organizationId)
      .or(tenantId ? `tenant_id.eq.${tenantId}` : 'is_primary.eq.true,is_primary.is.null')
      .limit(1)
      .single();

    if (error || !tokens) {
      throw new Error(`Xero not connected for organization ${organizationId}. Please connect via OAuth.`);
    }

    const tokenSet: TokenSet = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_at,
      id_token: tokens.id_token,
      token_type: 'Bearer',
      scope: tokens.scope
    };

    await this.client.setTokenSet(tokenSet);

    // Refresh if expired (expires_at is unix timestamp in seconds)
    const now = Math.floor(Date.now() / 1000);
    if (now >= tokens.expires_at) {
      console.log('🔄 Xero token expired, refreshing...');
      const newTokenSet = await this.client.refreshToken();
      await this.saveTokenSet(organizationId, newTokenSet);
      console.log('✅ Xero token refreshed successfully');
    }

    // Store tenant ID for subsequent API calls
    this.tenantId = tokens.tenant_id || undefined;
  }

  /**
   * Save token set to database
   * Uses supabaseAdmin to bypass RLS for system operations
   *
   * @param organizationId - Organization ID
   * @param tokenSet - OAuth token set
   * @param accountLabel - Optional label for this account (e.g., "Main Business", "Subsidiary A")
   */
  async saveTokenSet(
    organizationId: string,
    tokenSet: TokenSet,
    accountLabel?: string
  ): Promise<void> {
    const { supabaseAdmin } = await import('@/lib/supabase');

    // Get tenant info if not already set
    if (!this.tenantId) {
      await this.client.setTokenSet(tokenSet);
      const tenants = await this.client.updateTenants();
      if (tenants && tenants.length > 0) {
        this.tenantId = tenants[0].tenantId;
      }
    }

    // Get tenant name from Xero API
    let tenantName: string | undefined;
    try {
      if (this.tenantId) {
        const response = await this.client.accountingApi.getOrganisations(this.tenantId);
        if (response.body.organisations && response.body.organisations.length > 0) {
          tenantName = response.body.organisations[0].name;
        }
      }
    } catch (error) {
      console.error('⚠️ Failed to fetch Xero org name:', error);
    }

    // Check if this is the first account for this organization
    const { data: existingAccounts } = await supabaseAdmin
      .from('xero_tokens')
      .select('tenant_id')
      .eq('organization_id', organizationId);

    const isFirstAccount = !existingAccounts || existingAccounts.length === 0;

    const { error } = await supabaseAdmin
      .from('xero_tokens')
      .upsert({
        organization_id: organizationId,
        access_token: tokenSet.access_token,
        refresh_token: tokenSet.refresh_token,
        expires_at: tokenSet.expires_at!,
        id_token: tokenSet.id_token,
        scope: tokenSet.scope || '',
        tenant_id: this.tenantId,
        tenant_name: tenantName,
        account_label: accountLabel || tenantName,
        is_primary: isFirstAccount, // First account is primary by default
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('❌ Failed to save Xero tokens:', error);
      throw error;
    }

    console.log('✅ Xero tokens saved successfully');
  }

  /**
   * Get connected Xero tenant ID
   * Must be called after initialize()
   */
  async getTenantId(): Promise<string> {
    if (this.tenantId) {
      return this.tenantId;
    }

    const tenants: Tenant[] = await this.client.updateTenants();

    if (!tenants || tenants.length === 0) {
      throw new Error('No Xero organizations connected');
    }

    // Use first tenant (most common case)
    // In multi-tenant scenarios, allow user to select
    this.tenantId = tenants[0].tenantId;
    return this.tenantId;
  }

  /**
   * Get Xero client for direct API calls
   * Use after initialize()
   */
  getClient(): XeroClient {
    if (!this.tenantId) {
      throw new Error('XeroService not initialized. Call initialize() first.');
    }
    return this.client;
  }

  /**
   * Test connection to Xero
   * Returns organization name if successful
   */
  async testConnection(organizationId: string): Promise<{ success: boolean; orgName?: string; error?: string }> {
    try {
      await this.initialize(organizationId);
      const tenantId = await this.getTenantId();

      const response = await this.client.accountingApi.getOrganisations(tenantId);

      if (response.body.organisations && response.body.organisations.length > 0) {
        const org = response.body.organisations[0];
        return {
          success: true,
          orgName: org.name
        };
      }

      return {
        success: false,
        error: 'No organizations found'
      };
    } catch (error: any) {
      console.error('❌ Xero connection test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all connected Xero accounts for an organization
   */
  async getAllAccounts(organizationId: string): Promise<any[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('xero_accounts_summary')
      .select('*')
      .eq('organization_id', organizationId)
      .order('is_primary', { ascending: false })
      .order('connected_at', { ascending: true });

    if (error) {
      console.error('❌ Failed to fetch Xero accounts:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Set primary Xero account
   */
  async setPrimaryAccount(organizationId: string, tenantId: string): Promise<void> {
    const { supabaseAdmin } = await import('@/lib/supabase');

    // First, set all accounts to non-primary
    await supabaseAdmin
      .from('xero_tokens')
      .update({ is_primary: false })
      .eq('organization_id', organizationId);

    // Then set the selected account as primary
    const { error } = await supabaseAdmin
      .from('xero_tokens')
      .update({ is_primary: true })
      .eq('organization_id', organizationId)
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('❌ Failed to set primary account:', error);
      throw error;
    }

    console.log('✅ Primary account updated');
  }

  /**
   * Update account label
   */
  async updateAccountLabel(
    organizationId: string,
    tenantId: string,
    accountLabel: string
  ): Promise<void> {
    const { supabaseAdmin } = await import('@/lib/supabase');

    const { error } = await supabaseAdmin
      .from('xero_tokens')
      .update({ account_label: accountLabel })
      .eq('organization_id', organizationId)
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('❌ Failed to update account label:', error);
      throw error;
    }

    console.log('✅ Account label updated');
  }

  /**
   * Disconnect Xero account (revoke tokens)
   *
   * @param organizationId - Organization ID
   * @param tenantId - Optional specific tenant ID to disconnect
   *                   If not provided, disconnects ALL accounts
   */
  async disconnect(organizationId: string, tenantId?: string): Promise<void> {
    const { supabaseAdmin } = await import('@/lib/supabase');

    // Build delete query
    let query = supabaseAdmin
      .from('xero_tokens')
      .delete()
      .eq('organization_id', organizationId);

    if (tenantId) {
      // Disconnect specific account
      query = query.eq('tenant_id', tenantId);
    }

    const { error } = await query;

    if (error) {
      console.error('❌ Failed to delete Xero tokens:', error);
      throw error;
    }

    console.log('✅ Xero disconnected successfully');
  }
}

export default XeroService;
