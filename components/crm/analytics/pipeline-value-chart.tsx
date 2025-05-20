"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getPipelineValueByStage } from "@/lib/crm-analytics"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

export function PipelineValueChart() {
  const [data, setData] = useState<{ stage: string; value: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const valueByStage = await getPipelineValueByStage()
        setData(valueByStage)
      } catch (err) {
        console.error("Error fetching pipeline value data:", err)
        setError("Failed to load pipeline value data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Custom colors for each stage
  const colors = [
    "#6366F1", // Lead
    "#8B5CF6", // Qualification
    "#EC4899", // Needs Analysis
    "#F59E0B", // Proposal
    "#10B981", // Negotiation
    "#34D399", // Closed Won
    "#EF4444", // Closed Lost
  ]

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
        <CardTitle className="text-white">Pipeline Value by Stage</CardTitle>
        <CardDescription className="text-gray-400">Total value of opportunities in each stage</CardDescription>
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
              <BarChart
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
                  dataKey="stage"
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
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
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
