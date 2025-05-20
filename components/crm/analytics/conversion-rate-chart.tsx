"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getStageConversionRates } from "@/lib/crm-analytics"
import { getOpportunities, getPipelineStages } from "@/lib/crm"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export function ConversionRateChart() {
  const [data, setData] = useState<{ from: string; to: string; rate: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [opportunities, stages] = await Promise.all([getOpportunities(), getPipelineStages()])
        const conversionRates = await getStageConversionRates(opportunities, stages)
        setData(conversionRates)
      } catch (err) {
        console.error("Error fetching conversion rate data:", err)
        setError("Failed to load conversion rate data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#001428] border border-[#4ecdc4]/20 p-3 rounded shadow-md">
          <p className="font-medium text-white">{`${label} → ${payload[0].payload.to}`}</p>
          <p className="text-[#4ecdc4]">{`${payload[0].value}% conversion rate`}</p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="bg-[#001428] border-[#4ecdc4]/20">
      <CardHeader>
        <CardTitle className="text-white">Stage Conversion Rates</CardTitle>
        <CardDescription className="text-gray-400">
          Percentage of opportunities that progress between stages
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 rounded-full border-4 border-[#4ecdc4]/20 border-t-[#4ecdc4] animate-spin"></div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64 text-red-500">{error}</div>
        ) : data.length === 0 ? (
          <div className="flex justify-center items-center h-64 text-gray-400">
            Not enough data to calculate conversion rates
          </div>
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
                  dataKey="from"
                  tick={{ fill: "#A0AEC0" }}
                  axisLine={{ stroke: "#2D3748" }}
                  tickLine={{ stroke: "#2D3748" }}
                />
                <YAxis
                  tick={{ fill: "#A0AEC0" }}
                  axisLine={{ stroke: "#2D3748" }}
                  tickLine={{ stroke: "#2D3748" }}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="rate" fill="#4ecdc4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
