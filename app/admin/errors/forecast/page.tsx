import ErrorForecastingDashboard from "@/components/admin/error-forecasting-dashboard"

export const metadata = {
  title: "Error Forecasting | Admin Dashboard",
  description: "Predictive analytics for future error patterns",
}

export default function ErrorForecastPage() {
  return (
    <div className="container mx-auto py-6">
      <ErrorForecastingDashboard />
    </div>
  )
}
