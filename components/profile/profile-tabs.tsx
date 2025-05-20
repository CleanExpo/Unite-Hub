"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileInfo } from "@/components/profile/profile-info"
import { AccountSettings } from "@/components/profile/account-settings"
import { SecuritySettings } from "@/components/profile/security-settings"
import { NotificationSettings } from "@/components/profile/notification-settings"
import { ConnectedAccounts } from "@/components/profile/connected-accounts"
import { useAuth } from "@/contexts/auth-context"
import { User, Settings, Shield, Bell, Link } from "lucide-react"

export function ProfileTabs() {
  const { user, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState("profile")

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4ecdc4]"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-white">Please sign in to view your profile.</p>
      </div>
    )
  }

  return (
    <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-5 bg-[#001428]">
        <TabsTrigger value="profile" className="data-[state=active]:bg-[#4ecdc4]/20">
          <User className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Profile</span>
        </TabsTrigger>
        <TabsTrigger value="account" className="data-[state=active]:bg-[#4ecdc4]/20">
          <Settings className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Account</span>
        </TabsTrigger>
        <TabsTrigger value="security" className="data-[state=active]:bg-[#4ecdc4]/20">
          <Shield className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Security</span>
        </TabsTrigger>
        <TabsTrigger value="notifications" className="data-[state=active]:bg-[#4ecdc4]/20">
          <Bell className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Notifications</span>
        </TabsTrigger>
        <TabsTrigger value="connected" className="data-[state=active]:bg-[#4ecdc4]/20">
          <Link className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Connected</span>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="profile" className="mt-6">
        <ProfileInfo />
      </TabsContent>
      <TabsContent value="account" className="mt-6">
        <AccountSettings />
      </TabsContent>
      <TabsContent value="security" className="mt-6">
        <SecuritySettings />
      </TabsContent>
      <TabsContent value="notifications" className="mt-6">
        <NotificationSettings />
      </TabsContent>
      <TabsContent value="connected" className="mt-6">
        <ConnectedAccounts />
      </TabsContent>
    </Tabs>
  )
}
