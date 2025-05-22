import { ErrorTrendsDashboard } from "@/components/admin/error-trends-dashboard"

export const metadata = {
  title: "Error Trends Analysis",
  description: "Analyze error trends and patterns over time",
}

export default function ErrorTrendsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Error Trends Analysis</h1>
      <p className="text-muted-foreground">
        Analyze error patterns and trends to identify recurring issues and improve system stability.
      </p>

      <ErrorTrendsDashboard className="mt-6" />
    </div>
  )
}
