"use client"

import { useState, useEffect } from "react"
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react"

interface BuildStatus {
  status: "building" | "success" | "error" | "unknown"
  message: string
  timestamp: string
  buildId?: string
}

export function BuildStatus() {
  const [buildStatus, setBuildStatus] = useState<BuildStatus>({
    status: "unknown",
    message: "Checking build status...",
    timestamp: new Date().toISOString(),
  })
  const [isLoading, setIsLoading] = useState(false)

  const checkBuildStatus = async () => {
    setIsLoading(true)
    try {
      // Check if the app is running properly
      const response = await fetch("/api/health", { method: "HEAD" })

      if (response.ok) {
        setBuildStatus({
          status: "success",
          message: "Application is running successfully",
          timestamp: new Date().toISOString(),
          buildId: response.headers.get("x-build-id") || undefined,
        })
      } else {
        setBuildStatus({
          status: "error",
          message: `Application error (${response.status})`,
          timestamp: new Date().toISOString(),
        })
      }
    } catch (error) {
      setBuildStatus({
        status: "error",
        message: "Failed to connect to application",
        timestamp: new Date().toISOString(),
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkBuildStatus()
    // Check status every 30 seconds
    const interval = setInterval(checkBuildStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = () => {
    switch (buildStatus.status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "building":
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusColor = () => {
    switch (buildStatus.status) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800"
      case "error":
        return "bg-red-50 border-red-200 text-red-800"
      case "building":
        return "bg-blue-50 border-blue-200 text-blue-800"
      default:
        return "bg-yellow-50 border-yellow-200 text-yellow-800"
    }
  }

  return (
    <div className={`p-3 rounded-lg border ${getStatusColor()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium">Build Status</span>
        </div>
        <button
          onClick={checkBuildStatus}
          disabled={isLoading}
          className="text-xs opacity-70 hover:opacity-100 transition-opacity"
        >
          {isLoading ? "Checking..." : "Refresh"}
        </button>
      </div>
      <p className="text-xs mt-1 opacity-80">{buildStatus.message}</p>
      <p className="text-xs mt-1 opacity-60">Last checked: {new Date(buildStatus.timestamp).toLocaleTimeString()}</p>
      {buildStatus.buildId && <p className="text-xs mt-1 opacity-60">Build ID: {buildStatus.buildId}</p>}
    </div>
  )
}
