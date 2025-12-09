/**
 * RBAC Service (Phase E13)
 *
 * Role-based access control for Unite-Hub + Synthex
 * Server-side only - never expose to client
 *
 * @module rbacService
 */

import { supabaseAdmin } from "@/lib/supabase";

export interface RBACRole {
  id: string;
  tenant_id: string | null;
  key: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface RBACPermission {
  id: string;
  tenant_id: string | null;
  key: string;
  name: string;
  description: string | null;
  category: string | null;
  created_at: string;
}

export interface RBACRoleAssignment {
  id: string;
  tenant_id: string;
  user_id: string;
  role_id: string;
  assigned_by: string | null;
  created_at: string;
  expires_at: string | null;
}

export interface UserPermissions {
  user_id: string;
  tenant_id: string;
  permissions: string[];
  roles: string[];
}

/**
 * Get all roles assigned to user in tenant
 *
 * @param tenantId - Tenant UUID
 * @param userId - User UUID
 * @returns Array of role keys
 */
export async function getUserRoles(
  tenantId: string,
  userId: string
): Promise<string[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("rbacService must only run on server");
    }

    const { data: assignments, error } = await supabaseAdmin
      .from("rbac_role_assignments")
      .select(
        `
        role_id,
        rbac_roles!inner(key)
      `
      )
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    if (error) {
      console.error("[RBAC] Error fetching user roles:", error);
      return [];
    }

    return (
      assignments?.map((a: any) => a.rbac_roles?.key).filter(Boolean) || []
    );
  } catch (err) {
    console.error("[RBAC] Exception in getUserRoles:", err);
    return [];
  }
}

/**
 * Get all permissions for user in tenant
 *
 * @param tenantId - Tenant UUID
 * @param userId - User UUID
 * @returns Array of permission keys
 */
export async function getUserPermissions(
  tenantId: string,
  userId: string
): Promise<string[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("rbacService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("get_user_permissions", {
      p_tenant_id: tenantId,
      p_user_id: userId,
    });

    if (error) {
      console.error("[RBAC] Error fetching user permissions:", error);
      return [];
    }

    return (data || []).map((row: any) => row.permission_key);
  } catch (err) {
    console.error("[RBAC] Exception in getUserPermissions:", err);
    return [];
  }
}

/**
 * Check if user has specific permission
 *
 * @param tenantId - Tenant UUID
 * @param userId - User UUID
 * @param permissionKey - Permission key (e.g., 'analytics.view')
 * @returns True if user has permission
 */
export async function userHasPermission(
  tenantId: string,
  userId: string,
  permissionKey: string
): Promise<boolean> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("rbacService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("user_has_permission", {
      p_tenant_id: tenantId,
      p_user_id: userId,
      p_permission_key: permissionKey,
    });

    if (error) {
      console.error("[RBAC] Error checking permission:", error);
      return false;
    }

    return data === true;
  } catch (err) {
    console.error("[RBAC] Exception in userHasPermission:", err);
    return false;
  }
}

/**
 * Require permission or throw error
 *
 * @param tenantId - Tenant UUID
 * @param userId - User UUID
 * @param permissionKey - Permission key
 * @throws Error if permission denied
 */
export async function requirePermission(
  tenantId: string,
  userId: string,
  permissionKey: string
): Promise<void> {
  const hasPermission = await userHasPermission(tenantId, userId, permissionKey);

  if (!hasPermission) {
    throw new Error(
      `Permission denied: User ${userId} does not have '${permissionKey}' permission in tenant ${tenantId}`
    );
  }
}

/**
 * Assign role to user
 *
 * @param tenantId - Tenant UUID
 * @param userId - User UUID
 * @param roleKey - Role key (e.g., 'tenant.manager')
 * @param assignedBy - User assigning the role
 * @param expiresAt - Optional expiration date
 * @returns Assignment ID
 */
export async function assignUserRole(
  tenantId: string,
  userId: string,
  roleKey: string,
  assignedBy?: string,
  expiresAt?: Date
): Promise<string | null> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("rbacService must only run on server");
    }

    const { data, error } = await supabaseAdmin.rpc("assign_user_role", {
      p_tenant_id: tenantId,
      p_user_id: userId,
      p_role_key: roleKey,
      p_assigned_by: assignedBy || null,
      p_expires_at: expiresAt?.toISOString() || null,
    });

    if (error) {
      console.error("[RBAC] Error assigning role:", error);
      return null;
    }

    return data as string;
  } catch (err) {
    console.error("[RBAC] Exception in assignUserRole:", err);
    return null;
  }
}

/**
 * Remove role from user
 *
 * @param tenantId - Tenant UUID
 * @param userId - User UUID
 * @param roleKey - Role key to remove
 * @returns True if removed
 */
export async function removeUserRole(
  tenantId: string,
  userId: string,
  roleKey: string
): Promise<boolean> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("rbacService must only run on server");
    }

    // Get role ID
    const { data: role } = await supabaseAdmin
      .from("rbac_roles")
      .select("id")
      .or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
      .eq("key", roleKey)
      .order("tenant_id", { ascending: false, nullsFirst: false })
      .limit(1)
      .single();

    if (!role) {
      console.warn(`[RBAC] Role not found: ${roleKey}`);
      return false;
    }

    // Delete assignment
    const { error } = await supabaseAdmin
      .from("rbac_role_assignments")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .eq("role_id", role.id);

    if (error) {
      console.error("[RBAC] Error removing role:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[RBAC] Exception in removeUserRole:", err);
    return false;
  }
}

/**
 * Seed default roles and permissions for new tenant
 *
 * @param tenantId - Tenant UUID
 * @param ownerId - Owner user UUID (automatically assigned owner role)
 * @returns True if seeded successfully
 */
export async function seedDefaultRoles(
  tenantId: string,
  ownerId?: string
): Promise<boolean> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("rbacService must only run on server");
    }

    // Check if already seeded
    const { data: existing } = await supabaseAdmin
      .from("rbac_role_assignments")
      .select("id")
      .eq("tenant_id", tenantId)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`[RBAC] Tenant ${tenantId} already has role assignments`);
      return true;
    }

    // Assign owner role if ownerId provided
    if (ownerId) {
      await assignUserRole(tenantId, ownerId, "tenant.owner");
    }

    console.log(`[RBAC] Seeded default roles for tenant ${tenantId}`);
    return true;
  } catch (err) {
    console.error("[RBAC] Exception in seedDefaultRoles:", err);
    return false;
  }
}

/**
 * List all roles (admin only)
 *
 * @param tenantId - Optional tenant filter
 * @returns Array of roles
 */
export async function listRoles(tenantId?: string): Promise<RBACRole[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("rbacService must only run on server");
    }

    let query = supabaseAdmin
      .from("rbac_roles")
      .select("*")
      .order("name");

    if (tenantId) {
      query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[RBAC] Error listing roles:", error);
      return [];
    }

    return (data || []) as RBACRole[];
  } catch (err) {
    console.error("[RBAC] Exception in listRoles:", err);
    return [];
  }
}

/**
 * List all permissions (admin only)
 *
 * @param category - Optional category filter
 * @returns Array of permissions
 */
export async function listPermissions(
  category?: string
): Promise<RBACPermission[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("rbacService must only run on server");
    }

    let query = supabaseAdmin
      .from("rbac_permissions")
      .select("*")
      .order("category, name");

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[RBAC] Error listing permissions:", error);
      return [];
    }

    return (data || []) as RBACPermission[];
  } catch (err) {
    console.error("[RBAC] Exception in listPermissions:", err);
    return [];
  }
}

/**
 * List role assignments for tenant (admin only)
 *
 * @param tenantId - Tenant UUID
 * @param limit - Max results
 * @returns Array of assignments
 */
export async function listRoleAssignments(
  tenantId: string,
  limit: number = 100
): Promise<RBACRoleAssignment[]> {
  try {
    if (typeof window !== "undefined") {
      throw new Error("rbacService must only run on server");
    }

    const { data, error } = await supabaseAdmin
      .from("rbac_role_assignments")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[RBAC] Error listing assignments:", error);
      return [];
    }

    return (data || []) as RBACRoleAssignment[];
  } catch (err) {
    console.error("[RBAC] Exception in listRoleAssignments:", err);
    return [];
  }
}

/**
 * Get complete user permissions summary
 *
 * @param tenantId - Tenant UUID
 * @param userId - User UUID
 * @returns User permissions object
 */
export async function getUserPermissionsSummary(
  tenantId: string,
  userId: string
): Promise<UserPermissions> {
  const roles = await getUserRoles(tenantId, userId);
  const permissions = await getUserPermissions(tenantId, userId);

  return {
    user_id: userId,
    tenant_id: tenantId,
    roles,
    permissions,
  };
}
