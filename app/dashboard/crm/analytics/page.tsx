"use client"

import { useState } from "react"
import { Protected } from "@/components/auth/protected"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PipelineValueChart } from "@/components/crm/analytics/pipeline-value-chart"
import { OpportunityCountChart } from "@/components/crm/analytics/opportunity-count-chart"
import { ConversionRateChart } from "@/components/crm/analytics/conversion-rate-chart"
import { MonthlyTrendChart } from "@/components/crm/analytics/monthly-trend-chart"
import { TopIndustriesChart } from "@/components/crm/analytics/top-industries-chart"
import { MetricsCards } from "@/components/crm/analytics/metrics-cards"
import { Download, RefreshCw } from "lucide-react"

export default function CRMAnalyticsPage() {
  return (
    <Protected>
      <CRMAnalytics />
    </Protected>
  )
}

function CRMAnalytics() {
  const [timeRange, setTimeRange] = useState("all")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    // In a real implementation, this would trigger a refresh of the data
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001428] to-[#00253e] py-12">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Sales Analytics</h1>
              <p className="text-gray-300 mt-2">Insights and metrics for your sales pipeline</p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[180px] bg-[#001428] border-[#4ecdc4]/20 text-white">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent className="bg-[#001428] border-[#4ecdc4]/20">
                  <SelectItem value="all" className="text-white hover:bg-[#4ecdc4]/10">
                    All Time
                  </SelectItem>
                  <SelectItem value="year" className="text-white hover:bg-[#4ecdc4]/10">
                    This Year
                  </SelectItem>
                  <SelectItem value="quarter" className="text-white hover:bg-[#4ecdc4]/10">
                    This Quarter
                  </SelectItem>
                  <SelectItem value="month" className="text-white hover:bg-[#4ecdc4]/10">
                    This Month
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="border-[#4ecdc4]/20 text-white hover:bg-[#4ecdc4]/10"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          <MetricsCards />

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <PipelineValueChart />
            <OpportunityCountChart />
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <ConversionRateChart />
            <MonthlyTrendChart />
          </div>

          <div className="mt-6">
            <TopIndustriesChart />
          </div>

          <div className="mt-6">
            <Card className="bg-[#001428] border-[#4ecdc4]/20">
              <CardHeader>
                <CardTitle className="text-white">Detailed Reports</CardTitle>
                <CardDescription className="text-gray-400">
                  View and export detailed reports for your sales pipeline
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="pipeline" className="w-full">
                  <TabsList className="bg-[#001428] border-[#4ecdc4]/20 mb-6">
                    <TabsTrigger
                      value="pipeline"
                      className="data-[state=active]:bg-[#4ecdc4]/10 data-[state=active]:text-[#4ecdc4]"
                    >
                      Pipeline Report
                    </TabsTrigger>
                    <TabsTrigger
                      value="conversion"
                      className="data-[state=active]:bg-[#4ecdc4]/10 data-[state=active]:text-[#4ecdc4]"
                    >
                      Conversion Report
                    </TabsTrigger>
                    <TabsTrigger
                      value="forecast"
                      className="data-[state=active]:bg-[#4ecdc4]/10 data-[state=active]:text-[#4ecdc4]"
                    >
                      Sales Forecast
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="pipeline">
                    <div className="p-4 border border-[#4ecdc4]/20 rounded-md">
                      <p className="text-gray-300 mb-4">
                        The Pipeline Report provides a detailed breakdown of all opportunities in your sales pipeline,
                        including their current stage, value, and expected close date.
                      </p>
                      <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]">
                        <Download className="mr-2 h-4 w-4" />
                        Download Pipeline Report
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="conversion">
                    <div className="p-4 border border-[#4ecdc4]/20 rounded-md">
                      <p className="text-gray-300 mb-4">
                        The Conversion Report analyzes how effectively opportunities move through your sales pipeline,
                        identifying bottlenecks and areas for improvement.
                      </p>
                      <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]">
                        <Download className="mr-2 h-4 w-4" />
                        Download Conversion Report
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="forecast">
                    <div className="p-4 border border-[#4ecdc4]/20 rounded-md">
                      <p className="text-gray-300 mb-4">
                        The Sales Forecast projects your expected revenue based on current opportunities, their
                        probability, and historical conversion rates.
                      </p>
                      <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]">
                        <Download className="mr-2 h-4 w-4" />
                        Download Sales Forecast
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
