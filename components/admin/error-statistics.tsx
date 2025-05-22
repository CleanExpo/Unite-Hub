"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, AlertTriangle, Info, Bug, CheckCircle2, XCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorStatistics {
  totalCount: number
  severityCounts: { severity: string; count: number }[]
  categoryCounts: { category: string; count: number }[]
  resolvedCounts: { resolved: boolean; count: number }[]
  recentErrors: { created_at: string; severity: string }[]
}

export default function ErrorStatistics() {
  const [statistics, setStatistics] = useState<ErrorStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStatistics = async (skipCache = false) => {
    try {
      setError(null)
      if (skipCache) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      // Add cache-control header if skipCache is true
      const headers: HeadersInit = skipCache ? { "Cache-Control": "no-cache, no-store, must-revalidate" } : {}

      const response = await fetch("/api/errors/statistics", { headers })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()

      // Ensure we have valid data structure
      const validatedData: ErrorStatistics = {
        totalCount: data.totalCount || 0,
        severityCounts: Array.isArray(data.severityCounts) ? data.severityCounts : [],
        categoryCounts: Array.isArray(data.categoryCounts) ? data.categoryCounts : [],
        resolvedCounts: Array.isArray(data.resolvedCounts) ? data.resolvedCounts : [],
        recentErrors: Array.isArray(data.recentErrors) ? data.recentErrors : [],
      }

      setStatistics(validatedData)
    } catch (err) {
      console.error("Error fetching error statistics:", err)
      setError(err instanceof Error ? err.message : "Failed to load statistics")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStatistics()
  }, [])

  const handleRefresh = () => {
    fetchStatistics(true)
  }

  if (loading) {
    return <div className="py-8 text-center">Loading statistics...</div>
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <div className="inline-flex items-center p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span>Failed to load statistics: {error}</span>
        </div>
        <div className="mt-4">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!statistics) {
    return <div className="py-8 text-center">No statistics available</div>
  }

  // Add null checks and provide default empty arrays
  const resolvedCounts = statistics.resolvedCounts || []
  const severityCounts = statistics.severityCounts || []
  const categoryCounts = statistics.categoryCounts || []

  const resolvedCount = resolvedCounts.find((item) => item.resolved)?.count || 0
  const unresolvedCount = resolvedCounts.find((item) => !item.resolved)?.count || 0

  const criticalCount = severityCounts.find((item) => item.severity === "critical")?.count || 0
  const errorCount = severityCounts.find((item) => item.severity === "error")?.count || 0
  const warningCount = severityCounts.find((item) => item.severity === "warning")?.count || 0

  const topCategories = [...categoryCounts].sort((a, b) => b.count - a.count).slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Error Statistics</h2>
        <Button onClick={handleRefresh} variant="outline" size="sm" disabled={refreshing}>
          {refreshing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statistics.totalCount || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Critical Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-3xl font-bold">{criticalCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unresolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-amber-500 mr-2" />
              <span className="text-3xl font-bold">{unresolvedCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-3xl font-bold">{resolvedCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Errors by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            {severityCounts.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No severity data available</div>
            ) : (
              <div className="space-y-4">
                {severityCounts.map((item) => (
                  <div key={item.severity} className="flex items-center">
                    <div className="w-36 flex items-center">
                      {item.severity === "critical" && <AlertCircle className="h-4 w-4 text-red-600 mr-2" />}
                      {item.severity === "error" && <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />}
                      {item.severity === "warning" && <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />}
                      {item.severity === "info" && <Info className="h-4 w-4 text-blue-500 mr-2" />}
                      {item.severity === "debug" && <Bug className="h-4 w-4 text-gray-500 mr-2" />}
                      <span className="capitalize">{item.severity}</span>
                    </div>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${
                          item.severity === "critical"
                            ? "bg-red-600"
                            : item.severity === "error"
                              ? "bg-red-500"
                              : item.severity === "warning"
                                ? "bg-amber-500"
                                : item.severity === "info"
                                  ? "bg-blue-500"
                                  : "bg-gray-500"
                        }`}
                        style={{ width: `${(item.count / (statistics.totalCount || 1)) * 100}%` }}
                      />
                    </div>
                    <div className="w-12 text-right">{item.count}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Error Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {topCategories.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No category data available</div>
            ) : (
              <div className="space-y-4">
                {topCategories.map((item) => (
                  <div key={item.category} className="flex items-center">
                    <div className="w-36">
                      <span className="capitalize">{item.category}</span>
                    </div>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${(item.count / (statistics.totalCount || 1)) * 100}%` }}
                      />
                    </div>
                    <div className="w-12 text-right">{item.count}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
