import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
  type ChartOptions,
} from "chart.js"

// Register Chart.js components
export function registerCharts() {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    TimeScale,
  )
}

// Common chart options
export const commonOptions: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top" as const,
    },
    tooltip: {
      mode: "index" as const,
      intersect: false,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: "rgba(0, 0, 0, 0.05)",
      },
    },
  },
  interaction: {
    mode: "nearest" as const,
    axis: "x" as const,
    intersect: false,
  },
}

// Color palette for charts
export const chartColors = {
  critical: "rgba(220, 38, 38, 0.8)", // red
  error: "rgba(249, 115, 22, 0.8)", // orange
  warning: "rgba(245, 158, 11, 0.8)", // amber
  info: "rgba(59, 130, 246, 0.8)", // blue
  debug: "rgba(107, 114, 128, 0.8)", // gray
  background: {
    critical: "rgba(220, 38, 38, 0.1)",
    error: "rgba(249, 115, 22, 0.1)",
    warning: "rgba(245, 158, 11, 0.1)",
    info: "rgba(59, 130, 246, 0.1)",
    debug: "rgba(107, 114, 128, 0.1)",
  },
}

// Format date for display
export function formatDate(dateStr: string, groupBy = "day"): string {
  const date = new Date(dateStr)

  switch (groupBy) {
    case "hour":
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
      })
    case "day":
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
      })
    case "week":
      return `Week of ${date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
      })}`
    case "month":
      return date.toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      })
    default:
      return dateStr
  }
}
