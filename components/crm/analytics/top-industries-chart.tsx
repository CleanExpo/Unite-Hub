"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getTopIndustries } from "@/lib/crm-analytics"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export function TopIndustriesChart() {
  const [data, setData] = useState<{ industry: string; value: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const industries = await getTopIndustries()
        setData(industries)
      } catch (err) {
        console.error("Error fetching top industries data:", err)
        setError("Failed to load top industries data")
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
        <CardTitle className="text-white">Top Performing Industries</CardTitle>
        <CardDescription className="text-gray-400">Industries with highest closed deal value</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 rounded-full border-4 border-[#4ecdc4]/20 border-t-[#4ecdc4] animate-spin"></div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64 text-red-500">{error}</div>
        ) : data.length === 0 ? (
          <div className="flex justify-center items-center h-64 text-gray-400">No closed deals to analyze</div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                <XAxis
                  type="number"
                  tick={{ fill: "#A0AEC0" }}
                  axisLine={{ stroke: "#2D3748" }}
                  tickLine={{ stroke: "#2D3748" }}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <YAxis
                  dataKey="industry"
                  type="category"
                  tick={{ fill: "#A0AEC0" }}
                  axisLine={{ stroke: "#2D3748" }}
                  tickLine={{ stroke: "#2D3748" }}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#4ecdc4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
