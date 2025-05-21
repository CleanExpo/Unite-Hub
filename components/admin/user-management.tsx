"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Loader2, Search, Trash2, UserCog } from "lucide-react"
import { getAllRoles, getUserRoles, assignRoleToUser, removeRoleFromUser } from "@/lib/rbac"
import type { Role } from "@/types/rbac"

type User = {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  user_metadata: {
    full_name?: string
    name?: string
    avatar_url?: string
  }
  roles: Role[]
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const usersPerPage = 10

  useEffect(() => {
    loadData()
  }, [currentPage])

  useEffect(() => {
    if (searchQuery) {
      setFilteredUsers(
        users.filter(
          (user) =>
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.user_metadata?.full_name || user.user_metadata?.name || "")
              .toLowerCase()
              .includes(searchQuery.toLowerCase()),
        ),
      )
    } else {
      setFilteredUsers(users)
    }
  }, [searchQuery, users])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Get all roles
      const rolesData = await getAllRoles()
      setRoles(rolesData)

      // Get users with pagination
      const {
        data: usersData,
        error,
        count,
      } = await supabase
        .from("users")
        .select("*", { count: "exact" })
        .range((currentPage - 1) * usersPerPage, currentPage * usersPerPage - 1)

      if (error) throw error

      if (count) {
        setTotalPages(Math.ceil(count / usersPerPage))
      }

      // Get roles for each user
      const usersWithRoles = await Promise.all(
        usersData.map(async (user) => {
          const userRoles = await getUserRoles(user.id)
          return {
            ...user,
            roles: userRoles,
          }
        }),
      )

      setUsers(usersWithRoles)
      setFilteredUsers(usersWithRoles)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load users and roles.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleRole = async (userId: string, roleId: number, hasRole: boolean) => {
    try {
      let success
      if (hasRole) {
        success = await removeRoleFromUser(userId, roleId)
      } else {
        success = await assignRoleToUser(userId, roleId)
      }

      if (success) {
        // Update local state
        setUsers(
          users.map((user) => {
            if (user.id === userId) {
              if (hasRole) {
                // Remove role
                return {
                  ...user,
                  roles: user.roles.filter((role) => role.id !== roleId),
                }
              } else {
                // Add role
                const roleToAdd = roles.find((role) => role.id === roleId)
                if (roleToAdd) {
                  return {
                    ...user,
                    roles: [...user.roles, roleToAdd],
                  }
                }
              }
            }
            return user
          }),
        )

        toast({
          title: "Success",
          description: hasRole ? "Role removed successfully." : "Role assigned successfully.",
        })
      }
    } catch (error) {
      console.error("Error toggling role:", error)
      toast({
        title: "Error",
        description: "Failed to update user role.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId)

      if (error) throw error

      // Update local state
      setUsers(users.filter((user) => user.id !== userId))
      setFilteredUsers(filteredUsers.filter((user) => user.id !== userId))

      setIsDeleteDialogOpen(false)

      toast({
        title: "Success",
        description: "User deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: "Failed to delete user.",
        variant: "destructive",
      })
    }
  }

  const openRoleDialog = (user: User) => {
    setSelectedUser(user)
    setIsRoleDialogOpen(true)
  }

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
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
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#001428] border-gray-700 text-white pl-10 w-full"
            placeholder="Search users..."
          />
        </div>
        <Button
          onClick={() => loadData()}
          variant="outline"
          className="border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10"
        >
          Refresh
        </Button>
      </div>

      <div className="rounded-md border border-[#4ecdc4]/20 overflow-hidden">
        <Table>
          <TableHeader className="bg-[#001428]">
            <TableRow>
              <TableHead className="text-white">User</TableHead>
              <TableHead className="text-white">Email</TableHead>
              <TableHead className="text-white">Roles</TableHead>
              <TableHead className="text-white">Created</TableHead>
              <TableHead className="text-white">Last Login</TableHead>
              <TableHead className="text-white text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-t border-[#4ecdc4]/10">
                  <TableCell className="font-medium text-white">
                    {user.user_metadata?.full_name || user.user_metadata?.name || "N/A"}
                  </TableCell>
                  <TableCell className="text-gray-300">{user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <Badge key={role.id} className="bg-[#4ecdc4]/20 text-[#4ecdc4] hover:bg-[#4ecdc4]/30">
                            {role.name}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">No roles</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300">{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-gray-300">
                    {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => openRoleDialog(user)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-[#4ecdc4]"
                      >
                        <UserCog className="h-4 w-4" />
                        <span className="sr-only">Manage Roles</span>
                      </Button>
                      <Button
                        onClick={() => openDeleteDialog(user)}
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
                <TableCell colSpan={6} className="h-24 text-center text-gray-300">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          <Button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
            className="border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10"
          >
            Previous
          </Button>
          <span className="flex items-center text-white px-2">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            variant="outline"
            size="sm"
            className="border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10"
          >
            Next
          </Button>
        </div>
      )}

      {/* Role Management Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="bg-[#001428] text-white border-[#4ecdc4]/20 max-w-md">
          <DialogHeader>
            <DialogTitle>Manage User Roles</DialogTitle>
            <DialogDescription className="text-gray-400">{selectedUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-4">
            {roles.map((role) => {
              const hasRole = selectedUser?.roles.some((r) => r.id === role.id) || false
              return (
                <div key={role.id} className="flex items-start space-x-3 p-2 rounded-md border border-[#4ecdc4]/20">
                  <Checkbox
                    id={`role-${role.id}`}
                    checked={hasRole}
                    onCheckedChange={(checked) => {
                      if (selectedUser) {
                        handleToggleRole(selectedUser.id, role.id, hasRole)
                      }
                    }}
                    className="data-[state=checked]:bg-[#4ecdc4] data-[state=checked]:border-[#4ecdc4]"
                  />
                  <div className="space-y-1">
                    <label
                      htmlFor={`role-${role.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {role.name}
                    </label>
                    {role.description && <p className="text-xs text-gray-400">{role.description}</p>}
                  </div>
                </div>
              )
            })}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsRoleDialogOpen(false)}
              className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#001428] text-white border-[#4ecdc4]/20 max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-white font-medium">{selectedUser?.email}</p>
          </div>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button
              onClick={() => setIsDeleteDialogOpen(false)}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedUser && handleDeleteUser(selectedUser.id)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
