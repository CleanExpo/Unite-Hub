/**
 * Role-Based Access Control (RBAC) System
 *
 * This module defines the complete permission matrix for Unite-Hub.
 * Permissions are mapped to user roles (owner, admin, member, viewer).
 *
 * @module permissions
 */

/**
 * User role types as defined in user_organizations table
 */
export type UserRole = "owner" | "admin" | "member" | "viewer";

/**
 * Complete permission matrix
 * Maps each permission to the roles that are allowed to perform it
 */
export const PERMISSIONS = {
  // ============================================
  // ORGANIZATION MANAGEMENT
  // ============================================
  'org:view': ['owner', 'admin', 'member', 'viewer'],
  'org:update': ['owner'],
  'org:delete': ['owner'],
  'org:invite': ['owner', 'admin'],
  'org:remove_members': ['owner', 'admin'],
  'org:change_roles': ['owner'],
  'org:view_members': ['owner', 'admin', 'member', 'viewer'],
  'org:view_audit_logs': ['owner', 'admin'],

  // ============================================
  // WORKSPACE MANAGEMENT
  // ============================================
  'workspace:view': ['owner', 'admin', 'member', 'viewer'],
  'workspace:create': ['owner', 'admin'],
  'workspace:update': ['owner', 'admin', 'member'],
  'workspace:delete': ['owner'],
  'workspace:archive': ['owner', 'admin'],

  // ============================================
  // CONTACT MANAGEMENT
  // ============================================
  'contact:view': ['owner', 'admin', 'member', 'viewer'],
  'contact:create': ['owner', 'admin', 'member'],
  'contact:update': ['owner', 'admin', 'member'],
  'contact:delete': ['owner', 'admin'],
  'contact:export': ['owner', 'admin', 'member'],
  'contact:import': ['owner', 'admin', 'member'],
  'contact:tag': ['owner', 'admin', 'member'],
  'contact:score': ['owner', 'admin', 'member'],

  // ============================================
  // EMAIL MANAGEMENT
  // ============================================
  'email:view': ['owner', 'admin', 'member', 'viewer'],
  'email:send': ['owner', 'admin', 'member'],
  'email:delete': ['owner', 'admin'],
  'email:view_tracking': ['owner', 'admin', 'member'],
  'email:export': ['owner', 'admin', 'member'],

  // ============================================
  // CAMPAIGN MANAGEMENT
  // ============================================
  'campaign:view': ['owner', 'admin', 'member', 'viewer'],
  'campaign:create': ['owner', 'admin', 'member'],
  'campaign:update': ['owner', 'admin', 'member'],
  'campaign:delete': ['owner', 'admin'],
  'campaign:send': ['owner', 'admin'],
  'campaign:pause': ['owner', 'admin', 'member'],
  'campaign:clone': ['owner', 'admin', 'member'],
  'campaign:view_analytics': ['owner', 'admin', 'member', 'viewer'],
  'campaign:export': ['owner', 'admin', 'member'],

  // ============================================
  // DRIP CAMPAIGN MANAGEMENT
  // ============================================
  'drip:view': ['owner', 'admin', 'member', 'viewer'],
  'drip:create': ['owner', 'admin', 'member'],
  'drip:update': ['owner', 'admin', 'member'],
  'drip:delete': ['owner', 'admin'],
  'drip:activate': ['owner', 'admin'],
  'drip:enroll': ['owner', 'admin', 'member'],
  'drip:unenroll': ['owner', 'admin', 'member'],

  // ============================================
  // CONTENT GENERATION (AI)
  // ============================================
  'content:view': ['owner', 'admin', 'member', 'viewer'],
  'content:generate': ['owner', 'admin', 'member'],
  'content:approve': ['owner', 'admin'],
  'content:edit': ['owner', 'admin', 'member'],
  'content:delete': ['owner', 'admin'],
  'content:send': ['owner', 'admin'],

  // ============================================
  // AI AGENT ACCESS
  // ============================================
  'ai:use_agents': ['owner', 'admin', 'member'],
  'ai:view_intelligence': ['owner', 'admin', 'member', 'viewer'],
  'ai:view_scoring': ['owner', 'admin', 'member', 'viewer'],
  'ai:view_sentiment': ['owner', 'admin', 'member', 'viewer'],
  'ai:configure': ['owner', 'admin'],
  'ai:view_memory': ['owner', 'admin'],
  'ai:clear_memory': ['owner'],

  // ============================================
  // INTEGRATION MANAGEMENT
  // ============================================
  'integration:view': ['owner', 'admin', 'member'],
  'integration:connect': ['owner'],
  'integration:disconnect': ['owner', 'admin'],
  'integration:configure': ['owner', 'admin'],
  'integration:sync': ['owner', 'admin', 'member'],

  // ============================================
  // BILLING & SUBSCRIPTION
  // ============================================
  'billing:view': ['owner'],
  'billing:manage': ['owner'],
  'billing:view_invoices': ['owner'],
  'billing:update_payment': ['owner'],
  'billing:cancel_subscription': ['owner'],
  'billing:upgrade_plan': ['owner'],

  // ============================================
  // SETTINGS & CONFIGURATION
  // ============================================
  'settings:view': ['owner', 'admin', 'member'],
  'settings:update': ['owner', 'admin'],
  'settings:update_profile': ['owner', 'admin', 'member', 'viewer'],
  'settings:update_branding': ['owner', 'admin'],
  'settings:update_notifications': ['owner', 'admin', 'member', 'viewer'],

  // ============================================
  // ANALYTICS & REPORTING
  // ============================================
  'analytics:view_dashboard': ['owner', 'admin', 'member', 'viewer'],
  'analytics:export': ['owner', 'admin', 'member'],
  'analytics:view_detailed': ['owner', 'admin', 'member'],
  'analytics:create_reports': ['owner', 'admin'],

  // ============================================
  // TEMPLATES
  // ============================================
  'template:view': ['owner', 'admin', 'member', 'viewer'],
  'template:create': ['owner', 'admin', 'member'],
  'template:update': ['owner', 'admin', 'member'],
  'template:delete': ['owner', 'admin'],
  'template:share': ['owner', 'admin'],

  // ============================================
  // TAGS & LABELS
  // ============================================
  'tag:view': ['owner', 'admin', 'member', 'viewer'],
  'tag:create': ['owner', 'admin', 'member'],
  'tag:update': ['owner', 'admin', 'member'],
  'tag:delete': ['owner', 'admin'],

  // ============================================
  // WEBHOOKS
  // ============================================
  'webhook:view': ['owner', 'admin'],
  'webhook:create': ['owner', 'admin'],
  'webhook:update': ['owner', 'admin'],
  'webhook:delete': ['owner', 'admin'],
  'webhook:test': ['owner', 'admin'],

  // ============================================
  // API KEYS
  // ============================================
  'api_key:view': ['owner'],
  'api_key:create': ['owner'],
  'api_key:revoke': ['owner'],

} as const;

/**
 * Permission type - derived from PERMISSIONS keys
 */
export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if a role has a specific permission
 *
 * @param role - User role to check
 * @param permission - Permission to verify
 * @returns true if role has permission, false otherwise
 *
 * @example
 * ```typescript
 * hasPermission('admin', 'contact:delete') // true
 * hasPermission('viewer', 'contact:delete') // false
 * ```
 */
export function hasPermission(
  role: UserRole | undefined | null,
  permission: Permission
): boolean {
  if (!role) return false;

  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) return false;

  return allowedRoles.includes(role as any);
}

/**
 * Check if a role has ALL of the specified permissions
 *
 * @param role - User role to check
 * @param permissions - Array of permissions to verify
 * @returns true if role has all permissions, false otherwise
 *
 * @example
 * ```typescript
 * hasAllPermissions('admin', ['contact:view', 'contact:update']) // true
 * hasAllPermissions('viewer', ['contact:view', 'contact:delete']) // false
 * ```
 */
export function hasAllPermissions(
  role: UserRole | undefined | null,
  permissions: Permission[]
): boolean {
  if (!role) return false;
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Check if a role has ANY of the specified permissions
 *
 * @param role - User role to check
 * @param permissions - Array of permissions to verify
 * @returns true if role has at least one permission, false otherwise
 *
 * @example
 * ```typescript
 * hasAnyPermission('member', ['billing:manage', 'contact:create']) // true (has contact:create)
 * hasAnyPermission('viewer', ['contact:delete', 'campaign:send']) // false
 * ```
 */
export function hasAnyPermission(
  role: UserRole | undefined | null,
  permissions: Permission[]
): boolean {
  if (!role) return false;
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Get all permissions for a specific role
 *
 * @param role - User role
 * @returns Array of permission keys that the role has access to
 *
 * @example
 * ```typescript
 * const permissions = getPermissionsForRole('admin');
 * // Returns: ['org:view', 'org:invite', 'contact:view', ...]
 * ```
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return Object.entries(PERMISSIONS)
    .filter(([_, allowedRoles]) => allowedRoles.includes(role as any))
    .map(([permission]) => permission as Permission);
}

/**
 * Role hierarchy for comparison
 * Higher values = more permissions
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

/**
 * Check if a role has equal or greater access than another role
 *
 * @param role - User's role
 * @param requiredRole - Minimum required role
 * @returns true if user role >= required role
 *
 * @example
 * ```typescript
 * hasRoleOrHigher('owner', 'admin') // true
 * hasRoleOrHigher('member', 'admin') // false
 * ```
 */
export function hasRoleOrHigher(
  role: UserRole | undefined | null,
  requiredRole: UserRole
): boolean {
  if (!role) return false;
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Get human-readable role display name
 *
 * @param role - User role
 * @returns Formatted role name
 */
export function getRoleDisplayName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
    viewer: 'Viewer',
  };
  return names[role];
}

/**
 * Get role description
 *
 * @param role - User role
 * @returns Description of role capabilities
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    owner: 'Full access including billing, integrations, and organization management',
    admin: 'Manage team members, campaigns, and settings (except billing)',
    member: 'Create and manage contacts, campaigns, and content',
    viewer: 'View-only access to contacts, campaigns, and analytics',
  };
  return descriptions[role];
}

/**
 * Permission categories for UI grouping
 */
export const PERMISSION_CATEGORIES = {
  organization: [
    'org:view', 'org:update', 'org:delete', 'org:invite', 'org:remove_members',
    'org:change_roles', 'org:view_members', 'org:view_audit_logs'
  ],
  workspace: [
    'workspace:view', 'workspace:create', 'workspace:update', 'workspace:delete', 'workspace:archive'
  ],
  contacts: [
    'contact:view', 'contact:create', 'contact:update', 'contact:delete',
    'contact:export', 'contact:import', 'contact:tag', 'contact:score'
  ],
  campaigns: [
    'campaign:view', 'campaign:create', 'campaign:update', 'campaign:delete',
    'campaign:send', 'campaign:pause', 'campaign:clone', 'campaign:view_analytics', 'campaign:export'
  ],
  ai: [
    'ai:use_agents', 'ai:view_intelligence', 'ai:view_scoring',
    'ai:view_sentiment', 'ai:configure', 'ai:view_memory', 'ai:clear_memory'
  ],
  billing: [
    'billing:view', 'billing:manage', 'billing:view_invoices',
    'billing:update_payment', 'billing:cancel_subscription', 'billing:upgrade_plan'
  ],
  integrations: [
    'integration:view', 'integration:connect', 'integration:disconnect',
    'integration:configure', 'integration:sync'
  ],
} as const;
