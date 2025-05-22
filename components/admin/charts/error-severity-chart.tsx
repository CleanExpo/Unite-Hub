"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Sample data - in a real implementation, this would come from an API
const sampleSeverityData = {
  total: 487,
  distribution: [
    { name: "Critical", value: 42, color: "#ef4444" },
    { name: "Error", value: 156, color: "#f97316" },
    { name: "Warning", value: 215, color: "#eab308" },
    { name: "Info", value: 74, color: "#3b82f6" },
  ],
  trend: [
    { day: "Mon", Critical: 8, Error: 24, Warning: 32, Info: 12 },
    { day: "Tue", Critical: 6, Error: 22, Warning: 28, Info: 10 },
    { day: "Wed", Critical: 5, Error: 18, Warning: 30, Info: 8 },
    { day: "Thu", Critical: 7, Error: 26, Warning: 34, Info: 14 },
    { day: "Fri", Critical: 9, Error: 28, Warning: 36, Info: 12 },
    { day: "Sat", Critical: 4, Error: 20, Warning: 26, Info: 9 },
    { day: "Sun", Critical: 3, Error: 18, Warning: 29, Info: 9 },
  ],
}

export function ErrorSeverityChart() {
  const [period, setPeriod] = useState("7d")
  const [view, setView] = useState("pie")

  // In a real implementation, we would fetch data based on the selected period
  const data = sampleSeverityData

  // Calculate percentages for the summary
  const criticalPercent = ((data.distribution[0].value / data.total) * 100).toFixed(1)
  const errorPercent = ((data.distribution[1].value / data.total) * 100).toFixed(1)
  const warningPercent = ((data.distribution[2].value / data.total) * 100).toFixed(1)
  const infoPercent = ((data.distribution[3].value / data.total) * 100).toFixed(1)

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Error Severity Distribution</CardTitle>
          <CardDescription>Breakdown of errors by severity level</CardDescription>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="365d">Last year</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-red-50 dark:bg-red-950/20">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{criticalPercent}%</div>
              <div className="text-sm font-medium text-red-600 dark:text-red-400">Critical</div>
              <div className="text-xs text-muted-foreground mt-1">{data.distribution[0].value} errors</div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 dark:bg-orange-950/20">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{errorPercent}%</div>
              <div className="text-sm font-medium text-orange-600 dark:text-orange-400">Error</div>
              <div className="text-xs text-muted-foreground mt-1">{data.distribution[1].value} errors</div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{warningPercent}%</div>
              <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Warning</div>
              <div className="text-xs text-muted-foreground mt-1">{data.distribution[2].value} errors</div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-950/20">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{infoPercent}%</div>
              <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Info</div>
              <div className="text-xs text-muted-foreground mt-1">{data.distribution[3].value} errors</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={view} onValueChange={setView}>
          <TabsList className="mb-4">
            <TabsTrigger value="pie">Pie Chart</TabsTrigger>
            <TabsTrigger value="donut">Donut Chart</TabsTrigger>
            <TabsTrigger value="bar">Bar Chart</TabsTrigger>
            <TabsTrigger value="trend">Trend</TabsTrigger>
          </TabsList>

          <TabsContent value="pie" className="mt-0">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.distribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {data.distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} errors`, "Count"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="donut" className="mt-0">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {data.distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} errors`, "Count"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="bar" className="mt-0">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.distribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} errors`, "Count"]} />
                  <Legend />
                  <Bar dataKey="value" name="Errors">
                    {data.distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="trend" className="mt-0">
            <ChartContainer
              config={{
                Critical: {
                  label: "Critical",
                  color: "#ef4444",
                },
                Error: {
                  label: "Error",
                  color: "#f97316",
                },
                Warning: {
                  label: "Warning",
                  color: "#eab308",
                },
                Info: {
                  label: "Info",
                  color: "#3b82f6",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="Critical" stackId="a" fill="var(--color-Critical)" />
                  <Bar dataKey="Error" stackId="a" fill="var(--color-Error)" />
                  <Bar dataKey="Warning" stackId="a" fill="var(--color-Warning)" />
                  <Bar dataKey="Info" stackId="a" fill="var(--color-Info)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default ErrorSeverityChart
