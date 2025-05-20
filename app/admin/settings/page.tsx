import { Suspense } from "react"
import { Protected } from "@/components/auth/protected"
import { SettingsContent } from "@/components/admin/settings/settings-content"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "Site Settings | Admin Dashboard",
  description: "Manage global site settings and configuration",
}

export default function SettingsPage() {
  return (
    <Protected requiredRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-[#001428] to-[#00253e] py-12">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white">Site Settings</h1>
              <p className="text-gray-300 mt-2">Manage global settings and configuration for your site.</p>
            </div>

            <Suspense fallback={<SettingsSkeleton />}>
              <SettingsContent />
            </Suspense>
          </div>
        </div>
      </div>
    </Protected>
  )
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-[#001428] border border-[#4ecdc4]/20 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-4 w-full max-w-md mb-8" />
          <div className="space-y-6">
            {[1, 2, 3].map((j) => (
              <div key={j} className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
