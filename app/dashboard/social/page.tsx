import type { Metadata } from "next"
import { SocialDashboard } from "@/components/social/social-dashboard"

export const metadata: Metadata = {
  title: "Social Media Dashboard | UNITE Group",
  description: "Manage your social media content across multiple platforms from a single dashboard.",
}

export default function SocialDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Social Media Dashboard</h1>
      <SocialDashboard />
    </div>
  )
}
