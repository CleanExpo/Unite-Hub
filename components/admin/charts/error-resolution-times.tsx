"use client"

import { useEffect, useState } from "react"
import { Bar } from "react-chartjs-2"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { commonOptions, chartColors } from "@/lib/chart-utils"
import { Loader2 } from "lucide-react"

interface ErrorResolutionTimesProps {
  data: any[]
  isLoading: boolean
}

export default function ErrorResolutionTimes({ data, isLoading }: ErrorResolutionTimesProps) {
  const [chartData, setChartData] = useState<any>(null)

  useEffect(() => {
    if (!data || data.length === 0) return

    // Sort by severity importance
    const severityOrder = { critical: 0, error: 1, warning: 2, info: 3, debug: 4 }
    const sortedData = [...data].sort(
      (a, b) =>
        severityOrder[a.severity as keyof typeof severityOrder] -
        severityOrder[b.severity as keyof typeof severityOrder],
    )

    setChartData({
      labels: sortedData.map((item) => item.severity),
      datasets: [
        {
          label: "Average Resolution Time (hours)",
          data: sortedData.map((item) => Number.parseFloat(item.avg_resolution_time.toFixed(2))),
          backgroundColor: sortedData.map(
            (item) => chartColors[item.severity as keyof typeof chartColors] || chartColors.debug,
          ),
        },
      ],
    })
  }, [data])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Average Resolution Time by Severity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-80">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !chartData ? (
          <div className="flex justify-center items-center h-80 text-muted-foreground">No data available</div>
        ) : (
          <div className="h-80">
            <Bar data={chartData} options={commonOptions} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
