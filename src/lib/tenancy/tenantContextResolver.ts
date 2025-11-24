/**
 * Tenant Context Resolver
 * Phase 90: Resolve tenant context from session/request
 */

import { getSupabaseServer } from '@/lib/supabase';
import { TenantContext, UserAgency, AgencyRole } from './tenantTypes';

/**
 * Resolve tenant context for a request
 */
export async function resolveForRequest(
  userId: string,
  tenantId?: string
): Promise<TenantContext | null> {
  const supabase = await getSupabaseServer();

  // If tenantId provided, verify access
  if (tenantId) {
    const { data: membership } = await supabase
      .from('agency_users')
      .select(`
        role,
        permissions,
        agencies (
          id,
          name,
          slug,
          active
        )
      `)
      .eq('user_id', userId)
      .eq('agency_id', tenantId)
      .single();

    if (!membership || !membership.agencies) {
      return null;
    }

    const agency = membership.agencies as any;

    if (!agency.active) {
      return null;
    }

    return {
      tenantId: agency.id,
      tenantName: agency.name,
      tenantSlug: agency.slug,
      userId,
      role: membership.role as AgencyRole,
      permissions: membership.permissions || [],
      isOwner: membership.role === 'owner',
      isManager: membership.role === 'owner' || membership.role === 'manager',
    };
  }

  // No tenantId provided, get user's default (first) agency
  const { data: memberships } = await supabase
    .from('agency_users')
    .select(`
      role,
      permissions,
      agencies (
        id,
        name,
        slug,
        active
      )
    `)
    .eq('user_id', userId)
    .limit(1);

  if (!memberships || memberships.length === 0) {
    return null;
  }

  const membership = memberships[0];
  const agency = membership.agencies as any;

  if (!agency || !agency.active) {
    return null;
  }

  return {
    tenantId: agency.id,
    tenantName: agency.name,
    tenantSlug: agency.slug,
    userId,
    role: membership.role as AgencyRole,
    permissions: membership.permissions || [],
    isOwner: membership.role === 'owner',
    isManager: membership.role === 'owner' || membership.role === 'manager',
  };
}

/**
 * Assert user has access to tenant
 */
export async function assertTenantAccess(
  userId: string,
  tenantId: string
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('agency_users')
    .select('id')
    .eq('user_id', userId)
    .eq('agency_id', tenantId)
    .single();

  return !error && !!data;
}

/**
 * List all tenants for a user
 */
export async function listUserTenants(userId: string): Promise<UserAgency[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('agency_users')
    .select(`
      role,
      agencies (
        id,
        name,
        slug,
        active
      )
    `)
    .eq('user_id', userId);

  if (error || !data) {
    return [];
  }

  return data.map((membership) => {
    const agency = membership.agencies as any;
    return {
      agencyId: agency.id,
      agencyName: agency.name,
      agencySlug: agency.slug,
      role: membership.role as AgencyRole,
      isActive: agency.active,
    };
  });
}

/**
 * Get user's role in a tenant
 */
export async function getUserRole(
  userId: string,
  tenantId: string
): Promise<AgencyRole | null> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('agency_users')
    .select('role')
    .eq('user_id', userId)
    .eq('agency_id', tenantId)
    .single();

  return data?.role as AgencyRole || null;
}

/**
 * Check if user is owner of tenant
 */
export async function isOwner(
  userId: string,
  tenantId: string
): Promise<boolean> {
  const role = await getUserRole(userId, tenantId);
  return role === 'owner';
}

/**
 * Check if user can manage tenant
 */
export async function canManage(
  userId: string,
  tenantId: string
): Promise<boolean> {
  const role = await getUserRole(userId, tenantId);
  return role === 'owner' || role === 'manager';
}
