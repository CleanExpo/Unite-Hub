/**
 * Guardian Access Control Module
 *
 * Role-based access control for Guardian security and governance features.
 * Provides authentication, authorization, and tenant isolation.
 *
 * @module guardian/access
 */

import { createClient } from '@/lib/supabase/server';

export type GuardianRole =
  | 'guardian_admin'
  | 'guardian_analyst'
  | 'guardian_viewer'
  | 'workspace_admin'
  | 'workspace_user';

export interface GuardianAccessContext {
  userId: string;
  role: GuardianRole;
  workspaceId: string | null;
  email: string;
}

/**
 * Get Guardian access context for current user
 *
 * Retrieves authenticated user information and their role/permissions
 * for Guardian system access control.
 *
 * @returns Guardian access context with user role and workspace
 * @throws Error if user is not authenticated
 *
 * @example
 * ```typescript
 * const { userId, role, workspaceId } = await getGuardianAccessContext();
 * if (role === 'guardian_admin') {
 *   // Allow admin operations
 * }
 * ```
 */
export async function getGuardianAccessContext(): Promise<GuardianAccessContext> {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized: User not authenticated');
  }

  // Get user's workspace and role
  // Note: This is a simplified implementation
  // In production, fetch from user_organizations or profiles table
  const { data: orgData } = await supabase
    .from('user_organizations')
    .select('org_id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  const workspaceId = orgData?.org_id || null;

  // Get user role from profiles table
  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Map profile role to Guardian role
  // For now, default to workspace_user unless explicitly set
  let guardianRole: GuardianRole = 'workspace_user';

  if (profileData?.role === 'ADMIN') {
    guardianRole = 'guardian_admin';
  } else if (profileData?.role === 'FOUNDER') {
    guardianRole = 'guardian_admin';
  }

  return {
    userId: user.id,
    role: guardianRole,
    workspaceId,
    email: user.email || '',
  };
}

/**
 * Assert that user has required Guardian role
 *
 * Throws an error if the user's role is not in the allowed list.
 * Use this for role-based access control on Guardian endpoints.
 *
 * @param userRole Current user's Guardian role
 * @param allowedRoles Array of allowed roles
 * @throws Error if user role is not allowed
 *
 * @example
 * ```typescript
 * const { role } = await getGuardianAccessContext();
 * assertGuardianRole(role, ['guardian_admin', 'guardian_analyst']);
 * // Proceeds only if user has admin or analyst role
 * ```
 */
export function assertGuardianRole(
  userRole: GuardianRole,
  allowedRoles: GuardianRole[]
): void {
  if (!allowedRoles.includes(userRole)) {
    throw new Error(
      `Forbidden: Role '${userRole}' not authorized. Required: ${allowedRoles.join(', ')}`
    );
  }
}

/**
 * Check if user has specific Guardian permission
 *
 * More granular permission check beyond role-based access.
 * Can be used for feature-specific authorization.
 *
 * @param role User's Guardian role
 * @param permission Permission to check (e.g., 'view_logs', 'manage_policies')
 * @returns True if user has permission
 *
 * @example
 * ```typescript
 * const { role } = await getGuardianAccessContext();
 * if (hasGuardianPermission(role, 'view_logs')) {
 *   // Allow log access
 * }
 * ```
 */
export function hasGuardianPermission(
  role: GuardianRole,
  permission: string
): boolean {
  // Permission matrix
  const permissions: Record<GuardianRole, string[]> = {
    guardian_admin: [
      'view_logs',
      'manage_policies',
      'view_analytics',
      'manage_users',
      'configure_system',
      'view_notifications',
      'manage_notifications',
    ],
    guardian_analyst: [
      'view_logs',
      'view_analytics',
      'view_notifications',
    ],
    guardian_viewer: [
      'view_logs',
      'view_analytics',
    ],
    workspace_admin: [
      'view_logs',
      'view_analytics',
    ],
    workspace_user: [],
  };

  const userPermissions = permissions[role] || [];
  return userPermissions.includes(permission);
}

/**
 * Get Guardian role hierarchy level
 *
 * Returns numeric level for role comparison (higher = more privileged).
 * Useful for implementing "role or higher" checks.
 *
 * @param role Guardian role
 * @returns Numeric privilege level (0-4)
 */
export function getGuardianRoleLevel(role: GuardianRole): number {
  const levels: Record<GuardianRole, number> = {
    guardian_admin: 4,
    guardian_analyst: 3,
    guardian_viewer: 2,
    workspace_admin: 1,
    workspace_user: 0,
  };

  return levels[role] || 0;
}

/**
 * Check if user role is at least minimum required level
 *
 * @param userRole Current user's role
 * @param minimumRole Minimum required role
 * @returns True if user role meets or exceeds minimum
 *
 * @example
 * ```typescript
 * const { role } = await getGuardianAccessContext();
 * if (meetsMinimumRole(role, 'guardian_analyst')) {
 *   // Allow analyst-level and above
 * }
 * ```
 */
export function meetsMinimumRole(
  userRole: GuardianRole,
  minimumRole: GuardianRole
): boolean {
  return getGuardianRoleLevel(userRole) >= getGuardianRoleLevel(minimumRole);
}
