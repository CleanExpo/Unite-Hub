"use client"

import { useEffect, useState } from "react"
import { Bar } from "react-chartjs-2"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { commonOptions } from "@/lib/chart-utils"
import { Loader2 } from "lucide-react"

interface ErrorHourlyDistributionProps {
  data: any[]
  isLoading: boolean
}

export default function ErrorHourlyDistribution({ data, isLoading }: ErrorHourlyDistributionProps) {
  const [chartData, setChartData] = useState<any>(null)

  useEffect(() => {
    if (!data || data.length === 0) return

    // Sort by hour
    const sortedData = [...data].sort((a, b) => a.hour - b.hour)

    setChartData({
      labels: sortedData.map((item) => `${item.hour}:00`),
      datasets: [
        {
          label: "Error Count",
          data: sortedData.map((item) => item.count),
          backgroundColor: "rgba(59, 130, 246, 0.8)", // blue
          borderColor: "rgba(59, 130, 246, 1)",
          borderWidth: 1,
        },
      ],
    })
  }, [data])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Error Distribution by Hour of Day</CardTitle>
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
