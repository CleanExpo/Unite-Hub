"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SocialFeed } from "@/components/social/social-feed"
import { SocialScheduler } from "@/components/social/social-scheduler"
import { SocialAnalytics } from "@/components/social/social-analytics"
import { SocialAccounts } from "@/components/social/social-accounts"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function SocialDashboard() {
  const { user, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState("feed")

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#4ecdc4]" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="bg-[#002a42] rounded-lg p-8 text-center">
        <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
        <p className="text-gray-300 mb-4">Please sign in to access the social media dashboard.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">Social Media Dashboard</h1>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/dashboard/social/templates">Templates</Link>
          </Button>
          <Button asChild className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]">
            <Link href="/dashboard/social/automation">Automation</Link>
          </Button>
        </div>
      </div>

      <div className="bg-[#002a42] rounded-lg shadow-lg overflow-hidden">
        <Tabs defaultValue="feed" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-[#4ecdc4]/20">
            <TabsList className="bg-transparent h-auto p-0">
              <div className="flex w-full overflow-x-auto scrollbar-hide">
                <TabsTrigger
                  value="feed"
                  className="flex-1 py-4 px-6 data-[state=active]:border-b-2 data-[state=active]:border-[#4ecdc4] data-[state=active]:text-[#4ecdc4] rounded-none"
                >
                  Feed
                </TabsTrigger>
                <TabsTrigger
                  value="scheduler"
                  className="flex-1 py-4 px-6 data-[state=active]:border-b-2 data-[state=active]:border-[#4ecdc4] data-[state=active]:text-[#4ecdc4] rounded-none"
                >
                  Scheduler
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="flex-1 py-4 px-6 data-[state=active]:border-b-2 data-[state=active]:border-[#4ecdc4] data-[state=active]:text-[#4ecdc4] rounded-none"
                >
                  Analytics
                </TabsTrigger>
                <TabsTrigger
                  value="accounts"
                  className="flex-1 py-4 px-6 data-[state=active]:border-b-2 data-[state=active]:border-[#4ecdc4] data-[state=active]:text-[#4ecdc4] rounded-none"
                >
                  Accounts
                </TabsTrigger>
              </div>
            </TabsList>
          </div>

          <TabsContent value="feed" className="p-6">
            <SocialFeed />
          </TabsContent>

          <TabsContent value="scheduler" className="p-6">
            <SocialScheduler />
          </TabsContent>

          <TabsContent value="analytics" className="p-6">
            <SocialAnalytics />
          </TabsContent>

          <TabsContent value="accounts" className="p-6">
            <SocialAccounts />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
