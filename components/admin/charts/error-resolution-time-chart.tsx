"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts"

interface ResolutionTimeData {
  severity?: string
  category?: string
  count: number
  avg_resolution_time: number
  min_resolution_time: number
  max_resolution_time: number
  median_resolution_time: number
}

interface ErrorResolutionTimeChartProps {
  className?: string
}

export function ErrorResolutionTimeChart({ className }: ErrorResolutionTimeChartProps) {
  const [data, setData] = useState<ResolutionTimeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState("90")
  const [groupBy, setGroupBy] = useState("severity")
  const [chartType, setChartType] = useState("avg")

  const colors = [
    "#8884d8",
    "#83a6ed",
    "#8dd1e1",
    "#82ca9d",
    "#a4de6c",
    "#d0ed57",
    "#ffc658",
    "#ff8042",
    "#ff6361",
    "#bc5090",
  ]

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/errors/resolution-times?groupBy=${groupBy}&days=${timeRange}`)

        if (!response.ok) {
          throw new Error("Failed to fetch error resolution times")
        }

        const result = await response.json()

        // Sort data by resolution time
        const sortedData = [...(result.data || [])].sort((a, b) => {
          if (chartType === "avg") {
            return b.avg_resolution_time - a.avg_resolution_time
          } else if (chartType === "median") {
            return b.median_resolution_time - a.median_resolution_time
          } else if (chartType === "max") {
            return b.max_resolution_time - a.max_resolution_time
          }
          return 0
        })

        setData(sortedData)
      } catch (err) {
        console.error("Error fetching error resolution times:", err)
        setError(err instanceof Error ? err.message : "Failed to load resolution time data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [timeRange, groupBy, chartType])

  const getChartData = () => {
    return data.map((item) => ({
      name: item[groupBy as keyof ResolutionTimeData] || "Unknown",
      value:
        chartType === "avg"
          ? Number(item.avg_resolution_time.toFixed(2))
          : chartType === "median"
            ? Number(item.median_resolution_time.toFixed(2))
            : Number(item.max_resolution_time.toFixed(2)),
      count: item.count,
    }))
  }

  const getChartTitle = () => {
    const timeType = chartType === "avg" ? "Average" : chartType === "median" ? "Median" : "Maximum"

    const groupType = groupBy === "severity" ? "Severity" : "Category"

    return `${timeType} Resolution Time by ${groupType}`
  }

  const formatYAxis = (value: number) => {
    if (value < 1) {
      return `${Math.round(value * 60)} min`
    }
    if (value < 24) {
      return `${value.toFixed(1)} h`
    }
    return `${(value / 24).toFixed(1)} d`
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const hours = payload[0].value
      let timeDisplay

      if (hours < 1) {
        timeDisplay = `${Math.round(hours * 60)} minutes`
      } else if (hours < 24) {
        timeDisplay = `${hours.toFixed(1)} hours`
      } else {
        timeDisplay = `${(hours / 24).toFixed(1)} days`
      }

      return (
        <div className="bg-background p-3 border rounded-md shadow-sm">
          <p className="font-medium">{label}</p>
          <p className="text-sm">{`${timeDisplay} to resolve`}</p>
          <p className="text-xs text-muted-foreground">{`Based on ${payload[0].payload.count} resolved errors`}</p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>{getChartTitle()}</CardTitle>
          <CardDescription>How long it takes to resolve different types of errors</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Group By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="severity">Severity</SelectItem>
              <SelectItem value="category">Category</SelectItem>
            </SelectContent>
          </Select>

          <Select value={chartType} onValueChange={setChartType}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Chart Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="avg">Average</SelectItem>
              <SelectItem value="median">Median</SelectItem>
              <SelectItem value="max">Maximum</SelectItem>
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="180">Last 180 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
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
        ) : data.length === 0 ? (
          <div className="w-full h-[400px] flex items-center justify-center text-muted-foreground">
            No resolution time data available
          </div>
        ) : (
          <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={getChartData()}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 70,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} interval={0} />
                <YAxis
                  tickFormatter={formatYAxis}
                  label={{
                    value: "Resolution Time",
                    angle: -90,
                    position: "insideLeft",
                    style: { textAnchor: "middle" },
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="value" name="Resolution Time">
                  {getChartData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
