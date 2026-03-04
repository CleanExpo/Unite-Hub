/**
 * Xero Two-Licence Service — Founder System
 *
 * Manages two separate Xero OAuth licence groups using CARSI's developer app credentials.
 *
 * Licence groups:
 *   carsi   → CARSI, RestoreAssist, Unite-Group, ATO, Synthex (5 tenants)
 *   dr_nrpg → Disaster Recovery, NRPG (2 tenants)
 *
 * CRITICAL: This is SEPARATE from the workspace XeroService in xero-client.ts.
 * Do NOT use this service for workspace user Xero operations.
 *
 * Token storage: plain text for now. To enable pgp_sym_encrypt, add a Supabase
 * vault key (SUPABASE_DB_ENCRYPTION_KEY) and wrap token writes with:
 *   supabaseAdmin.rpc('pgp_sym_encrypt', { data: token, key: encKey })
 *
 * Auth flow safety rule: authenticate → get tenants → present mapping UI → user confirms → THEN enable sync.
 */

import { XeroClient, TokenSet, TokenSetParameters } from 'xero-node';
import { supabaseAdmin } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LicenceName = 'carsi' | 'dr_nrpg';

export interface XeroAppCredentials {
  id: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
}

export interface XeroLicenceToken {
  id: string;
  licence_name: LicenceName;
  access_token: string | null;
  refresh_token: string | null;
  token_set_json: Record<string, unknown> | null;
  expires_at: string | null;
  connected_at: string | null;
  status: 'connected' | 'expired' | 'error' | 'disconnected';
  error_message: string | null;
}

export interface XeroTenant {
  tenantId: string;
  tenantName: string;
  tenantType: string;
}

export interface XeroBusinessTenant {
  id: string;
  business_key: string;
  licence_id: string;
  xero_tenant_id: string;
  xero_org_name: string | null;
  sync_enabled: boolean;
  last_synced_at: string | null;
  mapped_at: string;
  confirmed_at: string | null;
}

export interface LicenceStatus {
  carsi: {
    status: string;
    connected_at: string | null;
    mapped_businesses: XeroBusinessTenant[];
  };
  dr_nrpg: {
    status: string;
    connected_at: string | null;
    mapped_businesses: XeroBusinessTenant[];
  };
}

export interface SyncResult {
  business_key: string;
  records_synced: number;
  errors: unknown[];
  completed_at: string;
}

// Scopes required for accounting operations (string[] as required by IXeroClientConfig)
const XERO_SCOPES: string[] = [
  'openid',
  'profile',
  'email',
  'accounting.transactions',
  'accounting.contacts',
  'accounting.settings',
  'accounting.reports.read',
  'offline_access',
];

// ─── App credential helpers ────────────────────────────────────────────────────

/**
 * Reads the CARSI Xero developer app credentials from xero_oauth_app.
 * Returns null if not yet configured.
 */
export async function getXeroApp(): Promise<XeroAppCredentials | null> {
  const { data, error } = await supabaseAdmin
    .from('xero_oauth_app')
    .select('id, client_id, client_secret, redirect_uri')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[xero-founder] Failed to read xero_oauth_app:', error.message);
    return null;
  }

  return data as XeroAppCredentials | null;
}

/**
 * Saves (upserts) CARSI app credentials to xero_oauth_app.
 * Deletes any existing row first to ensure a single row.
 */
export async function saveXeroApp(
  clientId: string,
  clientSecret: string,
  redirectUri = 'https://unite-group.in/api/founder/xero/callback'
): Promise<void> {
  // Delete all existing rows (should only be one, but be safe)
  await supabaseAdmin.from('xero_oauth_app').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const { error } = await supabaseAdmin.from('xero_oauth_app').insert({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to save Xero app credentials: ${error.message}`);
  }
}

// ─── XeroClient factory ────────────────────────────────────────────────────────

/**
 * Builds a configured XeroClient for a given licence group.
 * Loads the app credentials from xero_oauth_app and the stored token from xero_licence_tokens.
 * Throws if app credentials are not configured.
 */
export async function buildXeroClient(licence: LicenceName): Promise<XeroClient> {
  const app = await getXeroApp();
  if (!app) {
    throw new Error('Xero app credentials not configured. Go to /founder/integrations/xero and save your CARSI client_id + client_secret first.');
  }

  const xero = new XeroClient({
    clientId: app.client_id,
    clientSecret: app.client_secret,
    redirectUris: [app.redirect_uri],
    scopes: XERO_SCOPES,
  });

  // initialize() must be called before any API operations (sets up openid-client)
  await xero.initialize();

  // If we have stored tokens for this licence, restore them
  const { data: licenceRow } = await supabaseAdmin
    .from('xero_licence_tokens')
    .select('access_token, refresh_token, token_set_json, expires_at')
    .eq('licence_name', licence)
    .single();

  if (licenceRow?.token_set_json) {
    // Restore full token set from stored JSON (preferred — preserves all openid-client fields)
    xero.setTokenSet(licenceRow.token_set_json as unknown as TokenSetParameters);
  } else if (licenceRow?.access_token && licenceRow?.refresh_token) {
    // Fallback: reconstruct minimal token set parameters
    const tokenSetParams: TokenSetParameters = {
      access_token: licenceRow.access_token,
      refresh_token: licenceRow.refresh_token,
      expires_at: licenceRow.expires_at ? Math.floor(new Date(licenceRow.expires_at).getTime() / 1000) : undefined,
      token_type: 'Bearer',
    };
    xero.setTokenSet(tokenSetParams);
  }

  return xero;
}

// ─── OAuth flow ────────────────────────────────────────────────────────────────

/**
 * Builds the Xero OAuth consent URL for a given licence group.
 * Encodes the licence name in the state param (via IXeroClientConfig.state) so the callback
 * knows which xero_licence_tokens row to write to.
 *
 * xero-node's buildConsentUrl() takes no arguments — state is passed in the constructor config.
 */
export async function getAuthUrl(licence: LicenceName, redirectUri?: string): Promise<string> {
  const app = await getXeroApp();
  if (!app) {
    throw new Error('Xero app credentials not configured.');
  }

  const resolvedRedirect = redirectUri ?? app.redirect_uri;

  // Encode licence name in state so the callback can route to the correct row
  const state = Buffer.from(JSON.stringify({ licence })).toString('base64');

  const xero = new XeroClient({
    clientId: app.client_id,
    clientSecret: app.client_secret,
    redirectUris: [resolvedRedirect],
    scopes: XERO_SCOPES,
    state,
  });

  // initialize() must be called to set up the openid-client before buildConsentUrl()
  await xero.initialize();
  const url = await xero.buildConsentUrl();
  return url;
}

/**
 * Exchanges the OAuth authorisation code for tokens and saves them to xero_licence_tokens.
 * Called from the /api/founder/xero/callback route.
 */
export async function handleCallback(code: string, licence: LicenceName): Promise<void> {
  const app = await getXeroApp();
  if (!app) {
    throw new Error('Xero app credentials not configured.');
  }

  const xero = new XeroClient({
    clientId: app.client_id,
    clientSecret: app.client_secret,
    redirectUris: [app.redirect_uri],
    scopes: XERO_SCOPES,
  });

  // initialize() must be called before apiCallback() to set up the openid-client
  await xero.initialize();

  // Build the full callback URL (xero-node requires the complete URL with code param)
  const callbackUrl = `${app.redirect_uri}?code=${encodeURIComponent(code)}`;
  const tokenSet = await xero.apiCallback(callbackUrl);

  await _saveTokens(licence, tokenSet);
}

/**
 * Internal helper — saves token set to xero_licence_tokens for the given licence.
 */
async function _saveTokens(licence: LicenceName, tokenSet: TokenSet): Promise<void> {
  const expiresAt = tokenSet.expires_at
    ? new Date(Number(tokenSet.expires_at) * 1000).toISOString()
    : null;

  const { error } = await supabaseAdmin
    .from('xero_licence_tokens')
    .update({
      access_token: tokenSet.access_token ?? null,
      refresh_token: tokenSet.refresh_token ?? null,
      token_set_json: tokenSet as unknown as Record<string, unknown>,
      expires_at: expiresAt,
      connected_at: new Date().toISOString(),
      status: 'connected',
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq('licence_name', licence);

  if (error) {
    throw new Error(`Failed to save Xero tokens for licence '${licence}': ${error.message}`);
  }
}

// ─── Tenant discovery ─────────────────────────────────────────────────────────

/**
 * Fetches the list of Xero tenants (organisations) connected to this licence group.
 * Requires the licence to be connected first.
 *
 * CRITICAL: This must be called and the results presented to the user for mapping
 * confirmation BEFORE sync is enabled for any business.
 */
export async function getTenantsForLicence(licence: LicenceName): Promise<XeroTenant[]> {
  const xero = await buildXeroClient(licence);

  // Refresh token if needed and update tenants list
  const tenants = await xero.updateTenants(false);

  return (tenants ?? []).map((t) => ({
    tenantId: t.tenantId ?? '',
    tenantName: t.tenantName ?? 'Unknown',
    tenantType: t.tenantType ?? 'ORGANISATION',
  }));
}

// ─── Business → tenant mapping ─────────────────────────────────────────────────

/**
 * Maps a business key to a specific Xero tenant within its licence group.
 * Creates or updates the row in xero_business_tenants.
 *
 * NOTE: This does NOT enable sync. The user must explicitly confirm mappings
 * via the UI before sync is enabled. Call confirmTenantMapping() after user confirmation.
 */
export async function mapBusinessTenant(
  businessKey: string,
  licenceName: LicenceName,
  xeroTenantId: string,
  xeroOrgName: string
): Promise<void> {
  // Resolve licence row id
  const { data: licenceRow, error: licenceError } = await supabaseAdmin
    .from('xero_licence_tokens')
    .select('id')
    .eq('licence_name', licenceName)
    .single();

  if (licenceError || !licenceRow) {
    throw new Error(`Licence '${licenceName}' not found in xero_licence_tokens.`);
  }

  const { error } = await supabaseAdmin
    .from('xero_business_tenants')
    .upsert(
      {
        business_key: businessKey,
        licence_id: licenceRow.id,
        xero_tenant_id: xeroTenantId,
        xero_org_name: xeroOrgName,
        sync_enabled: false, // Always false until explicitly confirmed
        mapped_at: new Date().toISOString(),
        confirmed_at: null, // Reset confirmation when re-mapped
      },
      { onConflict: 'business_key' }
    );

  if (error) {
    throw new Error(`Failed to map business '${businessKey}' to tenant '${xeroTenantId}': ${error.message}`);
  }
}

/**
 * Confirms all tenant mappings for a licence group and enables sync.
 * Only called after the user has reviewed and confirmed the mapping table.
 */
export async function confirmTenantMappings(licenceName: LicenceName): Promise<void> {
  // Resolve licence row id
  const { data: licenceRow, error: licenceError } = await supabaseAdmin
    .from('xero_licence_tokens')
    .select('id')
    .eq('licence_name', licenceName)
    .single();

  if (licenceError || !licenceRow) {
    throw new Error(`Licence '${licenceName}' not found.`);
  }

  const { error } = await supabaseAdmin
    .from('xero_business_tenants')
    .update({
      sync_enabled: true,
      confirmed_at: new Date().toISOString(),
    })
    .eq('licence_id', licenceRow.id);

  if (error) {
    throw new Error(`Failed to confirm mappings for licence '${licenceName}': ${error.message}`);
  }
}

// ─── Status ────────────────────────────────────────────────────────────────────

/**
 * Returns the connection status of both licences and their mapped businesses.
 */
export async function getLicenceStatus(): Promise<LicenceStatus> {
  const { data: licences, error: licenceError } = await supabaseAdmin
    .from('xero_licence_tokens')
    .select('id, licence_name, status, connected_at')
    .in('licence_name', ['carsi', 'dr_nrpg']);

  if (licenceError) {
    throw new Error(`Failed to read licence status: ${licenceError.message}`);
  }

  const { data: mappings, error: mappingError } = await supabaseAdmin
    .from('xero_business_tenants')
    .select('*');

  if (mappingError) {
    throw new Error(`Failed to read tenant mappings: ${mappingError.message}`);
  }

  const byLicence = (licenceName: LicenceName) => {
    const licence = (licences ?? []).find((l) => l.licence_name === licenceName);
    const licenceMappings = (mappings ?? []).filter(
      (m: XeroBusinessTenant) => m.licence_id === licence?.id
    );
    return {
      status: licence?.status ?? 'disconnected',
      connected_at: licence?.connected_at ?? null,
      mapped_businesses: licenceMappings as XeroBusinessTenant[],
    };
  };

  return {
    carsi: byLicence('carsi'),
    dr_nrpg: byLicence('dr_nrpg'),
  };
}

// ─── Sync ─────────────────────────────────────────────────────────────────────

/**
 * Syncs invoices for a specific business from its mapped Xero tenant.
 *
 * Safety: only proceeds if xero_business_tenants has a confirmed mapping
 * with sync_enabled = true for this business key.
 */
export async function syncBusinessInvoices(businessKey: string): Promise<SyncResult> {
  // Look up the mapping
  const { data: mapping, error: mapError } = await supabaseAdmin
    .from('xero_business_tenants')
    .select('*, xero_licence_tokens(licence_name, access_token, refresh_token, token_set_json, expires_at, status)')
    .eq('business_key', businessKey)
    .single();

  if (mapError || !mapping) {
    throw new Error(`No tenant mapping found for business '${businessKey}'. Configure the mapping in /founder/integrations/xero first.`);
  }

  if (!mapping.sync_enabled) {
    throw new Error(`Sync is not enabled for '${businessKey}'. Confirm the tenant mapping in the setup UI first.`);
  }

  if (!mapping.confirmed_at) {
    throw new Error(`Tenant mapping for '${businessKey}' has not been confirmed. Review and confirm in the setup UI.`);
  }

  // Insert sync log entry
  const { data: logRow, error: logError } = await supabaseAdmin
    .from('xero_sync_log')
    .insert({
      business_key: businessKey,
      sync_type: 'invoices',
      records_synced: 0,
      errors: [],
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (logError || !logRow) {
    throw new Error(`Failed to create sync log entry: ${logError?.message}`);
  }

  const errors: unknown[] = [];
  let recordsSynced = 0;

  try {
    // Determine licence name from the joined row
    const licenceData = mapping.xero_licence_tokens as {
      licence_name: LicenceName;
      status: string;
    } | null;

    if (!licenceData || licenceData.status !== 'connected') {
      throw new Error(`Licence for '${businessKey}' is not connected. Status: ${licenceData?.status ?? 'unknown'}`);
    }

    const xero = await buildXeroClient(licenceData.licence_name);
    const tenantId: string = mapping.xero_tenant_id;

    // Fetch invoices modified in last 90 days
    const since = new Date();
    since.setDate(since.getDate() - 90);

    const response = await xero.accountingApi.getInvoices(
      tenantId,
      since,       // ifModifiedSince
      undefined,   // where
      undefined,   // order
      undefined,   // ids
      undefined,   // invoiceNumbers
      undefined,   // contactIDs
      ['AUTHORISED', 'PAID'] // statuses
    );

    const invoices = response.body.invoices ?? [];
    recordsSynced = invoices.length;

    // Update last synced timestamp for this business
    await supabaseAdmin
      .from('xero_business_tenants')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('business_key', businessKey);

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push({ message });
    console.error(`[xero-founder] Sync failed for '${businessKey}':`, message);

    // Mark licence as error if it's a token issue
    if (message.includes('token') || message.includes('401') || message.includes('unauthorize')) {
      await supabaseAdmin
        .from('xero_licence_tokens')
        .update({ status: 'error', error_message: message })
        .eq('licence_name', (mapping.xero_licence_tokens as { licence_name: LicenceName })?.licence_name);
    }
  }

  const completedAt = new Date().toISOString();

  // Update sync log
  await supabaseAdmin
    .from('xero_sync_log')
    .update({
      records_synced: recordsSynced,
      errors,
      completed_at: completedAt,
    })
    .eq('id', logRow.id);

  return {
    business_key: businessKey,
    records_synced: recordsSynced,
    errors,
    completed_at: completedAt,
  };
}

/**
 * Refreshes a licence's access token using the stored refresh token.
 * Call this when status is 'expired'.
 */
export async function refreshLicenceToken(licence: LicenceName): Promise<void> {
  const xero = await buildXeroClient(licence);

  try {
    const newTokenSet = await xero.refreshToken();
    await _saveTokens(licence, newTokenSet);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    await supabaseAdmin
      .from('xero_licence_tokens')
      .update({ status: 'error', error_message: message, updated_at: new Date().toISOString() })
      .eq('licence_name', licence);
    throw new Error(`Failed to refresh token for licence '${licence}': ${message}`);
  }
}
