/**
 * Role-Based Access Control (RBAC) Service
 * Unite Group Advanced Security System
 */

import { createClient } from '@supabase/supabase-js';
import { 
  Role, 
  Permission, 
  UserRole, 
  CreateRoleRequest,
  UpdateRoleRequest,
  CreatePermissionRequest,
  UpdatePermissionRequest,
  AssignRoleRequest,
  RoleQuery,
  PermissionQuery,
  RoleWithPermissions,
  AuthContext,
  PermissionCheck,
  PermissionResult,
  ROLE_LEVELS,
  DEFAULT_RBAC_CONFIG,
  RBACConfig,
  RBACAction,
  ValidationResult
} from './types';

export class RBACService {
  private supabase: ReturnType<typeof createClient>;
  private config: RBACConfig;
  private permissionCache: Map<string, string[]> = new Map();

  constructor(supabaseUrl?: string, supabaseKey?: string, config?: Partial<RBACConfig>) {
    this.supabase = createClient(
      supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.config = { ...DEFAULT_RBAC_CONFIG, ...config };
  }

  // ================================
  // ROLE MANAGEMENT
  // ================================

  async createRole(request: CreateRoleRequest, createdBy: string): Promise<Role> {
    try {
      // Validate request
      const validation = this.validateCreateRoleRequest(request);
      if (!validation.valid) {
        throw new RBACError('VALIDATION_ERROR', 'Invalid role data', validation.errors);
      }

      // Check if role name already exists
      const existingRole = await this.getRoleByName(request.name);
      if (existingRole) {
        throw new RBACError('ROLE_EXISTS', 'Role with this name already exists');
      }

      const { data, error } = await this.supabase
        .from('roles')
        .insert({
          name: request.name,
          display_name: request.display_name,
          description: request.description || null,
          level: request.level,
          created_by: createdBy,
          updated_by: createdBy
        })
        .select()
        .single();

      if (error) throw error;

      const role = data as unknown as Role;

      // Assign permissions if provided
      if (request.permission_ids && request.permission_ids.length > 0) {
        await this.grantPermissionsToRole(role.id, request.permission_ids, createdBy);
      }

      // Audit log
      await this.logAuditAction({
        user_id: createdBy,
        action: 'role_created',
        entity_type: 'role',
        entity_id: role.id,
        new_values: role as unknown as Record<string, unknown>
      });

      return role;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateRole(roleId: string, request: UpdateRoleRequest, updatedBy: string): Promise<Role> {
    try {
      const existingRole = await this.getRoleById(roleId);
      if (!existingRole) {
        throw new RBACError('ROLE_NOT_FOUND', 'Role not found');
      }

      if (existingRole.is_system && !(await this.canModifySystemRole(updatedBy))) {
        throw new RBACError('SYSTEM_ROLE_PROTECTED', 'Cannot modify system roles');
      }

      const updateData: Partial<Role> = {
        updated_by: updatedBy,
        updated_at: new Date().toISOString()
      };

      if (request.display_name !== undefined) updateData.display_name = request.display_name;
      if (request.description !== undefined) updateData.description = request.description;
      if (request.level !== undefined) updateData.level = request.level;
      if (request.is_active !== undefined) updateData.is_active = request.is_active;

      const { data, error } = await this.supabase
        .from('roles')
        .update(updateData)
        .eq('id', roleId)
        .select()
        .single();

      if (error) throw error;

      const updatedRole = data as unknown as Role;

      // Update permissions if provided
      if (request.permission_ids !== undefined) {
        await this.replaceRolePermissions(roleId, request.permission_ids, updatedBy);
      }

      // Clear cache for this role
      this.clearPermissionCache(roleId);

      // Audit log
      await this.logAuditAction({
        user_id: updatedBy,
        action: 'role_updated',
        entity_type: 'role',
        entity_id: roleId,
        old_values: existingRole as unknown as Record<string, unknown>,
        new_values: updatedRole as unknown as Record<string, unknown>
      });

      return updatedRole;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteRole(roleId: string, deletedBy: string): Promise<void> {
    try {
      const role = await this.getRoleById(roleId);
      if (!role) {
        throw new RBACError('ROLE_NOT_FOUND', 'Role not found');
      }

      if (role.is_system) {
        throw new RBACError('SYSTEM_ROLE_PROTECTED', 'Cannot delete system roles');
      }

      // Check if role is assigned to any users
      const { data: userRoles } = await this.supabase
        .from('user_roles')
        .select('id')
        .eq('role_id', roleId)
        .eq('is_active', true);

      if (userRoles && userRoles.length > 0) {
        throw new RBACError('ROLE_IN_USE', 'Cannot delete role that is assigned to users');
      }

      const { error } = await this.supabase
        .from('roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      // Clear cache
      this.clearPermissionCache(roleId);

      // Audit log
      await this.logAuditAction({
        user_id: deletedBy,
        action: 'role_deleted',
        entity_type: 'role',
        entity_id: roleId,
        old_values: role as unknown as Record<string, unknown>
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getRoleById(roleId: string): Promise<Role | null> {
    try {
      const { data, error } = await this.supabase
        .from('roles')
        .select('*')
        .eq('id', roleId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data ? (data as unknown as Role) : null;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getRoleByName(name: string): Promise<Role | null> {
    try {
      const { data, error } = await this.supabase
        .from('roles')
        .select('*')
        .eq('name', name)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data ? (data as unknown as Role) : null;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getRoles(query?: RoleQuery): Promise<{ roles: Role[]; total: number }> {
    try {
      let queryBuilder = this.supabase.from('roles').select('*', { count: 'exact' });

      if (query) {
        if (query.name) queryBuilder = queryBuilder.ilike('name', `%${query.name}%`);
        if (query.level_min !== undefined) queryBuilder = queryBuilder.gte('level', query.level_min);
        if (query.level_max !== undefined) queryBuilder = queryBuilder.lte('level', query.level_max);
        if (query.is_active !== undefined) queryBuilder = queryBuilder.eq('is_active', query.is_active);
        if (query.is_system !== undefined) queryBuilder = queryBuilder.eq('is_system', query.is_system);
        if (query.search) {
          queryBuilder = queryBuilder.or(`name.ilike.%${query.search}%,display_name.ilike.%${query.search}%`);
        }

        const sortBy = query.sort_by || 'name';
        const sortOrder = query.sort_order || 'asc';
        queryBuilder = queryBuilder.order(sortBy, { ascending: sortOrder === 'asc' });

        if (query.limit) queryBuilder = queryBuilder.limit(query.limit);
        if (query.offset) queryBuilder = queryBuilder.range(query.offset, query.offset + (query.limit || 10) - 1);
      }

      const { data, error, count } = await queryBuilder;
      if (error) throw error;

      return { 
        roles: (data || []).map(item => item as unknown as Role), 
        total: count || 0 
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getRoleWithPermissions(roleId: string): Promise<RoleWithPermissions | null> {
    try {
      const role = await this.getRoleById(roleId);
      if (!role) return null;

      const permissions = await this.getRolePermissions(roleId);
      return { ...role, permissions };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ================================
  // PERMISSION MANAGEMENT
  // ================================

  async createPermission(request: CreatePermissionRequest): Promise<Permission> {
    try {
      const validation = this.validateCreatePermissionRequest(request);
      if (!validation.valid) {
        throw new RBACError('VALIDATION_ERROR', 'Invalid permission data', validation.errors);
      }

      const { data, error } = await this.supabase
        .from('permissions')
        .insert({
          name: request.name,
          display_name: request.display_name,
          description: request.description || null,
          resource: request.resource,
          action: request.action,
          scope: request.scope || 'all'
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Permission;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updatePermission(permissionId: string, request: UpdatePermissionRequest): Promise<Permission> {
    try {
      const updateData: Partial<Permission> = {};

      if (request.display_name !== undefined) updateData.display_name = request.display_name;
      if (request.description !== undefined) updateData.description = request.description;
      if (request.resource !== undefined) updateData.resource = request.resource;
      if (request.action !== undefined) updateData.action = request.action;
      if (request.scope !== undefined) updateData.scope = request.scope;
      if (request.is_active !== undefined) updateData.is_active = request.is_active;

      const { data, error } = await this.supabase
        .from('permissions')
        .update(updateData)
        .eq('id', permissionId)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Permission;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getPermissions(query?: PermissionQuery): Promise<{ permissions: Permission[]; total: number }> {
    try {
      let queryBuilder = this.supabase.from('permissions').select('*', { count: 'exact' });

      if (query) {
        if (query.resource) queryBuilder = queryBuilder.eq('resource', query.resource);
        if (query.action) queryBuilder = queryBuilder.eq('action', query.action);
        if (query.scope) queryBuilder = queryBuilder.eq('scope', query.scope);
        if (query.is_active !== undefined) queryBuilder = queryBuilder.eq('is_active', query.is_active);
        if (query.search) {
          queryBuilder = queryBuilder.or(`name.ilike.%${query.search}%,display_name.ilike.%${query.search}%`);
        }

        const sortBy = query.sort_by || 'name';
        const sortOrder = query.sort_order || 'asc';
        queryBuilder = queryBuilder.order(sortBy, { ascending: sortOrder === 'asc' });

        if (query.limit) queryBuilder = queryBuilder.limit(query.limit);
        if (query.offset) queryBuilder = queryBuilder.range(query.offset, query.offset + (query.limit || 10) - 1);
      }

      const { data, error, count } = await queryBuilder;
      if (error) throw error;

      return { 
        permissions: (data || []).map(item => item as unknown as Permission), 
        total: count || 0 
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ================================
  // ROLE-PERMISSION MAPPING
  // ================================

  async grantPermissionsToRole(roleId: string, permissionIds: string[], grantedBy: string): Promise<void> {
    try {
      const insertData = permissionIds.map(permissionId => ({
        role_id: roleId,
        permission_id: permissionId,
        granted_by: grantedBy
      }));

      const { error } = await this.supabase
        .from('role_permissions')
        .insert(insertData);

      if (error) throw error;

      // Clear cache for this role
      this.clearPermissionCache(roleId);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async revokePermissionsFromRole(roleId: string, permissionIds: string[]): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId)
        .in('permission_id', permissionIds);

      if (error) throw error;

      // Clear cache for this role
      this.clearPermissionCache(roleId);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async replaceRolePermissions(roleId: string, permissionIds: string[], updatedBy: string): Promise<void> {
    try {
      // Remove all existing permissions for this role
      await this.supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId);

      // Add new permissions
      if (permissionIds.length > 0) {
        await this.grantPermissionsToRole(roleId, permissionIds, updatedBy);
      }

      // Clear cache for this role
      this.clearPermissionCache(roleId);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getRolePermissions(roleId: string): Promise<Permission[]> {
    try {
      const { data, error } = await this.supabase
        .from('role_permissions')
        .select(`
          permission:permissions(*)
        `)
        .eq('role_id', roleId);

      if (error) throw error;

      return (data || [])
        .map((item: { permission: unknown }) => item.permission)
        .filter(Boolean)
        .map(permission => permission as unknown as Permission);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ================================
  // USER-ROLE ASSIGNMENT
  // ================================

  async assignRoleToUser(request: AssignRoleRequest, assignedBy: string): Promise<UserRole> {
    try {
      // Check if assignment already exists
      const { data: existingAssignment } = await this.supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', request.user_id)
        .eq('role_id', request.role_id)
        .single();

      if (existingAssignment) {
        // Update existing assignment
        const { data, error } = await this.supabase
          .from('user_roles')
          .update({
            is_active: true,
            expires_at: request.expires_at || null,
            assigned_by: assignedBy,
            assigned_at: new Date().toISOString()
          })
          .eq('id', (existingAssignment as { id: string }).id)
          .select()
          .single();

        if (error) throw error;
        return data as unknown as UserRole;
      } else {
        // Create new assignment
        const { data, error } = await this.supabase
          .from('user_roles')
          .insert({
            user_id: request.user_id,
            role_id: request.role_id,
            assigned_by: assignedBy,
            expires_at: request.expires_at || null
          })
          .select()
          .single();

        if (error) throw error;

        const userRole = data as unknown as UserRole;

        // Clear user permission cache
        this.clearUserPermissionCache(request.user_id);

        // Audit log
        await this.logAuditAction({
          user_id: assignedBy,
          action: 'role_assigned',
          entity_type: 'user_role',
          entity_id: userRole.id,
          new_values: userRole as unknown as Record<string, unknown>
        });

        return userRole;
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async revokeRoleFromUser(userId: string, roleId: string, revokedBy: string): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('role_id', roleId)
        .select()
        .single();

      if (error) throw error;

      const userRole = data as unknown as UserRole;

      // Clear user permission cache
      this.clearUserPermissionCache(userId);

      // Audit log
      await this.logAuditAction({
        user_id: revokedBy,
        action: 'role_revoked',
        entity_type: 'user_role',
        entity_id: userRole.id,
        old_values: userRole as unknown as Record<string, unknown>
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_roles')
        .select(`
          role:roles(*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .or('expires_at.is.null,expires_at.gt.now()');

      if (error) throw error;

      return (data || [])
        .map((item: { role: unknown }) => item.role)
        .filter(Boolean)
        .map(role => role as unknown as Role);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      // Check cache first
      if (this.config.enablePermissionCaching) {
        const cached = this.permissionCache.get(userId);
        if (cached) return cached;
      }

      const { data, error } = await this.supabase.rpc('get_user_permissions', {
        user_uuid: userId
      });

      if (error) throw error;

      const permissions = Array.isArray(data) 
        ? data.map((item: { permission_name: string }) => item.permission_name).filter(Boolean)
        : [];

      // Cache permissions
      if (this.config.enablePermissionCaching) {
        this.permissionCache.set(userId, permissions);
        // Set expiration
        setTimeout(() => {
          this.permissionCache.delete(userId);
        }, this.config.cacheExpirationMinutes * 60 * 1000);
      }

      return permissions;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ================================
  // PERMISSION CHECKING
  // ================================

  async checkPermission(userId: string, check: PermissionCheck): Promise<PermissionResult> {
    try {
      const userPermissions = await this.getUserPermissions(userId);
      const requiredPermission = `${check.resource}.${check.action}`;

      const granted = userPermissions.includes(requiredPermission);

      return {
        granted,
        reason: granted ? 'Permission granted' : 'Permission denied',
        required_permissions: [requiredPermission],
        user_permissions: userPermissions
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async checkPermissions(userId: string, permissions: string[]): Promise<PermissionResult> {
    try {
      const userPermissions = await this.getUserPermissions(userId);
      const missingPermissions = permissions.filter(p => !userPermissions.includes(p));

      const granted = missingPermissions.length === 0;

      return {
        granted,
        reason: granted ? 'All permissions granted' : `Missing permissions: ${missingPermissions.join(', ')}`,
        required_permissions: permissions,
        user_permissions: userPermissions
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserAuthContext(userId: string): Promise<AuthContext> {
    try {
      const [roles, permissions] = await Promise.all([
        this.getUserRoles(userId),
        this.getUserPermissions(userId)
      ]);

      const maxLevel = Math.max(...roles.map(r => r.level), 0);

      return {
        user_id: userId,
        roles: roles.map(r => r.name),
        permissions,
        level: maxLevel
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ================================
  // UTILITY METHODS
  // ================================

  private validateCreateRoleRequest(request: CreateRoleRequest): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    if (!request.name || request.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Role name is required' });
    }

    if (!request.display_name || request.display_name.trim().length === 0) {
      errors.push({ field: 'display_name', message: 'Display name is required' });
    }

    if (request.level < 0 || request.level > 1000) {
      errors.push({ field: 'level', message: 'Level must be between 0 and 1000' });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private validateCreatePermissionRequest(request: CreatePermissionRequest): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    if (!request.name || request.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Permission name is required' });
    }

    if (!request.display_name || request.display_name.trim().length === 0) {
      errors.push({ field: 'display_name', message: 'Display name is required' });
    }

    if (!request.resource || request.resource.trim().length === 0) {
      errors.push({ field: 'resource', message: 'Resource is required' });
    }

    if (!request.action || request.action.trim().length === 0) {
      errors.push({ field: 'action', message: 'Action is required' });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private async canModifySystemRole(userId: string): Promise<boolean> {
    const context = await this.getUserAuthContext(userId);
    return context.level >= ROLE_LEVELS.SUPER_ADMIN;
  }

  private clearPermissionCache(roleId?: string): void {
    if (roleId) {
      // Clear cache for all users with this role
      // This is a simplified approach - in production, you might want more sophisticated cache invalidation
      this.permissionCache.clear();
    }
  }

  private clearUserPermissionCache(userId: string): void {
    this.permissionCache.delete(userId);
  }

  private async logAuditAction(action: Partial<RBACAction>): Promise<void> {
    if (!this.config.auditEnabled) return;

    try {
      await this.supabase.from('rbac_audit_log').insert({
        user_id: action.user_id,
        action: action.action,
        entity_type: action.entity_type,
        entity_id: action.entity_id,
        old_values: action.old_values || null,
        new_values: action.new_values || null,
        ip_address: null, // Would be set from request context
        user_agent: null, // Would be set from request context
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log audit action:', error);
    }
  }

  private handleError(error: unknown): RBACError {
    if (error instanceof RBACError) {
      return error;
    }

    // Handle Supabase/PostgreSQL errors
    if (error && typeof error === 'object' && 'code' in error) {
      const dbError = error as { code: string; message?: string };
      switch (dbError.code) {
        case '23505': // Unique violation
          return new RBACError('DUPLICATE_ENTRY', 'A record with this value already exists');
        case '23503': // Foreign key violation
          return new RBACError('REFERENCE_ERROR', 'Referenced record does not exist');
        case 'PGRST116': // Not found
          return new RBACError('NOT_FOUND', 'Record not found');
        default:
          return new RBACError('DATABASE_ERROR', dbError.message || 'Database operation failed');
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new RBACError('UNKNOWN_ERROR', errorMessage);
  }
}

// ================================
// RBAC ERROR CLASS
// ================================

export class RBACError extends Error {
  public code: string;
  public details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'RBACError';
    this.code = code;
    this.details = details;
  }
}

// ================================
// SINGLETON INSTANCE
// ================================

let rbacServiceInstance: RBACService | null = null;

export function getRBACService(config?: Partial<RBACConfig>): RBACService {
  if (!rbacServiceInstance) {
    rbacServiceInstance = new RBACService(undefined, undefined, config);
  }
  return rbacServiceInstance;
}

export default RBACService;
