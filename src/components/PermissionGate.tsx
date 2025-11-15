/**
 * Permission Gate Component
 *
 * Conditionally renders children based on user's role permissions.
 * Used to show/hide UI elements based on RBAC rules.
 *
 * @module PermissionGate
 */

"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission, hasAnyPermission, hasAllPermissions, Permission } from '@/lib/permissions';

interface PermissionGateProps {
  /**
   * Single permission required to view children
   */
  permission?: Permission;

  /**
   * Array of permissions - user needs ANY one (OR logic)
   */
  anyPermission?: Permission[];

  /**
   * Array of permissions - user needs ALL (AND logic)
   */
  allPermissions?: Permission[];

  /**
   * Content to render if user has permission
   */
  children: React.ReactNode;

  /**
   * Optional fallback content if user lacks permission
   */
  fallback?: React.ReactNode;

  /**
   * If true, renders nothing instead of fallback when unauthorized
   */
  hideOnUnauthorized?: boolean;
}

/**
 * PermissionGate component - conditionally renders based on user permissions
 *
 * @example
 * ```tsx
 * // Single permission
 * <PermissionGate permission="contact:delete">
 *   <Button>Delete Contact</Button>
 * </PermissionGate>
 *
 * // Any permission (OR)
 * <PermissionGate anyPermission={['campaign:create', 'campaign:update']}>
 *   <Button>Edit Campaign</Button>
 * </PermissionGate>
 *
 * // All permissions (AND)
 * <PermissionGate allPermissions={['contact:view', 'contact:export']}>
 *   <Button>Export Contacts</Button>
 * </PermissionGate>
 *
 * // With fallback
 * <PermissionGate permission="billing:manage" fallback={<p>Owner access required</p>}>
 *   <BillingSettings />
 * </PermissionGate>
 *
 * // Hide when unauthorized
 * <PermissionGate permission="org:delete" hideOnUnauthorized>
 *   <DangerZone />
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  permission,
  anyPermission,
  allPermissions,
  children,
  fallback = null,
  hideOnUnauthorized = false,
}: PermissionGateProps) {
  const { currentOrganization } = useAuth();
  const role = currentOrganization?.role;

  // Determine if user has required permissions
  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(role, permission);
  } else if (anyPermission) {
    hasAccess = anyPermission.some(p => hasPermission(role, p));
  } else if (allPermissions) {
    hasAccess = allPermissions.every(p => hasPermission(role, p));
  } else {
    // No permissions specified - allow access (default allow)
    hasAccess = true;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // Unauthorized - show fallback or hide
  if (hideOnUnauthorized) {
    return null;
  }

  return <>{fallback}</>;
}

/**
 * Hook-based alternative to PermissionGate
 * Returns boolean indicating if user has permission
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const canDelete = useHasPermission('contact:delete');
 *   const canEdit = useHasAnyPermission(['campaign:create', 'campaign:update']);
 *
 *   return (
 *     <div>
 *       {canEdit && <EditButton />}
 *       {canDelete && <DeleteButton />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useHasPermission(permission: Permission): boolean {
  const { currentOrganization } = useAuth();
  const role = currentOrganization?.role;
  return hasPermission(role, permission);
}

/**
 * Check if user has ANY of the specified permissions
 */
export function useHasAnyPermission(permissions: Permission[]): boolean {
  const { currentOrganization } = useAuth();
  const role = currentOrganization?.role;
  return permissions.some(p => hasPermission(role, p));
}

/**
 * Check if user has ALL of the specified permissions
 */
export function useHasAllPermissions(permissions: Permission[]): boolean {
  const { currentOrganization } = useAuth();
  const role = currentOrganization?.role;
  return permissions.every(p => hasPermission(role, p));
}

/**
 * Owner-only gate - shorthand for owner permission checks
 */
export function OwnerOnlyGate({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { currentOrganization } = useAuth();
  const isOwner = currentOrganization?.role === 'owner';

  return isOwner ? <>{children}</> : <>{fallback}</>;
}

/**
 * Admin or Owner gate - shorthand for admin/owner checks
 */
export function AdminGate({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { currentOrganization } = useAuth();
  const isAdminOrOwner =
    currentOrganization?.role === 'owner' ||
    currentOrganization?.role === 'admin';

  return isAdminOrOwner ? <>{children}</> : <>{fallback}</>;
}

/**
 * Disable element based on permissions
 * Renders children with disabled prop when unauthorized
 *
 * @example
 * ```tsx
 * <DisableWithoutPermission permission="contact:delete">
 *   <Button>Delete</Button>
 * </DisableWithoutPermission>
 * ```
 */
export function DisableWithoutPermission({
  permission,
  children,
  disabledMessage,
}: {
  permission: Permission;
  children: React.ReactElement;
  disabledMessage?: string;
}) {
  const { currentOrganization } = useAuth();
  const role = currentOrganization?.role;
  const hasAccess = hasPermission(role, permission);

  if (hasAccess) {
    return children;
  }

  // Clone element and add disabled prop
  return React.cloneElement(children, {
    disabled: true,
    title: disabledMessage || `Requires permission: ${permission}`,
  } as any);
}
