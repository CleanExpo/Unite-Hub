"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, Settings, User, Shield, Bell } from "lucide-react"
import { FcGoogle } from "react-icons/fc"

export function ProfileContent() {
  const router = useRouter()
  const { user, signOut, isLoading } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    } finally {
      setIsSigningOut(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4ecdc4]"></div>
      </div>
    )
  }

  if (!user) {
    router.push("/auth/signin")
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="flex-shrink-0">
          {user.user_metadata?.avatar_url ? (
            <Image
              src={user.user_metadata.avatar_url || "/placeholder.svg"}
              alt={user.user_metadata?.full_name || "Profile"}
              width={100}
              height={100}
              className="rounded-full border-2 border-[#4ecdc4]"
            />
          ) : (
            <div className="w-[100px] h-[100px] bg-[#4ecdc4]/20 rounded-full flex items-center justify-center">
              <User className="h-12 w-12 text-[#4ecdc4]" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">
            {user.user_metadata?.full_name || user.email?.split("@")[0] || "User"}
          </h2>
          <p className="text-gray-300">{user.email}</p>
          <p className="text-[#4ecdc4] text-sm mt-1">Member since {new Date(user.created_at).toLocaleDateString()}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isSigningOut ? "Signing out..." : "Sign out"}
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-[#001428]">
          <TabsTrigger value="profile" className="data-[state=active]:bg-[#4ecdc4]/20">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-[#4ecdc4]/20">
            <Shield className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-[#4ecdc4]/20">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-[#4ecdc4]/20">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-6 space-y-4">
          <div>
            <h3 className="text-lg font-medium text-white mb-2">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  defaultValue={user.user_metadata?.full_name || ""}
                  className="w-full px-3 py-2 bg-[#001428] border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#4ecdc4] focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  defaultValue={user.email || ""}
                  disabled
                  className="w-full px-3 py-2 bg-[#001428] border border-gray-600 rounded-md text-gray-400 focus:outline-none"
                />
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-white mb-2">Connected Accounts</h3>
            <div className="space-y-3">
              {user.app_metadata?.providers?.includes("google") ? (
                <div className="flex items-center justify-between p-3 bg-[#001428] rounded-md border border-gray-600">
                  <div className="flex items-center">
                    <FcGoogle className="h-5 w-5 mr-3" />
                    <span className="text-white">Google</span>
                  </div>
                  <span className="text-green-500 text-sm">Connected</span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-[#001428] rounded-md border border-gray-600">
                  <div className="flex items-center">
                    <FcGoogle className="h-5 w-5 mr-3" />
                    <span className="text-white">Google</span>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    Connect
                  </Button>
                </div>
              )}

              {/* Add similar blocks for other providers */}
            </div>
          </div>
          <div className="pt-4">
            <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium">Save Changes</Button>
          </div>
        </TabsContent>
        <TabsContent value="security" className="mt-6">
          <h3 className="text-lg font-medium text-white mb-4">Security Settings</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300 mb-1">
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                className="w-full px-3 py-2 bg-[#001428] border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#4ecdc4] focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-1">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                className="w-full px-3 py-2 bg-[#001428] border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#4ecdc4] focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="w-full px-3 py-2 bg-[#001428] border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#4ecdc4] focus:border-transparent"
              />
            </div>
            <div className="pt-4">
              <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium">Update Password</Button>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="notifications" className="mt-6">
          <h3 className="text-lg font-medium text-white mb-4">Notification Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Email Notifications</h4>
                <p className="text-gray-400 text-sm">Receive email updates about your account</p>
              </div>
              <div className="relative inline-block w-12 h-6 rounded-full bg-[#001428]">
                <input type="checkbox" id="emailNotifications" className="sr-only" defaultChecked />
                <label
                  htmlFor="emailNotifications"
                  className="absolute inset-0 rounded-full bg-[#001428] border border-gray-600 cursor-pointer transition-colors duration-200 ease-in-out peer-checked:bg-[#4ecdc4]"
                >
                  <span className="absolute inset-0 flex items-center justify-start pl-1">
                    <span className="w-4 h-4 rounded-full bg-gray-400 transition-transform duration-200 ease-in-out peer-checked:translate-x-6 peer-checked:bg-white"></span>
                  </span>
                </label>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Marketing Emails</h4>
                <p className="text-gray-400 text-sm">Receive promotional emails and offers</p>
              </div>
              <div className="relative inline-block w-12 h-6 rounded-full bg-[#001428]">
                <input type="checkbox" id="marketingEmails" className="sr-only" />
                <label
                  htmlFor="marketingEmails"
                  className="absolute inset-0 rounded-full bg-[#001428] border border-gray-600 cursor-pointer transition-colors duration-200 ease-in-out peer-checked:bg-[#4ecdc4]"
                >
                  <span className="absolute inset-0 flex items-center justify-start pl-1">
                    <span className="w-4 h-4 rounded-full bg-gray-400 transition-transform duration-200 ease-in-out peer-checked:translate-x-6 peer-checked:bg-white"></span>
                  </span>
                </label>
              </div>
            </div>
            <div className="pt-4">
              <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium">
                Save Preferences
              </Button>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
          <h3 className="text-lg font-medium text-white mb-4">Account Settings</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-300 mb-1">
                Language
              </label>
              <select
                id="language"
                className="w-full px-3 py-2 bg-[#001428] border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#4ecdc4] focus:border-transparent"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-300 mb-1">
                Timezone
              </label>
              <select
                id="timezone"
                className="w-full px-3 py-2 bg-[#001428] border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#4ecdc4] focus:border-transparent"
              >
                <option value="utc">UTC</option>
                <option value="est">Eastern Time (ET)</option>
                <option value="pst">Pacific Time (PT)</option>
                <option value="aest">Australian Eastern Standard Time (AEST)</option>
              </select>
            </div>
            <div className="pt-4">
              <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium">Save Settings</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
