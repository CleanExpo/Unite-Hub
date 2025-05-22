import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generatePdfReport, type ReportType } from "@/lib/pdf-export-service"

export async function POST(request: Request) {
  try {
    const { reportType, timeRange, filters } = await request.json()

    // Validate the report type
    if (
      ![
        "error-trends",
        "error-distribution",
        "resolution-times",
        "category-distribution",
        "heatmap",
        "prediction",
      ].includes(reportType)
    ) {
      return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
    }

    // Parse the time range
    const days = Number.parseInt(timeRange.replace("d", ""), 10) || 30

    // Fetch the data based on the report type
    const data = await fetchReportData(reportType as ReportType, days, filters)

    // Generate the PDF report
    const pdfBuffer = await generatePdfReport({
      title: getReportTitle(reportType as ReportType),
      subtitle: "Error Monitoring System",
      timeRange: `Last ${days} days`,
      data,
      type: reportType as ReportType,
      filters,
    })

    // Return the PDF as a response
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${getReportFileName(reportType as ReportType)}"`,
      },
    })
  } catch (error) {
    console.error("Error generating PDF report:", error)
    return NextResponse.json({ error: "Failed to generate PDF report" }, { status: 500 })
  }
}

// Fetch the report data based on the report type
async function fetchReportData(reportType: ReportType, days: number, filters: any = {}) {
  const supabase = createClient()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  switch (reportType) {
    case "error-trends": {
      const { data, error } = await supabase.rpc("get_error_trends_by_time_period", {
        start_date: startDate.toISOString(),
        end_date: new Date().toISOString(),
        interval_type: "day",
      })

      if (error) throw error

      return data.map((item) => ({
        date: new Date(item.time_period).toISOString(),
        total: item.total_count,
        critical: item.critical_count,
        error: item.error_count,
        warning: item.warning_count,
        info: item.info_count,
        debug: item.debug_count,
        resolved: item.resolved_count,
      }))
    }

    case "error-distribution": {
      // Similar to error-trends but formatted differently
      const { data, error } = await supabase.rpc("get_error_trends_by_time_period", {
        start_date: startDate.toISOString(),
        end_date: new Date().toISOString(),
        interval_type: "day",
      })

      if (error) throw error

      return data.map((item) => ({
        date: new Date(item.time_period).toISOString(),
        critical: item.critical_count,
        error: item.error_count,
        warning: item.warning_count,
        info: item.info_count,
        debug: item.debug_count,
      }))
    }

    case "resolution-times": {
      const groupBy = filters.groupBy || "severity"
      const { data, error } = await supabase.rpc("get_error_resolution_times_by_type", {
        group_by_field: groupBy,
        start_date: startDate.toISOString(),
      })

      if (error) throw error

      return data || []
    }

    case "category-distribution": {
      const { data, error } = await supabase.rpc("get_error_category_distribution", {
        start_date: startDate.toISOString(),
      })

      if (error) throw error

      return data || []
    }

    case "heatmap": {
      const { data, error } = await supabase.rpc("get_error_heatmap_data", {
        start_date: startDate.toISOString(),
      })

      if (error) throw error

      return data || []
    }

    case "prediction": {
      // For prediction, we'll need to call the prediction API
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/errors/predict?days=${days}&forecast=30`, {
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch prediction data: ${response.statusText}`)
      }

      const result = await response.json()
      return result.data || []
    }

    default:
      return []
  }
}

// Get the report title based on the report type
function getReportTitle(reportType: ReportType): string {
  switch (reportType) {
    case "error-trends":
      return "Error Trends Report"
    case "error-distribution":
      return "Error Distribution Report"
    case "resolution-times":
      return "Error Resolution Times Report"
    case "category-distribution":
      return "Error Category Distribution Report"
    case "heatmap":
      return "Error Occurrence Heatmap Report"
    case "prediction":
      return "Error Prediction Report"
    default:
      return "Error Report"
  }
}

// Get the report file name based on the report type
function getReportFileName(reportType: ReportType): string {
  const date = new Date().toISOString().split("T")[0]
  switch (reportType) {
    case "error-trends":
      return `error-trends-report-${date}.pdf`
    case "error-distribution":
      return `error-distribution-report-${date}.pdf`
    case "resolution-times":
      return `error-resolution-times-report-${date}.pdf`
    case "category-distribution":
      return `error-category-distribution-report-${date}.pdf`
    case "heatmap":
      return `error-heatmap-report-${date}.pdf`
    case "prediction":
      return `error-prediction-report-${date}.pdf`
    default:
      return `error-report-${date}.pdf`
  }
}
