/**
 * Role-Based Access Guards
 *
 * Provides authorization checks for different user roles and project contexts.
 * Used in conjunction with auth middleware for fine-grained access control.
 *
 * @module core/auth/guards
 */

import { UserRole, ProjectContext, SynthexTier, RolePermissions } from './types';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Role hierarchy for permission inheritance
 * Higher index = more permissions
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  CLIENT: 1,
  STAFF: 2,
  ADMIN: 3,
  FOUNDER: 4,
};

/**
 * Check if a role is allowed based on permission config
 *
 * @param userRole - Current user's role
 * @param allowedRoles - List of roles that have access
 * @returns true if user has permission
 */
export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Check if user role meets minimum requirement
 *
 * @param userRole - Current user's role
 * @param minimumRole - Minimum role required
 * @returns true if user meets or exceeds minimum
 */
export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}

/**
 * Unite-Hub guard - Staff only (FOUNDER, STAFF, ADMIN)
 * Used for internal CRM routes
 */
export function requireUniteHubAccess(role: UserRole): boolean {
  return hasRole(role, ['FOUNDER', 'STAFF', 'ADMIN']);
}

/**
 * Synthex guard - Clients with active subscription
 * Also allows staff for support access
 */
export function requireSynthexAccess(role: UserRole): boolean {
  return hasRole(role, ['CLIENT', 'FOUNDER', 'STAFF', 'ADMIN']);
}

/**
 * Admin-only guard
 */
export function requireAdmin(role: UserRole): boolean {
  return hasRole(role, ['ADMIN', 'FOUNDER']);
}

/**
 * Founder-only guard (highest privilege)
 */
export function requireFounder(role: UserRole): boolean {
  return role === 'FOUNDER';
}

/**
 * Check Synthex tier requirement
 *
 * @param supabase - Supabase client for DB query
 * @param userId - User ID to check
 * @param requiredTiers - Tiers that have access
 * @returns true if user has required tier
 */
export async function hasSynthexTier(
  supabase: SupabaseClient,
  userId: string,
  requiredTiers: SynthexTier[]
): Promise<boolean> {
  // Staff/Admin/Founder bypass tier checks
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (profile?.role && ['STAFF', 'ADMIN', 'FOUNDER'].includes(profile.role)) {
    return true;
  }

  // Check subscription tier
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('tier, status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (!subscription) {
    return false;
  }

  return requiredTiers.includes(subscription.tier as SynthexTier);
}

/**
 * Check workspace membership
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param workspaceId - Workspace to check access for
 * @returns true if user has access to workspace
 */
export async function hasWorkspaceAccess(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string
): Promise<boolean> {
  // Check direct workspace ownership
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('id', workspaceId)
    .eq('owner_id', userId)
    .maybeSingle();

  if (workspace) {
    return true;
  }

  // Check organization membership
  const { data: membership } = await supabase
    .from('user_organizations')
    .select('organization_id')
    .eq('user_id', userId)
    .eq('organization_id', workspaceId)
    .maybeSingle();

  return !!membership;
}

/**
 * Permission presets for common route patterns
 */
export const PERMISSION_PRESETS = {
  // Unite-Hub routes (staff CRM)
  UNITE_HUB_READ: {
    allowedRoles: ['FOUNDER', 'STAFF', 'ADMIN'] as UserRole[],
    projectContext: 'unite-hub' as ProjectContext,
  },
  UNITE_HUB_WRITE: {
    allowedRoles: ['FOUNDER', 'STAFF', 'ADMIN'] as UserRole[],
    projectContext: 'unite-hub' as ProjectContext,
  },
  UNITE_HUB_ADMIN: {
    allowedRoles: ['FOUNDER', 'ADMIN'] as UserRole[],
    projectContext: 'unite-hub' as ProjectContext,
  },

  // Synthex routes (client portal)
  SYNTHEX_READ: {
    allowedRoles: ['CLIENT', 'FOUNDER', 'STAFF', 'ADMIN'] as UserRole[],
    projectContext: 'synthex' as ProjectContext,
  },
  SYNTHEX_STARTER: {
    allowedRoles: ['CLIENT', 'FOUNDER', 'STAFF', 'ADMIN'] as UserRole[],
    projectContext: 'synthex' as ProjectContext,
    requireTier: ['starter', 'professional', 'elite'] as SynthexTier[],
  },
  SYNTHEX_PROFESSIONAL: {
    allowedRoles: ['CLIENT', 'FOUNDER', 'STAFF', 'ADMIN'] as UserRole[],
    projectContext: 'synthex' as ProjectContext,
    requireTier: ['professional', 'elite'] as SynthexTier[],
  },
  SYNTHEX_ELITE: {
    allowedRoles: ['CLIENT', 'FOUNDER', 'STAFF', 'ADMIN'] as UserRole[],
    projectContext: 'synthex' as ProjectContext,
    requireTier: ['elite'] as SynthexTier[],
  },

  // Shared routes (both projects)
  AUTHENTICATED: {
    allowedRoles: ['CLIENT', 'STAFF', 'ADMIN', 'FOUNDER'] as UserRole[],
    projectContext: 'shared' as ProjectContext,
  },
  FOUNDER_ONLY: {
    allowedRoles: ['FOUNDER'] as UserRole[],
    projectContext: 'shared' as ProjectContext,
  },
} as const;

/**
 * Validate full permission set
 *
 * @param role - User's role
 * @param permissions - Permission configuration
 * @param tierCheck - Optional async tier check result
 * @returns true if all permission requirements are met
 */
export function validatePermissions(
  role: UserRole,
  permissions: RolePermissions,
  tierCheck?: boolean
): boolean {
  // Check role
  if (!hasRole(role, permissions.allowedRoles)) {
    return false;
  }

  // Check tier if required
  if (permissions.requireTier && tierCheck === false) {
    return false;
  }

  return true;
}
