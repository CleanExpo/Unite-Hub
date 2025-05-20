"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getMonthlyPipelineValue } from "@/lib/crm-analytics"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export function MonthlyTrendChart() {
  const [data, setData] = useState<{ month: string; value: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const monthlyValues = await getMonthlyPipelineValue()
        setData(monthlyValues)
      } catch (err) {
        console.error("Error fetching monthly trend data:", err)
        setError("Failed to load monthly trend data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Format currency for tooltip
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#001428] border border-[#4ecdc4]/20 p-3 rounded shadow-md">
          <p className="font-medium text-white">{label}</p>
          <p className="text-[#4ecdc4]">{formatCurrency(payload[0].value)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="bg-[#001428] border-[#4ecdc4]/20">
      <CardHeader>
        <CardTitle className="text-white">Monthly Pipeline Trend</CardTitle>
        <CardDescription className="text-gray-400">Total pipeline value over the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 rounded-full border-4 border-[#4ecdc4]/20 border-t-[#4ecdc4] animate-spin"></div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64 text-red-500">{error}</div>
        ) : (
          <div className="h-64">
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
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#A0AEC0" }}
                  axisLine={{ stroke: "#2D3748" }}
                  tickLine={{ stroke: "#2D3748" }}
                />
                <YAxis
                  tick={{ fill: "#A0AEC0" }}
                  axisLine={{ stroke: "#2D3748" }}
                  tickLine={{ stroke: "#2D3748" }}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#4ecdc4"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#4ecdc4", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#4ecdc4", stroke: "#001428", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
