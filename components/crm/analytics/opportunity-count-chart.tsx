"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getOpportunityCountByStage } from "@/lib/crm-analytics"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

export function OpportunityCountChart() {
  const [data, setData] = useState<{ stage: string; count: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const countByStage = await getOpportunityCountByStage()
        setData(countByStage)
      } catch (err) {
        console.error("Error fetching opportunity count data:", err)
        setError("Failed to load opportunity count data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Custom colors for each stage
  const COLORS = [
    "#6366F1", // Lead
    "#8B5CF6", // Qualification
    "#EC4899", // Needs Analysis
    "#F59E0B", // Proposal
    "#10B981", // Negotiation
    "#34D399", // Closed Won
    "#EF4444", // Closed Lost
  ]

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#001428] border border-[#4ecdc4]/20 p-3 rounded shadow-md">
          <p className="font-medium text-white">{payload[0].name}</p>
          <p className="text-[#4ecdc4]">{`${payload[0].value} opportunities`}</p>
        </div>
      )
    }
    return null
  }

  // Custom legend
  const renderCustomizedLegend = (props: any) => {
    const { payload } = props

    return (
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
            <span className="text-xs text-gray-300">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card className="bg-[#001428] border-[#4ecdc4]/20">
      <CardHeader>
        <CardTitle className="text-white">Opportunities by Stage</CardTitle>
        <CardDescription className="text-gray-400">Distribution of opportunities across stages</CardDescription>
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
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="stage"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={renderCustomizedLegend} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
