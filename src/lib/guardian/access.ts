import { createClient } from '@/lib/supabase/server';

/**
 * Guardian G32: Access Level Control
 * Role-based permissions for Guardian features
 */

export type GuardianRole = 'guardian_viewer' | 'guardian_analyst' | 'guardian_admin';

export interface GuardianAccessContext {
  userId: string;
  role: GuardianRole;
  hasViewerAccess: boolean;
  hasAnalystAccess: boolean;
  hasAdminAccess: boolean;
}

/**
 * Phase G32: Guardian Access Levels
 *
 * Roles are derived from Supabase user metadata:
 *   - guardian_viewer: read-only visibility (telemetry streams/events)
 *   - guardian_analyst: viewer + warehouse/replay deeper access
 *   - guardian_admin: full access to scenarios, runs, and high-risk surfaces
 *
 * @returns Access context with user ID and role
 * @throws Error with code 'GUARDIAN_ACCESS_UNAUTHENTICATED' if no user
 */
export async function getGuardianAccessContext(): Promise<GuardianAccessContext> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    const err = new Error('GUARDIAN_ACCESS_UNAUTHENTICATED');
    err.name = 'GUARDIAN_ACCESS_UNAUTHENTICATED';
    throw err;
  }

  // Read role from user metadata, default to viewer
  const role = (data.user.user_metadata?.guardian_role as GuardianRole) || 'guardian_viewer';

  // Compute access levels
  const hasAdminAccess = role === 'guardian_admin';
  const hasAnalystAccess = role === 'guardian_analyst' || hasAdminAccess;
  const hasViewerAccess = role === 'guardian_viewer' || hasAnalystAccess;

  return {
    userId: data.user.id,
    role,
    hasViewerAccess,
    hasAnalystAccess,
    hasAdminAccess,
  };
}

/**
 * Assert that user has one of the required Guardian roles
 *
 * @param role - User's current role
 * @param required - List of allowed roles
 * @throws Error with code 'GUARDIAN_ACCESS_FORBIDDEN' if role not in required list
 */
export function assertGuardianRole(role: GuardianRole, required: GuardianRole[]): void {
  if (!required.includes(role)) {
    const err = new Error('GUARDIAN_ACCESS_FORBIDDEN');
    err.name = 'GUARDIAN_ACCESS_FORBIDDEN';
    throw err;
  }
}

/**
 * Check if role has specific access level
 *
 * @param role - Role to check
 * @param level - Required access level
 * @returns true if role has required level
 */
export function hasGuardianAccess(
  role: GuardianRole,
  level: 'viewer' | 'analyst' | 'admin'
): boolean {
  switch (level) {
    case 'admin':
      return role === 'guardian_admin';
    case 'analyst':
      return role === 'guardian_analyst' || role === 'guardian_admin';
    case 'viewer':
      return true; // All roles have viewer access
    default:
      return false;
  }
}

/**
 * Get human-readable role name
 *
 * @param role - Guardian role
 * @returns Display name
 */
export function getGuardianRoleName(role: GuardianRole): string {
  switch (role) {
    case 'guardian_admin':
      return 'Admin';
    case 'guardian_analyst':
      return 'Analyst';
    case 'guardian_viewer':
      return 'Viewer';
    default:
      return 'Unknown';
  }
}
