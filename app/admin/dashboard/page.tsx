"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import UserManagement from "@/components/admin/user-management"
import RoleManagement from "@/components/admin/role-management"
import PermissionManagement from "@/components/admin/permission-management"
import { Protected } from "@/components/auth/protected"

export default function AdminDashboardPage() {
  const { user, isLoading, hasRole } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("users")

  useEffect(() => {
    if (!isLoading && user && !hasRole("admin")) {
      router.push("/unauthorized")
    }
  }, [isLoading, user, hasRole, router])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#4ecdc4]" />
      </div>
    )
  }

  return (
    <Protected requiredRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-[#001428] to-[#00253e] py-12">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-[#001428] border border-[#4ecdc4]/20">
                <TabsTrigger value="users" className="data-[state=active]:bg-[#4ecdc4]/10">
                  Users
                </TabsTrigger>
                <TabsTrigger value="roles" className="data-[state=active]:bg-[#4ecdc4]/10">
                  Roles
                </TabsTrigger>
                <TabsTrigger value="permissions" className="data-[state=active]:bg-[#4ecdc4]/10">
                  Permissions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="space-y-6">
                <Card className="bg-[#001428] border-[#4ecdc4]/20">
                  <CardHeader>
                    <CardTitle className="text-white">User Management</CardTitle>
                    <CardDescription className="text-gray-400">
                      Manage users, assign roles, and edit profiles.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <UserManagement />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="roles" className="space-y-6">
                <Card className="bg-[#001428] border-[#4ecdc4]/20">
                  <CardHeader>
                    <CardTitle className="text-white">Role Management</CardTitle>
                    <CardDescription className="text-gray-400">
                      Create, edit, and delete roles. Assign permissions to roles.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RoleManagement />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="permissions" className="space-y-6">
                <Card className="bg-[#001428] border-[#4ecdc4]/20">
                  <CardHeader>
                    <CardTitle className="text-white">Permission Management</CardTitle>
                    <CardDescription className="text-gray-400">
                      Create and manage permissions for resources and actions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PermissionManagement />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Protected>
  )
}
