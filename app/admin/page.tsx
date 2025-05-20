"use client"

import { useAuth } from "@/contexts/auth-context"
import { Protected } from "@/components/auth/protected"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Shield, Settings, Lock } from "lucide-react"

export default function AdminDashboardPage() {
  return (
    <Protected requiredRole="admin">
      <AdminDashboard />
    </Protected>
  )
}

function AdminDashboard() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001428] to-[#00253e] py-12">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-300 mt-2">Welcome, {user?.email}. Manage your application settings and users.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/admin/users" className="block">
              <Card className="bg-[#001428] border-[#4ecdc4]/20 hover:border-[#4ecdc4]/40 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">User Management</CardTitle>
                    <Users className="h-5 w-5 text-[#4ecdc4]" />
                  </div>
                  <CardDescription className="text-gray-400">Manage users and their roles</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-300">
                    Add, edit, or remove users. Assign roles and permissions to control access.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/roles" className="block">
              <Card className="bg-[#001428] border-[#4ecdc4]/20 hover:border-[#4ecdc4]/40 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Role Management</CardTitle>
                    <Shield className="h-5 w-5 text-[#4ecdc4]" />
                  </div>
                  <CardDescription className="text-gray-400">Configure roles and permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-300">
                    Create and manage roles. Define permissions for each role to control access to features.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/settings" className="block">
              <Card className="bg-[#001428] border-[#4ecdc4]/20 hover:border-[#4ecdc4]/40 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Site Settings</CardTitle>
                    <Settings className="h-5 w-5 text-[#4ecdc4]" />
                  </div>
                  <CardDescription className="text-gray-400">Configure application settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-300">
                    Manage global settings, branding, and configuration options for your application.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="mt-8 bg-[#001428] p-6 rounded-lg border border-[#4ecdc4]/20">
            <div className="flex items-start">
              <Lock className="h-6 w-6 text-[#4ecdc4] mr-4 mt-1" />
              <div>
                <h2 className="text-xl font-semibold text-white">Security Information</h2>
                <p className="text-gray-300 mt-2">
                  As an administrator, you have access to sensitive information and powerful tools. Please use these
                  privileges responsibly and ensure you maintain a secure password and enable two-factor authentication.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
