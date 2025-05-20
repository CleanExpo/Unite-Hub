"use client"

import { useEffect, useState } from "react"
import { Protected } from "@/components/auth/protected"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Search, UserPlus, UserMinus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getAllRoles, getUserRoles, assignRoleToUser, removeRoleFromUser } from "@/lib/rbac"
import type { Role } from "@/types/rbac"

type UserWithRoles = {
  id: string
  email: string
  created_at: string
  roles: Role[]
}

export default function UserManagementPage() {
  return (
    <Protected requiredRole="admin">
      <UserManagement />
    </Protected>
  )
}

function UserManagement() {
  const [users, setUsers] = useState<UserWithRoles[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredUsers, setFilteredUsers] = useState<UserWithRoles[]>([])

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      setFilteredUsers(users.filter((user) => user.email.toLowerCase().includes(searchQuery.toLowerCase())))
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

      // Get all users
      const { data: usersData, error } = await supabase.auth.admin.listUsers()

      if (error) throw error

      // Get roles for each user
      const usersWithRoles = await Promise.all(
        usersData.users.map(async (user) => {
          const userRoles = await getUserRoles(user.id)
          return {
            id: user.id,
            email: user.email,
            created_at: user.created_at,
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
          <h1 className="text-3xl font-bold text-white mb-8">User Management</h1>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#001428] border-gray-700 text-white pl-10"
                placeholder="Search users by email..."
              />
            </div>
          </div>

          <div className="space-y-6">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div key={user.id} className="bg-[#001428] p-6 rounded-lg border border-[#4ecdc4]/20">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-white">{user.email}</h2>
                    <p className="text-gray-400 text-sm">User ID: {user.id.substring(0, 8)}...</p>
                    <p className="text-gray-400 text-sm">Created: {new Date(user.created_at).toLocaleDateString()}</p>
                  </div>

                  <h3 className="text-lg font-medium text-white mb-4">Roles</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roles.map((role) => {
                      const hasRole = user.roles.some((r) => r.id === role.id)
                      return (
                        <div
                          key={role.id}
                          className={`p-3 rounded-md border ${
                            hasRole ? "border-[#4ecdc4]/40 bg-[#002a42]" : "border-gray-700 bg-[#001428]"
                          }`}
                        >
                          <div className="flex items-start">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-white">{role.name}</h4>
                              {role.description && <p className="text-xs text-gray-400 mt-1">{role.description}</p>}
                            </div>
                            <Button
                              onClick={() => handleToggleRole(user.id, role.id, hasRole)}
                              variant="ghost"
                              size="sm"
                              className={`p-1 h-auto ${
                                hasRole ? "text-[#4ecdc4] hover:text-[#4ecdc4]/80" : "text-gray-400 hover:text-white"
                              }`}
                            >
                              {hasRole ? <UserMinus className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-[#001428] p-6 rounded-lg border border-[#4ecdc4]/20 text-center">
                <p className="text-gray-300">No users found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
