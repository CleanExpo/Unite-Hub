import type { Metadata } from "next"
import ErrorTrendsDashboard from "@/components/admin/error-trends-dashboard"

export const metadata: Metadata = {
  title: "Error Trends Analysis | Admin Dashboard",
  description: "Analyze error patterns and trends",
}

export default function ErrorTrendsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Error Trends Analysis</h1>
      <ErrorTrendsDashboard />
    </div>
  )
}
