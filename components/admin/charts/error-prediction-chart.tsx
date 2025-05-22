"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Area, ComposedChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

interface PredictionData {
  date: string
  predicted: number
  lowerBound: number
  upperBound: number
}

interface PredictionMetadata {
  historyDays: number
  forecastDays: number
  totalPredicted: number
  avgDaily: number
  peakDay: {
    date: string
    predicted: number
  }
}

interface PredictionResponse {
  predictions: PredictionData[]
  metadata: PredictionMetadata
}

export function ErrorPredictionChart() {
  const [predictionData, setPredictionData] = useState<PredictionResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [historyDays, setHistoryDays] = useState("90")
  const [forecastDays, setForecastDays] = useState("30")

  const fetchPredictions = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/errors/predict?historyDays=${historyDays}&forecastDays=${forecastDays}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch predictions")
      }

      const data = await response.json()
      setPredictionData(data)
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

  // Calculate trend direction
  const getTrendDirection = () => {
    if (!predictionData?.predictions || predictionData.predictions.length < 2) return "stable"

    const firstWeek = predictionData.predictions.slice(0, 7)
    const lastWeek = predictionData.predictions.slice(-7)

    const firstWeekAvg = firstWeek.reduce((sum, item) => sum + item.predicted, 0) / firstWeek.length
    const lastWeekAvg = lastWeek.reduce((sum, item) => sum + item.predicted, 0) / lastWeek.length

    const percentChange = ((lastWeekAvg - firstWeekAvg) / firstWeekAvg) * 100

    if (percentChange > 10) return "increasing"
    if (percentChange < -10) return "decreasing"
    return "stable"
  }

  const trendDirection = getTrendDirection()

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl">Error Prediction</CardTitle>
          <CardDescription>ML-based forecast of future error patterns</CardDescription>
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
      </CardHeader>

      <CardContent>
        {error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : loading ? (
          <div className="space-y-4">
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : predictionData ? (
          <div className="space-y-4">
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
                    data={predictionData.predictions}
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
                      <span className="text-sm text-muted-foreground">Peak Day:</span>
                      <span className="font-medium">
                        {formatDate(predictionData.metadata.peakDay.date)} ({predictionData.metadata.peakDay.predicted}{" "}
                        errors)
                      </span>
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
                    <Badge
                      variant={
                        trendDirection === "increasing"
                          ? "destructive"
                          : trendDirection === "decreasing"
                            ? "success"
                            : "secondary"
                      }
                    >
                      {trendDirection === "increasing"
                        ? "⬆️ Increasing"
                        : trendDirection === "decreasing"
                          ? "⬇️ Decreasing"
                          : "➡️ Stable"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm font-medium">Prediction Details</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Based on:</span>
                      <span className="font-medium">{predictionData.metadata.historyDays} days of history</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Forecast Length:</span>
                      <span className="font-medium">{predictionData.metadata.forecastDays} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Last Updated:</span>
                      <span className="font-medium">{new Date().toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-[400px]">
            <p className="text-muted-foreground">No prediction data available</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <p className="text-xs text-muted-foreground">
          Predictions are based on historical error patterns and may not account for unexpected system changes or
          events.
        </p>
      </CardFooter>
    </Card>
  )
}
