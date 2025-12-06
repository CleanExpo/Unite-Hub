/**
 * Synthex Agency Workspace Service
 * Phase B32: Agency Multi-Workspace + Brand Switcher
 *
 * Allows agencies to manage multiple client workspaces (tenants)
 * from a single Synthex account with portfolio overview.
 */

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase';

// =====================================================
// Types
// =====================================================

export interface Agency {
  id: string;
  owner_user_id: string;
  name: string;
  description?: string;
  logo_url?: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AgencyClient {
  id: string;
  agency_id: string;
  tenant_id: string;
  label: string;
  primary_domain?: string;
  status: 'active' | 'paused' | 'archived';
  notes?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AgencyMembership {
  user_id: string;
  agency_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AgencyActiveTenant {
  user_id: string;
  tenant_id: string;
  agency_id?: string;
  switched_at: string;
}

export interface AgencyWithStats {
  agency_id: string;
  agency_name: string;
  role: string;
  client_count: number;
  active_client_count: number;
}

export interface ClientSummary {
  tenant_id: string;
  label: string;
  primary_domain?: string;
  status: string;
  seo_health_score?: number;
  active_campaigns?: number;
  audience_size?: number;
  leads_this_month?: number;
  risk_indicators?: string[];
}

export interface PortfolioSummary {
  agency_id: string;
  agency_name: string;
  total_clients: number;
  active_clients: number;
  clients: ClientSummary[];
  aggregate_stats: {
    total_audience: number;
    total_campaigns: number;
    total_leads: number;
    avg_seo_health: number;
  };
}

// =====================================================
// Agency Management
// =====================================================

/**
 * Get all agencies the user is a member of
 */
export async function getUserAgencies(userId: string): Promise<AgencyWithStats[]> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase.rpc('get_user_agencies_with_stats', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error fetching user agencies:', error);
    // Fall back to direct query if RPC fails
    const { data: memberships, error: memberError } = await supabase
      .from('synthex_agency_memberships')
      .select(`
        role,
        agency:synthex_agency_accounts (
          id,
          name
        )
      `)
      .eq('user_id', userId);

    if (memberError) {
      throw new Error(`Failed to fetch agencies: ${memberError.message}`);
    }

    // Map to expected format
    return (memberships || []).map((m: { role: string; agency: { id: string; name: string } }) => ({
      agency_id: m.agency.id,
      agency_name: m.agency.name,
      role: m.role,
      client_count: 0,
      active_client_count: 0,
    }));
  }

  return data || [];
}

/**
 * Create a new agency
 */
export async function createAgency(
  userId: string,
  name: string,
  description?: string
): Promise<Agency> {
  const supabase = supabaseAdmin;

  // Create the agency
  const { data: agency, error: agencyError } = await supabase
    .from('synthex_agency_accounts')
    .insert({
      owner_user_id: userId,
      name,
      description,
      settings: {},
    })
    .select()
    .single();

  if (agencyError) {
    throw new Error(`Failed to create agency: ${agencyError.message}`);
  }

  // Create owner membership
  const { error: memberError } = await supabase
    .from('synthex_agency_memberships')
    .insert({
      user_id: userId,
      agency_id: agency.id,
      role: 'owner',
      permissions: { all: true },
    });

  if (memberError) {
    console.error('Failed to create owner membership:', memberError);
  }

  return agency;
}

/**
 * Get agency by ID
 */
export async function getAgency(agencyId: string): Promise<Agency | null> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('synthex_agency_accounts')
    .select('*')
    .eq('id', agencyId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch agency: ${error.message}`);
  }

  return data;
}

// =====================================================
// Client Management
// =====================================================

/**
 * Get all clients for an agency
 */
export async function getAgencyClients(agencyId: string): Promise<AgencyClient[]> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('synthex_agency_clients')
    .select('*')
    .eq('agency_id', agencyId)
    .order('label', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch agency clients: ${error.message}`);
  }

  return data || [];
}

/**
 * Link a tenant to an agency as a client
 */
export async function linkTenantToAgencyClient(
  agencyId: string,
  tenantId: string,
  label: string,
  domain?: string,
  notes?: string
): Promise<AgencyClient> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('synthex_agency_clients')
    .upsert(
      {
        agency_id: agencyId,
        tenant_id: tenantId,
        label,
        primary_domain: domain,
        notes,
        status: 'active',
        metadata: {},
      },
      {
        onConflict: 'agency_id,tenant_id',
      }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to link tenant to agency: ${error.message}`);
  }

  return data;
}

/**
 * Update client status
 */
export async function updateClientStatus(
  clientId: string,
  status: 'active' | 'paused' | 'archived'
): Promise<AgencyClient> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('synthex_agency_clients')
    .update({ status })
    .eq('id', clientId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update client status: ${error.message}`);
  }

  return data;
}

/**
 * Remove client from agency
 */
export async function removeAgencyClient(clientId: string): Promise<void> {
  const supabase = supabaseAdmin;

  const { error } = await supabase
    .from('synthex_agency_clients')
    .delete()
    .eq('id', clientId);

  if (error) {
    throw new Error(`Failed to remove client: ${error.message}`);
  }
}

// =====================================================
// Active Tenant Management
// =====================================================

/**
 * Set the active tenant for a user session
 */
export async function setActiveTenantForUser(
  userId: string,
  tenantId: string,
  agencyId?: string
): Promise<AgencyActiveTenant> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('synthex_agency_active_tenant')
    .upsert(
      {
        user_id: userId,
        tenant_id: tenantId,
        agency_id: agencyId,
        switched_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to set active tenant: ${error.message}`);
  }

  return data;
}

/**
 * Get the active tenant for a user
 */
export async function getActiveTenantForUser(userId: string): Promise<AgencyActiveTenant | null> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('synthex_agency_active_tenant')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get active tenant: ${error.message}`);
  }

  return data;
}

// =====================================================
// Portfolio Summary
// =====================================================

/**
 * Get aggregated portfolio summary for an agency
 * Collects SEO, campaign, and audience stats per tenant
 */
export async function getAgencyPortfolioSummary(agencyId: string): Promise<PortfolioSummary> {
  const supabase = supabaseAdmin;

  // Get agency details
  const agency = await getAgency(agencyId);
  if (!agency) {
    throw new Error('Agency not found');
  }

  // Get all clients
  const clients = await getAgencyClients(agencyId);

  // Build client summaries with stats from various Synthex tables
  const clientSummaries: ClientSummary[] = await Promise.all(
    clients.map(async (client) => {
      const summary: ClientSummary = {
        tenant_id: client.tenant_id,
        label: client.label,
        primary_domain: client.primary_domain,
        status: client.status,
        risk_indicators: [],
      };

      try {
        // Get SEO health from synthex_seo_reports (if exists)
        const { data: seoData } = await supabase
          .from('synthex_seo_reports')
          .select('overall_score')
          .eq('tenant_id', client.tenant_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (seoData) {
          summary.seo_health_score = seoData.overall_score;
          if (seoData.overall_score < 50) {
            summary.risk_indicators?.push('Low SEO health');
          }
        }
      } catch {
        // Table may not exist, skip
      }

      try {
        // Get active campaigns count
        const { count: campaignCount } = await supabase
          .from('synthex_campaigns')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', client.tenant_id)
          .eq('status', 'active');

        summary.active_campaigns = campaignCount || 0;
      } catch {
        // Table may not exist, skip
      }

      try {
        // Get audience size from synthex_audience_segments
        const { data: audienceData } = await supabase
          .from('synthex_audience_segments')
          .select('member_count')
          .eq('tenant_id', client.tenant_id);

        if (audienceData) {
          summary.audience_size = audienceData.reduce(
            (sum: number, seg: { member_count: number }) => sum + (seg.member_count || 0),
            0
          );
        }
      } catch {
        // Table may not exist, skip
      }

      try {
        // Get leads this month from synthex_leads
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count: leadCount } = await supabase
          .from('synthex_leads')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', client.tenant_id)
          .gte('created_at', startOfMonth.toISOString());

        summary.leads_this_month = leadCount || 0;
      } catch {
        // Table may not exist, skip
      }

      return summary;
    })
  );

  // Calculate aggregate stats
  const activeClients = clientSummaries.filter((c) => c.status === 'active');
  const totalAudience = clientSummaries.reduce((sum, c) => sum + (c.audience_size || 0), 0);
  const totalCampaigns = clientSummaries.reduce((sum, c) => sum + (c.active_campaigns || 0), 0);
  const totalLeads = clientSummaries.reduce((sum, c) => sum + (c.leads_this_month || 0), 0);

  const seoScores = clientSummaries
    .filter((c) => c.seo_health_score !== undefined)
    .map((c) => c.seo_health_score!);
  const avgSeoHealth = seoScores.length > 0
    ? Math.round(seoScores.reduce((sum, s) => sum + s, 0) / seoScores.length)
    : 0;

  return {
    agency_id: agencyId,
    agency_name: agency.name,
    total_clients: clients.length,
    active_clients: activeClients.length,
    clients: clientSummaries,
    aggregate_stats: {
      total_audience: totalAudience,
      total_campaigns: totalCampaigns,
      total_leads: totalLeads,
      avg_seo_health: avgSeoHealth,
    },
  };
}

// =====================================================
// Membership Management
// =====================================================

/**
 * Add a member to an agency
 */
export async function addAgencyMember(
  agencyId: string,
  userId: string,
  role: 'admin' | 'member' | 'viewer' = 'member'
): Promise<AgencyMembership> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('synthex_agency_memberships')
    .insert({
      user_id: userId,
      agency_id: agencyId,
      role,
      permissions: {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add member: ${error.message}`);
  }

  return data;
}

/**
 * Update member role
 */
export async function updateMemberRole(
  agencyId: string,
  userId: string,
  role: 'admin' | 'member' | 'viewer'
): Promise<AgencyMembership> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('synthex_agency_memberships')
    .update({ role })
    .eq('agency_id', agencyId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update member role: ${error.message}`);
  }

  return data;
}

/**
 * Remove a member from an agency
 */
export async function removeAgencyMember(agencyId: string, userId: string): Promise<void> {
  const supabase = supabaseAdmin;

  const { error } = await supabase
    .from('synthex_agency_memberships')
    .delete()
    .eq('agency_id', agencyId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to remove member: ${error.message}`);
  }
}

/**
 * Get all members of an agency
 */
export async function getAgencyMembers(agencyId: string): Promise<AgencyMembership[]> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('synthex_agency_memberships')
    .select('*')
    .eq('agency_id', agencyId)
    .order('role', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch members: ${error.message}`);
  }

  return data || [];
}

/**
 * Check if user has access to agency
 */
export async function userHasAgencyAccess(
  userId: string,
  agencyId: string
): Promise<{ hasAccess: boolean; role?: string }> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('synthex_agency_memberships')
    .select('role')
    .eq('user_id', userId)
    .eq('agency_id', agencyId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { hasAccess: false };
    }
    throw new Error(`Failed to check access: ${error.message}`);
  }

  return { hasAccess: true, role: data.role };
}
