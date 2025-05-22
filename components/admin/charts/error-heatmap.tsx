"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"

interface HeatmapData {
  day_of_week: number
  hour_of_day: number
  count: number
}

interface ErrorHeatmapProps {
  className?: string
}

export function ErrorHeatmap({ className }: ErrorHeatmapProps) {
  const [data, setData] = useState<HeatmapData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState("30")

  // Day names for display
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

  // Hour labels for display
  const hourLabels = Array.from({ length: 24 }, (_, i) =>
    i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`,
  )

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/errors/heatmap?days=${timeRange}`)

        if (!response.ok) {
          throw new Error("Failed to fetch error heatmap data")
        }

        const result = await response.json()
        setData(result.data || [])
      } catch (err) {
        console.error("Error fetching heatmap data:", err)
        setError(err instanceof Error ? err.message : "Failed to load heatmap data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [timeRange])

  // Process data for the heatmap
  const processedData = useMemo(() => {
    // Create a 7x24 grid (days x hours) filled with zeros
    const grid = Array.from({ length: 7 }, () => Array(24).fill(0))

    // Fill in the grid with actual counts
    data.forEach((item) => {
      const day = item.day_of_week
      const hour = item.hour_of_day
      if (day >= 0 && day < 7 && hour >= 0 && hour < 24) {
        grid[day][hour] = item.count
      }
    })

    return grid
  }, [data])

  // Find the maximum count for color scaling
  const maxCount = useMemo(() => {
    return Math.max(...data.map((item) => item.count), 1)
  }, [data])

  // Generate a color based on the count (from light to dark)
  const getColor = (count: number) => {
    if (count === 0) return "bg-gray-50"

    // Calculate intensity (0 to 1)
    const intensity = Math.min(count / maxCount, 1)

    // Use a heat scale from light yellow to dark red
    if (intensity < 0.2) return "bg-yellow-50"
    if (intensity < 0.4) return "bg-yellow-100"
    if (intensity < 0.6) return "bg-orange-200"
    if (intensity < 0.8) return "bg-orange-300"
    return "bg-red-500"
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Error Occurrence Heatmap</CardTitle>
          <CardDescription>When errors occur most frequently</CardDescription>
        </div>
        <div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
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
          <div className="w-full h-[500px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : data.length === 0 ? (
          <div className="w-full h-[500px] flex items-center justify-center text-muted-foreground">
            No heatmap data available
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Hour labels (top) */}
              <div className="flex border-b">
                <div className="w-24 flex-shrink-0"></div>
                {hourLabels.map((hour, i) => (
                  <div key={i} className="flex-1 text-center text-xs py-1 font-medium">
                    {i % 3 === 0 ? hour : ""}
                  </div>
                ))}
              </div>

              {/* Heatmap grid */}
              {processedData.map((dayData, dayIndex) => (
                <div key={dayIndex} className="flex border-b last:border-b-0">
                  {/* Day label (left) */}
                  <div className="w-24 flex-shrink-0 py-2 pr-2 text-sm font-medium flex items-center justify-end">
                    {dayNames[dayIndex]}
                  </div>

                  {/* Hours for this day */}
                  {dayData.map((count, hourIndex) => (
                    <div
                      key={hourIndex}
                      className={`flex-1 h-10 ${getColor(count)} hover:opacity-80 transition-opacity relative group`}
                      title={`${dayNames[dayIndex]} at ${hourLabels[hourIndex]}: ${count} errors`}
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute hidden group-hover:block z-10 bg-background border rounded-md shadow-md p-2 text-xs -mt-8 ml-2 whitespace-nowrap">
                        <div className="font-medium">
                          {dayNames[dayIndex]} at {hourLabels[hourIndex]}
                        </div>
                        <div>{count} errors</div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {/* Legend */}
              <div className="mt-4 flex items-center justify-end">
                <div className="text-xs text-muted-foreground mr-2">Frequency:</div>
                <div className="flex">
                  <div className="w-6 h-4 bg-gray-50 border"></div>
                  <div className="w-6 h-4 bg-yellow-50 border"></div>
                  <div className="w-6 h-4 bg-yellow-100 border"></div>
                  <div className="w-6 h-4 bg-orange-200 border"></div>
                  <div className="w-6 h-4 bg-orange-300 border"></div>
                  <div className="w-6 h-4 bg-red-500 border"></div>
                </div>
                <div className="flex text-xs text-muted-foreground ml-2">
                  <span>Low</span>
                  <span className="mx-12">Medium</span>
                  <span>High</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
