"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileDown, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"

interface ErrorReportExportButtonProps {
  className?: string
}

export function ErrorReportExportButton({ className }: ErrorReportExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [reportType, setReportType] = useState<string>("error-trends")
  const [timeRange, setTimeRange] = useState<string>("30d")

  const handleExport = async () => {
    setIsExporting(true)

    try {
      // Make API call to generate PDF
      const response = await fetch(`/api/errors/export-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportType,
          timeRange,
          filters: {},
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to generate PDF")
      }

      const blob = await response.blob()

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `${reportType}-report.pdf`)
      document.body.appendChild(link)
      link.click()

      // Clean up
      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Report exported successfully",
        description: "Your error report has been downloaded.",
      })
    } catch (error) {
      console.error("Error exporting PDF:", error)
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export report",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Select value={timeRange} onValueChange={setTimeRange}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Time Range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7d">Last 7 days</SelectItem>
          <SelectItem value="30d">Last 30 days</SelectItem>
          <SelectItem value="90d">Last 90 days</SelectItem>
          <SelectItem value="365d">Last year</SelectItem>
        </SelectContent>
      </Select>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                Export Report
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Select Report Type</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setReportType("error-trends")
              handleExport()
            }}
          >
            Error Trends
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setReportType("error-distribution")
              handleExport()
            }}
          >
            Error Distribution
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setReportType("resolution-times")
              handleExport()
            }}
          >
            Resolution Times
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setReportType("category-distribution")
              handleExport()
            }}
          >
            Category Distribution
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setReportType("heatmap")
              handleExport()
            }}
          >
            Occurrence Heatmap
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setReportType("prediction")
              handleExport()
            }}
          >
            Error Prediction
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
