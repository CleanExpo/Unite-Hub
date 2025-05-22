"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { io, type Socket } from "socket.io-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, AlertTriangle, Info, Bug, Bell, Play, Pause, RotateCcw, Clock, Search } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

interface ErrorLog {
  id: number
  message: string
  severity: string
  category: string
  created_at: string
  resolved: boolean
  assigned_to: string | null
  assignment_status: string | null
  stack_trace?: string
  user_id?: string
  session_id?: string
  browser?: string
  os?: string
  url?: string
}

export default function RealTimeErrorDashboard() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isStreaming, setIsStreaming] = useState(true)
  const [realtimeErrors, setRealtimeErrors] = useState<ErrorLog[]>([])
  const [errorCount, setErrorCount] = useState<Record<string, number>>({
    total: 0,
    critical: 0,
    error: 0,
    warning: 0,
    info: 0,
    debug: 0,
  })
  const [errorRate, setErrorRate] = useState<{ time: string; count: number }[]>([])
  const [activeTab, setActiveTab] = useState("live-feed")
  const [filters, setFilters] = useState({
    severity: "all",
    category: "all",
    search: "",
  })
  const [autoScroll, setAutoScroll] = useState(true)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const errorRateInterval = useRef<NodeJS.Timeout | null>(null)

  // Initialize socket connection
  useEffect(() => {
    const socketInstance = io({
      path: "/api/socket",
      addTrailingSlash: false,
    })

    socketInstance.on("connect", () => {
      console.log("Real-time dashboard socket connected:", socketInstance.id)
      setIsConnected(true)

      // Subscribe to error updates
      socketInstance.emit("subscribe:errors", filters)
    })

    socketInstance.on("disconnect", () => {
      console.log("Real-time dashboard socket disconnected")
      setIsConnected(false)
    })

    socketInstance.on("error:new", (error: ErrorLog) => {
      if (isStreaming) {
        // Add new error to the list
        setRealtimeErrors((prev) => [error, ...prev].slice(0, 100)) // Keep only the 100 most recent

        // Update error counts
        setErrorCount((prev) => ({
          ...prev,
          total: prev.total + 1,
          [error.severity]: (prev[error.severity as keyof typeof prev] || 0) + 1,
        }))
      }
    })

    // Store socket instance
    setSocket(socketInstance)

    // Set up error rate tracking
    setupErrorRateTracking()

    // Clean up on unmount
    return () => {
      if (socketInstance) {
        socketInstance.emit("unsubscribe:errors")
        socketInstance.disconnect()
      }

      if (errorRateInterval.current) {
        clearInterval(errorRateInterval.current)
      }
    }
  }, [])

  // Update filters when they change
  useEffect(() => {
    if (socket && isConnected) {
      socket.emit("subscribe:errors", filters)
    }
  }, [filters, socket, isConnected])

  // Auto-scroll to the latest error
  useEffect(() => {
    if (autoScroll && scrollAreaRef.current && realtimeErrors.length > 0) {
      scrollAreaRef.current.scrollTop = 0
    }
  }, [realtimeErrors, autoScroll])

  // Set up error rate tracking
  const setupErrorRateTracking = () => {
    // Initialize with empty data points for the last 30 minutes (1 point per minute)
    const initialData = Array.from({ length: 30 }, (_, i) => {
      const time = new Date()
      time.setMinutes(time.getMinutes() - (29 - i))
      return {
        time: time.toISOString(),
        count: 0,
      }
    })

    setErrorRate(initialData)

    // Update error rate every minute
    errorRateInterval.current = setInterval(() => {
      const now = new Date().toISOString()

      setErrorRate((prev) => {
        // Remove oldest data point and add new one
        const newData = [...prev.slice(1), { time: now, count: 0 }]
        return newData
      })
    }, 60000) // Every minute
  }

  // Update error rate when new errors come in
  useEffect(() => {
    if (realtimeErrors.length > 0) {
      const latestError = realtimeErrors[0]

      setErrorRate((prev) => {
        const newData = [...prev]
        const lastIndex = newData.length - 1

        // Increment the count for the latest minute
        newData[lastIndex] = {
          ...newData[lastIndex],
          count: newData[lastIndex].count + 1,
        }

        return newData
      })
    }
  }, [realtimeErrors])

  // Toggle streaming
  const toggleStreaming = () => {
    setIsStreaming(!isStreaming)
  }

  // Clear all errors
  const clearErrors = () => {
    setRealtimeErrors([])
    setErrorCount({
      total: 0,
      critical: 0,
      error: 0,
      warning: 0,
      info: 0,
      debug: 0,
    })
  }

  // Apply search filter
  const applySearchFilter = (e: React.FormEvent) => {
    e.preventDefault()
    // Filters are already applied via the state
  }

  // Get severity badge
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Critical
          </Badge>
        )
      case "error":
        return (
          <Badge variant="destructive" className="bg-red-500 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Error
          </Badge>
        )
      case "warning":
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-500 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Warning
          </Badge>
        )
      case "info":
        return (
          <Badge variant="outline" className="text-blue-500 border-blue-500 flex items-center gap-1">
            <Info className="h-3 w-3" /> Info
          </Badge>
        )
      case "debug":
        return (
          <Badge variant="outline" className="text-gray-500 border-gray-500 flex items-center gap-1">
            <Bug className="h-3 w-3" /> Debug
          </Badge>
        )
      default:
        return <Badge>{severity}</Badge>
    }
  }

  // Filter errors based on current filters
  const filteredErrors = realtimeErrors.filter((error) => {
    if (filters.severity !== "all" && error.severity !== filters.severity) {
      return false
    }

    if (filters.category !== "all" && error.category !== filters.category) {
      return false
    }

    if (filters.search && !error.message.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }

    return true
  })

  // Format time for chart
  const formatTime = (time: string) => {
    const date = new Date(time)
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-red-500 animate-pulse" />
              Real-Time Error Monitor
              {isConnected ? (
                <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-200">
                  Disconnected
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Monitor errors as they occur in real-time across your application</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isStreaming ? "default" : "outline"}
              size="sm"
              onClick={toggleStreaming}
              className="flex items-center gap-1"
            >
              {isStreaming ? (
                <>
                  <Pause className="h-4 w-4" /> Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" /> Resume
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={clearErrors} className="flex items-center gap-1">
              <RotateCcw className="h-4 w-4" /> Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="live-feed" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="live-feed">Live Feed</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="live-feed">
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                <div className="flex-1">
                  <form onSubmit={applySearchFilter} className="flex gap-2">
                    <Input
                      placeholder="Search error messages..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="flex-1"
                    />
                    <Button type="submit" size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                  </form>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Select
                    value={filters.severity}
                    onValueChange={(value) => setFilters({ ...filters, severity: value })}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="debug">Debug</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.category}
                    onValueChange={(value) => setFilters({ ...filters, category: value })}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="api">API</SelectItem>
                      <SelectItem value="database">Database</SelectItem>
                      <SelectItem value="authentication">Authentication</SelectItem>
                      <SelectItem value="frontend">Frontend</SelectItem>
                      <SelectItem value="backend">Backend</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center space-x-2">
                    <Switch id="auto-scroll" checked={autoScroll} onCheckedChange={setAutoScroll} />
                    <Label htmlFor="auto-scroll">Auto-scroll</Label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-4 mb-4">
                <Card className="col-span-5 md:col-span-1">
                  <CardContent className="p-4">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Total Errors</div>
                    <div className="text-2xl font-bold">{errorCount.total}</div>
                  </CardContent>
                </Card>
                <Card className="col-span-5 md:col-span-1">
                  <CardContent className="p-4 bg-red-50">
                    <div className="text-sm font-medium text-red-700 mb-1">Critical</div>
                    <div className="text-2xl font-bold text-red-700">{errorCount.critical}</div>
                  </CardContent>
                </Card>
                <Card className="col-span-5 md:col-span-1">
                  <CardContent className="p-4 bg-orange-50">
                    <div className="text-sm font-medium text-orange-700 mb-1">Errors</div>
                    <div className="text-2xl font-bold text-orange-700">{errorCount.error}</div>
                  </CardContent>
                </Card>
                <Card className="col-span-5 md:col-span-1">
                  <CardContent className="p-4 bg-amber-50">
                    <div className="text-sm font-medium text-amber-700 mb-1">Warnings</div>
                    <div className="text-2xl font-bold text-amber-700">{errorCount.warning}</div>
                  </CardContent>
                </Card>
                <Card className="col-span-5 md:col-span-1">
                  <CardContent className="p-4 bg-blue-50">
                    <div className="text-sm font-medium text-blue-700 mb-1">Info</div>
                    <div className="text-2xl font-bold text-blue-700">{errorCount.info}</div>
                  </CardContent>
                </Card>
              </div>

              <ScrollArea className="h-[400px] border rounded-md" ref={scrollAreaRef}>
                {filteredErrors.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No errors to display. Waiting for new errors...
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredErrors.map((error) => (
                      <div key={`${error.id}-${error.created_at}`} className="p-4 hover:bg-muted/50">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-start gap-2">
                              <div className="mt-0.5">{getSeverityBadge(error.severity)}</div>
                              <div>
                                <p className="font-medium">{error.message}</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                                  <span className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {formatDistanceToNow(new Date(error.created_at), { addSuffix: true })}
                                  </span>
                                  <span>Category: {error.category}</span>
                                  {error.url && <span>URL: {error.url}</span>}
                                  {error.browser && <span>Browser: {error.browser}</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="metrics">
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Error Rate (Last 30 Minutes)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ChartContainer
                      config={{
                        count: {
                          label: "Error Count",
                          color: "hsl(var(--chart-1))",
                        },
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={errorRate}>
                          <XAxis dataKey="time" tickFormatter={formatTime} tick={{ fontSize: 12 }} tickCount={6} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                          <Tooltip content={<ChartTooltipContent />} />
                          <Line
                            type="monotone"
                            dataKey="count"
                            stroke="var(--color-count)"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Severity Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(errorCount)
                        .filter(([key]) => key !== "total")
                        .map(([severity, count]) => {
                          const percentage = errorCount.total > 0 ? Math.round((count / errorCount.total) * 100) : 0

                          return (
                            <div key={severity} className="flex items-center">
                              <div className="w-24 capitalize">{severity}</div>
                              <div className="flex-1">
                                <div className="h-2 w-full bg-muted overflow-hidden rounded-full">
                                  <div
                                    className={`h-full ${
                                      severity === "critical"
                                        ? "bg-red-500"
                                        : severity === "error"
                                          ? "bg-orange-500"
                                          : severity === "warning"
                                            ? "bg-amber-500"
                                            : severity === "info"
                                              ? "bg-blue-500"
                                              : "bg-gray-500"
                                    }`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                              <div className="w-16 text-right">
                                {count} ({percentage}%)
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Session Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">Active Monitoring</div>
                        <div className="text-2xl font-bold">
                          {isStreaming ? (
                            <span className="text-green-600">Active</span>
                          ) : (
                            <span className="text-amber-600">Paused</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">Connection Status</div>
                        <div className="text-2xl font-bold">
                          {isConnected ? (
                            <span className="text-green-600">Connected</span>
                          ) : (
                            <span className="text-red-600">Disconnected</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">Monitoring Since</div>
                        <div className="font-medium">{new Date().toLocaleTimeString()}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
