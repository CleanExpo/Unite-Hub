/**
 * Agency Service
 * Phase 90: Agency CRUD operations
 */

import { getSupabaseServer } from '@/lib/supabase';
import { Agency, CreateAgencyInput, TenantStats, AgencyRole } from './tenantTypes';

/**
 * Create a new agency
 */
export async function createAgency(
  input: CreateAgencyInput,
  ownerId: string
): Promise<Agency> {
  const supabase = await getSupabaseServer();

  // Create agency
  const { data: agency, error: agencyError } = await supabase
    .from('agencies')
    .insert({
      name: input.name,
      slug: input.slug,
      parent_agency_id: input.parentAgencyId,
      settings: input.settings || {},
    })
    .select()
    .single();

  if (agencyError) {
    throw new Error(`Failed to create agency: ${agencyError.message}`);
  }

  // Add owner as agency user
  const { error: userError } = await supabase
    .from('agency_users')
    .insert({
      agency_id: agency.id,
      user_id: ownerId,
      role: 'owner',
    });

  if (userError) {
    // Rollback agency creation
    await supabase.from('agencies').delete().eq('id', agency.id);
    throw new Error(`Failed to add owner: ${userError.message}`);
  }

  return mapToAgency(agency);
}

/**
 * Get agency by ID
 */
export async function getAgency(agencyId: string): Promise<Agency | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('agencies')
    .select('*')
    .eq('id', agencyId)
    .single();

  if (error || !data) {
    return null;
  }

  return mapToAgency(data);
}

/**
 * Get agency by slug
 */
export async function getAgencyBySlug(slug: string): Promise<Agency | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('agencies')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return null;
  }

  return mapToAgency(data);
}

/**
 * Update agency
 */
export async function updateAgency(
  agencyId: string,
  updates: Partial<Agency>
): Promise<Agency> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('agencies')
    .update({
      name: updates.name,
      slug: updates.slug,
      settings: updates.settings,
      active: updates.active,
      metadata: updates.metadata,
    })
    .eq('id', agencyId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update agency: ${error.message}`);
  }

  return mapToAgency(data);
}

/**
 * Get agency stats
 */
export async function getAgencyStats(agencyId: string): Promise<TenantStats> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase.rpc('get_tenant_stats', {
    p_tenant_id: agencyId,
  });

  if (!data) {
    return {
      totalUsers: 0,
      totalContacts: 0,
      activePlaybooks: 0,
      subAgencies: 0,
    };
  }

  return {
    totalUsers: data.total_users,
    totalContacts: data.total_contacts,
    activePlaybooks: data.active_playbooks,
    subAgencies: data.sub_agencies,
  };
}

/**
 * Add user to agency
 */
export async function addAgencyUser(
  agencyId: string,
  userId: string,
  role: AgencyRole
): Promise<void> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('agency_users')
    .insert({
      agency_id: agencyId,
      user_id: userId,
      role,
    });

  if (error) {
    throw new Error(`Failed to add user: ${error.message}`);
  }
}

/**
 * Remove user from agency
 */
export async function removeAgencyUser(
  agencyId: string,
  userId: string
): Promise<void> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('agency_users')
    .delete()
    .eq('agency_id', agencyId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to remove user: ${error.message}`);
  }
}

/**
 * Get agency users
 */
export async function getAgencyUsers(agencyId: string) {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('agency_users')
    .select(`
      *,
      user:auth.users (
        id,
        email
      )
    `)
    .eq('agency_id', agencyId);

  if (error) {
    console.error('Failed to get agency users:', error);
    return [];
  }

  return data || [];
}

// Helper
function mapToAgency(row: any): Agency {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    name: row.name,
    slug: row.slug,
    parentAgencyId: row.parent_agency_id,
    active: row.active,
    settings: row.settings,
    metadata: row.metadata,
  };
}
