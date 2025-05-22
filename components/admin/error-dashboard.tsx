"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ErrorTable from "@/components/admin/error-table"
import ErrorStatistics from "@/components/admin/error-statistics"
import dynamic from "next/dynamic"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

// Use dynamic import with default export
const ErrorTrendsDashboard = dynamic(() => import("@/components/admin/error-trends-dashboard"), {
  ssr: false,
  loading: () => <div className="py-8 text-center">Loading trends dashboard...</div>,
})

export default function ErrorDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [error, setError] = useState<string | null>(null)

  // Error handling function that can be passed to child components
  const handleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  return (
    <Card>
      <CardContent className="p-6">
        {error && (
          <div className="mb-4 p-4 border border-red-200 bg-red-50 rounded-md flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends Analysis</TabsTrigger>
            <TabsTrigger value="logs">Error Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <ErrorStatistics />
          </TabsContent>

          <TabsContent value="trends">
            <ErrorTrendsDashboard />
          </TabsContent>

          <TabsContent value="logs">
            <ErrorTable />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
