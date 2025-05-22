import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard",
}

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col p-4">
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

        {/* Database Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h2 className="text-lg font-semibold mb-4">Database Status</h2>
          <p>Connected</p>
        </div>

        {/* Build Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">System Status</h2>
          <BuildStatus />
        </div>
      </div>
    </main>
  )
}

import { BuildStatus } from "@/app/components/build-status"
