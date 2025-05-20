"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const { user, isLoading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/signin")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#001428] to-[#00253e]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#4ecdc4]" />
          <p className="mt-4 text-white">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001428] to-[#00253e]">
      <div className="container px-4 md:px-6 py-16 mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-8 border border-[#4ecdc4]/20">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-white">Welcome to Your Dashboard</h1>
              <Button
                variant="outline"
                className="bg-transparent border-[#4ecdc4]/20 text-white hover:bg-[#001f3d]"
                onClick={signOut}
              >
                Sign Out
              </Button>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-[#001428] rounded-lg border border-[#4ecdc4]/20">
                <h2 className="text-xl font-semibold text-white mb-4">Your Profile</h2>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-gray-400 min-w-[100px]">Email:</span>
                    <span className="text-white">{user?.email}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-gray-400 min-w-[100px]">Name:</span>
                    <span className="text-white">{user?.user_metadata?.full_name || "Not provided"}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-gray-400 min-w-[100px]">Provider:</span>
                    <span className="text-white capitalize">{user?.app_metadata?.provider || "email"}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-[#001428] rounded-lg border border-[#4ecdc4]/20">
                  <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
                  <p className="text-gray-300">No recent activity to display.</p>
                </div>
                <div className="p-6 bg-[#001428] rounded-lg border border-[#4ecdc4]/20">
                  <h2 className="text-xl font-semibold text-white mb-4">Account Status</h2>
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-white">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
