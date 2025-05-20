import type { Metadata } from "next"
import { ProfileTabs } from "@/components/profile/profile-tabs"

export const metadata: Metadata = {
  title: "Profile | UNITE Group",
  description: "Manage your UNITE Group profile and account settings.",
}

export default function ProfilePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#001428] to-[#00253e] py-16 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-5xl mx-auto">
              <h1 className="text-3xl font-bold tracking-tighter text-white mb-6">Your Profile</h1>
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20">
                <ProfileTabs />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
