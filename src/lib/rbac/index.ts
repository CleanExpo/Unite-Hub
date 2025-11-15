/**
 * RBAC System - Central Export
 *
 * This file provides a single import point for the entire RBAC system.
 * Import everything you need from here for convenience.
 *
 * @module rbac
 *
 * @example
 * ```typescript
 * // Server-side (API routes)
 * import { requirePermission, requireOwner } from '@/lib/rbac';
 *
 * // Client-side (components)
 * import { PermissionGate, usePermissions, RoleBadge } from '@/lib/rbac';
 *
 * // API calls
 * import { apiDelete, isPermissionError } from '@/lib/rbac';
 * ```
 */

// ============================================
// PERMISSIONS & UTILITIES
// ============================================
export {
  // Types
  type UserRole,
  type Permission,

  // Permission Matrix
  PERMISSIONS,
  PERMISSION_CATEGORIES,
  ROLE_HIERARCHY,

  // Permission Checking
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  hasRoleOrHigher,

  // Role Information
  getRoleDisplayName,
  getRoleDescription,
  getPermissionsForRole,
} from '../permissions';

// ============================================
// SERVER-SIDE MIDDLEWARE
// ============================================
export {
  // Types
  type AuthenticatedUser,

  // Authentication
  getUserSession,
  requireAuth,

  // Permission Checks
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,

  // Role Checks
  requireOwner,
  requireAdminOrOwner,

  // Organization Verification
  requireSameOrganization,

  // Utilities
  logPermissionCheck,
  withAuth,
} from '../auth-middleware';

// ============================================
// CLIENT-SIDE COMPONENTS
// ============================================
export {
  // Main Gate
  PermissionGate,

  // Hooks for Permission Checks
  useHasPermission,
  useHasAnyPermission,
  useHasAllPermissions,

  // Shorthand Gates
  OwnerOnlyGate,
  AdminGate,

  // Disable Wrapper
  DisableWithoutPermission,
} from '../../components/PermissionGate';

export {
  // Role Display
  RoleBadge,
  RoleIndicator,
  CurrentUserRole,
} from '../../components/RoleBadge';

// ============================================
// REACT HOOKS
// ============================================
export {
  // Main Hook
  usePermissions,

  // Convenience Hooks
  usePermission,
  useIsOwner,
  useIsAdminOrOwner,
  useRole,
} from '../../hooks/usePermissions';

// ============================================
// API CLIENT
// ============================================
export {
  // Main Client
  authenticatedFetch,

  // HTTP Methods
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,

  // File Upload
  apiUpload,

  // Error Handling
  APIError,
  handleAPIError,
  isAuthError,
  isPermissionError,
} from '../api-client';
