"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Plus, Edit, Trash2 } from "lucide-react"
import type { Permission } from "@/types/rbac"

export default function PermissionManagement() {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null)
  const [newPermission, setNewPermission] = useState({
    name: "",
    description: "",
    resource: "",
    action: "",
  })
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    loadPermissions()
  }, [])

  const loadPermissions = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("permissions").select("*").order("resource", { ascending: true })

      if (error) throw error

      setPermissions(data)
    } catch (error) {
      console.error("Error loading permissions:", error)
      toast({
        title: "Error",
        description: "Failed to load permissions.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreatePermission = async () => {
    const { name, description, resource, action } = newPermission

    if (!name.trim() || !resource.trim() || !action.trim()) {
      toast({
        title: "Error",
        description: "Name, resource, and action are required.",
        variant: "destructive",
      })
      return
    }

    try {
      if (isEditing && selectedPermission) {
        // Update existing permission
        const { data, error } = await supabase
          .from("permissions")
          .update({
            name,
            description,
            resource,
            action,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedPermission.id)
          .select()
          .single()

        if (error) throw error

        setPermissions(permissions.map((p) => (p.id === selectedPermission.id ? data : p)))
        toast({
          title: "Success",
          description: "Permission updated successfully.",
        })
      } else {
        // Create new permission
        const { data, error } = await supabase
          .from("permissions")
          .insert({
            name,
            description,
            resource,
            action,
          })
          .select()
          .single()

        if (error) throw error

        setPermissions([...permissions, data])
        toast({
          title: "Success",
          description: "Permission created successfully.",
        })
      }

      setIsPermissionDialogOpen(false)
      resetPermissionForm()
    } catch (error) {
      console.error("Error creating/updating permission:", error)
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} permission.`,
        variant: "destructive",
      })
    }
  }

  const handleDeletePermission = async () => {
    if (!selectedPermission) return

    try {
      const { error } = await supabase.from("permissions").delete().eq("id", selectedPermission.id)

      if (error) throw error

      setPermissions(permissions.filter((p) => p.id !== selectedPermission.id))
      toast({
        title: "Success",
        description: "Permission deleted successfully.",
      })
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error("Error deleting permission:", error)
      toast({
        title: "Error",
        description: "Failed to delete permission.",
        variant: "destructive",
      })
    }
  }

  const openPermissionDialog = (permission?: Permission) => {
    if (permission) {
      setSelectedPermission(permission)
      setNewPermission({
        name: permission.name,
        description: permission.description || "",
        resource: permission.resource,
        action: permission.action,
      })
      setIsEditing(true)
    } else {
      resetPermissionForm()
      setIsEditing(false)
    }
    setIsPermissionDialogOpen(true)
  }

  const openDeleteDialog = (permission: Permission) => {
    setSelectedPermission(permission)
    setIsDeleteDialogOpen(true)
  }

  const resetPermissionForm = () => {
    setSelectedPermission(null)
    setNewPermission({
      name: "",
      description: "",
      resource: "",
      action: "",
    })
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
        <h2 className="text-xl font-semibold text-white">Permissions</h2>
        <Button onClick={() => openPermissionDialog()} className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]">
          <Plus className="h-4 w-4 mr-2" />
          Add Permission
        </Button>
      </div>

      <div className="rounded-md border border-[#4ecdc4]/20 overflow-hidden">
        <Table>
          <TableHeader className="bg-[#001428]">
            <TableRow>
              <TableHead className="text-white">Name</TableHead>
              <TableHead className="text-white">Resource</TableHead>
              <TableHead className="text-white">Action</TableHead>
              <TableHead className="text-white">Description</TableHead>
              <TableHead className="text-white text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissions.length > 0 ? (
              permissions.map((permission) => (
                <TableRow key={permission.id} className="border-t border-[#4ecdc4]/10">
                  <TableCell className="font-medium text-white">{permission.name}</TableCell>
                  <TableCell className="text-gray-300">{permission.resource}</TableCell>
                  <TableCell className="text-gray-300">{permission.action}</TableCell>
                  <TableCell className="text-gray-300">{permission.description || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => openPermissionDialog(permission)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-[#4ecdc4]"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        onClick={() => openDeleteDialog(permission)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500"
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
                <TableCell colSpan={5} className="h-24 text-center text-gray-300">
                  No permissions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Permission Dialog */}
      <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
        <DialogContent className="bg-[#001428] text-white border-[#4ecdc4]/20">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Permission" : "Create New Permission"}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {isEditing ? "Update the permission details below." : "Fill in the details to create a new permission."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="permission-name" className="text-sm font-medium text-white">
                Permission Name
              </label>
              <Input
                id="permission-name"
                value={newPermission.name}
                onChange={(e) => setNewPermission({ ...newPermission, name: e.target.value })}
                className="bg-[#001428] border-gray-700 text-white"
                placeholder="e.g., View Users, Edit Posts"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="permission-resource" className="text-sm font-medium text-white">
                  Resource
                </label>
                <Input
                  id="permission-resource"
                  value={newPermission.resource}
                  onChange={(e) => setNewPermission({ ...newPermission, resource: e.target.value })}
                  className="bg-[#001428] border-gray-700 text-white"
                  placeholder="e.g., users, posts"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="permission-action" className="text-sm font-medium text-white">
                  Action
                </label>
                <Input
                  id="permission-action"
                  value={newPermission.action}
                  onChange={(e) => setNewPermission({ ...newPermission, action: e.target.value })}
                  className="bg-[#001428] border-gray-700 text-white"
                  placeholder="e.g., read, write"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="permission-description" className="text-sm font-medium text-white">
                Description
              </label>
              <Textarea
                id="permission-description"
                value={newPermission.description}
                onChange={(e) => setNewPermission({ ...newPermission, description: e.target.value })}
                className="bg-[#001428] border-gray-700 text-white min-h-[100px]"
                placeholder="Describe what this permission allows..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsPermissionDialogOpen(false)}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button onClick={handleCreatePermission} className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]">
              {isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Permission Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#001428] text-white border-[#4ecdc4]/20 max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Permission</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this permission? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-white font-medium">{selectedPermission?.name}</p>
            <p className="text-gray-400 text-sm mt-1">
              {selectedPermission?.resource}:{selectedPermission?.action}
            </p>
          </div>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button
              onClick={() => setIsDeleteDialogOpen(false)}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button onClick={handleDeletePermission} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
