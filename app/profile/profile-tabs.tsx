"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProfileForm from "./profile-form"
import AccountSettings from "./account-settings"
import ActivityLog from "./activity-log"

export default function ProfileTabs({ user, profile }: { user: any; profile: any }) {
  const [activeTab, setActiveTab] = useState("profile")

  return (
    <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="px-6 border-b">
        <TabsList className="h-14 bg-transparent border-0 p-0 gap-6">
          <TabsTrigger
            value="profile"
            className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:shadow-none rounded-none h-14 px-2"
          >
            Profile Information
          </TabsTrigger>
          <TabsTrigger
            value="account"
            className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:shadow-none rounded-none h-14 px-2"
          >
            Account Settings
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:shadow-none rounded-none h-14 px-2"
          >
            Activity
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="p-6">
        <TabsContent value="profile" className="m-0">
          <ProfileForm user={user} profile={profile} />
        </TabsContent>

        <TabsContent value="account" className="m-0">
          <AccountSettings user={user} />
        </TabsContent>

        <TabsContent value="activity" className="m-0">
          <ActivityLog userId={user.id} />
        </TabsContent>
      </div>
    </Tabs>
  )
}
