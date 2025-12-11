/**
 * Permission Service (Phase E09)
 *
 * Multi-tenant role-based access control (RBAC v2)
 * Module-level and action-level permissions for Synthex platform
 *
 * @module permissionService
 */

import { supabaseAdmin } from "@/lib/supabase/admin";

export interface Permission {
  module: string;
  action: string;
  resource_type?: string;
  display_name: string;
}

export interface Role {
  id: string;
  tenant_id: string;
  name: string;
  display_name: string;
  description?: string;
  is_system: boolean;
  permissions?: Permission[];
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  tenant_id: string;
  role_id: string;
  role_name?: string;
  role_display_name?: string;
  assigned_by?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Check if user has a specific permission
 *
 * @param userId - User UUID
 * @param tenantId - Tenant UUID
 * @param module - Permission module (e.g., 'content', 'campaigns')
 * @param action - Permission action (e.g., 'read', 'write')
 * @param resourceType - Optional resource type filter ('own', 'all')
 * @returns True if user has permission
 */
export async function hasPermission(
  userId: string,
  tenantId: string,
  module: string,
  action: string,
  resourceType?: string
): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin.rpc("has_permission", {
      p_user_id: userId,
      p_tenant_id: tenantId,
      p_module: module,
      p_action: action,
      p_resource_type: resourceType || null,
    });

    if (error) {
      console.error("[Permission] Error checking permission:", error);
      return false;
    }

    return data === true;
  } catch (err) {
    console.error("[Permission] Exception in hasPermission:", err);
    return false;
  }
}

/**
 * Require permission or throw error
 *
 * @param userId - User UUID
 * @param tenantId - Tenant UUID
 * @param module - Permission module
 * @param action - Permission action
 * @param resourceType - Optional resource type filter
 * @throws Error if user lacks permission
 */
export async function requirePermission(
  userId: string,
  tenantId: string,
  module: string,
  action: string,
  resourceType?: string
): Promise<void> {
  const allowed = await hasPermission(userId, tenantId, module, action, resourceType);

  if (!allowed) {
    const error: any = new Error(
      `Permission denied: ${module}.${action}${resourceType ? `:${resourceType}` : ""}`
    );
    error.status = 403;
    throw error;
  }
}

/**
 * List all permissions for a user
 *
 * @param userId - User UUID
 * @param tenantId - Tenant UUID
 * @returns Array of permissions
 */
export async function listUserPermissions(
  userId: string,
  tenantId: string
): Promise<Permission[]> {
  try {
    const { data, error } = await supabaseAdmin.rpc("list_user_permissions", {
      p_user_id: userId,
      p_tenant_id: tenantId,
    });

    if (error) {
      console.error("[Permission] Error listing permissions:", error);
      return [];
    }

    return (data || []) as Permission[];
  } catch (err) {
    console.error("[Permission] Exception in listUserPermissions:", err);
    return [];
  }
}

/**
 * Initialize default roles for a new tenant
 *
 * @param tenantId - Tenant UUID
 */
export async function initDefaultRoles(tenantId: string): Promise<void> {
  try {
    await supabaseAdmin.rpc("init_default_roles", {
      p_tenant_id: tenantId,
    });
  } catch (err) {
    console.error("[Permission] Exception in initDefaultRoles:", err);
  }
}

/**
 * Get all roles for a tenant
 *
 * @param tenantId - Tenant UUID
 * @returns Array of roles
 */
export async function listRoles(tenantId: string): Promise<Role[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("roles_v2")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("name");

    if (error) {
      console.error("[Permission] Error listing roles:", error);
      return [];
    }

    return (data || []) as Role[];
  } catch (err) {
    console.error("[Permission] Exception in listRoles:", err);
    return [];
  }
}

/**
 * Get role with permissions
 *
 * @param roleId - Role UUID
 * @param tenantId - Tenant UUID
 * @returns Role with permissions
 */
export async function getRoleWithPermissions(
  roleId: string,
  tenantId: string
): Promise<Role | null> {
  try {
    // Get role
    const { data: role, error: roleError } = await supabaseAdmin
      .from("roles_v2")
      .select("*")
      .eq("id", roleId)
      .eq("tenant_id", tenantId)
      .single();

    if (roleError || !role) {
      return null;
    }

    // Get permissions
    const { data: perms, error: permsError } = await supabaseAdmin
      .from("role_permissions_v2")
      .select("permission_id, permissions_v2(*)")
      .eq("role_id", roleId);

    if (permsError) {
      console.error("[Permission] Error fetching role permissions:", permsError);
      return role as Role;
    }

    const permissions = (perms || []).map((p: any) => p.permissions_v2);

    return {
      ...role,
      permissions,
    } as Role;
  } catch (err) {
    console.error("[Permission] Exception in getRoleWithPermissions:", err);
    return null;
  }
}

/**
 * Create custom role
 *
 * @param tenantId - Tenant UUID
 * @param name - Role name (slug)
 * @param displayName - Display name
 * @param description - Role description
 * @param permissionIds - Array of permission IDs
 * @returns Created role ID
 */
export async function createRole(
  tenantId: string,
  name: string,
  displayName: string,
  description?: string,
  permissionIds: string[] = []
): Promise<string | null> {
  try {
    // Create role
    const { data: role, error: roleError } = await supabaseAdmin
      .from("roles_v2")
      .insert({
        tenant_id: tenantId,
        name,
        display_name: displayName,
        description,
        is_system: false,
      })
      .select("id")
      .single();

    if (roleError || !role) {
      console.error("[Permission] Error creating role:", roleError);
      return null;
    }

    // Assign permissions
    if (permissionIds.length > 0) {
      const assignments = permissionIds.map((permId) => ({
        role_id: role.id,
        permission_id: permId,
      }));

      const { error: assignError } = await supabaseAdmin
        .from("role_permissions_v2")
        .insert(assignments);

      if (assignError) {
        console.error("[Permission] Error assigning permissions:", assignError);
      }
    }

    return role.id;
  } catch (err) {
    console.error("[Permission] Exception in createRole:", err);
    return null;
  }
}

/**
 * Update role permissions
 *
 * @param roleId - Role UUID
 * @param tenantId - Tenant UUID
 * @param permissionIds - New permission IDs (replaces existing)
 */
export async function updateRolePermissions(
  roleId: string,
  tenantId: string,
  permissionIds: string[]
): Promise<boolean> {
  try {
    // Verify role belongs to tenant
    const { data: role } = await supabaseAdmin
      .from("roles_v2")
      .select("id, is_system")
      .eq("id", roleId)
      .eq("tenant_id", tenantId)
      .single();

    if (!role || role.is_system) {
      // Cannot modify system roles
      return false;
    }

    // Delete existing permissions
    await supabaseAdmin.from("role_permissions_v2").delete().eq("role_id", roleId);

    // Insert new permissions
    if (permissionIds.length > 0) {
      const assignments = permissionIds.map((permId) => ({
        role_id: roleId,
        permission_id: permId,
      }));

      const { error } = await supabaseAdmin
        .from("role_permissions_v2")
        .insert(assignments);

      if (error) {
        console.error("[Permission] Error updating permissions:", error);
        return false;
      }
    }

    return true;
  } catch (err) {
    console.error("[Permission] Exception in updateRolePermissions:", err);
    return false;
  }
}

/**
 * Assign role to user
 *
 * @param userId - User UUID
 * @param tenantId - Tenant UUID
 * @param roleId - Role UUID
 * @param assignedBy - Assigning user UUID
 */
export async function assignRole(
  userId: string,
  tenantId: string,
  roleId: string,
  assignedBy?: string
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.from("user_roles_v2").insert({
      user_id: userId,
      tenant_id: tenantId,
      role_id: roleId,
      assigned_by: assignedBy || null,
    });

    if (error) {
      console.error("[Permission] Error assigning role:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Permission] Exception in assignRole:", err);
    return false;
  }
}

/**
 * Remove role from user
 *
 * @param userId - User UUID
 * @param tenantId - Tenant UUID
 * @param roleId - Role UUID
 */
export async function removeRole(
  userId: string,
  tenantId: string,
  roleId: string
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from("user_roles_v2")
      .delete()
      .eq("user_id", userId)
      .eq("tenant_id", tenantId)
      .eq("role_id", roleId);

    if (error) {
      console.error("[Permission] Error removing role:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Permission] Exception in removeRole:", err);
    return false;
  }
}

/**
 * Get user roles
 *
 * @param userId - User UUID
 * @param tenantId - Tenant UUID
 * @returns Array of user role assignments
 */
export async function getUserRoles(
  userId: string,
  tenantId: string
): Promise<UserRole[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("user_roles_v2")
      .select("*, roles_v2(name, display_name)")
      .eq("user_id", userId)
      .eq("tenant_id", tenantId);

    if (error) {
      console.error("[Permission] Error fetching user roles:", error);
      return [];
    }

    return (data || []).map((ur: any) => ({
      ...ur,
      role_name: ur.roles_v2?.name,
      role_display_name: ur.roles_v2?.display_name,
    })) as UserRole[];
  } catch (err) {
    console.error("[Permission] Exception in getUserRoles:", err);
    return [];
  }
}

/**
 * Get all available permissions
 *
 * @returns Array of all system permissions
 */
export async function listAllPermissions(): Promise<Permission[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("permissions_v2")
      .select("module, action, resource_type, display_name, description")
      .order("module");

    if (error) {
      console.error("[Permission] Error listing permissions:", error);
      return [];
    }

    return (data || []) as Permission[];
  } catch (err) {
    console.error("[Permission] Exception in listAllPermissions:", err);
    return [];
  }
}
