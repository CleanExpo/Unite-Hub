import type { Metadata } from "next"
import ErrorDashboard from "@/components/admin/error-dashboard"

export const metadata: Metadata = {
  title: "Error Management | Admin Dashboard",
  description: "Monitor and manage application errors",
}

export default function ErrorsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Error Management</h1>
      <ErrorDashboard />
    </div>
  )
}
