"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Plus, Edit, Trash2, Shield } from "lucide-react"
import {
  getAllRoles,
  getAllPermissions,
  createRole,
  updateRole,
  deleteRole,
  assignPermissionToRole,
  removePermissionFromRole,
} from "@/lib/rbac"
import type { Permission, RoleWithPermissions } from "@/types/rbac"

export default function RoleManagement() {
  const [roles, setRoles] = useState<RoleWithPermissions[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null)
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [newRoleName, setNewRoleName] = useState("")
  const [newRoleDescription, setNewRoleDescription] = useState("")
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const rolesData = await getAllRoles()
      const permissionsData = await getAllPermissions()

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
    if (!newRoleName.trim()) {
      toast({
        title: "Error",
        description: "Role name is required.",
        variant: "destructive",
      })
      return
    }

    try {
      let role
      if (isEditing && selectedRole) {
        role = await updateRole(selectedRole.id, newRoleName, newRoleDescription)
        if (role) {
          setRoles(roles.map((r) => (r.id === role.id ? { ...role, permissions: selectedRole.permissions } : r)))
        }
      } else {
        role = await createRole(newRoleName, newRoleDescription)
        if (role) {
          setRoles([...roles, { ...role, permissions: [] }])
        }
      }

      if (role) {
        toast({
          title: "Success",
          description: isEditing ? "Role updated successfully." : "Role created successfully.",
        })
        setIsRoleDialogOpen(false)
        resetRoleForm()
      }
    } catch (error) {
      console.error("Error creating/updating role:", error)
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} role.`,
        variant: "destructive",
      })
    }
  }

  const handleDeleteRole = async () => {
    if (!selectedRole) return

    try {
      const success = await deleteRole(selectedRole.id)

      if (success) {
        setRoles(roles.filter((role) => role.id !== selectedRole.id))
        toast({
          title: "Success",
          description: "Role deleted successfully.",
        })
        setIsDeleteDialogOpen(false)
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
        // Update local state
        setRoles(
          roles.map((role) => {
            if (role.id === roleId) {
              if (hasPermission) {
                // Remove permission
                return {
                  ...role,
                  permissions: role.permissions.filter((perm) => perm.id !== permissionId),
                }
              } else {
                // Add permission
                const permissionToAdd = permissions.find((perm) => perm.id === permissionId)
                if (permissionToAdd) {
                  return {
                    ...role,
                    permissions: [...role.permissions, permissionToAdd],
                  }
                }
              }
            }
            return role
          }),
        )

        // Also update selectedRole if it's the one being modified
        if (selectedRole && selectedRole.id === roleId) {
          if (hasPermission) {
            setSelectedRole({
              ...selectedRole,
              permissions: selectedRole.permissions.filter((perm) => perm.id !== permissionId),
            })
          } else {
            const permissionToAdd = permissions.find((perm) => perm.id === permissionId)
            if (permissionToAdd) {
              setSelectedRole({
                ...selectedRole,
                permissions: [...selectedRole.permissions, permissionToAdd],
              })
            }
          }
        }

        toast({
          title: "Success",
          description: hasPermission ? "Permission removed successfully." : "Permission assigned successfully.",
        })
      }
    } catch (error) {
      console.error("Error toggling permission:", error)
      toast({
        title: "Error",
        description: "Failed to update role permission.",
        variant: "destructive",
      })
    }
  }

  const openRoleDialog = (role?: RoleWithPermissions) => {
    if (role) {
      setSelectedRole(role)
      setNewRoleName(role.name)
      setNewRoleDescription(role.description || "")
      setIsEditing(true)
    } else {
      resetRoleForm()
      setIsEditing(false)
    }
    setIsRoleDialogOpen(true)
  }

  const openPermissionDialog = (role: RoleWithPermissions) => {
    setSelectedRole(role)
    setIsPermissionDialogOpen(true)
  }

  const openDeleteDialog = (role: RoleWithPermissions) => {
    setSelectedRole(role)
    setIsDeleteDialogOpen(true)
  }

  const resetRoleForm = () => {
    setSelectedRole(null)
    setNewRoleName("")
    setNewRoleDescription("")
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#4ecdc4]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Roles</h2>
        <Button onClick={() => openRoleDialog()} className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]">
          <Plus className="h-4 w-4 mr-2" />
          Add Role
        </Button>
      </div>

      <div className="rounded-md border border-[#4ecdc4]/20 overflow-hidden">
        <Table>
          <TableHeader className="bg-[#001428]">
            <TableRow>
              <TableHead className="text-white">Name</TableHead>
              <TableHead className="text-white">Description</TableHead>
              <TableHead className="text-white">Permissions</TableHead>
              <TableHead className="text-white text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.length > 0 ? (
              roles.map((role) => (
                <TableRow key={role.id} className="border-t border-[#4ecdc4]/10">
                  <TableCell className="font-medium text-white">{role.name}</TableCell>
                  <TableCell className="text-gray-300">{role.description || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.length > 0 ? (
                        role.permissions.slice(0, 3).map((permission) => (
                          <Badge key={permission.id} className="bg-[#4ecdc4]/20 text-[#4ecdc4] hover:bg-[#4ecdc4]/30">
                            {permission.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">No permissions</span>
                      )}
                      {role.permissions.length > 3 && (
                        <Badge className="bg-gray-700 text-gray-300 hover:bg-gray-600">
                          +{role.permissions.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => openPermissionDialog(role)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-[#4ecdc4]"
                      >
                        <Shield className="h-4 w-4" />
                        <span className="sr-only">Manage Permissions</span>
                      </Button>
                      <Button
                        onClick={() => openRoleDialog(role)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-[#4ecdc4]"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        onClick={() => openDeleteDialog(role)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500"
                        disabled={role.name === "admin" || role.name === "user"}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-gray-300">
                  No roles found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="bg-[#001428] text-white border-[#4ecdc4]/20">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Role" : "Create New Role"}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {isEditing ? "Update the role details below." : "Fill in the details to create a new role."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="role-name" className="text-sm font-medium text-white">
                Role Name
              </label>
              <Input
                id="role-name"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                className="bg-[#001428] border-gray-700 text-white"
                placeholder="e.g., Editor, Moderator"
                disabled={isEditing && (selectedRole?.name === "admin" || selectedRole?.name === "user")}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="role-description" className="text-sm font-medium text-white">
                Description
              </label>
              <Textarea
                id="role-description"
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
                className="bg-[#001428] border-gray-700 text-white min-h-[100px]"
                placeholder="Describe the role's purpose and permissions..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsRoleDialogOpen(false)}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button onClick={handleCreateRole} className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]">
              {isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Permissions Dialog */}
      <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
        <DialogContent className="bg-[#001428] text-white border-[#4ecdc4]/20 max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Permissions</DialogTitle>
            <DialogDescription className="text-gray-400">{selectedRole?.name} role</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-4">
            {permissions.map((permission) => {
              const hasPermission = selectedRole?.permissions.some((p) => p.id === permission.id) || false
              return (
                <div
                  key={permission.id}
                  className="flex items-start space-x-3 p-2 rounded-md border border-[#4ecdc4]/20"
                >
                  <Checkbox
                    id={`permission-${permission.id}`}
                    checked={hasPermission}
                    onCheckedChange={(checked) => {
                      if (selectedRole) {
                        handleTogglePermission(selectedRole.id, permission.id, hasPermission)
                      }
                    }}
                    className="data-[state=checked]:bg-[#4ecdc4] data-[state=checked]:border-[#4ecdc4]"
                  />
                  <div className="space-y-1">
                    <label
                      htmlFor={`permission-${permission.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {permission.name}
                    </label>
                    <p className="text-xs text-gray-400">
                      {permission.resource}:{permission.action}
                    </p>
                    {permission.description && <p className="text-xs text-gray-400">{permission.description}</p>}
                  </div>
                </div>
              )
            })}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsPermissionDialogOpen(false)}
              className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#001428] text-white border-[#4ecdc4]/20 max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this role? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-white font-medium">{selectedRole?.name}</p>
            <p className="text-gray-400 text-sm mt-1">{selectedRole?.description}</p>
          </div>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button
              onClick={() => setIsDeleteDialogOpen(false)}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button onClick={handleDeleteRole} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
