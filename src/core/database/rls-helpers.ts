/**
 * RLS Policy Helpers
 *
 * Server-side helpers that mirror RLS policies for application-level checks.
 * These provide defense-in-depth alongside database RLS policies.
 *
 * See: .claude/RLS_WORKFLOW.md for the 3-step migration process
 *
 * @module core/database/rls-helpers
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { UserRole } from '@/core/auth/types';

/**
 * Check if user owns a workspace
 *
 * Mirrors: rls_user_owns_workspace(user_id, workspace_id)
 */
export async function userOwnsWorkspace(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('workspaces')
    .select('id')
    .eq('id', workspaceId)
    .eq('owner_id', userId)
    .maybeSingle();

  return !error && !!data;
}

/**
 * Check if user is member of organization
 *
 * Mirrors: rls_user_in_organization(user_id, org_id)
 */
export async function userInOrganization(
  supabase: SupabaseClient,
  userId: string,
  organizationId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_organizations')
    .select('id')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .maybeSingle();

  return !error && !!data;
}

/**
 * Check if user has access to workspace (owner or org member)
 *
 * Mirrors: rls_user_has_workspace_access(user_id, workspace_id)
 */
export async function userHasWorkspaceAccess(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string
): Promise<boolean> {
  // Check ownership first (faster)
  const isOwner = await userOwnsWorkspace(supabase, userId, workspaceId);
  if (isOwner) return true;

  // Check organization membership
  // Workspace might be linked to an org
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('organization_id')
    .eq('id', workspaceId)
    .maybeSingle();

  if (workspace?.organization_id) {
    return userInOrganization(supabase, userId, workspace.organization_id);
  }

  // Also check if workspaceId is actually an org ID
  return userInOrganization(supabase, userId, workspaceId);
}

/**
 * Get user's role from profile
 *
 * Mirrors: rls_get_user_role(user_id)
 */
export async function getUserRole(
  supabase: SupabaseClient,
  userId: string
): Promise<UserRole> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data?.role) {
    return 'CLIENT'; // Default to most restrictive
  }

  return data.role as UserRole;
}

/**
 * Check if user is staff (FOUNDER, STAFF, or ADMIN)
 *
 * Mirrors: rls_is_staff(user_id)
 */
export async function userIsStaff(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const role = await getUserRole(supabase, userId);
  return ['FOUNDER', 'STAFF', 'ADMIN'].includes(role);
}

/**
 * Check if user is founder
 *
 * Mirrors: rls_is_founder(user_id)
 */
export async function userIsFounder(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const role = await getUserRole(supabase, userId);
  return role === 'FOUNDER';
}

/**
 * Check if user can read a record in a workspace-scoped table
 *
 * Combined policy check for SELECT operations
 */
export async function canReadWorkspaceRecord(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string
): Promise<boolean> {
  return userHasWorkspaceAccess(supabase, userId, workspaceId);
}

/**
 * Check if user can write a record in a workspace-scoped table
 *
 * Combined policy check for INSERT/UPDATE/DELETE operations
 */
export async function canWriteWorkspaceRecord(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string
): Promise<boolean> {
  // For now, same as read access
  // Can be extended for role-based write restrictions
  return userHasWorkspaceAccess(supabase, userId, workspaceId);
}

/**
 * Check if user can access admin functions
 */
export async function canAccessAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const role = await getUserRole(supabase, userId);
  return ['FOUNDER', 'ADMIN'].includes(role);
}

/**
 * Batch check workspace access for multiple workspace IDs
 *
 * Useful for operations that span multiple workspaces
 */
export async function batchCheckWorkspaceAccess(
  supabase: SupabaseClient,
  userId: string,
  workspaceIds: string[]
): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();

  // Get all user's organizations
  const { data: memberships } = await supabase
    .from('user_organizations')
    .select('organization_id')
    .eq('user_id', userId);

  const orgIds = new Set(memberships?.map(m => m.organization_id) || []);

  // Get all user's owned workspaces
  const { data: ownedWorkspaces } = await supabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', userId);

  const ownedIds = new Set(ownedWorkspaces?.map(w => w.id) || []);

  // Check each workspace
  for (const workspaceId of workspaceIds) {
    const hasAccess = ownedIds.has(workspaceId) || orgIds.has(workspaceId);
    results.set(workspaceId, hasAccess);
  }

  return results;
}
