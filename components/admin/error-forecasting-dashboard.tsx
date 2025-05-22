"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, AlertCircle, TrendingUp, Calendar, BarChart4, PieChart } from "lucide-react"
import {
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Types for our prediction data
interface PredictionData {
  date: string
  predicted: number
  lowerBound: number
  upperBound: number
}

interface CategoryPrediction {
  category: string
  current: number
  predicted: number
  change: number
  changePercent: number
}

interface SeverityPrediction {
  severity: string
  current: number
  predicted: number
  change: number
  changePercent: number
}

interface AnomalyPrediction {
  date: string
  description: string
  confidence: number
  potentialImpact: string
  suggestedAction: string
}

interface PredictionResponse {
  timeSeries: PredictionData[]
  categories: CategoryPrediction[]
  severities: SeverityPrediction[]
  anomalies: AnomalyPrediction[]
  metadata: {
    historyDays: number
    forecastDays: number
    lastUpdated: string
    accuracy: number
    totalPredicted: number
    avgDaily: number
    trend: "increasing" | "decreasing" | "stable"
    trendPercent: number
  }
}

// Mock data for initial rendering
const mockPredictionData: PredictionResponse = {
  timeSeries: Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i)
    const predicted = Math.round(50 + Math.sin(i / 5) * 20 + Math.random() * 10)
    return {
      date: date.toISOString().split("T")[0],
      predicted,
      lowerBound: Math.max(0, Math.round(predicted * 0.8)),
      upperBound: Math.round(predicted * 1.2),
    }
  }),
  categories: [
    { category: "API", current: 120, predicted: 145, change: 25, changePercent: 20.8 },
    { category: "Database", current: 85, predicted: 92, change: 7, changePercent: 8.2 },
    { category: "Authentication", current: 45, predicted: 38, change: -7, changePercent: -15.6 },
    { category: "Frontend", current: 65, predicted: 78, change: 13, changePercent: 20 },
    { category: "Backend", current: 95, predicted: 105, change: 10, changePercent: 10.5 },
  ],
  severities: [
    { severity: "Critical", current: 25, predicted: 32, change: 7, changePercent: 28 },
    { severity: "Error", current: 120, predicted: 135, change: 15, changePercent: 12.5 },
    { severity: "Warning", current: 180, predicted: 195, change: 15, changePercent: 8.3 },
    { severity: "Info", current: 95, predicted: 90, change: -5, changePercent: -5.3 },
  ],
  anomalies: [
    {
      date: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
      description: "Potential spike in API errors",
      confidence: 85,
      potentialImpact: "High",
      suggestedAction: "Scale API servers and monitor rate limiting",
    },
    {
      date: new Date(Date.now() + 12 * 86400000).toISOString().split("T")[0],
      description: "Database connection errors likely to increase",
      confidence: 72,
      potentialImpact: "Medium",
      suggestedAction: "Check connection pool settings and database load",
    },
    {
      date: new Date(Date.now() + 18 * 86400000).toISOString().split("T")[0],
      description: "Authentication failures predicted to rise",
      confidence: 68,
      potentialImpact: "Medium",
      suggestedAction: "Review recent auth changes and monitor login attempts",
    },
  ],
  metadata: {
    historyDays: 90,
    forecastDays: 30,
    lastUpdated: new Date().toISOString(),
    accuracy: 82,
    totalPredicted: 1850,
    avgDaily: 61.7,
    trend: "increasing",
    trendPercent: 12.4,
  },
}

export default function ErrorForecastingDashboard() {
  const [predictionData, setPredictionData] = useState<PredictionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [historyDays, setHistoryDays] = useState("90")
  const [forecastDays, setForecastDays] = useState("30")
  const [activeTab, setActiveTab] = useState("overview")

  const fetchPredictions = async () => {
    setLoading(true)
    setError(null)

    try {
      // In a real implementation, this would be an API call
      // const response = await fetch(`/api/errors/forecast?historyDays=${historyDays}&forecastDays=${forecastDays}`)
      // if (!response.ok) {
      //   throw new Error("Failed to fetch prediction data")
      // }
      // const data = await response.json()

      // Using mock data for now
      await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API delay
      setPredictionData(mockPredictionData)
    } catch (err) {
      console.error("Error fetching predictions:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPredictions()
  }, [])

  const handleRefresh = () => {
    fetchPredictions()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  // Get trend direction badge variant
  const getTrendBadgeVariant = (trend: "increasing" | "decreasing" | "stable") => {
    if (trend === "increasing") return "destructive"
    if (trend === "decreasing") return "success"
    return "secondary"
  }

  // Get change indicator for tables
  const getChangeIndicator = (change: number) => {
    if (change > 0) return <span className="text-red-500">↑ {change}</span>
    if (change < 0) return <span className="text-green-500">↓ {Math.abs(change)}</span>
    return <span className="text-gray-500">―</span>
  }

  // Get percent change indicator for tables
  const getPercentChangeIndicator = (changePercent: number) => {
    if (changePercent > 0) return <span className="text-red-500">+{changePercent.toFixed(1)}%</span>
    if (changePercent < 0) return <span className="text-green-500">{changePercent.toFixed(1)}%</span>
    return <span className="text-gray-500">0%</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Error Forecasting</h2>
          <p className="text-muted-foreground">Predictive analytics for future error patterns and potential issues</p>
        </div>

        <div className="flex items-center space-x-2">
          <Select value={historyDays} onValueChange={setHistoryDays}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="History" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 Days History</SelectItem>
              <SelectItem value="60">60 Days History</SelectItem>
              <SelectItem value="90">90 Days History</SelectItem>
              <SelectItem value="180">180 Days History</SelectItem>
              <SelectItem value="365">365 Days History</SelectItem>
            </SelectContent>
          </Select>

          <Select value={forecastDays} onValueChange={setForecastDays}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Forecast" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 Days Forecast</SelectItem>
              <SelectItem value="14">14 Days Forecast</SelectItem>
              <SelectItem value="30">30 Days Forecast</SelectItem>
              <SelectItem value="60">60 Days Forecast</SelectItem>
              <SelectItem value="90">90 Days Forecast</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : loading ? (
        <div className="space-y-4">
          <Skeleton className="h-[400px] w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
            <Skeleton className="h-[120px]" />
          </div>
        </div>
      ) : predictionData ? (
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              <span>Categories</span>
            </TabsTrigger>
            <TabsTrigger value="severities" className="flex items-center gap-2">
              <BarChart4 className="h-4 w-4" />
              <span>Severities</span>
            </TabsTrigger>
            <TabsTrigger value="anomalies" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>Anomalies</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Predicted Error Trend</CardTitle>
                <CardDescription>
                  Forecast of error occurrences over the next {predictionData.metadata.forecastDays} days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ChartContainer
                    config={{
                      predicted: {
                        label: "Predicted Errors",
                        color: "hsl(var(--primary))",
                      },
                      range: {
                        label: "Prediction Range",
                        color: "hsl(var(--primary) / 0.2)",
                      },
                    }}
                    className="h-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={predictionData.timeSeries}
                        margin={{
                          top: 20,
                          right: 20,
                          left: 20,
                          bottom: 20,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={formatDate} minTickGap={30} />
                        <YAxis />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatters={{
                                date: (value) => formatDate(value),
                                predicted: (value) => `${value} errors`,
                                lowerBound: (value) => `${value} errors`,
                                upperBound: (value) => `${value} errors`,
                              }}
                            />
                          }
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="upperBound"
                          stroke="transparent"
                          fillOpacity={1}
                          fill="var(--color-range)"
                          name="Upper Bound"
                        />
                        <Area
                          type="monotone"
                          dataKey="lowerBound"
                          stroke="transparent"
                          fillOpacity={1}
                          fill="white"
                          name="Lower Bound"
                        />
                        <Line
                          type="monotone"
                          dataKey="predicted"
                          stroke="var(--color-predicted)"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                          name="Predicted Errors"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground">
                  Predictions are based on historical error patterns with {predictionData.metadata.accuracy}% accuracy.
                  Last updated: {new Date(predictionData.metadata.lastUpdated).toLocaleString()}
                </p>
              </CardFooter>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm font-medium">Prediction Summary</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Predicted:</span>
                      <span className="font-medium">{predictionData.metadata.totalPredicted} errors</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Daily Average:</span>
                      <span className="font-medium">{predictionData.metadata.avgDaily.toFixed(1)} errors/day</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Based on:</span>
                      <span className="font-medium">{predictionData.metadata.historyDays} days of history</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm font-medium">Trend Analysis</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Overall Trend:</span>
                    <Badge variant={getTrendBadgeVariant(predictionData.metadata.trend)}>
                      {predictionData.metadata.trend === "increasing"
                        ? `⬆️ Increasing (${predictionData.metadata.trendPercent}%)`
                        : predictionData.metadata.trend === "decreasing"
                          ? `⬇️ Decreasing (${Math.abs(predictionData.metadata.trendPercent)}%)`
                          : "➡️ Stable"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm font-medium">Model Accuracy</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Prediction Accuracy:</span>
                      <span className="font-medium">{predictionData.metadata.accuracy}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Forecast Length:</span>
                      <span className="font-medium">{predictionData.metadata.forecastDays} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Last Updated:</span>
                      <span className="font-medium">
                        {new Date(predictionData.metadata.lastUpdated).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Predicted Error Categories</CardTitle>
                <CardDescription>
                  Forecast of how error categories will change over the next {predictionData.metadata.forecastDays} days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={predictionData.categories}
                      margin={{
                        top: 20,
                        right: 20,
                        left: 20,
                        bottom: 20,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="current" fill="#8884d8" name="Current" />
                      <Bar dataKey="predicted" fill="#82ca9d" name="Predicted" />
                      <Line
                        type="monotone"
                        dataKey="changePercent"
                        stroke="#ff7300"
                        name="% Change"
                        yAxisId={1}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <YAxis
                        yAxisId={1}
                        orientation="right"
                        tickFormatter={(value) => `${value}%`}
                        domain={[-30, 30]}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Prediction Details</CardTitle>
                <CardDescription>Detailed breakdown of predicted changes by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Category</th>
                        <th className="text-right py-3 px-4">Current</th>
                        <th className="text-right py-3 px-4">Predicted</th>
                        <th className="text-right py-3 px-4">Change</th>
                        <th className="text-right py-3 px-4">% Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {predictionData.categories.map((category) => (
                        <tr key={category.category} className="border-b">
                          <td className="py-3 px-4">{category.category}</td>
                          <td className="text-right py-3 px-4">{category.current}</td>
                          <td className="text-right py-3 px-4">{category.predicted}</td>
                          <td className="text-right py-3 px-4">{getChangeIndicator(category.change)}</td>
                          <td className="text-right py-3 px-4">{getPercentChangeIndicator(category.changePercent)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground">
                  Categories with increasing error rates may require additional attention and resources.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="severities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Predicted Error Severities</CardTitle>
                <CardDescription>
                  Forecast of how error severities will change over the next {predictionData.metadata.forecastDays} days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={predictionData.severities}
                      margin={{
                        top: 20,
                        right: 20,
                        left: 20,
                        bottom: 20,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="severity" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="current" fill="#8884d8" name="Current" />
                      <Bar dataKey="predicted" fill="#82ca9d" name="Predicted" />
                      <Line
                        type="monotone"
                        dataKey="changePercent"
                        stroke="#ff7300"
                        name="% Change"
                        yAxisId={1}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <YAxis
                        yAxisId={1}
                        orientation="right"
                        tickFormatter={(value) => `${value}%`}
                        domain={[-30, 30]}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Severity Prediction Details</CardTitle>
                <CardDescription>Detailed breakdown of predicted changes by severity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Severity</th>
                        <th className="text-right py-3 px-4">Current</th>
                        <th className="text-right py-3 px-4">Predicted</th>
                        <th className="text-right py-3 px-4">Change</th>
                        <th className="text-right py-3 px-4">% Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {predictionData.severities.map((severity) => (
                        <tr key={severity.severity} className="border-b">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <div
                                className={`w-3 h-3 rounded-full mr-2 ${
                                  severity.severity === "Critical"
                                    ? "bg-red-500"
                                    : severity.severity === "Error"
                                      ? "bg-orange-500"
                                      : severity.severity === "Warning"
                                        ? "bg-yellow-500"
                                        : "bg-blue-500"
                                }`}
                              ></div>
                              {severity.severity}
                            </div>
                          </td>
                          <td className="text-right py-3 px-4">{severity.current}</td>
                          <td className="text-right py-3 px-4">{severity.predicted}</td>
                          <td className="text-right py-3 px-4">{getChangeIndicator(severity.change)}</td>
                          <td className="text-right py-3 px-4">{getPercentChangeIndicator(severity.changePercent)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground">
                  Pay special attention to predicted increases in Critical and Error severity levels.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="anomalies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Predicted Anomalies</CardTitle>
                <CardDescription>
                  Potential error anomalies predicted for the next {predictionData.metadata.forecastDays} days
                </CardDescription>
              </CardHeader>
              <CardContent>
                {predictionData.anomalies.length > 0 ? (
                  <div className="space-y-4">
                    {predictionData.anomalies.map((anomaly, index) => (
                      <Card key={index}>
                        <CardHeader className="py-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-medium">{anomaly.description}</CardTitle>
                            <Badge
                              variant={
                                anomaly.potentialImpact === "High"
                                  ? "destructive"
                                  : anomaly.potentialImpact === "Medium"
                                    ? "warning"
                                    : "outline"
                              }
                            >
                              {anomaly.potentialImpact} Impact
                            </Badge>
                          </div>
                          <CardDescription className="flex items-center justify-between mt-1">
                            <span>
                              <Calendar className="inline h-3 w-3 mr-1" />
                              Expected on {formatDate(anomaly.date)}
                            </span>
                            <span>Confidence: {anomaly.confidence}%</span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="py-2">
                          <div className="space-y-2">
                            <div>
                              <h4 className="text-sm font-medium">Suggested Action:</h4>
                              <p className="text-sm text-muted-foreground">{anomaly.suggestedAction}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="rounded-full bg-primary/10 p-3 mb-4">
                      <AlertCircle className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium">No anomalies predicted</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-sm mt-2">
                      Our model hasn't detected any potential anomalies in the forecast period. Continue monitoring for
                      changes.
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground">
                  Anomaly predictions are based on pattern recognition and may require human verification.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex justify-center items-center h-[400px]">
          <p className="text-muted-foreground">No prediction data available</p>
        </div>
      )}
    </div>
  )
}
