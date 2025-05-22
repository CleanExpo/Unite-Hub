import { jsPDF } from "jspdf"
import "jspdf-autotable"
import { ChartJSNodeCanvas } from "chartjs-node-canvas"
import { formatDate } from "./utils"

// Define the chart canvas dimensions
const width = 800
const height = 400
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: "white" })

// Define the report types
export type ReportType =
  | "error-trends"
  | "error-distribution"
  | "resolution-times"
  | "category-distribution"
  | "heatmap"
  | "prediction"

// Define the report options
export interface ReportOptions {
  title: string
  subtitle?: string
  timeRange: string
  data: any
  type: ReportType
  includeTable?: boolean
  filters?: Record<string, string>
}

// Generate a PDF report
export async function generatePdfReport(options: ReportOptions): Promise<Uint8Array> {
  const { title, subtitle, timeRange, data, type, includeTable = true, filters = {} } = options

  // Create a new PDF document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  // Add the report header
  addReportHeader(doc, title, subtitle, timeRange, filters)

  // Add the chart based on the report type
  await addChart(doc, type, data)

  // Add a table of the data if requested
  if (includeTable) {
    addDataTable(doc, type, data)
  }

  // Add the footer
  addFooter(doc)

  // Return the PDF as a Uint8Array
  return doc.output("arraybuffer")
}

// Add the report header
function addReportHeader(
  doc: jsPDF,
  title: string,
  subtitle?: string,
  timeRange?: string,
  filters: Record<string, string> = {},
) {
  // Add the title
  doc.setFontSize(20)
  doc.setTextColor(33, 33, 33)
  doc.text(title, 20, 20)

  // Add the subtitle if provided
  if (subtitle) {
    doc.setFontSize(14)
    doc.setTextColor(100, 100, 100)
    doc.text(subtitle, 20, 30)
  }

  // Add the time range
  if (timeRange) {
    doc.setFontSize(12)
    doc.setTextColor(100, 100, 100)
    doc.text(`Time Range: ${timeRange}`, 20, subtitle ? 40 : 30)
  }

  // Add the filters
  if (Object.keys(filters).length > 0) {
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    const filterText = Object.entries(filters)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ")
    doc.text(`Filters: ${filterText}`, 20, subtitle ? (timeRange ? 50 : 40) : timeRange ? 40 : 30)
  }

  // Add the generation date
  doc.setFontSize(10)
  doc.setTextColor(150, 150, 150)
  doc.text(`Generated on: ${formatDate(new Date())}`, 20, 60)

  // Add a horizontal line
  doc.setDrawColor(200, 200, 200)
  doc.line(20, 65, 190, 65)
}

// Add a chart to the PDF
async function addChart(doc: jsPDF, type: ReportType, data: any) {
  try {
    // Create the chart configuration based on the report type
    const chartConfig = createChartConfig(type, data)

    // Generate the chart image
    const chartImage = await chartJSNodeCanvas.renderToBuffer(chartConfig)

    // Add the chart image to the PDF
    doc.addImage(chartImage, "PNG", 20, 70, 170, 85)
  } catch (error) {
    console.error("Error generating chart:", error)
    doc.setTextColor(255, 0, 0)
    doc.setFontSize(12)
    doc.text("Error generating chart. Please try again.", 20, 100)
  }
}

// Create a chart configuration based on the report type
function createChartConfig(type: ReportType, data: any) {
  // Default chart configuration
  const config: any = {
    type: "line",
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: getChartTitle(type),
        },
      },
    },
  }

  // Customize the chart based on the report type
  switch (type) {
    case "error-trends":
      config.data = {
        labels: data.map((item: any) => formatDate(new Date(item.date))),
        datasets: [
          {
            label: "Total Errors",
            data: data.map((item: any) => item.total),
            borderColor: "rgb(53, 162, 235)",
            backgroundColor: "rgba(53, 162, 235, 0.5)",
          },
          {
            label: "Critical Errors",
            data: data.map((item: any) => item.critical),
            borderColor: "rgb(255, 99, 132)",
            backgroundColor: "rgba(255, 99, 132, 0.5)",
          },
        ],
      }
      break

    case "error-distribution":
      config.type = "bar"
      config.data = {
        labels: data.map((item: any) => formatDate(new Date(item.date))),
        datasets: [
          {
            label: "Critical",
            data: data.map((item: any) => item.critical),
            backgroundColor: "rgba(255, 99, 132, 0.5)",
          },
          {
            label: "Error",
            data: data.map((item: any) => item.error),
            backgroundColor: "rgba(255, 159, 64, 0.5)",
          },
          {
            label: "Warning",
            data: data.map((item: any) => item.warning),
            backgroundColor: "rgba(255, 205, 86, 0.5)",
          },
          {
            label: "Info",
            data: data.map((item: any) => item.info),
            backgroundColor: "rgba(75, 192, 192, 0.5)",
          },
          {
            label: "Debug",
            data: data.map((item: any) => item.debug),
            backgroundColor: "rgba(153, 102, 255, 0.5)",
          },
        ],
      }
      break

    case "resolution-times":
      config.type = "bar"
      config.data = {
        labels: data.map((item: any) => item.category || item.severity),
        datasets: [
          {
            label: "Average Resolution Time (hours)",
            data: data.map((item: any) => item.avg_resolution_time),
            backgroundColor: "rgba(75, 192, 192, 0.5)",
          },
        ],
      }
      break

    case "category-distribution":
      config.type = "pie"
      config.data = {
        labels: data.map((item: any) => item.category),
        datasets: [
          {
            label: "Error Count",
            data: data.map((item: any) => item.count),
            backgroundColor: [
              "rgba(255, 99, 132, 0.5)",
              "rgba(54, 162, 235, 0.5)",
              "rgba(255, 206, 86, 0.5)",
              "rgba(75, 192, 192, 0.5)",
              "rgba(153, 102, 255, 0.5)",
              "rgba(255, 159, 64, 0.5)",
              "rgba(199, 199, 199, 0.5)",
            ],
          },
        ],
      }
      break

    case "prediction":
      config.data = {
        labels: data.map((item: any) => formatDate(new Date(item.date))),
        datasets: [
          {
            label: "Predicted Errors",
            data: data.map((item: any) => item.prediction),
            borderColor: "rgb(53, 162, 235)",
            backgroundColor: "rgba(53, 162, 235, 0.5)",
          },
          {
            label: "Upper Bound",
            data: data.map((item: any) => item.upper_bound),
            borderColor: "rgba(255, 99, 132, 0.5)",
            backgroundColor: "rgba(255, 99, 132, 0.1)",
            borderDash: [5, 5],
            fill: "+1",
          },
          {
            label: "Lower Bound",
            data: data.map((item: any) => item.lower_bound),
            borderColor: "rgba(255, 99, 132, 0.5)",
            backgroundColor: "rgba(255, 99, 132, 0.1)",
            borderDash: [5, 5],
            fill: false,
          },
        ],
      }
      break

    case "heatmap":
      // For heatmap, we'll use a custom rendering approach
      config.type = "bar"
      config.data = {
        labels: ["Heatmap data cannot be directly rendered in PDF. Please refer to the web interface."],
        datasets: [
          {
            label: "Heatmap",
            data: [0],
            backgroundColor: "rgba(75, 192, 192, 0.5)",
          },
        ],
      }
      break

    default:
      break
  }

  return config
}

// Get the chart title based on the report type
function getChartTitle(type: ReportType): string {
  switch (type) {
    case "error-trends":
      return "Error Trends Over Time"
    case "error-distribution":
      return "Error Distribution by Severity"
    case "resolution-times":
      return "Average Resolution Times"
    case "category-distribution":
      return "Error Distribution by Category"
    case "heatmap":
      return "Error Occurrence Heatmap"
    case "prediction":
      return "Predicted Error Trends"
    default:
      return "Error Report"
  }
}

// Add a table of the data to the PDF
function addDataTable(doc: jsPDF, type: ReportType, data: any) {
  // Define the table columns based on the report type
  const columns = getTableColumns(type)

  // Transform the data for the table
  const tableData = transformDataForTable(type, data)

  // Add the table to the PDF
  ;(doc as any).autoTable({
    startY: 160,
    head: [columns],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [66, 66, 66],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
    margin: { top: 160, right: 20, bottom: 20, left: 20 },
  })
}

// Get the table columns based on the report type
function getTableColumns(type: ReportType): string[] {
  switch (type) {
    case "error-trends":
      return ["Date", "Total", "Critical", "Error", "Warning", "Info", "Debug", "Resolved"]
    case "error-distribution":
      return ["Date", "Critical", "Error", "Warning", "Info", "Debug"]
    case "resolution-times":
      return ["Category/Severity", "Count", "Avg. Resolution Time (h)", "Min", "Max", "Median"]
    case "category-distribution":
      return ["Category", "Count", "Percentage"]
    case "heatmap":
      return ["Day", "Hour", "Error Count"]
    case "prediction":
      return ["Date", "Predicted Errors", "Lower Bound", "Upper Bound"]
    default:
      return ["Date", "Value"]
  }
}

// Transform the data for the table
function transformDataForTable(type: ReportType, data: any): any[][] {
  switch (type) {
    case "error-trends":
      return data.map((item: any) => [
        formatDate(new Date(item.date)),
        item.total,
        item.critical,
        item.error,
        item.warning,
        item.info,
        item.debug,
        item.resolved,
      ])

    case "error-distribution":
      return data.map((item: any) => [
        formatDate(new Date(item.date)),
        item.critical,
        item.error,
        item.warning,
        item.info,
        item.debug,
      ])

    case "resolution-times":
      return data.map((item: any) => [
        item.category || item.severity,
        item.count,
        item.avg_resolution_time.toFixed(2),
        item.min_resolution_time.toFixed(2),
        item.max_resolution_time.toFixed(2),
        item.median_resolution_time.toFixed(2),
      ])

    case "category-distribution":
      const total = data.reduce((sum: number, item: any) => sum + item.count, 0)
      return data.map((item: any) => [item.category, item.count, ((item.count / total) * 100).toFixed(2) + "%"])

    case "heatmap":
      return data.map((item: any) => [getDayName(item.day_of_week), item.hour_of_day, item.count])

    case "prediction":
      return data.map((item: any) => [
        formatDate(new Date(item.date)),
        item.prediction.toFixed(2),
        item.lower_bound.toFixed(2),
        item.upper_bound.toFixed(2),
      ])

    default:
      return data.map((item: any) => Object.values(item))
  }
}

// Get the day name from the day of week number
function getDayName(dayOfWeek: number): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  return days[dayOfWeek]
}

// Add a footer to the PDF
function addFooter(doc: jsPDF) {
  const pageCount = (doc as any).internal.getNumberOfPages()

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(10)
    doc.setTextColor(150, 150, 150)
    doc.text(`Page ${i} of ${pageCount}`, 20, doc.internal.pageSize.height - 10)
    doc.text("Generated by Streamline Error Monitoring System", 100, doc.internal.pageSize.height - 10, {
      align: "center",
    })
  }
}
