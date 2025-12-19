/**
 * M1 RBAC Manager
 *
 * Role-Based Access Control with granular permissions and resource policies
 * Manages user roles, permissions, and authorization rules
 *
 * Version: v2.5.0
 * Phase: 11E - Enterprise Features
 */

/**
 * Permission action
 */
export type Permission = 'read' | 'write' | 'delete' | 'admin' | 'execute';

/**
 * Resource type
 */
export type ResourceType = 'data' | 'users' | 'billing' | 'settings' | 'integrations' | 'api_keys' | 'roles';

/**
 * Role definition
 */
export interface Role {
  roleId: string;
  name: string;
  description: string;
  permissions: Map<ResourceType, Set<Permission>>;
  tenantId: string;
  isBuiltIn: boolean;
  createdAt: number;
}

/**
 * User role assignment
 */
export interface UserRole {
  userId: string;
  tenantId: string;
  roleId: string;
  assignedAt: number;
  expiresAt?: number;
}

/**
 * Resource permission policy
 */
export interface ResourcePolicy {
  policyId: string;
  tenantId: string;
  resourceType: ResourceType;
  resourceId: string;
  roleId: string;
  permissions: Set<Permission>;
  conditions?: Record<string, unknown>; // Additional conditions (IP, time-based, etc.)
  createdAt: number;
}

/**
 * RBAC Manager
 */
export class RBACManager {
  private roles: Map<string, Role> = new Map();
  private userRoles: Map<string, UserRole[]> = new Map();
  private resourcePolicies: Map<string, ResourcePolicy[]> = new Map();
  private auditLog: Array<{ timestamp: number; action: string; details: Record<string, unknown> }> = [];

  constructor() {
    this.initializeBuiltInRoles();
  }

  /**
   * Initialize built-in roles
   */
  private initializeBuiltInRoles(): void {
    // Owner role
    const ownerPermissions = new Map<ResourceType, Set<Permission>>();
    const allResources: ResourceType[] = ['data', 'users', 'billing', 'settings', 'integrations', 'api_keys', 'roles'];
    const allPermissions = new Set<Permission>(['read', 'write', 'delete', 'admin', 'execute']);

    allResources.forEach(resource => {
      ownerPermissions.set(resource, allPermissions);
    });

    this.createBuiltInRole('owner', 'Owner', 'Full system access', ownerPermissions);

    // Admin role
    const adminPermissions = new Map<ResourceType, Set<Permission>>();
    allResources.forEach(resource => {
      if (resource !== 'billing') {
        adminPermissions.set(resource, new Set(['read', 'write', 'delete', 'admin', 'execute']));
      } else {
        adminPermissions.set(resource, new Set(['read', 'write']));
      }
    });

    this.createBuiltInRole('admin', 'Admin', 'Administrative access', adminPermissions);

    // Editor role
    const editorPermissions = new Map<ResourceType, Set<Permission>>();
    editorPermissions.set('data', new Set(['read', 'write', 'execute']));
    editorPermissions.set('users', new Set(['read']));
    editorPermissions.set('settings', new Set(['read', 'write']));

    this.createBuiltInRole('editor', 'Editor', 'Edit data and settings', editorPermissions);

    // Viewer role
    const viewerPermissions = new Map<ResourceType, Set<Permission>>();
    viewerPermissions.set('data', new Set(['read']));
    viewerPermissions.set('users', new Set(['read']));

    this.createBuiltInRole('viewer', 'Viewer', 'Read-only access', viewerPermissions);
  }

  /**
   * Create built-in role (internal)
   */
  private createBuiltInRole(
    roleId: string,
    name: string,
    description: string,
    permissions: Map<ResourceType, Set<Permission>>,
  ): void {
    const role: Role = {
      roleId,
      name,
      description,
      permissions,
      tenantId: 'system',
      isBuiltIn: true,
      createdAt: Date.now(),
    };

    this.roles.set(roleId, role);
  }

  /**
   * Create custom role
   */
  createRole(
    tenantId: string,
    name: string,
    description: string,
    permissions: Map<ResourceType, Set<Permission>>,
  ): string {
    const roleId = `role_${tenantId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const role: Role = {
      roleId,
      name,
      description,
      permissions,
      tenantId,
      isBuiltIn: false,
      createdAt: Date.now(),
    };

    this.roles.set(roleId, role);

    this.auditLog.push({
      timestamp: Date.now(),
      action: 'create_role',
      details: { roleId, tenantId, name },
    });

    return roleId;
  }

  /**
   * Assign role to user
   */
  assignRole(userId: string, tenantId: string, roleId: string, expiresAt?: number): void {
    const role = this.roles.get(roleId);
    if (!role) {
throw new Error(`Role ${roleId} not found`);
}

    const userRole: UserRole = {
      userId,
      tenantId,
      roleId,
      assignedAt: Date.now(),
      expiresAt,
    };

    const userKey = `${userId}:${tenantId}`;
    const userRoles = this.userRoles.get(userKey) || [];
    userRoles.push(userRole);
    this.userRoles.set(userKey, userRoles);

    this.auditLog.push({
      timestamp: Date.now(),
      action: 'assign_role',
      details: { userId, tenantId, roleId },
    });
  }

  /**
   * Check if user has permission
   */
  hasPermission(userId: string, tenantId: string, resourceType: ResourceType, permission: Permission): boolean {
    const userKey = `${userId}:${tenantId}`;
    const userRoles = this.userRoles.get(userKey) || [];

    const now = Date.now();

    for (const userRole of userRoles) {
      // Check if role is expired
      if (userRole.expiresAt && userRole.expiresAt < now) {
        continue;
      }

      const role = this.roles.get(userRole.roleId);
      if (!role) {
continue;
}

      const permissions = role.permissions.get(resourceType);
      if (permissions && permissions.has(permission)) {
        return true;
      }
    }

    // Check resource-specific policies
    const policyKey = `${tenantId}:${resourceType}`;
    const policies = this.resourcePolicies.get(policyKey) || [];

    for (const policy of policies) {
      // Check if user has role for this policy
      const hasRole = userRoles.some(ur => ur.roleId === policy.roleId);
      if (hasRole && policy.permissions.has(permission)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get user roles
   */
  getUserRoles(userId: string, tenantId: string): Role[] {
    const userKey = `${userId}:${tenantId}`;
    const userRoles = this.userRoles.get(userKey) || [];

    const now = Date.now();

    return userRoles
      .filter(ur => !ur.expiresAt || ur.expiresAt >= now)
      .map(ur => this.roles.get(ur.roleId))
      .filter((r): r is Role => r !== undefined);
  }

  /**
   * Get role details
   */
  getRole(roleId: string): Role | null {
    return this.roles.get(roleId) || null;
  }

  /**
   * Update role permissions
   */
  updateRolePermissions(roleId: string, resourceType: ResourceType, permissions: Set<Permission>): void {
    const role = this.roles.get(roleId);
    if (!role || role.isBuiltIn) {
      throw new Error('Cannot modify built-in roles');
    }

    role.permissions.set(resourceType, permissions);

    this.auditLog.push({
      timestamp: Date.now(),
      action: 'update_role',
      details: { roleId, resourceType, permissions: Array.from(permissions) },
    });
  }

  /**
   * Remove role from user
   */
  removeUserRole(userId: string, tenantId: string, roleId: string): void {
    const userKey = `${userId}:${tenantId}`;
    const userRoles = this.userRoles.get(userKey) || [];

    const filtered = userRoles.filter(ur => ur.roleId !== roleId);
    this.userRoles.set(userKey, filtered);

    this.auditLog.push({
      timestamp: Date.now(),
      action: 'remove_role',
      details: { userId, tenantId, roleId },
    });
  }

  /**
   * Create resource policy
   */
  createResourcePolicy(
    tenantId: string,
    resourceType: ResourceType,
    resourceId: string,
    roleId: string,
    permissions: Set<Permission>,
  ): string {
    const policyId = `policy_${tenantId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const policy: ResourcePolicy = {
      policyId,
      tenantId,
      resourceType,
      resourceId,
      roleId,
      permissions,
      createdAt: Date.now(),
    };

    const policyKey = `${tenantId}:${resourceType}`;
    const policies = this.resourcePolicies.get(policyKey) || [];
    policies.push(policy);
    this.resourcePolicies.set(policyKey, policies);

    return policyId;
  }

  /**
   * Get RBAC statistics
   */
  getStats(): Record<string, unknown> {
    const builtInRoles = Array.from(this.roles.values()).filter(r => r.isBuiltIn).length;
    const customRoles = Array.from(this.roles.values()).filter(r => !r.isBuiltIn).length;

    return {
      totalRoles: this.roles.size,
      builtInRoles,
      customRoles,
      userRoleAssignments: Array.from(this.userRoles.values()).reduce((sum, arr) => sum + arr.length, 0),
      resourcePolicies: Array.from(this.resourcePolicies.values()).reduce((sum, arr) => sum + arr.length, 0),
      auditLogEntries: this.auditLog.length,
    };
  }

  /**
   * Get audit log
   */
  getAuditLog(limit: number = 100): Array<{ timestamp: number; action: string; details: Record<string, unknown> }> {
    return this.auditLog.slice(-limit);
  }
}

// Export singleton
export const rbacManager = new RBACManager();
