"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useEffect } from "react"
import { registerCharts } from "@/lib/chart-utils"
import { ErrorTrendsChart } from "./error-trends-chart"
import { ErrorResolutionTimeChart } from "./charts/error-resolution-time-chart"
import { ErrorCategoryPieChart } from "./charts/error-category-pie-chart"
import { ErrorHeatmap } from "./charts/error-heatmap"
import { ErrorPredictionChart } from "./charts/error-prediction-chart"
import { ErrorReportExportButton } from "./error-report-export-button"
import { ErrorComparisonChart } from "./charts/error-comparison-chart"
// Import the new severity chart component
import { ErrorSeverityChart } from "./charts/error-severity-chart"

// Register Chart.js components
registerCharts()

interface ErrorTrendsDashboardProps {
  className?: string
}

// Create the component function
function ErrorTrendsDashboardComponent({ className }: ErrorTrendsDashboardProps) {
  const [activeTab, setActiveTab] = useState("line")
  const [period, setPeriod] = useState<string>("7d")
  const [groupBy, setGroupBy] = useState<string>("day")
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [trendsData, setTrendsData] = useState<any>({
    timeTrends: [],
    categoryDistribution: [],
    resolutionTimes: [],
    hourlyDistribution: [],
  })

  const fetchTrendsData = async (skipCache = false) => {
    try {
      setError(null)
      if (skipCache) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      // Add cache-control header if skipCache is true
      const headers: HeadersInit = skipCache ? { "Cache-Control": "no-cache, no-store, must-revalidate" } : {}

      const response = await fetch(`/api/errors/trends?period=${period}&groupBy=${groupBy}`, { headers })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()

      setTrendsData({
        timeTrends: Array.isArray(data.timeTrends) ? data.timeTrends : [],
        categoryDistribution: Array.isArray(data.categoryDistribution) ? data.categoryDistribution : [],
        resolutionTimes: Array.isArray(data.resolutionTimes) ? data.resolutionTimes : [],
        hourlyDistribution: Array.isArray(data.hourlyDistribution) ? data.hourlyDistribution : [],
      })
    } catch (err) {
      console.error("Error fetching trends data:", err)
      setError(err instanceof Error ? err.message : "Failed to load trends data")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchTrendsData()
  }, [period, groupBy])

  const handleRefresh = () => {
    fetchTrendsData(true)
  }

  return (
    <div className={className}>
      <Tabs defaultValue="line" onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Error Trends Analysis</h2>
          <div className="flex items-center gap-4">
            <ErrorReportExportButton />
            <TabsList>
              <TabsTrigger value="line">Line Chart</TabsTrigger>
              <TabsTrigger value="bar">Bar Chart</TabsTrigger>
              <TabsTrigger value="resolution">Resolution Time</TabsTrigger>
              <TabsTrigger value="category">Category Distribution</TabsTrigger>
              <TabsTrigger value="severity">Severity Distribution</TabsTrigger>
              <TabsTrigger value="heatmap">Occurrence Heatmap</TabsTrigger>
              <TabsTrigger value="prediction">Prediction</TabsTrigger>
              <TabsTrigger value="comparison">Comparison</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="line" className="mt-0">
          <ErrorTrendsChart />
        </TabsContent>

        <TabsContent value="bar" className="mt-0">
          <ErrorTrendsBarChart />
        </TabsContent>

        <TabsContent value="resolution" className="mt-0">
          <ErrorResolutionTimeChart />
        </TabsContent>

        <TabsContent value="category" className="mt-0">
          <ErrorCategoryPieChart />
        </TabsContent>

        <TabsContent value="severity" className="mt-0">
          <ErrorSeverityChart />
        </TabsContent>

        <TabsContent value="heatmap" className="mt-0">
          <ErrorHeatmap />
        </TabsContent>

        <TabsContent value="prediction" className="mt-0">
          <ErrorPredictionChart />
        </TabsContent>

        <TabsContent value="comparison" className="mt-0">
          <ErrorComparisonChart />
        </TabsContent>

        <TabsContent value="summary" className="mt-0">
          <ErrorTrendsSummary />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Stacked Bar Chart Component
function ErrorTrendsBarChart() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeRange, setTimeRange] = useState("30")

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/errors/trends-bar?timeRange=${timeRange}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const result = await response.json()
        setData(result)
      } catch (e: any) {
        setError(e.message || "Could not load error data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [timeRange])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Error Distribution</CardTitle>
          <CardDescription>Error distribution by severity over time</CardDescription>
        </div>
        {/* Time range selector */}
      </CardHeader>
      <CardContent>
        <div className="w-full h-[400px]">
          <ChartContainer
            config={{
              critical: {
                label: "Critical",
                color: "hsl(var(--destructive))",
              },
              error: {
                label: "Error",
                color: "hsl(var(--chart-2))",
              },
              warning: {
                label: "Warning",
                color: "hsl(var(--chart-3))",
              },
              info: {
                label: "Info",
                color: "hsl(var(--chart-4))",
              },
              debug: {
                label: "Debug",
                color: "hsl(var(--chart-5))",
              },
            }}
            className="h-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="critical" stackId="a" fill="var(--color-critical)" />
                <Bar dataKey="error" stackId="a" fill="var(--color-error)" />
                <Bar dataKey="warning" stackId="a" fill="var(--color-warning)" />
                <Bar dataKey="info" stackId="a" fill="var(--color-info)" />
                <Bar dataKey="debug" stackId="a" fill="var(--color-debug)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// Summary Component
function ErrorTrendsSummary() {
  const [summary, setSummary] = useState({
    totalErrors: 0,
    criticalErrors: 0,
    resolvedErrors: 0,
    resolutionRate: 0,
    avgResolutionTime: 0,
    topCategories: [],
    trend: "stable",
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true)
      try {
        const response = await fetch("/api/errors/summary")
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const result = await response.json()
        setSummary(result)
      } catch (e: any) {
        console.error("Failed to fetch summary data:", e)
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Error Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Total Errors</dt>
              <dd className="text-2xl font-bold">{summary.totalErrors}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Critical Errors</dt>
              <dd className="text-2xl font-bold text-destructive">{summary.criticalErrors}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Resolved</dt>
              <dd className="text-2xl font-bold">{summary.resolvedErrors}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Resolution Rate</dt>
              <dd className="text-2xl font-bold">{summary.resolutionRate}%</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trend Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Overall Trend</h4>
              <p className="text-lg font-medium">
                {summary.trend === "increasing"
                  ? "⬆️ Increasing"
                  : summary.trend === "decreasing"
                    ? "⬇️ Decreasing"
                    : "➡️ Stable"}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Avg. Resolution Time</h4>
              <p className="text-lg font-medium">{summary.avgResolutionTime} hours</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Top Error Categories</h4>
              <ul className="mt-2 space-y-1">
                {summary.topCategories.map((category: any, index: number) => (
                  <li key={index} className="text-sm">
                    {category.name}: {category.count} errors
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Export both as named export and default export
export const ErrorTrendsDashboard = ErrorTrendsDashboardComponent
export default ErrorTrendsDashboardComponent
