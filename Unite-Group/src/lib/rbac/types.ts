/**
 * Role-Based Access Control (RBAC) Types
 * Unite Group Advanced Security System
 */

// Base types
export interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  level: number;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface Permission {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  resource: string;
  action: string;
  scope: string;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  granted_at: string;
  granted_by: string | null;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  assigned_at: string;
  assigned_by: string | null;
  expires_at: string | null;
  is_active: boolean;
}

export interface RoleHierarchy {
  id: string;
  parent_role_id: string;
  child_role_id: string;
  created_at: string;
}

export interface RBACError {
  code: string;
  message: string;
  details?: unknown;
}

// Audit log types
export interface RBACAction {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// Request/Response types
export interface CreateRoleRequest {
  name: string;
  display_name: string;
  description?: string;
  level: number;
  permission_ids?: string[];
}

export interface UpdateRoleRequest {
  display_name?: string;
  description?: string;
  level?: number;
  is_active?: boolean;
  permission_ids?: string[];
}

export interface CreatePermissionRequest {
  name: string;
  display_name: string;
  description?: string;
  resource: string;
  action: string;
  scope?: string;
}

export interface UpdatePermissionRequest {
  display_name?: string;
  description?: string;
  resource?: string;
  action?: string;
  scope?: string;
  is_active?: boolean;
}

export interface AssignRoleRequest {
  user_id: string;
  role_id: string;
  expires_at?: string;
}

export interface BulkAssignRolesRequest {
  user_id: string;
  role_ids: string[];
  expires_at?: string;
}

export interface GrantPermissionRequest {
  role_id: string;
  permission_id: string;
}

export interface BulkGrantPermissionsRequest {
  role_id: string;
  permission_ids: string[];
}

// Extended types with relationships
export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export interface UserWithRoles {
  id: string;
  email: string;
  roles: (Role & { assigned_at: string; expires_at: string | null })[];
}

export interface PermissionWithRoles extends Permission {
  roles: Role[];
}

// Query types
export interface RoleQuery {
  name?: string;
  level_min?: number;
  level_max?: number;
  is_active?: boolean;
  is_system?: boolean;
  search?: string;
  sort_by?: 'name' | 'level' | 'created_at';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface PermissionQuery {
  resource?: string;
  action?: string;
  scope?: string;
  is_active?: boolean;
  search?: string;
  sort_by?: 'name' | 'resource' | 'action';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface UserRoleQuery {
  user_id?: string;
  role_id?: string;
  is_active?: boolean;
  expires_before?: string;
  expires_after?: string;
  limit?: number;
  offset?: number;
}

// Authorization context
export interface AuthContext {
  user_id: string;
  roles: string[];
  permissions: string[];
  level: number;
}

// Permission checking
export interface PermissionCheck {
  resource: string;
  action: string;
  scope?: string;
  context?: Record<string, unknown>;
}

export interface PermissionResult {
  granted: boolean;
  reason?: string;
  required_permissions?: string[];
  user_permissions?: string[];
}

// Resource-based permissions
export type ResourceType = 
  | 'users'
  | 'roles'
  | 'projects'
  | 'consultations'
  | 'analytics'
  | 'content'
  | 'payments'
  | 'system';

export type ActionType =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'assign'
  | 'publish'
  | 'process'
  | 'export'
  | 'backup'
  | 'maintenance'
  | 'impersonate';

export type ScopeType =
  | 'all'
  | 'own'
  | 'team'
  | 'organization';

// System roles enum
export enum SystemRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  CONSULTANT = 'consultant',
  CLIENT = 'client',
  GUEST = 'guest'
}

// Permission templates for common patterns
export interface PermissionTemplate {
  name: string;
  permissions: Array<{
    resource: ResourceType;
    action: ActionType;
    scope?: ScopeType;
  }>;
}

// Role level constants
export const ROLE_LEVELS = {
  SUPER_ADMIN: 1000,
  ADMIN: 800,
  MANAGER: 600,
  CONSULTANT: 400,
  CLIENT: 200,
  GUEST: 100
} as const;

// Common permission patterns
export const PERMISSION_PATTERNS = {
  FULL_CRUD: (resource: ResourceType): string[] => [
    `${resource}.create`,
    `${resource}.read`,
    `${resource}.update`,
    `${resource}.delete`
  ],
  
  READ_ONLY: (resource: ResourceType): string[] => [
    `${resource}.read`
  ],
  
  BASIC_CRUD: (resource: ResourceType): string[] => [
    `${resource}.create`,
    `${resource}.read`,
    `${resource}.update`
  ]
} as const;

// Role hierarchies for inheritance
export interface RoleInheritance {
  [key: string]: string[]; // role name -> inherited role names
}

// Default role inheritance structure
export const DEFAULT_ROLE_INHERITANCE: RoleInheritance = {
  [SystemRole.SUPER_ADMIN]: [SystemRole.ADMIN],
  [SystemRole.ADMIN]: [SystemRole.MANAGER],
  [SystemRole.MANAGER]: [SystemRole.CONSULTANT],
  [SystemRole.CONSULTANT]: [SystemRole.CLIENT],
  [SystemRole.CLIENT]: [SystemRole.GUEST]
};

// RBAC configuration
export interface RBACConfig {
  enableRoleInheritance: boolean;
  enablePermissionCaching: boolean;
  cacheExpirationMinutes: number;
  auditEnabled: boolean;
  strictModeEnabled: boolean;
  defaultRole: SystemRole;
  superAdminEmails: string[];
}

// Default RBAC configuration
export const DEFAULT_RBAC_CONFIG: RBACConfig = {
  enableRoleInheritance: true,
  enablePermissionCaching: true,
  cacheExpirationMinutes: 30,
  auditEnabled: true,
  strictModeEnabled: true,
  defaultRole: SystemRole.GUEST,
  superAdminEmails: []
};

// Function types for RBAC operations
export type PermissionChecker = (
  userPermissions: string[],
  requiredPermissions: string | string[],
  context?: Record<string, unknown>
) => boolean;

export type RoleAssigner = (
  userId: string,
  roleIds: string[],
  assignedBy: string,
  expiresAt?: Date
) => Promise<void>;

export type PermissionGranter = (
  roleId: string,
  permissionIds: string[],
  grantedBy: string
) => Promise<void>;

// Middleware types
export interface RBACMiddlewareOptions {
  requiredPermissions?: string[];
  requiredRoles?: string[];
  requireAll?: boolean; // true = AND, false = OR
  onUnauthorized?: (context: AuthContext) => Response;
  onForbidden?: (context: AuthContext) => Response;
}

// Hook types for React components
export interface UseRBACOptions {
  enableCaching?: boolean;
  refreshInterval?: number;
}

export interface UseRBACReturn {
  permissions: string[];
  roles: string[];
  hasPermission: (permission: string | string[]) => boolean;
  hasRole: (role: string | string[]) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  isLoading: boolean;
  error: RBACError | null;
  refresh: () => Promise<void>;
}

// Component prop types
export interface RBACGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  requireAll?: boolean;
  onUnauthorized?: () => void;
}

// API response types
export interface RBACApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: RBACError;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

// Bulk operation types
export interface BulkRoleAssignment {
  user_ids: string[];
  role_ids: string[];
  assigned_by: string;
  expires_at?: string;
}

export interface BulkPermissionGrant {
  role_ids: string[];
  permission_ids: string[];
  granted_by: string;
}

// Import/Export types
export interface RBACExportData {
  roles: Role[];
  permissions: Permission[];
  role_permissions: RolePermission[];
  user_roles: UserRole[];
  role_hierarchy: RoleHierarchy[];
  exported_at: string;
  version: string;
}

export interface RBACImportOptions {
  merge_strategy: 'replace' | 'merge' | 'skip_existing';
  preserve_system_roles: boolean;
  preserve_user_assignments: boolean;
  dry_run: boolean;
}

// Validation types
export interface ValidationRule {
  field: string;
  rule: 'required' | 'unique' | 'min_length' | 'max_length' | 'format';
  value?: unknown;
  message?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
}
