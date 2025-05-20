import { supabase } from "./supabase"
import type { Role, Permission, RoleWithPermissions } from "@/types/rbac"

// Get user roles
export async function getUserRoles(userId: string): Promise<Role[]> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role_id, roles(id, name, description)")
    .eq("user_id", userId)

  if (error) {
    console.error("Error fetching user roles:", error)
    return []
  }

  return data.map((item) => item.roles) as Role[]
}

// Check if user has a specific role
export async function hasRole(userId: string, roleName: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", userId)
    .eq("roles.name", roleName)
    .single()

  if (error || !data) {
    return false
  }

  return true
}

// Get user permissions
export async function getUserPermissions(userId: string): Promise<Permission[]> {
  const { data, error } = await supabase
    .from("user_roles")
    .select(
      "role_id, roles!inner(id, role_permissions!inner(permission_id, permissions!inner(id, name, resource, action)))",
    )
    .eq("user_id", userId)

  if (error) {
    console.error("Error fetching user permissions:", error)
    return []
  }

  // Flatten the nested structure to get unique permissions
  const permissionsMap = new Map<number, Permission>()

  data.forEach((userRole) => {
    userRole.roles.role_permissions.forEach((rolePermission) => {
      const permission = rolePermission.permissions
      permissionsMap.set(permission.id, permission)
    })
  })

  return Array.from(permissionsMap.values())
}

// Check if user has a specific permission
export async function hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("roles!inner(role_permissions!inner(permissions!inner(resource, action)))")
    .eq("user_id", userId)
    .eq("roles.role_permissions.permissions.resource", resource)
    .eq("roles.role_permissions.permissions.action", action)
    .limit(1)

  if (error || !data || data.length === 0) {
    return false
  }

  return true
}

// Get all roles with their permissions
export async function getAllRoles(): Promise<RoleWithPermissions[]> {
  const { data, error } = await supabase.from("roles").select("*, role_permissions(permissions(*))")

  if (error) {
    console.error("Error fetching roles:", error)
    return []
  }

  return data.map((role) => {
    return {
      ...role,
      permissions: role.role_permissions.map((rp) => rp.permissions),
    }
  })
}

// Assign role to user
export async function assignRoleToUser(userId: string, roleId: number): Promise<boolean> {
  const { error } = await supabase.from("user_roles").insert({ user_id: userId, role_id: roleId }).select()

  if (error) {
    console.error("Error assigning role to user:", error)
    return false
  }

  return true
}

// Remove role from user
export async function removeRoleFromUser(userId: string, roleId: number): Promise<boolean> {
  const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role_id", roleId)

  if (error) {
    console.error("Error removing role from user:", error)
    return false
  }

  return true
}

// Get all permissions
export async function getAllPermissions(): Promise<Permission[]> {
  const { data, error } = await supabase.from("permissions").select("*")

  if (error) {
    console.error("Error fetching permissions:", error)
    return []
  }

  return data
}

// Create a new role
export async function createRole(name: string, description: string): Promise<Role | null> {
  const { data, error } = await supabase.from("roles").insert({ name, description }).select().single()

  if (error) {
    console.error("Error creating role:", error)
    return null
  }

  return data
}

// Update a role
export async function updateRole(id: number, name: string, description: string): Promise<Role | null> {
  const { data, error } = await supabase
    .from("roles")
    .update({ name, description, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating role:", error)
    return null
  }

  return data
}

// Delete a role
export async function deleteRole(id: number): Promise<boolean> {
  const { error } = await supabase.from("roles").delete().eq("id", id)

  if (error) {
    console.error("Error deleting role:", error)
    return false
  }

  return true
}

// Assign permission to role
export async function assignPermissionToRole(roleId: number, permissionId: number): Promise<boolean> {
  const { error } = await supabase.from("role_permissions").insert({ role_id: roleId, permission_id: permissionId })

  if (error) {
    console.error("Error assigning permission to role:", error)
    return false
  }

  return true
}

// Remove permission from role
export async function removePermissionFromRole(roleId: number, permissionId: number): Promise<boolean> {
  const { error } = await supabase
    .from("role_permissions")
    .delete()
    .eq("role_id", roleId)
    .eq("permission_id", permissionId)

  if (error) {
    console.error("Error removing permission from role:", error)
    return false
  }

  return true
}
