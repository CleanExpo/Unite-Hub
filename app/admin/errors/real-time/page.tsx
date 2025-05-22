import type { Metadata } from "next"
import RealTimeErrorDashboard from "@/components/admin/real-time-error-dashboard"

export const metadata: Metadata = {
  title: "Real-Time Error Monitoring",
  description: "Monitor errors as they occur in real-time across your application",
}

export default function RealTimeErrorPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Real-Time Error Monitoring</h1>
        <p className="text-muted-foreground">Monitor errors as they occur in real-time across your application</p>
      </div>

      <RealTimeErrorDashboard />
    </div>
  )
}
