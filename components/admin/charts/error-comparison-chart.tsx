"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, LineChart, Line } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react"

// Sample data - in a real implementation, this would come from an API
const sampleComparisonData = {
  current: {
    period: "Last 7 days",
    total: 156,
    byDay: [
      { day: "Mon", errors: 25 },
      { day: "Tue", errors: 18 },
      { day: "Wed", errors: 22 },
      { day: "Thu", errors: 30 },
      { day: "Fri", errors: 27 },
      { day: "Sat", errors: 15 },
      { day: "Sun", errors: 19 },
    ],
    bySeverity: {
      critical: 12,
      error: 48,
      warning: 67,
      info: 29,
    },
    byCategory: {
      api: 45,
      database: 38,
      authentication: 22,
      frontend: 31,
      other: 20,
    },
    avgResolutionTime: 4.2, // hours
  },
  previous: {
    period: "Previous 7 days",
    total: 178,
    byDay: [
      { day: "Mon", errors: 32 },
      { day: "Tue", errors: 24 },
      { day: "Wed", errors: 19 },
      { day: "Thu", errors: 28 },
      { day: "Fri", errors: 35 },
      { day: "Sat", errors: 18 },
      { day: "Sun", errors: 22 },
    ],
    bySeverity: {
      critical: 18,
      error: 52,
      warning: 72,
      info: 36,
    },
    byCategory: {
      api: 52,
      database: 45,
      authentication: 25,
      frontend: 36,
      other: 20,
    },
    avgResolutionTime: 5.8, // hours
  },
}

// Transform data for charts
const transformDailyData = (current, previous) => {
  return current.byDay.map((item, index) => ({
    day: item.day,
    current: item.errors,
    previous: previous.byDay[index].errors,
  }))
}

const transformSeverityData = (current, previous) => {
  return [
    { name: "Critical", current: current.bySeverity.critical, previous: previous.bySeverity.critical },
    { name: "Error", current: current.bySeverity.error, previous: previous.bySeverity.error },
    { name: "Warning", current: current.bySeverity.warning, previous: previous.bySeverity.warning },
    { name: "Info", current: current.bySeverity.info, previous: previous.bySeverity.info },
  ]
}

const transformCategoryData = (current, previous) => {
  return Object.keys(current.byCategory).map((key) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    current: current.byCategory[key],
    previous: previous.byCategory[key],
  }))
}

// Calculate percentage change
const calculateChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export function ErrorComparisonChart() {
  const [period, setPeriod] = useState("7d")
  const [view, setView] = useState("daily")

  // In a real implementation, we would fetch data based on the selected period
  const data = sampleComparisonData
  const dailyData = transformDailyData(data.current, data.previous)
  const severityData = transformSeverityData(data.current, data.previous)
  const categoryData = transformCategoryData(data.current, data.previous)

  const totalChange = calculateChange(data.current.total, data.previous.total)
  const resolutionTimeChange = calculateChange(data.current.avgResolutionTime, data.previous.avgResolutionTime)

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Error Comparison</CardTitle>
          <CardDescription>Compare error metrics between time periods</CardDescription>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days vs Previous</SelectItem>
            <SelectItem value="30d">Last 30 days vs Previous</SelectItem>
            <SelectItem value="90d">Last 90 days vs Previous</SelectItem>
            <SelectItem value="custom">Custom range</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{data.current.total}</div>
              <div className="text-sm text-muted-foreground">Total Errors</div>
              <div className="flex items-center mt-2">
                {totalChange < 0 ? (
                  <ArrowDownIcon className="h-4 w-4 text-green-500 mr-1" />
                ) : totalChange > 0 ? (
                  <ArrowUpIcon className="h-4 w-4 text-red-500 mr-1" />
                ) : (
                  <MinusIcon className="h-4 w-4 text-gray-500 mr-1" />
                )}
                <span
                  className={`text-sm ${totalChange < 0 ? "text-green-500" : totalChange > 0 ? "text-red-500" : "text-gray-500"}`}
                >
                  {Math.abs(totalChange).toFixed(1)}% from previous
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{data.current.avgResolutionTime.toFixed(1)}h</div>
              <div className="text-sm text-muted-foreground">Avg Resolution Time</div>
              <div className="flex items-center mt-2">
                {resolutionTimeChange < 0 ? (
                  <ArrowDownIcon className="h-4 w-4 text-green-500 mr-1" />
                ) : resolutionTimeChange > 0 ? (
                  <ArrowUpIcon className="h-4 w-4 text-red-500 mr-1" />
                ) : (
                  <MinusIcon className="h-4 w-4 text-gray-500 mr-1" />
                )}
                <span
                  className={`text-sm ${resolutionTimeChange < 0 ? "text-green-500" : resolutionTimeChange > 0 ? "text-red-500" : "text-gray-500"}`}
                >
                  {Math.abs(resolutionTimeChange).toFixed(1)}% from previous
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{data.current.bySeverity.critical}</div>
              <div className="text-sm text-muted-foreground">Critical Errors</div>
              <div className="flex items-center mt-2">
                {calculateChange(data.current.bySeverity.critical, data.previous.bySeverity.critical) < 0 ? (
                  <ArrowDownIcon className="h-4 w-4 text-green-500 mr-1" />
                ) : calculateChange(data.current.bySeverity.critical, data.previous.bySeverity.critical) > 0 ? (
                  <ArrowUpIcon className="h-4 w-4 text-red-500 mr-1" />
                ) : (
                  <MinusIcon className="h-4 w-4 text-gray-500 mr-1" />
                )}
                <span
                  className={`text-sm ${calculateChange(data.current.bySeverity.critical, data.previous.bySeverity.critical) < 0 ? "text-green-500" : calculateChange(data.current.bySeverity.critical, data.previous.bySeverity.critical) > 0 ? "text-red-500" : "text-gray-500"}`}
                >
                  {Math.abs(
                    calculateChange(data.current.bySeverity.critical, data.previous.bySeverity.critical),
                  ).toFixed(1)}
                  % from previous
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={view} onValueChange={setView}>
          <TabsList className="mb-4">
            <TabsTrigger value="daily">Daily Trend</TabsTrigger>
            <TabsTrigger value="severity">By Severity</TabsTrigger>
            <TabsTrigger value="category">By Category</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="mt-0">
            <ChartContainer
              config={{
                current: {
                  label: "Current Period",
                  color: "hsl(var(--chart-1))",
                },
                previous: {
                  label: "Previous Period",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line type="monotone" dataKey="current" stroke="var(--color-current)" strokeWidth={2} />
                  <Line
                    type="monotone"
                    dataKey="previous"
                    stroke="var(--color-previous)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="severity" className="mt-0">
            <ChartContainer
              config={{
                current: {
                  label: "Current Period",
                  color: "hsl(var(--chart-1))",
                },
                previous: {
                  label: "Previous Period",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="current" fill="var(--color-current)" />
                  <Bar dataKey="previous" fill="var(--color-previous)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="category" className="mt-0">
            <ChartContainer
              config={{
                current: {
                  label: "Current Period",
                  color: "hsl(var(--chart-1))",
                },
                previous: {
                  label: "Previous Period",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="current" fill="var(--color-current)" />
                  <Bar dataKey="previous" fill="var(--color-previous)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default ErrorComparisonChart
