"use client"

import { useEffect, useState } from "react"
import { Protected } from "@/components/auth/protected"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Plus, Trash, Edit, Save, X, Check } from "lucide-react"
import {
  getAllRoles,
  getAllPermissions,
  createRole,
  updateRole,
  deleteRole,
  assignPermissionToRole,
  removePermissionFromRole,
} from "@/lib/rbac"
import type { RoleWithPermissions, Permission } from "@/types/rbac"

export default function RolesManagementPage() {
  return (
    <Protected requiredRole="admin">
      <RolesManagement />
    </Protected>
  )
}

function RolesManagement() {
  const [roles, setRoles] = useState<RoleWithPermissions[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newRole, setNewRole] = useState({ name: "", description: "" })
  const [editingRole, setEditingRole] = useState<RoleWithPermissions | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [rolesData, permissionsData] = await Promise.all([getAllRoles(), getAllPermissions()])
      setRoles(rolesData)
      setPermissions(permissionsData)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load roles and permissions.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateRole = async () => {
    if (!newRole.name) {
      toast({
        title: "Error",
        description: "Role name is required.",
        variant: "destructive",
      })
      return
    }

    try {
      const role = await createRole(newRole.name, newRole.description)
      if (role) {
        setRoles([...roles, { ...role, permissions: [] }])
        setNewRole({ name: "", description: "" })
        setIsCreating(false)
        toast({
          title: "Success",
          description: `Role "${role.name}" created successfully.`,
        })
      }
    } catch (error) {
      console.error("Error creating role:", error)
      toast({
        title: "Error",
        description: "Failed to create role.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateRole = async () => {
    if (!editingRole || !editingRole.name) {
      toast({
        title: "Error",
        description: "Role name is required.",
        variant: "destructive",
      })
      return
    }

    try {
      const updatedRole = await updateRole(editingRole.id, editingRole.name, editingRole.description || "")
      if (updatedRole) {
        setRoles(
          roles.map((role) =>
            role.id === updatedRole.id
              ? { ...role, name: updatedRole.name, description: updatedRole.description }
              : role,
          ),
        )
        setEditingRole(null)
        toast({
          title: "Success",
          description: `Role "${updatedRole.name}" updated successfully.`,
        })
      }
    } catch (error) {
      console.error("Error updating role:", error)
      toast({
        title: "Error",
        description: "Failed to update role.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm("Are you sure you want to delete this role? This action cannot be undone.")) {
      return
    }

    try {
      const success = await deleteRole(roleId)
      if (success) {
        setRoles(roles.filter((role) => role.id !== roleId))
        toast({
          title: "Success",
          description: "Role deleted successfully.",
        })
      }
    } catch (error) {
      console.error("Error deleting role:", error)
      toast({
        title: "Error",
        description: "Failed to delete role.",
        variant: "destructive",
      })
    }
  }

  const handleTogglePermission = async (roleId: number, permissionId: number, hasPermission: boolean) => {
    try {
      let success
      if (hasPermission) {
        success = await removePermissionFromRole(roleId, permissionId)
      } else {
        success = await assignPermissionToRole(roleId, permissionId)
      }

      if (success) {
        // Reload data to get updated permissions
        await loadData()
      }
    } catch (error) {
      console.error("Error toggling permission:", error)
      toast({
        title: "Error",
        description: "Failed to update permission.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#4ecdc4]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001428] to-[#00253e] py-12">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">Role Management</h1>
            {!isCreating ? (
              <Button onClick={() => setIsCreating(true)} className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]">
                <Plus className="mr-2 h-4 w-4" /> Add Role
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button onClick={handleCreateRole} className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]">
                  <Save className="mr-2 h-4 w-4" /> Save
                </Button>
                <Button
                  onClick={() => {
                    setIsCreating(false)
                    setNewRole({ name: "", description: "" })
                  }}
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-[#002a42]"
                >
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
              </div>
            )}
          </div>

          {isCreating && (
            <div className="bg-[#001428] p-6 rounded-lg border border-[#4ecdc4]/20 mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Create New Role</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="roleName" className="block text-sm font-medium text-gray-300 mb-1">
                    Role Name*
                  </label>
                  <Input
                    id="roleName"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    className="bg-[#001428] border-gray-700 text-white"
                    placeholder="e.g., editor"
                  />
                </div>
                <div>
                  <label htmlFor="roleDescription" className="block text-sm font-medium text-gray-300 mb-1">
                    Description
                  </label>
                  <Input
                    id="roleDescription"
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    className="bg-[#001428] border-gray-700 text-white"
                    placeholder="e.g., Can edit content"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {roles.map((role) => (
              <div key={role.id} className="bg-[#001428] p-6 rounded-lg border border-[#4ecdc4]/20">
                {editingRole && editingRole.id === role.id ? (
                  <div className="mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label
                          htmlFor={`editRoleName-${role.id}`}
                          className="block text-sm font-medium text-gray-300 mb-1"
                        >
                          Role Name*
                        </label>
                        <Input
                          id={`editRoleName-${role.id}`}
                          value={editingRole.name}
                          onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                          className="bg-[#001428] border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`editRoleDescription-${role.id}`}
                          className="block text-sm font-medium text-gray-300 mb-1"
                        >
                          Description
                        </label>
                        <Input
                          id={`editRoleDescription-${role.id}`}
                          value={editingRole.description || ""}
                          onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                          className="bg-[#001428] border-gray-700 text-white"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleUpdateRole}
                        className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]"
                        size="sm"
                      >
                        <Save className="mr-2 h-4 w-4" /> Save
                      </Button>
                      <Button
                        onClick={() => setEditingRole(null)}
                        variant="outline"
                        className="border-gray-700 text-gray-300 hover:bg-[#002a42]"
                        size="sm"
                      >
                        <X className="mr-2 h-4 w-4" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-white">{role.name}</h2>
                      {role.description && <p className="text-gray-300 mt-1">{role.description}</p>}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => setEditingRole(role)}
                        variant="outline"
                        className="border-gray-700 text-gray-300 hover:bg-[#002a42]"
                        size="sm"
                      >
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </Button>
                      {role.name !== "admin" && (
                        <Button onClick={() => handleDeleteRole(role.id)} variant="destructive" size="sm">
                          <Trash className="mr-2 h-4 w-4" /> Delete
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <h3 className="text-lg font-medium text-white mb-4">Permissions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {permissions.map((permission) => {
                    const hasPermission = role.permissions.some((p) => p.id === permission.id)
                    return (
                      <div
                        key={permission.id}
                        className={`p-3 rounded-md border ${
                          hasPermission ? "border-[#4ecdc4]/40 bg-[#002a42]" : "border-gray-700 bg-[#001428]"
                        }`}
                      >
                        <div className="flex items-start">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <h4 className="text-sm font-medium text-white">{permission.name}</h4>
                              <span
                                className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                                  hasPermission ? "bg-[#4ecdc4]/20 text-[#4ecdc4]" : "bg-gray-700 text-gray-300"
                                }`}
                              >
                                {permission.resource}
                              </span>
                            </div>
                            {permission.description && (
                              <p className="text-xs text-gray-400 mt-1">{permission.description}</p>
                            )}
                          </div>
                          <Button
                            onClick={() => handleTogglePermission(role.id, permission.id, hasPermission)}
                            variant="ghost"
                            size="sm"
                            className={`p-1 h-auto ${
                              hasPermission
                                ? "text-[#4ecdc4] hover:text-[#4ecdc4]/80"
                                : "text-gray-400 hover:text-white"
                            }`}
                          >
                            {hasPermission ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
