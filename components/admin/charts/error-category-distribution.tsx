"use client"

import { useEffect, useState } from "react"
import { Bar } from "react-chartjs-2"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { commonOptions, chartColors } from "@/lib/chart-utils"
import { Loader2 } from "lucide-react"

interface ErrorCategoryDistributionProps {
  data: any[]
  isLoading: boolean
}

export default function ErrorCategoryDistribution({ data, isLoading }: ErrorCategoryDistributionProps) {
  const [chartData, setChartData] = useState<any>(null)

  useEffect(() => {
    if (!data || data.length === 0) return

    // Sort categories by total count
    const sortedData = [...data].sort((a, b) => {
      const totalA = (a.critical || 0) + (a.error || 0) + (a.warning || 0) + (a.info || 0) + (a.debug || 0)
      const totalB = (b.critical || 0) + (b.error || 0) + (b.warning || 0) + (b.info || 0) + (b.debug || 0)
      return totalB - totalA
    })

    // Limit to top 10 categories
    const topCategories = sortedData.slice(0, 10)

    setChartData({
      labels: topCategories.map((item) => item.category),
      datasets: [
        {
          label: "Critical",
          data: topCategories.map((item) => item.critical || 0),
          backgroundColor: chartColors.critical,
          stack: "Stack 0",
        },
        {
          label: "Error",
          data: topCategories.map((item) => item.error || 0),
          backgroundColor: chartColors.error,
          stack: "Stack 0",
        },
        {
          label: "Warning",
          data: topCategories.map((item) => item.warning || 0),
          backgroundColor: chartColors.warning,
          stack: "Stack 0",
        },
        {
          label: "Info",
          data: topCategories.map((item) => item.info || 0),
          backgroundColor: chartColors.info,
          stack: "Stack 0",
        },
        {
          label: "Debug",
          data: topCategories.map((item) => item.debug || 0),
          backgroundColor: chartColors.debug,
          stack: "Stack 0",
        },
      ],
    })
  }, [data])

  const options = {
    ...commonOptions,
    scales: {
      ...commonOptions.scales,
      x: {
        ...commonOptions.scales?.x,
        stacked: true,
      },
      y: {
        ...commonOptions.scales?.y,
        stacked: true,
      },
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Error Distribution by Category</CardTitle>
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
            <Bar data={chartData} options={options} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
