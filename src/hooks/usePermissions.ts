/**
 * usePermissions Hook
 *
 * React hook for accessing user permissions and role information.
 * Provides convenient methods for permission checking in components.
 *
 * @module usePermissions
 */

"use client";

import { useAuth } from '@/contexts/AuthContext';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRoleOrHigher,
  getPermissionsForRole,
  getRoleDisplayName,
  getRoleDescription,
  Permission,
  UserRole,
  ROLE_HIERARCHY,
} from '@/lib/permissions';

/**
 * Permission utilities hook
 *
 * @returns Object with permission checking methods and role information
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { can, canAny, canAll, role, isOwner, isAdmin } = usePermissions();
 *
 *   return (
 *     <div>
 *       {can('contact:delete') && <DeleteButton />}
 *       {isOwner && <BillingSettings />}
 *       {canAny(['campaign:create', 'campaign:update']) && <CampaignEditor />}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePermissions() {
  const { currentOrganization } = useAuth();
  const role = currentOrganization?.role;

  return {
    /**
     * Current user's role
     */
    role,

    /**
     * Organization ID
     */
    orgId: currentOrganization?.org_id,

    /**
     * Organization name
     */
    organizationName: currentOrganization?.organization?.name,

    /**
     * Check if user has a specific permission
     *
     * @param permission - Permission to check
     * @returns true if user has permission
     *
     * @example
     * ```tsx
     * const { can } = usePermissions();
     * if (can('contact:delete')) {
     *   // User can delete contacts
     * }
     * ```
     */
    can: (permission: Permission): boolean => {
      return hasPermission(role, permission);
    },

    /**
     * Check if user has ANY of the specified permissions (OR logic)
     *
     * @param permissions - Array of permissions to check
     * @returns true if user has at least one permission
     *
     * @example
     * ```tsx
     * const { canAny } = usePermissions();
     * if (canAny(['campaign:create', 'campaign:update'])) {
     *   // User can create OR update campaigns
     * }
     * ```
     */
    canAny: (permissions: Permission[]): boolean => {
      return permissions.some(p => hasPermission(role, p));
    },

    /**
     * Check if user has ALL of the specified permissions (AND logic)
     *
     * @param permissions - Array of permissions to check
     * @returns true if user has all permissions
     *
     * @example
     * ```tsx
     * const { canAll } = usePermissions();
     * if (canAll(['contact:view', 'contact:export'])) {
     *   // User can view AND export contacts
     * }
     * ```
     */
    canAll: (permissions: Permission[]): boolean => {
      return permissions.every(p => hasPermission(role, p));
    },

    /**
     * Check if user cannot perform action (inverse of can)
     *
     * @param permission - Permission to check
     * @returns true if user does NOT have permission
     *
     * @example
     * ```tsx
     * const { cannot } = usePermissions();
     * if (cannot('billing:manage')) {
     *   // Show upgrade prompt
     * }
     * ```
     */
    cannot: (permission: Permission): boolean => {
      return !hasPermission(role, permission);
    },

    /**
     * Check if user is owner
     */
    isOwner: role === 'owner',

    /**
     * Check if user is admin
     */
    isAdmin: role === 'admin',

    /**
     * Check if user is member
     */
    isMember: role === 'member',

    /**
     * Check if user is viewer
     */
    isViewer: role === 'viewer',

    /**
     * Check if user is admin or owner
     */
    isAdminOrOwner: role === 'owner' || role === 'admin',

    /**
     * Check if user has role or higher
     *
     * @param requiredRole - Minimum required role
     * @returns true if user role >= required role
     *
     * @example
     * ```tsx
     * const { hasRoleLevel } = usePermissions();
     * if (hasRoleLevel('admin')) {
     *   // User is admin or owner
     * }
     * ```
     */
    hasRoleLevel: (requiredRole: UserRole): boolean => {
      return hasRoleOrHigher(role, requiredRole);
    },

    /**
     * Get all permissions for current user's role
     *
     * @returns Array of permission keys
     *
     * @example
     * ```tsx
     * const { getAllPermissions } = usePermissions();
     * const permissions = getAllPermissions();
     * console.log('User permissions:', permissions);
     * ```
     */
    getAllPermissions: (): Permission[] => {
      if (!role) {
return [];
}
      return getPermissionsForRole(role);
    },

    /**
     * Get human-readable role name
     *
     * @returns Formatted role name (e.g., "Owner", "Admin")
     *
     * @example
     * ```tsx
     * const { getRoleName } = usePermissions();
     * <Badge>{getRoleName()}</Badge> // "Owner"
     * ```
     */
    getRoleName: (): string => {
      if (!role) {
return 'Unknown';
}
      return getRoleDisplayName(role);
    },

    /**
     * Get role description
     *
     * @returns Description of role capabilities
     *
     * @example
     * ```tsx
     * const { getDescription } = usePermissions();
     * <Tooltip>{getDescription()}</Tooltip>
     * ```
     */
    getDescription: (): string => {
      if (!role) {
return '';
}
      return getRoleDescription(role);
    },

    /**
     * Get role hierarchy level (1-4, higher = more permissions)
     *
     * @returns Number representing role level
     */
    getRoleLevel: (): number => {
      if (!role) {
return 0;
}
      return ROLE_HIERARCHY[role];
    },

    /**
     * Check if loaded and has organization
     */
    isLoaded: !!currentOrganization,
  };
}

/**
 * Hook for checking a single permission
 * Simpler alternative when you only need to check one permission
 *
 * @param permission - Permission to check
 * @returns true if user has permission
 *
 * @example
 * ```tsx
 * function DeleteButton() {
 *   const canDelete = usePermission('contact:delete');
 *
 *   if (!canDelete) return null;
 *
 *   return <Button onClick={handleDelete}>Delete</Button>;
 * }
 * ```
 */
export function usePermission(permission: Permission): boolean {
  const { can } = usePermissions();
  return can(permission);
}

/**
 * Hook for checking if user is owner
 *
 * @returns true if user is owner
 *
 * @example
 * ```tsx
 * function BillingSettings() {
 *   const isOwner = useIsOwner();
 *
 *   if (!isOwner) {
 *     return <p>Owner access required</p>;
 *   }
 *
 *   return <BillingForm />;
 * }
 * ```
 */
export function useIsOwner(): boolean {
  const { isOwner } = usePermissions();
  return isOwner;
}

/**
 * Hook for checking if user is admin or owner
 *
 * @returns true if user is admin or owner
 *
 * @example
 * ```tsx
 * function TeamSettings() {
 *   const isAdmin = useIsAdminOrOwner();
 *
 *   if (!isAdmin) {
 *     return <p>Admin access required</p>;
 *   }
 *
 *   return <TeamManagement />;
 * }
 * ```
 */
export function useIsAdminOrOwner(): boolean {
  const { isAdminOrOwner } = usePermissions();
  return isAdminOrOwner;
}

/**
 * Hook that returns current user's role
 *
 * @returns User role or undefined
 *
 * @example
 * ```tsx
 * function RoleIndicator() {
 *   const role = useRole();
 *   return <Badge>{role}</Badge>;
 * }
 * ```
 */
export function useRole(): UserRole | undefined {
  const { role } = usePermissions();
  return role;
}
