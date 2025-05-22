"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { format, parseISO } from "date-fns"

interface ErrorTrend {
  date: string
  total: number
  critical: number
  error: number
  warning: number
  info: number
  debug: number
  resolved: number
}

interface ErrorTrendsChartProps {
  className?: string
}

export function ErrorTrendsChart({ className }: ErrorTrendsChartProps) {
  const [data, setData] = useState<ErrorTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState("30")
  const [groupBy, setGroupBy] = useState("day")

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/errors/trends?period=${groupBy}&days=${timeRange}`)

        if (!response.ok) {
          throw new Error("Failed to fetch error trends")
        }

        const result = await response.json()
        setData(result.data)
      } catch (err) {
        console.error("Error fetching error trends:", err)
        setError("Failed to load error trends data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [timeRange, groupBy])

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = parseISO(dateString)

    switch (groupBy) {
      case "hour":
        return format(date, "HH:mm")
      case "day":
        return format(date, "MMM dd")
      case "week":
        return format(date, "MMM dd")
      case "month":
        return format(date, "MMM yyyy")
      default:
        return format(date, "MMM dd")
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Error Trends</CardTitle>
          <CardDescription>Error occurrence patterns over time</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Group By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hour">Hourly</SelectItem>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="w-full h-[400px] flex items-center justify-center">
            <Skeleton className="w-full h-full" />
          </div>
        ) : (
          <div className="w-full h-[400px]">
            <ChartContainer
              config={{
                total: {
                  label: "Total Errors",
                  color: "hsl(var(--chart-1))",
                },
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
                resolved: {
                  label: "Resolved",
                  color: "hsl(var(--chart-4))",
                },
              }}
              className="h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDate} minTickGap={30} />
                  <YAxis />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    labelFormatter={(value) => formatDate(value as string)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="var(--color-total)"
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                  <Line type="monotone" dataKey="critical" stroke="var(--color-critical)" strokeWidth={2} />
                  <Line type="monotone" dataKey="error" stroke="var(--color-error)" strokeWidth={2} />
                  <Line type="monotone" dataKey="warning" stroke="var(--color-warning)" strokeWidth={2} />
                  <Line
                    type="monotone"
                    dataKey="resolved"
                    stroke="var(--color-resolved)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
