"use client"

import { useEffect, useState } from "react"
import { Line } from "react-chartjs-2"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { commonOptions, chartColors, formatDate } from "@/lib/chart-utils"
import { Loader2 } from "lucide-react"

interface ErrorTimeTrendsProps {
  data: any[]
  isLoading: boolean
  groupBy: string
}

export default function ErrorTimeTrends({ data, isLoading, groupBy }: ErrorTimeTrendsProps) {
  const [chartData, setChartData] = useState<any>(null)

  useEffect(() => {
    if (!data || data.length === 0) return

    const labels = data.map((item) => formatDate(item.time_period, groupBy))

    setChartData({
      labels,
      datasets: [
        {
          label: "Critical",
          data: data.map((item) => item.critical || 0),
          borderColor: chartColors.critical,
          backgroundColor: chartColors.background.critical,
          fill: true,
          tension: 0.2,
        },
        {
          label: "Error",
          data: data.map((item) => item.error || 0),
          borderColor: chartColors.error,
          backgroundColor: chartColors.background.error,
          fill: true,
          tension: 0.2,
        },
        {
          label: "Warning",
          data: data.map((item) => item.warning || 0),
          borderColor: chartColors.warning,
          backgroundColor: chartColors.background.warning,
          fill: true,
          tension: 0.2,
        },
        {
          label: "Info",
          data: data.map((item) => item.info || 0),
          borderColor: chartColors.info,
          backgroundColor: chartColors.background.info,
          fill: true,
          tension: 0.2,
        },
        {
          label: "Debug",
          data: data.map((item) => item.debug || 0),
          borderColor: chartColors.debug,
          backgroundColor: chartColors.background.debug,
          fill: true,
          tension: 0.2,
        },
      ],
    })
  }, [data, groupBy])

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Error Trends Over Time</CardTitle>
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
            <Line data={chartData} options={commonOptions} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
